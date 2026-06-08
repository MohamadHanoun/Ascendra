/**
 * Ascendra realtime server — DORMANT FOUNDATION SKELETON (Batch 1E hardened,
 * Batch 1F ACL, Batch 1G programmatic factory).
 *
 * Standalone Node.js + Socket.IO server intended for future deployment on
 * Hetzner behind a Caddy/Nginx TLS reverse proxy at
 * wss://realtime.ascendrahub.com.
 *
 * IMPORTANT
 * ---------
 * - This server is NOT wired into the Next.js app yet.
 * - Do NOT run it on production until approved.
 * - It does NOT use Redis and does NOT touch the database or the Discord bot.
 * - It imports no code from the Next.js application.
 *
 * Endpoints
 *   GET  /healthz          -> liveness/readiness probe (no secrets).
 *   POST /internal/events  -> server-to-server ingress (Bearer + HMAC + replay).
 *
 * Security
 *   - 64 KB JSON body limit (413 on oversize).
 *   - Per-IP rate limit on /internal/events (429 on limit).
 *   - In-memory signature replay protection (409 on reuse).
 *   - Strict method handling (405 on unsupported methods).
 *   - CORS restricted to ALLOWED_ORIGINS (no wildcard in production).
 *   - Minimal security headers; no-store on responses.
 *   - Socket.IO joins gated by token ACL (acl.mjs); public rooms anonymous.
 *   - Logs never include secrets, signatures, auth headers, tokens, or raw bodies.
 *
 * Usage
 *   - CLI: `npm start` / `npm run dev` boots from environment config.
 *   - Programmatic: `createRealtimeServer(overrides)` returns an unstarted
 *     server with `listen()` / `close()` (used by the E2E test harness).
 */

import http from "node:http";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

import express from "express";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";

import { config } from "./config.mjs";
import {
  isValidEventSecret,
  verifyHmacSignature,
  parseSignatureHeader,
} from "./auth.mjs";
import {
  validateEventBody,
  broadcastEvent,
  CLIENT_EVENT_NAME,
} from "./events.mjs";
import { isValidRoomName } from "./channels.mjs";
import { verifyClientToken } from "./clientToken.mjs";
import { canJoinRoom } from "./acl.mjs";
import {
  getClientIp,
  createRateLimiter,
  createReplayCache,
  buildSignatureKey,
  createOriginResolver,
} from "./security.mjs";
import { createMetrics } from "./metrics.mjs";

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

function createLogger(logLevel) {
  const activeLevel = LEVELS[logLevel] ?? LEVELS.info;
  return function log(level, message, meta) {
    if ((LEVELS[level] ?? LEVELS.info) > activeLevel) {
      return;
    }
    const line = {
      t: new Date().toISOString(),
      level,
      msg: message,
      ...(meta ? { meta } : {}),
    };
    // eslint-disable-next-line no-console
    console[level === "debug" ? "log" : level](JSON.stringify(line));
  };
}

function methodNotAllowed(allowed, onReject) {
  return (_req, res) => {
    if (typeof onReject === "function") onReject();
    res.setHeader("Allow", allowed.join(", "));
    res.status(405).json({ ok: false, error: "Method not allowed" });
  };
}

function isAdminRoomName(room) {
  return room === "admin" || room.startsWith("admin:");
}

/**
 * Build an unstarted realtime server. `overrides` shallow-merges over the
 * environment `config`, so the E2E harness can inject test secrets + an
 * ephemeral port without touching real production env.
 *
 * @returns {{ app, httpServer, io, cfg, listen, close }}
 */
