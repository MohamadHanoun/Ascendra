import { afterEach, beforeAll, describe, expect, it } from "vitest";

/**
 * Full leaderboard realtime loop (Batch 1S). Opt-in via ASCENDRA_REALTIME_E2E.
 *
 * Proves: app dispatch (dispatchRealtimeEvent) → signed POST /internal/events on a
 * LOCAL ephemeral server → broadcast to the "leaderboard" room → a Socket.IO
 * client receives a sanitized ascendra:event → the leaderboard refresh-decision
 * helper would trigger a refresh. Localhost only; no production network.
 *
 * Heavy imports are dynamic so default root runs skip cleanly.
 */

const E2E_ENABLED = process.env.ASCENDRA_REALTIME_E2E === "true";

describe.runIf(E2E_ENABLED)("leaderboard realtime full loop", () => {
  let startTestServer;
  let ioClient;
  let dispatchRealtimeEvent;
  let shouldRefresh;
  let server;
  let socket;
  const savedEnv = new Map();

  beforeAll(async () => {
    ({ startTestServer } = await import("./helpers/startTestServer.mjs"));
    ({ io: ioClient } = await import("socket.io-client"));
    ({ dispatchRealtimeEvent } = await import("../../../lib/realtime/dispatchRealtime.ts"));
    ({ shouldRefreshLeaderboardFromRealtimeEvent: shouldRefresh } = await import(
      "../../../components/leaderboard/leaderboardRealtimeUtils.ts"
    ));
  }, 20000);

  function setEnv(values) {
    for (const [key, value] of Object.entries(values)) {
      if (!savedEnv.has(key)) savedEnv.set(key, process.env[key]);
      process.env[key] = value;
    }
  }

  afterEach(async () => {
    try {
      socket?.disconnect();
    } catch {
      /* ignore */
    }
    socket = null;
    for (const [key, value] of savedEnv) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    savedEnv.clear();
    if (server) {
      await server.close();
      server = null;
    }
  });

  function connect(url) {
    const s = ioClient(url, {
      transports: ["websocket"],
      reconnection: false,
      forceNew: true,
    });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("connect timeout")), 5000);
      s.on("connect", () => {
        clearTimeout(timer);
        resolve(s);
      });
      s.on("connect_error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  function join(s, room) {
    return new Promise((resolve) => s.emit("join", room, (ack) => resolve(ack)));
  }

  function waitForEvent(s, name, timeoutMs = 4000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("event timeout")), timeoutMs);
      s.once(name, (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  it("dispatch → /internal/events → leaderboard room → sanitized socket receive", async () => {
    server = await startTestServer();
    setEnv({
      REALTIME_ENABLE_SOCKET: "true",
      REALTIME_SERVER_URL: server.baseUrl,
      REALTIME_EVENT_SECRET: server.eventSecret,
    });

    socket = await connect(server.socketUrl);
    expect((await join(socket, "leaderboard")).ok).toBe(true);

    const received = waitForEvent(socket, "ascendra:event");

    // Include sensitive fields to PROVE they are stripped before delivery.
    const result = await dispatchRealtimeEvent({
      type: "leaderboard.updated",
      audience: "public",
      entityType: "leaderboard",
      entityId: "global",
      payload: {
        tournamentId: "tournament_test",
        teamName: "Secret Team",
        rejectionReason: "should not leak",
      },
    });
    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(false);
    expect(result.rooms).toEqual(["leaderboard"]);

    const msg = await received;
    expect(msg.type).toBe("leaderboard.updated");
    expect(msg.payload.tournamentId).toBe("tournament_test");
    expect(shouldRefresh(msg)).toBe(true);

    const json = JSON.stringify(msg);
    for (const forbidden of [
      "teamName",
      "Secret Team",
      "rejectionReason",
      "userIds",
      "discordId",
      "email",
      "token",
      "secret",
      "password",
      "cookie",
      "headers",
      "raw",
      server.eventSecret,
    ]) {
      expect(json).not.toContain(forbidden);
    }

    const status = await fetch(`${server.baseUrl}/internal/status`, {
      headers: { Authorization: `Bearer ${server.eventSecret}` },
    });
    const body = await status.json();
    expect(body.counters.internalEventsAccepted).toBe(1);
    expect(body.counters.emittedRooms).toBe(1);
  }, 15000);

  it("dispatch to an unreachable server fails safely without throwing", async () => {
    setEnv({
      REALTIME_ENABLE_SOCKET: "true",
      REALTIME_SERVER_URL: "http://127.0.0.1:1",
      REALTIME_EVENT_SECRET: "x".repeat(40),
    });

    let result;
    await expect(
      (async () => {
        result = await dispatchRealtimeEvent({
          type: "leaderboard.updated",
          audience: "public",
          entityType: "leaderboard",
          entityId: "global",
          payload: { tournamentId: "tournament_test" },
        });
      })(),
    ).resolves.toBeUndefined();

    expect(result.ok).toBe(false);
    expect(result.skipped).toBe(false);
    expect(result.rooms).toEqual(["leaderboard"]);
  }, 15000);
});
