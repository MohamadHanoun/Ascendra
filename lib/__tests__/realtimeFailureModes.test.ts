import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dispatchRealtimeEvent } from "@/lib/realtime/dispatchRealtime";

/**
 * Failure-mode / chaos drills for the app-side realtime bridge (Batch 1L).
 *
 * Proves the bridge fails CLOSED and never throws under disabled, misconfigured,
 * unreachable, hostile, or malformed conditions — and never lets sensitive
 * fields reach the wire.
 */

function enableBridge({
  url = "http://localhost:8787",
  secret = "e".repeat(40),
  production = false,
} = {}) {
  vi.stubEnv("REALTIME_ENABLE_SOCKET", "true");
  vi.stubEnv("REALTIME_SERVER_URL", url);
  vi.stubEnv("REALTIME_EVENT_SECRET", secret);
  if (production) vi.stubEnv("NODE_ENV", "production");
}

function mockFetch(impl) {
  const fn = vi.fn(impl ?? (async () => ({ ok: true, status: 200 }) as Response));
  vi.stubGlobal("fetch", fn);
  return fn;
}

function lastBody(fetchMock: ReturnType<typeof vi.fn>) {
  const call = fetchMock.mock.calls.at(-1);
  const options = call?.[1] as RequestInit | undefined;
  return JSON.parse(String(options?.body ?? "{}")) as Record<string, unknown>;
}

