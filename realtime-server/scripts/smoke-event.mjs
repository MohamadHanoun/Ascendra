/**
 * Safe signed smoke-test tool for POST /internal/events (Batch 1N).
 *
 * Sends ONE HMAC-signed, minimal, public-only event to the realtime server so an
 * operator can verify ingress + delivery without hand-crafting HMAC in the shell.
 *
 * Safety:
 *  - Node built-ins only; no dependencies.
 *  - Never prints secrets, the Authorization header, or the HMAC signature.
 *  - Defaults to http://127.0.0.1:8787; production targets must be https (except
 *    localhost). Always posts the fixed /internal/events path (no path override).
 *  - Public rooms only: leaderboard, tournament:{id}, match:{id}. No
 *    private/admin/user/notifications/profile/team rooms.
 *  - Minimal ID-only payload; no arbitrary JSON input.
 *  - Never throws to the caller; returns structured results.
 */

import { createHmac } from "node:crypto";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

const INTERNAL_EVENTS_PATH = "/internal/events";
const DEFAULT_TARGET = "http://127.0.0.1:8787";
const USER_AGENT = "Ascendra-Realtime-Smoke/1.0";

const MAX_TYPE_LENGTH = 120;
const MAX_ID_LENGTH = 120;
const DEFAULT_TIMEOUT_MS = 1500;
const MIN_TIMEOUT_MS = 500;
const MAX_TIMEOUT_MS = 5000;

const TYPE_PATTERN = /^[a-zA-Z0-9._:-]+$/;
const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

// Output keys that must never be echoed even if a server returned them.
const UNSAFE_OUTPUT = /secret|signature|authorization|cookie|token/i;

export function resolveTimeout(raw) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(parsed, MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
}

export function validateSmokeTarget(rawUrl, isProduction) {
  const value = rawUrl && rawUrl.trim() ? rawUrl.trim() : DEFAULT_TARGET;
  let url;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: "invalid_target_url" };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "credentials_in_url" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "unsupported_protocol" };
  }
  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol === "http:" && (isProduction || !isLocalhost)) {
    return { ok: false, reason: "https_required" };
  }
  return { ok: true, origin: url.origin };
}

function isValidId(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_ID_LENGTH &&
    ID_PATTERN.test(value)
  );
}

export function isSafeSmokeRoom(room) {
  if (room === "leaderboard") return true;
  if (room.startsWith("tournament:")) return isValidId(room.slice("tournament:".length));
  if (room.startsWith("match:")) return isValidId(room.slice("match:".length));
  return false;
}

function deriveEntity(room, tournamentId) {
  if (room.startsWith("tournament:")) {
    return { entityType: "tournament", entityId: room.slice("tournament:".length) };
  }
  if (room.startsWith("match:")) {
    return { entityType: "tournamentMatch", entityId: room.slice("match:".length) };
  }
  return { entityType: "leaderboard", entityId: tournamentId };
}

/**
 * Build a safe, minimal smoke event from env-style overrides.
 * @param {Record<string,string|undefined>} env
 */
export function buildSmokeEvent(env = {}) {
  const type = (env.REALTIME_SMOKE_TYPE || "leaderboard.updated").trim();
  if (type.length === 0 || type.length > MAX_TYPE_LENGTH || !TYPE_PATTERN.test(type)) {
    return { ok: false, reason: "invalid_type" };
  }

  const room = (env.REALTIME_SMOKE_ROOM || "leaderboard").trim();
  if (!isSafeSmokeRoom(room)) {
    return { ok: false, reason: "unsafe_room" };
  }

  const tournamentId = (env.REALTIME_SMOKE_TOURNAMENT_ID || "smoke_test").trim();
  if (!isValidId(tournamentId)) {
    return { ok: false, reason: "invalid_tournament_id" };
  }

  const { entityType, entityId } = deriveEntity(room, tournamentId);

  return {
    ok: true,
    event: {
      type,
      rooms: [room],
      payload: { tournamentId },
      audience: "public",
      entityType,
      entityId,
    },
  };
}

