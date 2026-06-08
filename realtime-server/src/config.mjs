/**
 * Configuration loader for the Ascendra realtime server (FOUNDATION ONLY).
 *
 * Reads environment variables (optionally from a local .env via dotenv) and
 * exposes a frozen config object. No secrets are printed anywhere.
 *
 * This server is dormant: it is not wired into the Next.js app and must not be
 * run on production until approved.
 */

import dotenv from "dotenv";

import { clampInt } from "./security.mjs";

dotenv.config();

function parseOrigins(raw) {
  if (!raw || typeof raw !== "string") {
    return [];
  }

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parsePort(raw, fallback) {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const allowedOrigins = parseOrigins(process.env.ALLOWED_ORIGINS);

export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  // Default port for local development. Bind to localhost in production and put
  // a reverse proxy (Caddy/Nginx) in front for TLS + the public domain.
  port: parsePort(process.env.PORT, 8787),
  host: process.env.HOST || "127.0.0.1",

  // Server-to-server shared secret. Required to accept POST /internal/events.
  // Value is never logged.
  eventSecret: process.env.REALTIME_EVENT_SECRET || "",

  // Reserved for future client-token verification (Phase: client provider).
  // Not enforced yet — anonymous Socket.IO connections are allowed for now.
  clientTokenSecret: process.env.REALTIME_CLIENT_TOKEN_SECRET || "",

  // Optional dedicated secret for GET /internal/status. When unset, the status
  // endpoint falls back to REALTIME_EVENT_SECRET. Value is never logged.
  statusSecret: process.env.REALTIME_STATUS_SECRET || "",

  // CORS / Socket.IO allowed origins. Empty array => reflect-none (deny).
  allowedOrigins,

  siteUrl: process.env.ASCENDRA_SITE_URL || "",
  logLevel: process.env.LOG_LEVEL || "info",

  // Hardening (Batch 1E). In-memory, single-process only.
  // /internal/events requests per minute, per client IP. Default 120.
  internalEventsRateLimitPerMinute: clampInt(
    process.env.INTERNAL_EVENTS_RATE_LIMIT_PER_MINUTE,
    1,
    6000,
    120,
  ),
  // How long a signature+timestamp pair is remembered to block replays.
  // Default 120s (matches the HMAC skew window).
  replayWindowSeconds: clampInt(
    process.env.INTERNAL_EVENTS_REPLAY_WINDOW_SECONDS,
    30,
    600,
    120,
  ),

  isProduction: (process.env.NODE_ENV || "development") === "production",
});

/**
 * Lightweight readiness flags so the server can warn (but still boot) when
 * optional/foundation settings are missing. Never exposes the actual values.
 */
export const configStatus = Object.freeze({
  hasEventSecret: config.eventSecret.length > 0,
  hasClientTokenSecret: config.clientTokenSecret.length > 0,
  allowedOriginsCount: config.allowedOrigins.length,
});