export function createRealtimeServer(overrides = {}) {
  const cfg = { ...config, ...overrides };
  const log = createLogger(cfg.logLevel);

  const resolveCorsOrigin = createOriginResolver({
    allowedOrigins: cfg.allowedOrigins,
    isProduction: cfg.isProduction,
  });

  // In-memory limiters / replay guard — per server instance (no Redis).
  const internalRateLimiter = createRateLimiter({
    limit: cfg.internalEventsRateLimitPerMinute,
    windowMs: 60_000,
  });
  const replayCache = createReplayCache({ windowSeconds: cfg.replayWindowSeconds });
  const joinRateLimiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

  const metrics = createMetrics();

  // Abuse-threshold logging: warn on repeated rejections (no IP/secret/body).
  function warnAbuse(category, reason, count) {
    if (count === 5 || count % 50 === 0) {
      log("warn", "Repeated rejection", { category, reason, count });
    }
  }
  function rejectInternal(reason) {
    warnAbuse("internal_events", reason, metrics.onInternalRejected(reason));
  }
  function rejectJoin(reason) {
    warnAbuse("room_join", reason, metrics.onJoinRejected(reason));
  }

  // ─── HTTP app ────────────────────────────────────────────────────────────
  const app = express();
  app.disable("x-powered-by");

  app.use(cors({ origin: resolveCorsOrigin, credentials: false }));

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  // Strict 64 KB JSON limit; capture exact raw body for HMAC verification.
  app.use(
    express.json({
      limit: "64kb",
      verify: (req, _res, buf) => {
        req.rawBody = buf && buf.length > 0 ? buf.toString("utf8") : "";
      },
    }),
  );

  // Public, minimal — no config/secret details (those moved to /internal/status).
  app.get("/healthz", (_req, res) => {
    res.json({
      ok: true,
      uptimeSeconds: metrics.snapshot().uptimeSeconds,
      connections: io?.engine?.clientsCount ?? 0,
    });
  });
  app.all("/healthz", methodNotAllowed(["GET"]));

  // Protected metrics. Requires Bearer REALTIME_STATUS_SECRET, falling back to
  // REALTIME_EVENT_SECRET when no dedicated status secret is configured.
  app.get("/internal/status", (req, res) => {
    const statusSecret = cfg.statusSecret || cfg.eventSecret;
    if (!isValidEventSecret(req.headers.authorization, statusSecret)) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    const snap = metrics.snapshot();
    return res.json({
      ok: true,
      uptimeSeconds: snap.uptimeSeconds,
      connections: snap.connections,
      counters: snap.counters,
      config: {
        nodeEnv: cfg.nodeEnv,
        allowedOriginCount: cfg.allowedOrigins.length,
        publicRoomsEnabled: true,
        privateRoomsRequireToken: true,
        adminRoomsRequireToken: true,
      },
    });
  });
  app.all("/internal/status", methodNotAllowed(["GET"]));

  app.post("/internal/events", (req, res) => {
    // Layer 0: per-IP rate limit.
    const ip = getClientIp(req);
    const rate = internalRateLimiter(ip);
    if (!rate.allowed) {
      rejectInternal("rate_limit");
      res.setHeader("Retry-After", String(rate.retryAfterSeconds));
      return res.status(429).json({ ok: false, error: "Too many requests" });
    }

    // Layer 1: shared bearer secret (fails closed if secret unconfigured).
    if (!isValidEventSecret(req.headers.authorization, cfg.eventSecret)) {
      rejectInternal("auth");
      log("warn", "Rejected /internal/events: invalid or missing bearer secret");
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    // Layer 2: HMAC signature over `${timestamp}.${rawBody}` + skew window.
    const rawBody = typeof req.rawBody === "string" ? req.rawBody : "";
    const hmac = verifyHmacSignature({
      secret: cfg.eventSecret,
      timestampHeader: req.headers["x-ascendra-timestamp"],
      signatureHeader: req.headers["x-ascendra-signature"],
      rawBody,
    });
    if (!hmac.ok) {
      rejectInternal("hmac");
      log("warn", "Rejected /internal/events: HMAC verification failed", {
        reason: hmac.reason,
      });
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    // Layer 3: replay protection — reject reused timestamp+signature pairs.
    const digest = parseSignatureHeader(req.headers["x-ascendra-signature"]);
    if (digest) {
      const replayKey = buildSignatureKey(
        req.headers["x-ascendra-timestamp"],
        digest,
      );
      if (replayCache.seen(replayKey)) {
        rejectInternal("replay");
        log("warn", "Rejected /internal/events: replayed request");
        return res.status(409).json({ ok: false, error: "Replay detected" });
      }
    }

    const result = validateEventBody(req.body);
    if (!result.ok) {
      rejectInternal("validation");
      return res.status(400).json({ ok: false, error: result.error });
    }

    const roomCount = broadcastEvent(io, result.event);
    metrics.onInternalAccepted(roomCount);
    log("info", "Broadcast event", { type: result.event.type, rooms: roomCount });
    return res.json({ ok: true, type: result.event.type, rooms: roomCount });
  });
  app.all("/internal/events", methodNotAllowed(["POST"], () => rejectInternal("method")));

  // Body-parse / size error handler (must be last; 4-arg signature).
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err?.status || err?.statusCode || 400;
    if (status === 413 || err?.type === "entity.too.large") {
      rejectInternal("body_too_large");
      return res.status(413).json({ ok: false, error: "Payload too large" });
    }
    if (err?.type === "entity.parse.failed") {
      rejectInternal("validation");
      return res.status(400).json({ ok: false, error: "Invalid JSON" });
    }
    return res.status(400).json({ ok: false, error: "Bad request" });
  });

  // ─── HTTP + Socket.IO ──────────────────────────────────────────────────────
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    maxHttpBufferSize: 64 * 1024,
    cors: { origin: resolveCorsOrigin, credentials: false },
  });

  io.on("connection", (socket) => {
    // Verify the optional handshake token. Invalid/absent => anonymous (public
    // rooms only); we do not disconnect. Never log the token or handshake auth.
    const verified = verifyClientToken({
      secret: cfg.clientTokenSecret,
      token: socket.handshake?.auth?.token,
    });
    socket.data.claims = verified.ok ? verified.claims : null;
    metrics.onConnect();

    log("debug", "Socket connected", {
      id: socket.id,
      authenticated: verified.ok,
      connections: io.engine.clientsCount,
    });

    socket.on("join", (room, ack) => {
      metrics.onJoinAttempt();
      const rate = joinRateLimiter(socket.id);
      if (!rate.allowed) {
        rejectJoin("rate_limit");
        if (typeof ack === "function") ack({ ok: false, error: "Too many join attempts." });
        return;
      }
      if (typeof room !== "string" || !isValidRoomName(room)) {
        rejectJoin("invalid_room");
        if (typeof ack === "function") ack({ ok: false, error: "Invalid room name." });
        return;
      }
      const decision = canJoinRoom(room, socket.data.claims);
      if (!decision.allowed) {
        rejectJoin(isAdminRoomName(room) ? "admin_denied" : "private_denied");
        log("debug", "Refused room join", { id: socket.id });
        if (typeof ack === "function") ack({ ok: false, error: "Room not joinable." });
        return;
      }
      socket.join(room);
      metrics.onJoinAccepted();
      if (typeof ack === "function") ack({ ok: true, room });
    });

    socket.on("leave", (room, ack) => {
      if (typeof room === "string" && isValidRoomName(room)) {
        socket.leave(room);
      }
      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("disconnect", (reason) => {
      metrics.onDisconnect();
      log("debug", "Socket disconnected", { id: socket.id, reason });
    });
  });

  function listen({ port = cfg.port, host = cfg.host } = {}) {
    return new Promise((resolve) => {
      httpServer.listen(port, host, () => {
        const boundPort = httpServer.address()?.port ?? port;
        log("info", "Realtime server listening", {
          host,
          port: boundPort,
          env: cfg.nodeEnv,
          clientEvent: CLIENT_EVENT_NAME,
        });
        resolve({ port: boundPort, host });
      });
    });
  }

  function close() {
    return new Promise((resolve) => {
      // io.close() also closes the attached HTTP server and disconnects sockets.
      io.close(() => resolve());
    });
  }

  return { app, httpServer, io, cfg, metrics, listen, close };
}

// ─── CLI bootstrap (only when run directly: `node src/server.mjs`) ────────────

function isRunDirectly() {
  try {
    if (!process.argv[1]) return false;
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isRunDirectly()) {
  const log = createLogger(config.logLevel);
  const server = createRealtimeServer();

  server.listen({ port: config.port, host: config.host }).then(() => {
    log("warn", "DORMANT server — not for production until approved");
    if (config.eventSecret.length === 0) {
      log("warn", "REALTIME_EVENT_SECRET not set — /internal/events rejects all calls");
    }
    if (config.allowedOrigins.length === 0) {
      log(
        "warn",
        config.isProduction
          ? "ALLOWED_ORIGINS empty in production — ALL browser origins rejected (fail closed)"
          : "ALLOWED_ORIGINS not set — only localhost browser origins allowed (dev)",
      );
    }
  });

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log("info", "Shutting down", { signal });
    server.close().then(() => {
      log("info", "Shutdown complete");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
