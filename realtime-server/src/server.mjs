/**
 * Ascendra realtime server — DORMANT FOUNDATION SKELETON.
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
 *   POST /internal/events  -> server-to-server event ingress (bearer secret).
 *
 * Socket.IO
 *   - Anonymous connections are allowed for now.
 *   - Only public rooms are joinable in this phase (see channels.mjs).
 *   - Client-token ACLs for user/team/admin rooms come in a later phase.
 */

import http from "node:http";

import express from "express";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";

import { config, configStatus } from "./config.mjs";
import {
  isValidEventSecret,
  verifyHmacSignature,
  verifyClientToken,
} from "./auth.mjs";
import {
  validateEventBody,
  broadcastEvent,
  CLIENT_EVENT_NAME,
} from "./events.mjs";
import { isPubliclyJoinable } from "./channels.mjs";

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

// ─── HTTP app ────────────────────────────────────────────────────────────────

const app = express();

app.use(
  cors({
    origin: config.allowedOrigins.length > 0 ? config.allowedOrigins : false,
    credentials: false,
  }),
);

// Capture the exact raw body so HMAC verification uses the identical bytes the
// bridge signed. `verify` runs during parsing; we stash the buffer on the req.
app.use(
  express.json({
    limit: "256kb",
    verify: (req, _res, buf) => {
      req.rawBody = buf && buf.length > 0 ? buf.toString("utf8") : "";
    },
  }),
);

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

app.post("/internal/events", (req, res) => {
  // Layer 1: shared bearer secret (fails closed if secret unconfigured).
  if (!isValidEventSecret(req.headers.authorization)) {
    log("warn", "Rejected /internal/events: invalid or missing bearer secret");
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // Layer 2: HMAC signature over `${timestamp}.${rawBody}` + replay window.
  const hmac = verifyHmacSignature({
    secret: config.eventSecret,
    timestampHeader: req.headers["x-ascendra-timestamp"],
    signatureHeader: req.headers["x-ascendra-signature"],
    rawBody: typeof req.rawBody === "string" ? req.rawBody : "",
  });

  if (!hmac.ok) {
    log("warn", "Rejected /internal/events: HMAC verification failed", {
      reason: hmac.reason,
    });
    return res.status(401).json({ ok: false, error: "Unauthorized" });
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

// ─── HTTP + Socket.IO server ─────────────────────────────────────────────────

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.allowedOrigins.length > 0 ? config.allowedOrigins : false,
    credentials: false,
  },
});

io.on("connection", (socket) => {
  // FUTURE: read socket.handshake.auth.token and verify it here. For now we
  // attach an anonymous identity so later code has a stable shape.
  const identity = verifyClientToken(socket.handshake?.auth?.token);
  socket.data.identity = identity;

  log("debug", "Socket connected", { id: socket.id });

  // Basic room-join foundation. Anonymous clients may only join public rooms.
  // Private/admin rooms are refused until token ACLs exist (later phase).
  socket.on("join", (room, ack) => {
    if (isPubliclyJoinable(room)) {
      socket.join(room);
      if (typeof ack === "function") ack({ ok: true, room });
      return;
    }

    log("debug", "Refused room join", { id: socket.id });
    if (typeof ack === "function") {
      ack({ ok: false, error: "Room not joinable in current phase." });
    }
  });

  socket.on("leave", (room, ack) => {
    if (typeof room === "string" && room.length > 0) {
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
  });

  if (!configStatus.hasEventSecret) {
    log(
      "warn",
      "REALTIME_EVENT_SECRET not set — /internal/events will reject all calls",
    );
  }

  if (configStatus.allowedOriginsCount === 0) {
    log("warn", "ALLOWED_ORIGINS not set — browser origins will be blocked");
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
