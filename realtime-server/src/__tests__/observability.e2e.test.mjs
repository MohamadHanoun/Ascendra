import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";

/**
 * Opt-in observability E2E (Batch 1J). Gated by ASCENDRA_REALTIME_E2E === "true"
 * (run via `cd realtime-server && npm run test:e2e`). Boots a fresh server per
 * test on an ephemeral loopback port so counters are deterministic.
 *
 * Heavy imports are dynamic so default root test runs skip this cleanly without
 * needing socket.io-client / express / socket.io installed.
 */

const E2E_ENABLED = process.env.ASCENDRA_REALTIME_E2E === "true";

describe.runIf(E2E_ENABLED)("realtime observability E2E", () => {
  let startTestServer;
  let ioClient;
  let server;
  const sockets = [];

  beforeAll(async () => {
    ({ startTestServer } = await import("./helpers/startTestServer.mjs"));
    ({ io: ioClient } = await import("socket.io-client"));
  }, 20000);

  beforeEach(async () => {
    server = await startTestServer();
  });

  afterEach(async () => {
    while (sockets.length) {
      try {
        sockets.pop().disconnect();
      } catch {
        /* ignore */
      }
    }
    if (server) await server.close();
  });

  // ─── helpers ────────────────────────────────────────────────────────────
  function connectClient(token) {
    const socket = ioClient(server.socketUrl, {
      transports: ["websocket"],
      auth: token ? { token } : {},
      reconnection: false,
      forceNew: true,
    });
    sockets.push(socket);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("connect timeout")), 5000);
      socket.on("connect", () => {
        clearTimeout(timer);
        resolve(socket);
      });
      socket.on("connect_error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  function joinRoom(socket, room) {
    return new Promise((resolve) => socket.emit("join", room, (ack) => resolve(ack)));
  }

  async function postEvent(bodyObj, opts = {}) {
    const rawBody = JSON.stringify(bodyObj);
    const timestamp = opts.timestamp ?? Math.floor(Date.now() / 1000);
    const headers = { "Content-Type": "application/json" };
    if (!opts.omitAuth) headers.Authorization = `Bearer ${server.eventSecret}`;
    if (!opts.omitTimestamp) headers["X-Ascendra-Timestamp"] = String(timestamp);
    if (!opts.omitSignature) {
      headers["X-Ascendra-Signature"] =
        opts.signature ??
        `sha256=${createHmac("sha256", server.eventSecret)
          .update(`${timestamp}.${opts.signBody ?? rawBody}`)
          .digest("hex")}`;
    }
    return fetch(`${server.baseUrl}/internal/events`, { method: "POST", headers, body: rawBody });
  }

  async function getStatus(auth = true) {
    return fetch(`${server.baseUrl}/internal/status`, {
      headers: auth ? { Authorization: `Bearer ${server.eventSecret}` } : {},
    });
  }

  function assertNoSecrets(text) {
    expect(text).not.toContain(server.eventSecret);
    expect(text).not.toContain(server.clientTokenSecret);
    expect(text).not.toMatch(/signature/i);
  }

  // ─── 1. /healthz minimal ────────────────────────────────────────────────────
  it("exposes a minimal public /healthz (no config/secret details)", async () => {
    const res = await fetch(`${server.baseUrl}/healthz`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.uptimeSeconds).toBe("number");
    expect(typeof body.connections).toBe("number");
    expect(body).not.toHaveProperty("config");
    expect(body).not.toHaveProperty("hasEventSecret");
    expect(body).not.toHaveProperty("env");
  }, 15000);

  // ─── 2 & 3. /internal/status auth ────────────────────────────────────────────
  it("requires auth for /internal/status", async () => {
    expect((await getStatus(false)).status).toBe(401);
  }, 15000);

  it("returns counters + config flags with valid auth and leaks no secrets", async () => {
    const res = await getStatus(true);
    expect(res.status).toBe(200);
    const text = await res.text();
    assertNoSecrets(text);
    const body = JSON.parse(text);
    expect(body.ok).toBe(true);
    expect(body.counters).toBeTruthy();
    expect(body.config).toMatchObject({
      publicRoomsEnabled: true,
      privateRoomsRequireToken: true,
      adminRoomsRequireToken: true,
    });
    expect(body.config).not.toHaveProperty("allowedOrigins");
    expect(typeof body.config.allowedOriginCount).toBe("number");
  }, 15000);

  // ─── 4. HMAC rejection counter ───────────────────────────────────────────────
  it("increments the hmac rejection counter", async () => {
    const bad = await postEvent(
      { type: "leaderboard.updated", rooms: ["leaderboard"], payload: {} },
      { signature: "sha256=deadbeef" },
    );
    expect(bad.status).toBe(401);
    const body = await (await getStatus()).json();
    expect(body.counters.internalEventsRejected.hmac).toBe(1);
  }, 15000);

  // ─── 5. Replay counter ───────────────────────────────────────────────────────
  it("increments the replay counter on reuse", async () => {
    const ts = Math.floor(Date.now() / 1000);
    const eventBody = { type: "leaderboard.updated", rooms: ["leaderboard"], payload: {} };
    const raw = JSON.stringify(eventBody);
    const signature = `sha256=${createHmac("sha256", server.eventSecret)
      .update(`${ts}.${raw}`)
      .digest("hex")}`;

    expect((await postEvent(eventBody, { timestamp: ts, signature })).status).toBe(200);
    expect((await postEvent(eventBody, { timestamp: ts, signature })).status).toBe(409);

    const body = await (await getStatus()).json();
    expect(body.counters.internalEventsRejected.replay).toBe(1);
    expect(body.counters.internalEventsAccepted).toBe(1);
  }, 15000);

  // ─── 6. Accepted/emitted counters ────────────────────────────────────────────
  it("increments accepted/emitted counters on a valid event", async () => {
    expect(
      (await postEvent({ type: "leaderboard.updated", rooms: ["leaderboard"], payload: {} })).status,
    ).toBe(200);
    const body = await (await getStatus()).json();
    expect(body.counters.internalEventsAccepted).toBe(1);
    expect(body.counters.emittedEvents).toBe(1);
    expect(body.counters.emittedRooms).toBe(1);
  }, 15000);

  // ─── 7. Room-join rejection counter ──────────────────────────────────────────
  it("increments the join rejection counter on a denied private room", async () => {
    const client = await connectClient();
    expect((await joinRoom(client, "user:user_test_1")).ok).toBe(false);
    const body = await (await getStatus()).json();
    expect(body.counters.roomJoinAttempts).toBeGreaterThanOrEqual(1);
    expect(body.counters.roomJoinsRejected.private_denied).toBeGreaterThanOrEqual(1);
  }, 15000);

  // ─── 8. No secrets in health response either ─────────────────────────────────
  it("leaks no secrets via /healthz", async () => {
    const text = await (await fetch(`${server.baseUrl}/healthz`)).text();
    assertNoSecrets(text);
  }, 15000);
});
