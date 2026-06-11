/**
 * Realtime payload sanitizer (Batch 1C — DORMANT FOUNDATION).
 *
 * Produces a safe, minimal payload for future WebSocket events. It is NOT wired
 * into any emitter yet — the DB-polling realtime system is unchanged.
 *
 * Security model:
 *  - PUBLIC events are ID-only by default. Sensitive/private data never leaves.
 *  - ADMIN events may keep operational IDs but are still stripped of secrets,
 *    tokens, headers, passwords, etc.
 *  - Defends against prototype pollution, circular structures, oversized output,
 *    and non-JSON values. Never throws.
 */

import { REALTIME_AUDIENCES } from "@/lib/realtime/eventTypes";

// ─── Limits ──────────────────────────────────────────────────────────────────

const MAX_DEPTH = 4;
const MAX_ARRAY_LENGTH = 50;
const MAX_STRING_LENGTH = 500;
const MAX_OUTPUT_BYTES = 8 * 1024; // 8 KB

// ─── Sensitive key handling ───────────────────────────────────────────────────

// Exact (lowercased) field names that must never appear in any payload.
const SENSITIVE_KEYS = new Set([
  "rejectionreason",
  "reason",
  "adminnote",
  "adminnotes",
  "note",
  "notes",
  "email",
  "token",
  "secret",
  "password",
  "authorization",
  "cookie",
  "discordaccesstoken",
  "discordrefreshtoken",
  "accesstoken",
  "refreshtoken",
  "userids",
  "discordid",
  "raw",
  "headers",
]);

// Defensive substrings: any key containing these is dropped, even if not in the
// exact list above (e.g. "apiToken", "clientSecret", "sessionCookie").
const SENSITIVE_SUBSTRINGS = [
  "token",
  "secret",
  "password",
  "cookie",
  "authorization",
];

// Prototype-pollution vectors — always dropped.
const PROTO_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();

  if (PROTO_KEYS.has(lower)) {
    return true;
  }

  if (SENSITIVE_KEYS.has(lower)) {
    return true;
  }

  return SENSITIVE_SUBSTRINGS.some((needle) => lower.includes(needle));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function capString(value: string): string {
  return value.length > MAX_STRING_LENGTH
    ? value.slice(0, MAX_STRING_LENGTH)
    : value;
}

// Discord IDs are numeric snowflakes (17–20 digits); never expose them publicly.
function looksLikeDiscordId(value: string): boolean {
  return /^\d{17,20}$/.test(value);
}

/**
 * Recursively sanitize an arbitrary value into a JSON-safe value.
 * Returns `undefined` for anything that must be dropped (the caller skips it).
 */
function deepSanitize(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (depth > MAX_DEPTH) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  switch (typeof value) {
    case "string":
      return capString(value);
    case "number":
      return Number.isFinite(value) ? value : undefined;
    case "boolean":
      return value;
    case "bigint":
    case "function":
    case "symbol":
    case "undefined":
      return undefined;
    default:
      break;
  }

  // Objects from here down.
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? undefined : value.toISOString();
  }

  if (typeof value !== "object") {
    return undefined;
  }

  if (seen.has(value)) {
    // Circular reference — drop.
    return undefined;
  }
  seen.add(value);

  try {
    if (Array.isArray(value)) {
      const out: unknown[] = [];
      for (const item of value.slice(0, MAX_ARRAY_LENGTH)) {
        const sanitized = deepSanitize(item, depth + 1, seen);
        if (sanitized !== undefined) {
          out.push(sanitized);
        }
      }
      return out;
    }

    if (!isPlainObject(value)) {
      // Map/Set/class instances etc. — drop entirely.
      return undefined;
    }

    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      if (isSensitiveKey(key)) {
        continue;
      }
      const sanitized = deepSanitize(value[key], depth + 1, seen);
      if (sanitized !== undefined) {
        out[key] = sanitized;
      }
    }
    return out;
  } finally {
    // Allow the same object to appear in sibling branches (DAG), block cycles.
    seen.delete(value);
  }
}

/**
 * Build the minimal, ID-only payload used for public events (and as the safe
 * fallback when an admin payload is oversized).
 */
function buildMinimalPayload(
  payload: Record<string, unknown>,
  entityType: string | null | undefined,
  entityId: string | null | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const key of ["tournamentId", "matchId", "teamId"]) {
    const value = payload[key];
    if (typeof value === "string" && value.length > 0) {
      out[key] = capString(value);
    }
  }

  const userId = payload.userId;
  if (
    typeof userId === "string" &&
    userId.length > 0 &&
    !looksLikeDiscordId(userId)
  ) {
    out.userId = capString(userId);
  }

  if (typeof entityType === "string" && entityType.length > 0) {
    out.entityType = capString(entityType);
  }

  if (typeof entityId === "string" && entityId.length > 0) {
    out.entityId = capString(entityId);
  }

  return out;
}

function buildTournamentOnlyPayload(
  payload: Record<string, unknown>,
  entityType: string | null | undefined,
  entityId: string | null | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const tournamentId = payload.tournamentId;

  if (typeof tournamentId === "string" && tournamentId.length > 0) {
    out.tournamentId = capString(tournamentId);
  }

  if (typeof entityType === "string" && entityType.length > 0) {
    out.entityType = capString(entityType);
  }

  if (typeof entityId === "string" && entityId.length > 0) {
    out.entityId = capString(entityId);
  }

  return out;
}

function buildNotificationOnlyPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const notificationId = payload.notificationId;

  if (typeof notificationId === "string" && notificationId.length > 0) {
    out.notificationId = capString(notificationId);
  }

  return out;
}

function serializedByteLength(value: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(value) ?? "", "utf8");
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type SanitizeRealtimeInput = {
  type: string;
  audience?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: Record<string, unknown> | null;
};

/**
 * Sanitize an event payload for transmission to the realtime server.
 * Never throws; always returns a plain, JSON-serializable object.
 */
export function sanitizeRealtimePayload(
  input: SanitizeRealtimeInput,
): Record<string, unknown> {
  try {
    const payload = isPlainObject(input?.payload) ? input.payload : {};
    const isAdmin = input?.audience === REALTIME_AUDIENCES.ADMIN;

    if (!isAdmin) {
      // Public: ID-only, never anything else.
      if (
        input?.type === "tournament.registration.updated" ||
        input?.type === "tournaments.updated"
      ) {
        return buildTournamentOnlyPayload(
          payload,
          input?.entityType,
          input?.entityId,
        );
      }

      if (input?.type === "notification.created") {
        return buildNotificationOnlyPayload(payload);
      }

      return buildMinimalPayload(payload, input?.entityType, input?.entityId);
    }

    // Admin: deep-sanitize (secrets/tokens/headers always stripped).
    const sanitized = deepSanitize(payload, 1, new WeakSet());
    const result = isPlainObject(sanitized) ? sanitized : {};

    // Enforce total output cap; fall back to minimal IDs if too large.
    if (serializedByteLength(result) > MAX_OUTPUT_BYTES) {
      return buildMinimalPayload(payload, input?.entityType, input?.entityId);
    }

    return result;
  } catch {
    return {};
  }
}
