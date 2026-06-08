/**
 * Ascendra realtime server — DORMANT FOUNDATION SKELETON (Batch 1E hardened).
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
 * Security (Batch 1E)
 *   - 64 KB JSON body limit (413 on oversize).
 *   - Per-IP rate limit on /internal/events (429 on limit).
 *   - In-memory signature replay protection (409 on reuse).
 *   - Strict method handling (405 on unsupported methods).
 *   - CORS restricted to ALLOWED_ORIGINS (no wildcard in production).
 *   - Minimal security headers; no-store on responses.
 *   - Anonymous Socket.IO connections may join PUBLIC rooms only, rate-limited.
 *   - Logs never include secrets, signatures, auth headers, or raw bodies.
 */

import http from "node:http";

import express from "express";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";

import { config, configStatus } from "./config.mjs";
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

// ─── Minimal logger (no secrets) ─────────────────────────────────────────────

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const activeLevel = LEVELS[config.logLevel] ?? LEVELS.info;

function log(level, message, meta) {
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
}

// ─── CORS / origin policy ─────────────────────────────────────────────────────

// Shared origin resolver for HTTP CORS and Socket.IO (see security.mjs).
const resolveCorsOrigin = createOriginResolver({
  allowedOrigins: config.allowedOrigins,
  isProduction: config.isProduction,
});

// ─── In-memory limiters (single-process; no Redis) ────────────────────────────

const internalRateLimiter = createRateLimiter({
  limit: config.internalEventsRateLimitPerMinute,
  windowMs: 60_000,
});

const replayCache = createReplayCache({
  windowSeconds: config.replayWindowSeconds,
});

// Per-socket join attempt limiter (keyed by socket id).
const joinRateLimiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

// ─── HTTP app ────────────────────────────────────────────────────────────────

const app = express();
app.disable("x-powered-by");

app.use(cors({ origin: resolveCorsOrigin, credentials: false }));

// Minimal security headers + no-store on every response.
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Strict 64 KB JSON limit; capture the exact raw body for HMAC verification.
app.use(
  express.json({
    limit: "64kb",
    verify: (req, _res, buf) => {
      req.rawBody = buf && buf.length > 0 ? buf.toString("utf8") : "";
    },
  }),
);

function methodNotAllowed(allowed) {
  return (_req, res) => {
    res.setHeader("Allow", allowed.join(", "));
    res.status(405).json({ ok: false, error: "Method not allowed" });
  };
}

// ─── Routes ────────────────────────────────────────────────────────────────────

app.get("/healthz", (_req, res) => {
  res.json({
    ok: true,
    service: "ascendra-realtime",
    env: config.nodeEnv,
    uptimeSeconds: Math.round(process.uptime()),
    connections: io?.engine?.clientsCount ?? 0,
    config: {
      hasEventSecret: configStatus.hasEventSecret,
      hasClientTokenSecret: configStatus.hasClientTokenSecret,
      allowedOriginsCount: configStatus.allowedOriginsCount,
    },
  });
});
app.all("/healthz", methodNotAllowed(["GET"]));

app.post("/internal/events", (req, res) => {
  // Layer 0: per-IP rate limit.
  const ip = getClientIp(req);
  const rate = internalRateLimiter(ip);
  if (!rate.allowed) {
    res.setHeader("Retry-After", String(rate.retryAfterSeconds));
    return res.status(429).json({ ok: false, error: "Too many requests" });
  }

  // Layer 1: shared bearer secret (fails closed if secret unconfigured).
  if (!isValidEventSecret(req.headers.authorization)) {
    log("warn", "Rejected /internal/events: invalid or missing bearer secret");
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // Layer 2: HMAC signature over `${timestamp}.${rawBody}` + skew window.
  const rawBody = typeof req.rawBody === "string" ? req.rawBody : "";
  const hmac = verifyHmacSignature({
    secret: config.eventSecret,
    timestampHeader: req.headers["x-ascendra-timestamp"],
    signatureHeader: req.headers["x-ascendra-signature"],
    rawBody,
  });

  if (!hmac.ok) {
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
      log("warn", "Rejected /internal/events: replayed request");
      return res.status(409).json({ ok: false, error: "Replay detected" });
    }
  }

  const result = validateEventBody(req.body);
  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error });
  }

  const roomCount = broadcastEvent(io, result.event);

  log("info", "Broadcast event", {
    type: result.event.type,
    rooms: roomCount,
  });

  return res.json({ ok: true, type: result.event.type, rooms: roomCount });
});
app.all("/internal/events", methodNotAllowed(["POST"]));

