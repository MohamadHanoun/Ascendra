import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

import {
  resolveTimeout,
  validateSmokeTarget,
  isSafeSmokeRoom,
  buildSmokeEvent,
  createSignature,
  safeBody,
  sendSmokeEvent,
  runSmoke,
} from "../../scripts/smoke-event.mjs";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("buildSmokeEvent", () => {
  it("builds the safe default public event", () => {
    const result = buildSmokeEvent({});
    expect(result.ok).toBe(true);
    expect(result.event).toEqual({
      type: "leaderboard.updated",
      rooms: ["leaderboard"],
      payload: { tournamentId: "smoke_test" },
      audience: "public",
      entityType: "leaderboard",
      entityId: "smoke_test",
    });
  });

  it("honors safe overrides for type/room/tournament id", () => {
    const result = buildSmokeEvent({
      REALTIME_SMOKE_TYPE: "tournament.match.confirmed",
      REALTIME_SMOKE_ROOM: "match:m_123",
      REALTIME_SMOKE_TOURNAMENT_ID: "tour_9",
    });
    expect(result.ok).toBe(true);
    expect(result.event.rooms).toEqual(["match:m_123"]);
    expect(result.event.entityType).toBe("tournamentMatch");
    expect(result.event.entityId).toBe("m_123");
  });

  it("rejects private/admin/user/notifications/profile/team rooms", () => {
    for (const room of [
      "admin",
      "admin:queue",
      "admin:tournament:x",
      "user:u1",
      "notifications:u1",
      "profile:u1",
      "team:t1",
    ]) {
      expect(buildSmokeEvent({ REALTIME_SMOKE_ROOM: room }).ok).toBe(false);
    }
  });

  it("rejects invalid type / room / id", () => {
    expect(buildSmokeEvent({ REALTIME_SMOKE_TYPE: "bad type!" }).ok).toBe(false);
    expect(buildSmokeEvent({ REALTIME_SMOKE_ROOM: "tournament:bad id" }).ok).toBe(false);
    expect(buildSmokeEvent({ REALTIME_SMOKE_ROOM: "leaderboardx" }).ok).toBe(false);
    expect(buildSmokeEvent({ REALTIME_SMOKE_TOURNAMENT_ID: "bad/id" }).ok).toBe(false);
  });
});

describe("isSafeSmokeRoom", () => {
  it("allows only public smoke rooms", () => {
    expect(isSafeSmokeRoom("leaderboard")).toBe(true);
    expect(isSafeSmokeRoom("tournament:abc")).toBe(true);
    expect(isSafeSmokeRoom("match:m1")).toBe(true);
    expect(isSafeSmokeRoom("admin")).toBe(false);
    expect(isSafeSmokeRoom("user:1")).toBe(false);
    expect(isSafeSmokeRoom("tournament:")).toBe(false);
  });
});

describe("validateSmokeTarget", () => {
  it("defaults to localhost and accepts http localhost in non-prod", () => {
    expect(validateSmokeTarget(undefined, false)).toEqual({
      ok: true,
      origin: "http://127.0.0.1:8787",
    });
    expect(validateSmokeTarget("http://localhost:9000", false).ok).toBe(true);
  });

  it("requires https for non-local and in production", () => {
    expect(validateSmokeTarget("http://realtime.example.com", false).ok).toBe(false);
    expect(validateSmokeTarget("http://127.0.0.1:8787", true).ok).toBe(false);
    expect(validateSmokeTarget("https://realtime.ascendrahub.com", true).ok).toBe(true);
  });

  it("rejects credentials and bad protocols", () => {
    expect(validateSmokeTarget("https://u:p@example.com", false).ok).toBe(false);
    expect(validateSmokeTarget("ftp://example.com", false).ok).toBe(false);
    expect(validateSmokeTarget("not a url", false).ok).toBe(false);
  });
});

describe("resolveTimeout", () => {
  it("defaults and clamps 500-5000", () => {
    expect(resolveTimeout(undefined)).toBe(1500);
    expect(resolveTimeout("100")).toBe(500);
    expect(resolveTimeout("99999")).toBe(5000);
    expect(resolveTimeout("2000")).toBe(2000);
  });
});

describe("createSignature", () => {
  it("matches the HMAC scheme timestamp + '.' + rawBody", () => {
    const secret = "s".repeat(40);
    const ts = 1700000000;
    const raw = '{"type":"leaderboard.updated"}';
    expect(createSignature(secret, ts, raw)).toBe(
      `sha256=${createHmac("sha256", secret).update(`${ts}.${raw}`).digest("hex")}`,
    );
  });
});

describe("safeBody", () => {
  it("returns parsed safe JSON but redacts anything sensitive-looking", () => {
    expect(safeBody('{"ok":true,"rooms":1}')).toEqual({ ok: true, rooms: 1 });
    expect(safeBody('{"signature":"x"}')).toBeNull();
    expect(safeBody('{"token":"x"}')).toBeNull();
    expect(safeBody("not json")).toBeNull();
    expect(safeBody("")).toBeNull();
  });
});

describe("sendSmokeEvent (mocked fetch)", () => {
  it("posts the fixed /internal/events path and reports 2xx", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => '{"ok":true,"type":"leaderboard.updated","rooms":1}',
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendSmokeEvent({
      secret: "s".repeat(40),
      origin: "http://127.0.0.1:8787",
      event: buildSmokeEvent({}).event,
      timeoutMs: 1500,
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://127.0.0.1:8787/internal/events");
    // headers must carry auth + signature but the result must not leak them
    expect(JSON.stringify(result)).not.toMatch(/Bearer|sha256=/);
  });

  it("reports non-2xx as failure without throwing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 401, text: async () => "{}" })));
    const result = await sendSmokeEvent({
      secret: "s".repeat(40),
      origin: "http://127.0.0.1:8787",
      event: buildSmokeEvent({}).event,
      timeoutMs: 1500,
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });

  it("reports network errors safely", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const result = await sendSmokeEvent({
      secret: "s".repeat(40),
      origin: "http://127.0.0.1:8787",
      event: buildSmokeEvent({}).event,
      timeoutMs: 1500,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("network_error");
  });
});

describe("runSmoke", () => {
  it("fails closed on missing secret and invalid target", async () => {
    expect((await runSmoke({ secret: "", targetUrl: "http://127.0.0.1:8787" })).reason).toBe(
      "missing_secret",
    );
    expect(
      (await runSmoke({ secret: "s".repeat(40), targetUrl: "ftp://x" })).reason,
    ).toBe("unsupported_protocol");
    expect(
      (await runSmoke({
        secret: "s".repeat(40),
        targetUrl: "http://realtime.example.com",
        isProduction: true,
      })).reason,
    ).toBe("https_required");
  });
});