const leaderboardEvent = {
  type: "leaderboard.updated",
  audience: "public",
  entityType: "leaderboard",
  entityId: "global",
  payload: { tournamentId: "tour123" },
};

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("1. bridge disabled", () => {
  it("skips and makes no fetch when REALTIME_ENABLE_SOCKET is unset", async () => {
    const fetchMock = mockFetch();
    const result = await dispatchRealtimeEvent(leaderboardEvent);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("disabled");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("2. missing REALTIME_SERVER_URL", () => {
  it("skips safely without throwing or fetching", async () => {
    const fetchMock = mockFetch();
    vi.stubEnv("REALTIME_ENABLE_SOCKET", "true");
    vi.stubEnv("REALTIME_EVENT_SECRET", "e".repeat(40));
    // REALTIME_SERVER_URL intentionally unset.
    const result = await dispatchRealtimeEvent(leaderboardEvent);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("missing_server_url");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("3. missing/weak secret", () => {
  it("skips when secret is missing", async () => {
    const fetchMock = mockFetch();
    vi.stubEnv("REALTIME_ENABLE_SOCKET", "true");
    vi.stubEnv("REALTIME_SERVER_URL", "http://localhost:8787");
    const result = await dispatchRealtimeEvent(leaderboardEvent);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("missing_secret");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips when secret is weak in production", async () => {
    const fetchMock = mockFetch();
    enableBridge({ url: "https://realtime.example.com", secret: "short", production: true });
    const result = await dispatchRealtimeEvent(leaderboardEvent);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("weak_secret");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("4. unsafe REALTIME_SERVER_URL", () => {
  const unsafe = [
    "javascript:alert(1)",
    "file:///etc/passwd",
    "ftp://example.com",
    "https://user:pass@example.com",
    "http://evil.example.com", // non-local http in production
    "not a url",
  ];

  it.each(unsafe)("skips unsafe url %s without throwing (production)", async (url) => {
    const fetchMock = mockFetch();
    enableBridge({ url, secret: "e".repeat(40), production: true });
    const result = await dispatchRealtimeEvent(leaderboardEvent);
    expect(result.skipped).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignores caller path injection — always posts to /internal/events on the origin", async () => {
    const fetchMock = mockFetch();
    enableBridge({ url: "https://realtime.example.com/evil/path?x=1", secret: "e".repeat(40), production: true });
    await dispatchRealtimeEvent(leaderboardEvent);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toBe("https://realtime.example.com/internal/events");
  });
});

describe("5. timeout / unreachable server", () => {
  it("returns network_error on connection failure without throwing", async () => {
    const fetchMock = mockFetch(async () => {
      throw new Error("ECONNREFUSED");
    });
    enableBridge();
    const result = await dispatchRealtimeEvent(leaderboardEvent);
    expect(result.ok).toBe(false);
    expect(result.skipped).toBe(false);
    expect(result.reason).toBe("network_error");
  });

  it("returns timeout when the request aborts", async () => {
    const fetchMock = mockFetch(async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    });
    enableBridge();
    const result = await dispatchRealtimeEvent(leaderboardEvent);
    expect(result.ok).toBe(false);
    expect(result.skipped).toBe(false);
    expect(result.reason).toBe("timeout");
    void fetchMock;
  });
});

describe("6. non-2xx server responses", () => {
  it.each([401, 403, 429, 500])("returns ok:false with status %i and a single fetch", async (status) => {
    const fetchMock = mockFetch(async () => ({ ok: false, status }) as Response);
    enableBridge();
    const result = await dispatchRealtimeEvent(leaderboardEvent);
    expect(result.ok).toBe(false);
    expect(result.skipped).toBe(false);
    expect(result.status).toBe(status);
    expect(fetchMock).toHaveBeenCalledTimes(1); // no aggressive retry
  });
});

describe("7. payload sanitized before dispatch", () => {
  it("never sends registration/team/user/admin fields on a public registration update", async () => {
    const fetchMock = mockFetch();
    enableBridge();
    await dispatchRealtimeEvent({
      type: "tournament.registration.updated",
      audience: "public",
      entityType: "tournament",
      entityId: "tour123",
      payload: {
        tournamentId: "tour123",
        registrationId: "reg789",
        teamId: "team456",
        userId: "user123",
        teamName: "Shadow Wolves",
        rejectionReason: "nope",
        discordId: "123456789012345678",
        adminUserId: "admin123",
        token: "abc",
        cookie: "c",
      },
    });
    const payload = lastBody(fetchMock).payload as Record<string, unknown>;
    expect(payload).toEqual({
      tournamentId: "tour123",
      entityType: "tournament",
      entityId: "tour123",
    });
  });
});

describe("8. no safe rooms", () => {
  it("skips unknown public events with no safe entity mapping", async () => {
    const fetchMock = mockFetch();
    enableBridge();
    const result = await dispatchRealtimeEvent({ type: "weird.event", audience: "public", payload: {} });
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("no_safe_rooms");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("9. notification routing", () => {
  it("does not send a notification without an internal targetUserId", async () => {
    const fetchMock = mockFetch();
    enableBridge();
    const result = await dispatchRealtimeEvent({
      type: "notification.created",
      audience: "private",
      entityType: "notification",
      entityId: "notification_1",
      payload: { notificationId: "notification_1" },
    });
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("no_safe_rooms");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends only to notifications:{userId} and strips routing userId from the payload", async () => {
    const fetchMock = mockFetch();
    enableBridge();
    const result = await dispatchRealtimeEvent({
      type: "notification.created",
      audience: "private",
      entityType: "notification",
      entityId: "notification_1",
      targetUserId: "ckuser123",
      payload: {
        notificationId: "notification_1",
        userId: "ckuser123",
        message: "Private body",
      },
    });
    expect(result.rooms).toEqual(["notifications:ckuser123"]);
    expect(lastBody(fetchMock).rooms).toEqual(["notifications:ckuser123"]);
    expect(lastBody(fetchMock).payload).toEqual({
      notificationId: "notification_1",
    });
    expect(JSON.stringify(lastBody(fetchMock).payload)).not.toContain("ckuser123");
    expect(JSON.stringify(lastBody(fetchMock).payload)).not.toContain("Private body");
  });
});

describe("10. bad-input chaos", () => {
  it("never throws on null/circular/huge/weird payloads", async () => {
    const fetchMock = mockFetch();
    enableBridge();

    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;

    const cases: Array<Record<string, unknown> | null> = [
      null,
      circular,
      { big: "a".repeat(200_000) },
      { nested: { deep: { deeper: { deepest: { x: 1 } } } } },
      { list: [{ token: "x" }, () => 1, Symbol("s")] as unknown as unknown[] },
    ];

    for (const payload of cases) {
      // admin audience exercises the deep sanitizer path.
      const result = await dispatchRealtimeEvent({
        type: "bot.event.updated",
        audience: "admin",
        entityType: "bot",
        entityId: "evt1",
        payload: payload as Record<string, unknown> | null,
      });
      expect(typeof result.ok).toBe("boolean");
      // Whatever was sent must be JSON-serializable and free of functions.
      if (fetchMock.mock.calls.length > 0) {
        const body = lastBody(fetchMock);
        expect(() => JSON.stringify(body)).not.toThrow();
        expect(JSON.stringify(body)).not.toContain("function");
      }
    }
  });
});