// Body-parse / size error handler (must be last; 4-arg signature).
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err?.status || err?.statusCode || 400;
  if (status === 413 || err?.type === "entity.too.large") {
    return res.status(413).json({ ok: false, error: "Payload too large" });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ ok: false, error: "Invalid JSON" });
  }
  return res.status(400).json({ ok: false, error: "Bad request" });
});

// ─── HTTP + Socket.IO server ─────────────────────────────────────────────────

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  maxHttpBufferSize: 64 * 1024,
  cors: { origin: resolveCorsOrigin, credentials: false },
});

io.on("connection", (socket) => {
  // Verify the optional client token from the handshake. Invalid/absent tokens
  // fall back to anonymous (public rooms only) — we do not disconnect. Never log
  // the token or handshake auth.
  const verified = verifyClientToken({
    secret: config.clientTokenSecret,
    token: socket.handshake?.auth?.token,
  });
  socket.data.claims = verified.ok ? verified.claims : null;

  log("debug", "Socket connected", {
    id: socket.id,
    authenticated: verified.ok,
    connections: io.engine.clientsCount,
  });

  // Join policy (see acl.mjs):
  //  - public rooms: anonymous allowed
  //  - private rooms: require a token claim for the exact room
  //  - admin rooms: require isAdmin + the exact room claim
  socket.on("join", (room, ack) => {
    const rate = joinRateLimiter(socket.id);
    if (!rate.allowed) {
      if (typeof ack === "function") {
        ack({ ok: false, error: "Too many join attempts." });
      }
      return;
    }

    if (typeof room !== "string" || !isValidRoomName(room)) {
      if (typeof ack === "function") {
        ack({ ok: false, error: "Invalid room name." });
      }
      return;
    }

    const decision = canJoinRoom(room, socket.data.claims);
    if (!decision.allowed) {
      log("debug", "Refused room join", { id: socket.id });
      if (typeof ack === "function") {
        ack({ ok: false, error: "Room not joinable." });
      }
      return;
    }

    socket.join(room);
    if (typeof ack === "function") {
      ack({ ok: true, room });
    }
  });

  socket.on("leave", (room, ack) => {
    if (typeof room === "string" && isValidRoomName(room)) {
      socket.leave(room);
    }
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("disconnect", (reason) => {
    log("debug", "Socket disconnected", { id: socket.id, reason });
  });
});

// ─── Boot ────────────────────────────────────────────────────────────────────

httpServer.listen(config.port, config.host, () => {
  log("info", "Realtime server listening (DORMANT — not for production)", {
    host: config.host,
    port: config.port,
    env: config.nodeEnv,
    clientEvent: CLIENT_EVENT_NAME,
    rateLimitPerMinute: config.internalEventsRateLimitPerMinute,
    replayWindowSeconds: config.replayWindowSeconds,
  });

  if (!configStatus.hasEventSecret) {
    log(
      "warn",
      "REALTIME_EVENT_SECRET not set — /internal/events will reject all calls",
    );
  }

  if (configStatus.allowedOriginsCount === 0) {
    log(
      "warn",
      config.isProduction
        ? "ALLOWED_ORIGINS empty in production — ALL browser origins are rejected (fail closed)"
        : "ALLOWED_ORIGINS not set — only localhost browser origins allowed (dev)",
    );
  }
});

// ─── Graceful shutdown ───────────────────────────────────────────────────────

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  log("info", "Shutting down", { signal });

  io.close(() => {
    httpServer.close(() => {
      log("info", "Shutdown complete");
      process.exit(0);
    });
  });

  // Hard exit if something hangs.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
