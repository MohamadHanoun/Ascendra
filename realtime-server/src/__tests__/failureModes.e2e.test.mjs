import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";

/**
 * Opt-in failure-mode / chaos E2E (Batch 1L). Gated by ASCENDRA_REALTIME_E2E.
 * Proves the standalone server fails closed under hostile/misconfigured input.
 *
 * Heavy imports are dynamic so default root runs skip this without needing
 * socket.io-client / express / socket.io installed.
 */

const E2E_ENABLED = process.env.ASCENDRA_REALTIME_E2E === "true";

describe.runIf(E2E_ENABLED)("realtime failure-mode E2E", () => {
  let startTestServer;
  let ioClient;
  let signClientToken;
  let buildAllowedRooms;
  const servers = [];
  const sockets = [];

  beforeAll(async () => {
    ({ startTestServer } = await import("./helpers/startTestServer.mjs"));
    ({ io: ioClient } = await import("socket.io-client"));
    ({ signClientToken, buildAllowedRooms } = await import(
      "../../../lib/realtime/clientToken.ts"
    ));
  }, 20000);

  afterEach(async () => {
    while (sockets.length) {
      try {
        sockets.pop().disconnect();
      } catch {
        /* ignore */
      }
    }
    while (servers.length) {
      try {
        await servers.pop().close();
      } catch {
        /* ignore */
      }
    }
  });

  async function start(overrides) {
    const server = await startTestServer(overrides);
    servers.push(server);
    return server;
  }

  function connect(server, token) {
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

  function join(socket, room) {
    return new Promise((resolve) => socket.emit("join", room, (ack) => resolve(ack)));
  }

  function sign(secret, ts, raw) {
    return `sha256=${createHmac("sha256", secret).update(`${ts}.${raw}`).digest("hex")}`;
  }

  async function postEvent(server, bodyObj, opts = {}) {
    const rawBody = opts.rawBodyOverride ?? JSON.stringify(bodyObj);
    const ts = opts.timestamp ?? Math.floor(Date.now() / 1000);
    const headers = { "Content-Type": opts.contentType ?? "application/json" };
    if (!opts.omitAuth) headers.Authorization = `Bearer ${opts.bearer ?? server.eventSecret}`;
    if (!opts.omitTimestamp) headers["X-Ascendra-Timestamp"] = String(ts);
    if (!opts.omitSignature) {
      headers["X-Ascendra-Signature"] =
        opts.signature ?? sign(server.eventSecret, ts, opts.signBody ?? rawBody);
    }
    return fetch(`${server.baseUrl}/internal/events`, { method: opts.method ?? "POST", headers, body: rawBody });
  }

  // ─── 1. CORS / origin ──────────────────────────────────────────────────────
  it("only reflects allowed browser origins (denies others)", async () => {
    const server = await start({ allowedOrigins: ["https://www.ascendrahub.com"] });
    const denied = await fetch(`${server.baseUrl}/healthz`, { headers: { Origin: "https://evil.example.com" } });
    expect(denied.headers.get("access-control-allow-origin")).toBeNull();
    const allowed = await fetch(`${server.baseUrl}/healthz`, { headers: { Origin: "https://www.ascendrahub.com" } });
    expect(allowed.headers.get("access-control-allow-origin")).toBe("https://www.ascendrahub.com");
  }, 15000);

  it("fails closed for browser origins in production with empty ALLOWED_ORIGINS", async () => {
    const server = await start({ isProduction: true, allowedOrigins: [] });
    const res = await fetch(`${server.baseUrl}/healthz`, { headers: { Origin: "https://www.ascendrahub.com" } });
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  }, 15000);

  // ─── 2. Internal events auth failures ───────────────────────────────────────
  it("rejects every malformed auth variant on /internal/events", async () => {
    const server = await start();
    const body = { type: "leaderboard.updated", rooms: ["leaderboard"], payload: {} };

    expect((await postEvent(server, body, { omitAuth: true })).status).toBe(401);
    expect((await postEvent(server, body, { bearer: "wrong" })).status).toBe(401);
    expect((await postEvent(server, body, { omitTimestamp: true })).status).toBe(401);
    expect((await postEvent(server, body, { omitSignature: true })).status).toBe(401);
    expect((await postEvent(server, body, { signature: "sha256=deadbeef" })).status).toBe(401);
    expect((await postEvent(server, body, { timestamp: Math.floor(Date.now() / 1000) - 1000 })).status).toBe(401);
    expect((await postEvent(server, body, { timestamp: Math.floor(Date.now() / 1000) + 1000 })).status).toBe(401);
    expect((await postEvent(server, body, { signBody: '{"x":1}' })).status).toBe(401);
  }, 20000);

  it("rejects replayed timestamp+signature", async () => {
    const server = await start();
    const ts = Math.floor(Date.now() / 1000);
    const body = { type: "leaderboard.updated", rooms: ["leaderboard"], payload: {} };
    const raw = JSON.stringify(body);
    const signature = sign(server.eventSecret, ts, raw);
    expect((await postEvent(server, body, { timestamp: ts, signature })).status).toBe(200);
    expect((await postEvent(server, body, { timestamp: ts, signature })).status).toBe(409);
  }, 15000);

  // ─── 3. Rate limiting ────────────────────────────────────────────────────────
  it("returns 429 past the configured rate limit, leaking nothing", async () => {
    const server = await start({ internalEventsRateLimitPerMinute: 2 });
    const mk = (i) => ({ type: "leaderboard.updated", rooms: ["leaderboard"], payload: { n: String(i) } });
    expect((await postEvent(server, mk(1))).status).toBe(200);
    expect((await postEvent(server, mk(2))).status).toBe(200);
    const limited = await postEvent(server, mk(3));
    expect(limited.status).toBe(429);
    const text = await limited.text();
    expect(text).not.toContain(server.eventSecret);
    expect(text).not.toMatch(/signature/i);
  }, 15000);

  // ─── 4. Body / JSON / method failures ────────────────────────────────────────
  it("handles invalid JSON, oversized bodies, and wrong methods", async () => {
    const server = await start();

    const badJson = await fetch(`${server.baseUrl}/internal/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    expect(badJson.status).toBe(400);

    const oversized = await fetch(`${server.baseUrl}/internal/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ big: "a".repeat(70 * 1024) }),
    });
    expect(oversized.status).toBe(413);

    expect((await fetch(`${server.baseUrl}/internal/events`)).status).toBe(405); // GET
    expect(
      (await fetch(`${server.baseUrl}/healthz`, { method: "POST" })).status,
    ).toBe(405);
    expect(
      (await fetch(`${server.baseUrl}/internal/status`, { method: "POST" })).status,
    ).toBe(405);
  }, 15000);

  // ─── 5. Socket room-join abuse ───────────────────────────────────────────────
  it("denies invalid/private/admin rooms and rate-limits joins", async () => {
    const server = await start();
    const anon = await connect(server);

    expect((await join(anon, "bad room")).ok).toBe(false);
    expect((await join(anon, "user:u1")).ok).toBe(false);
    expect((await join(anon, "notifications:u1")).ok).toBe(false);
    expect((await join(anon, "admin")).ok).toBe(false);
    expect((await join(anon, "team:t1")).ok).toBe(false);

    // RC9 app-issued tokens do not claim admin rooms.
    const adminToken = signClientToken({
      secret: server.clientTokenSecret,
      sub: "adm",
      isAdmin: true,
      rooms: buildAllowedRooms({ databaseId: "adm", isAdmin: true }),
      ttlSeconds: 300,
    }).token;
    const admin = await connect(server, adminToken);
    expect((await join(admin, "notifications:adm")).ok).toBe(true);
    expect((await join(admin, "admin")).ok).toBe(false);
    expect((await join(admin, "admin:tournament:abc")).ok).toBe(false);
  }, 15000);

  it("rate-limits excessive join attempts", async () => {
    const server = await start();
    const client = await connect(server);
    let rejected = 0;
    for (let i = 0; i < 40; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const ack = await join(client, "leaderboard");
      if (!ack.ok) rejected += 1;
    }
    expect(rejected).toBeGreaterThan(0); // join limit is 30/min per socket
  }, 20000);

  // ─── 6. Status/metrics safety after failures ─────────────────────────────────
  it("status reflects rejections and leaks no secrets/bodies", async () => {
    const server = await start();
    await postEvent(server, { type: "leaderboard.updated", rooms: ["leaderboard"], payload: {} }, { signature: "sha256=deadbeef" });

    const res = await fetch(`${server.baseUrl}/internal/status`, {
      headers: { Authorization: `Bearer ${server.eventSecret}` },
    });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain(server.eventSecret);
    expect(text).not.toContain(server.clientTokenSecret);
    expect(text).not.toMatch(/authorization/i);
    expect(text).not.toMatch(/signature/i);
    expect(text).not.toMatch(/cookie/i);

    const body = JSON.parse(text);
    expect(body.counters.internalEventsRejected.hmac).toBeGreaterThanOrEqual(1);
  }, 15000);
});
