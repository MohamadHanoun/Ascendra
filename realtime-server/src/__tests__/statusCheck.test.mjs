import { afterEach, describe, expect, it, vi } from "vitest";

import {
  validateStatusTarget,
  summarizeStatus,
  runStatusCheck,
} from "../../scripts/status-check.mjs";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("validateStatusTarget", () => {
  it("defaults to localhost and allows http localhost in non-prod", () => {
    expect(validateStatusTarget(undefined, false)).toEqual({
      ok: true,
      origin: "http://127.0.0.1:8787",
    });
    expect(validateStatusTarget("http://localhost:9000", false).ok).toBe(true);
  });

  it("requires https for non-local and in production", () => {
    expect(validateStatusTarget("http://realtime.example.com", false).ok).toBe(false);
    expect(validateStatusTarget("http://127.0.0.1:8787", true).ok).toBe(false);
    expect(validateStatusTarget("https://realtime.ascendrahub.com", true).ok).toBe(true);
  });

  it("rejects credentials and bad protocols and junk", () => {
    expect(validateStatusTarget("https://u:p@example.com", false).ok).toBe(false);
    expect(validateStatusTarget("ftp://example.com", false).ok).toBe(false);
    expect(validateStatusTarget("not a url", false).ok).toBe(false);
  });
});

describe("summarizeStatus", () => {
  it("keeps only safe numeric fields, omitting origins/secrets", () => {
    const summary = summarizeStatus({
      ok: true,
      uptimeSeconds: 12,
      connections: 3,
      config: { allowedOriginCount: 2, allowedOrigins: ["x"] },
      counters: {
        internalEventsAccepted: 5,
        emittedEvents: 5,
        emittedRooms: 9,
        internalEventsRejected: { hmac: 1 },
      },
    });
    expect(summary).toEqual({
      uptimeSeconds: 12,
      connections: 3,
      internalEventsAccepted: 5,
      emittedEvents: 5,
      emittedRooms: 9,
    });
    expect(JSON.stringify(summary)).not.toMatch(/origin|secret/i);
  });
});

describe("runStatusCheck — fixed paths, no secret leakage", () => {
  it("health-only mode (no status secret) skips protected status", async () => {
    const calls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, opts) => {
        calls.push({ url: String(url), opts });
        return { ok: true, status: 200, json: async () => ({ ok: true, uptimeSeconds: 1, connections: 0 }) };
      }),
    );

    const result = await runStatusCheck({ targetUrl: "http://127.0.0.1:8787" });
    expect(result.ok).toBe(true);
    expect(result.health.ok).toBe(true);
    expect(result.status.state).toBe("skipped");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("http://127.0.0.1:8787/healthz");
    // no Authorization header sent in health-only mode
    expect(calls[0].opts?.headers?.Authorization).toBeUndefined();
  });

  it("protected mode queries /internal/status with a bearer but never leaks it", async () => {
    const calls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        calls.push(String(url));
        if (String(url).endsWith("/healthz")) {
          return { ok: true, status: 200, json: async () => ({ ok: true, uptimeSeconds: 2, connections: 1 }) };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, counters: { internalEventsAccepted: 1, emittedRooms: 1 } }),
        };
      }),
    );

    const result = await runStatusCheck({
      targetUrl: "https://realtime.example.com",
      statusSecret: "k".repeat(40),
      isProduction: true,
    });
    expect(result.ok).toBe(true);
    expect(result.status.state).toBe("ok");
    expect(calls).toEqual([
      "https://realtime.example.com/healthz",
      "https://realtime.example.com/internal/status",
    ]);
    expect(JSON.stringify(result)).not.toContain("k".repeat(40));
  });

  it("fails when health is non-2xx", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));
    const result = await runStatusCheck({ targetUrl: "http://127.0.0.1:8787" });
    expect(result.ok).toBe(false);
    expect(result.health.ok).toBe(false);
  });

  it("fails when protected status is non-2xx and a secret was provided", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) =>
        String(url).endsWith("/healthz")
          ? { ok: true, status: 200, json: async () => ({ ok: true }) }
          : { ok: false, status: 401, json: async () => ({ ok: false }) },
      ),
    );
    const result = await runStatusCheck({
      targetUrl: "http://127.0.0.1:8787",
      statusSecret: "k".repeat(40),
    });
    expect(result.ok).toBe(false);
    expect(result.status.state).toBe("fail");
  });

  it("rejects an invalid target without calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await runStatusCheck({ targetUrl: "ftp://example.com" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("unsupported_protocol");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