export function createSignature(secret, timestamp, rawBody) {
  return `sha256=${createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")}`;
}

/** Parse a response body but never return it if it could contain sensitive data. */
export function safeBody(text) {
  if (typeof text !== "string" || text.trim().length === 0) return null;
  if (UNSAFE_OUTPUT.test(text)) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function sendSmokeEvent({ secret, origin, event, timeoutMs }) {
  const rawBody = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createSignature(secret, timestamp, rawBody);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${origin}${INTERNAL_EVENTS_PATH}`, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
        "X-Ascendra-Timestamp": String(timestamp),
        "X-Ascendra-Signature": signature,
        "User-Agent": USER_AGENT,
      },
      body: rawBody,
    });
    const text = await response.text().catch(() => "");
    return { ok: response.ok, status: response.status, body: safeBody(text) };
  } catch (error) {
    const reason = error?.name === "AbortError" ? "timeout" : "network_error";
    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Full pipeline: validate config + build + sign + send. Never throws.
 * @returns {{ ok, status?, reason?, origin?, event?, body? }}
 */
export async function runSmoke({ secret, targetUrl, isProduction = false, env = {}, timeoutMs } = {}) {
  if (!secret) {
    return { ok: false, reason: "missing_secret" };
  }
  const target = validateSmokeTarget(targetUrl, isProduction);
  if (!target.ok) {
    return { ok: false, reason: target.reason };
  }
  const built = buildSmokeEvent(env);
  if (!built.ok) {
    return { ok: false, reason: built.reason };
  }
  const resolvedTimeout = timeoutMs ?? resolveTimeout(env.REALTIME_SMOKE_TIMEOUT_MS);
  const result = await sendSmokeEvent({
    secret,
    origin: target.origin,
    event: built.event,
    timeoutMs: resolvedTimeout,
  });
  return { ...result, origin: target.origin, event: built.event };
}

// ─── CLI (only when run directly: `node scripts/smoke-event.mjs`) ──────────────

function isRunDirectly() {
  try {
    if (!process.argv[1]) return false;
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isRunDirectly()) {
  const secret = process.env.REALTIME_EVENT_SECRET;
  const targetUrl = process.env.REALTIME_SMOKE_TARGET_URL;
  const isProduction = process.env.NODE_ENV === "production";

  // Pre-flight config errors (printed without any secret).
  if (!secret) {
    console.error("[smoke] FAILED: REALTIME_EVENT_SECRET is not set.");
    process.exit(1);
  }
  const target = validateSmokeTarget(targetUrl, isProduction);
  if (!target.ok) {
    console.error(`[smoke] FAILED: ${target.reason}`);
    process.exit(1);
  }
  const built = buildSmokeEvent(process.env);
  if (!built.ok) {
    console.error(`[smoke] FAILED: ${built.reason}`);
    process.exit(1);
  }
  const timeoutMs = resolveTimeout(process.env.REALTIME_SMOKE_TIMEOUT_MS);

  console.log(`[smoke] target: ${target.origin}${INTERNAL_EVENTS_PATH}`);
  console.log(
    `[smoke] event: ${built.event.type} -> rooms=${built.event.rooms.length} (${built.event.rooms.join(", ")})`,
  );
  console.log(`[smoke] timeout: ${timeoutMs}ms`);

  runSmoke({ secret, targetUrl, isProduction, env: process.env, timeoutMs }).then(
    (result) => {
      if (result.reason && result.status === undefined) {
        console.error(`[smoke] FAILED: ${result.reason}`);
        process.exit(1);
      }
      console.log(`[smoke] status: ${result.status} ok=${result.ok}`);
      if (result.body) {
        console.log(`[smoke] response: ${JSON.stringify(result.body)}`);
      }
      process.exit(result.ok ? 0 : 1);
    },
  );
}
