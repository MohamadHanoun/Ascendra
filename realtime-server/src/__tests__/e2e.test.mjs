import { afterEach, beforeAll, afterAll, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";

/**
 * Opt-in local end-to-end suite (Batch 1G).
 *
 * Skipped unless ASCENDRA_REALTIME_E2E === "true" (run via
 * `cd realtime-server && npm run test:e2e`). It boots a real realtime server on
 * an ephemeral loopback port, connects real Socket.IO clients, and exercises the
 * HMAC bridge + token ACL together. Localhost only; no external network.
 *
 * All heavy imports (server, socket.io-client, app token helper) are dynamic and
 * happen only when the suite runs, so default root test runs stay green without
 * socket.io-client installed.
 */

const E2E_ENABLED = process.env.ASCENDRA_REALTIME_E2E === "true";

describe.runIf(E2E_ENABLED)("realtime E2E", () => {
  let server;
  let ioClient;
  let signClientToken;
  let buildAllowedRooms;
  const sockets = [];

  beforeAll(async () => {
    const { startTestServer } = await import("./helpers/startTestServer.mjs");
    ({ io: ioClient } = await import("socket.io-client"));
    ({ signClientToken, buildAllowedRooms } = await import(
      "../../../lib/realtime/clientToken.ts"
    ));
    server = await startTestServer();
  }, 20000);

  afterEach(() => {
    while (sockets.length) {
      const socket = sockets.pop();
      try {
        socket.disconnect();
      } catch {
        /* ignore */
      }
    }
  });

  afterAll(async () => {
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
    return new Promise((resolve) => {
      socket.emit("join", room, (ack) => resolve(ack));
    });
  }

  function waitForEvent(socket, name, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("event timeout")), timeoutMs);
      socket.once(name, (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  async function postEvent(bodyObj, opts = {}) {
    const rawBody = opts.rawBodyOverride ?? JSON.stringify(bodyObj);
    const timestamp = opts.timestamp ?? Math.floor(Date.now() / 1000);
    const headers = { "Content-Type": "application/json" };
    if (!opts.omitAuth) {
      headers.Authorization = `Bearer ${opts.authSecret ?? server.eventSecret}`;
    }
    if (!opts.omitTimestamp) {
      headers["X-Ascendra-Timestamp"] = String(timestamp);
    }
    if (!opts.omitSignature) {
      headers["X-Ascendra-Signature"] =
        opts.signature ??
        `sha256=${createHmac("sha256", server.eventSecret)
          .update(`${timestamp}.${opts.signBody ?? rawBody}`)
          .digest("hex")}`;
    }
    return fetch(`${server.baseUrl}/internal/events`, {
      method: "POST",
      headers,
      body: rawBody,
    });
  }

  function mintToken({ sub, isAdmin, rooms }) {
    const { token } = signClientToken({
      secret: server.clientTokenSecret,
      sub,
      isAdmin,
      rooms: rooms ?? buildAllowedRooms({ databaseId: sub, isAdmin }),
      ttlSeconds: 300,
    });
    return token;
  }

  // ─── 1. Public room delivery ───────────────────────────────────────────────
  it("delivers events to anonymous public-room subscribers", async () => {
    const client = await connectClient();
    const joinAck = await joinRoom(client, "leaderboard");
    expect(joinAck.ok).toBe(true);

    const received = waitForEvent(client, "ascendra:event");
    const res = await postEvent({
      type: "leaderboard.updated",
      rooms: ["leaderboard"],
      payload: { tournamentId: "tournament_test" },
    });
    expect(res.status).toBe(200);

    const msg = await received;
    expect(msg.type).toBe("leaderboard.updated");
    expect(msg.payload.tournamentId).toBe("tournament_test");
    expect(JSON.stringify(msg)).not.toContain(server.eventSecret);
  }, 15000);

  // ─── 2. Private room token ACL ──────────────────────────────────────────────
  it("enforces private room token claims and isolates delivery", async () => {
    const token = mintToken({ sub: "user_test_1", isAdmin: false });
    const allowed = await connectClient(token);
    const anon = await connectClient();

    expect((await joinRoom(allowed, "notifications:user_test_1")).ok).toBe(true);
    expect((await joinRoom(allowed, "notifications:user_test_2")).ok).toBe(false);
    await joinRoom(anon, "leaderboard");

    let anonReceived = false;
    anon.on("ascendra:event", () => {
      anonReceived = true;
    });

    const received = waitForEvent(allowed, "ascendra:event");
    const res = await postEvent({
      type: "notification.created",
      rooms: ["notifications:user_test_1"],
      payload: { userId: "user_test_1" },
      audience: "public",
      entityType: "notification",
    });
    expect(res.status).toBe(200);

    const msg = await received;
    expect(msg.type).toBe("notification.created");

    await new Promise((r) => setTimeout(r, 250));
    expect(anonReceived).toBe(false);
  }, 15000);

  // ─── 3. Admin room ACL ──────────────────────────────────────────────────────
  it("permits claimed admin rooms only for admin tokens", async () => {
    const adminToken = mintToken({ sub: "admin_test", isAdmin: true });
    const admin = await connectClient(adminToken);

    expect((await joinRoom(admin, "admin")).ok).toBe(true);
    expect((await joinRoom(admin, "admin:queue")).ok).toBe(true);
    expect((await joinRoom(admin, "admin:tournament:abc")).ok).toBe(false);

    const sneakyToken = mintToken({
      sub: "sneaky_test",
      isAdmin: false,
      rooms: ["admin"],
    });
    const sneaky = await connectClient(sneakyToken);
    expect((await joinRoom(sneaky, "admin")).ok).toBe(false);
  }, 15000);

  // ─── 4. Invalid token stays anonymous ───────────────────────────────────────
  it("treats an invalid token as anonymous without disconnecting", async () => {
    const client = await connectClient("garbage.token");

    expect((await joinRoom(client, "leaderboard")).ok).toBe(true);
    expect((await joinRoom(client, "user:user_test_1")).ok).toBe(false);
    expect(client.connected).toBe(true);
  }, 15000);

  // ─── 5. HMAC + replay enforcement ───────────────────────────────────────────
  it("rejects missing signature, replays, and tampered bodies", async () => {
    // Missing signature.
    const missing = await postEvent(
      { type: "leaderboard.updated", rooms: ["leaderboard"], payload: {} },
      { omitSignature: true },
    );
    expect(missing.status).toBe(401);

    // Replay: identical timestamp + signature + body, twice.
    const ts = Math.floor(Date.now() / 1000);
    const body = { type: "leaderboard.updated", rooms: ["leaderboard"], payload: {} };
    const raw = JSON.stringify(body);
    const signature = `sha256=${createHmac("sha256", server.eventSecret)
      .update(`${ts}.${raw}`)
      .digest("hex")}`;

    const first = await postEvent(body, { timestamp: ts, signature });
    expect(first.status).toBe(200);
    const second = await postEvent(body, { timestamp: ts, signature });
    expect(second.status).toBe(409);

    // Tampered body: signature computed over a different body.
    const tampered = await postEvent(
      { type: "leaderboard.updated", rooms: ["leaderboard"], payload: { x: 1 } },
      { signBody: '{"different":true}' },
    );
    expect(tampered.status).toBe(401);
  }, 15000);

  // ─── 6. Body size limit ─────────────────────────────────────────────────────
  it("rejects oversized request bodies with 413", async () => {
    const huge = JSON.stringify({ big: "a".repeat(70 * 1024) });
    const res = await fetch(`${server.baseUrl}/internal/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: huge,
    });
    expect(res.status).toBe(413);
  }, 15000);
});
