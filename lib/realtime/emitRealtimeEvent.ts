import "server-only";

import { createHmac } from "node:crypto";

/**
 * Secure, SERVER-ONLY realtime event bridge (Batch 1B — DORMANT FOUNDATION).
 *
 * This helper can POST realtime events from Vercel/Next.js to the standalone
 * Hetzner realtime server's `/internal/events` endpoint, signed with HMAC.
 *
 * IMPORTANT — this is dormant and intentionally NOT wired anywhere:
 *  - It is disabled by default (requires REALTIME_ENABLE_SOCKET === "true").
 *  - No existing emitter calls it. The DB-polling realtime system is unchanged.
 *  - It is server-only (`import "server-only"`); it must never reach the browser.
 *  - It never throws. On any problem it returns a structured, safe result.
 *  - It never logs secrets, signatures, full payloads, or Authorization headers.
 *  - It never reads or exposes any NEXT_PUBLIC_* secret.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const INTERNAL_EVENTS_PATH = "/internal/events";

const MAX_TYPE_LENGTH = 120;
const MAX_ROOMS = 20;
const MAX_ROOM_LENGTH = 160;
const MAX_BODY_BYTES = 32 * 1024; // 32 KB

const DEFAULT_TIMEOUT_MS = 1500;
const MIN_TIMEOUT_MS = 500;
const MAX_TIMEOUT_MS = 5000;

const RECOMMENDED_MIN_SECRET_LENGTH = 32;

// Room names: letters, digits, colon, underscore, hyphen only.
const ROOM_PATTERN = /^[a-zA-Z0-9:_-]+$/;
// Event type names mirror existing dotted/underscored identifiers.
const TYPE_PATTERN = /^[a-zA-Z0-9._:-]+$/;

const BRIDGE_USER_AGENT = "Ascendra-Realtime-Bridge/1.0";

// ─── Types ───────────────────────────────────────────────────────────────────

export type RealtimeBridgeEvent = {
  type: string;
  rooms: string[];
  payload?: Record<string, unknown>;
  audience?: string;
  entityType?: string | null;
  entityId?: string | null;
};

export type EmitRealtimeResult = {
  ok: boolean;
  skipped: boolean;
  reason?: string;
  status?: number;
};

type NormalizedEvent = {
  type: string;
  rooms: string[];
  payload: Record<string, unknown>;
  audience: string | null;
  entityType: string | null;
  entityId: string | null;
};

// ─── Helpers (exported for unit tests; all pure, no I/O) ──────────────────────

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validate the configured realtime server URL.
 *
 * Rules:
 *  - Must be an absolute URL.
 *  - Only http/https protocols.
 *  - Production requires https.
 *  - Non-production allows http ONLY for localhost / 127.0.0.1.
 *  - Reject embedded credentials (username/password).
 * Returns the safe origin (path/query stripped); the caller appends the
 * fixed internal path so callers can never inject an arbitrary path.
 */
export function validateRealtimeServerUrl(
  rawUrl: string | undefined,
  isProduction: boolean,
): { ok: true; origin: string } | { ok: false; reason: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { ok: false, reason: "missing_server_url" };
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "invalid_server_url" };
  }

  if (url.username || url.password) {
    return { ok: false, reason: "credentials_in_url" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "unsupported_protocol" };
  }

  const isLocalhost =
    url.hostname === "localhost" || url.hostname === "127.0.0.1";

  if (isProduction && url.protocol !== "https:") {
    return { ok: false, reason: "https_required_in_production" };
  }

  if (!isProduction && url.protocol === "http:" && !isLocalhost) {
    return { ok: false, reason: "http_only_allowed_for_localhost" };
  }

  return { ok: true, origin: url.origin };
}

/**
 * Validate + normalize an inbound event. Pure; returns a safe reason on failure.
 */
export function validateEventInput(
  event: RealtimeBridgeEvent,
): { ok: true; event: NormalizedEvent } | { ok: false; reason: string } {
  if (!event || typeof event !== "object") {
    return { ok: false, reason: "invalid_event" };
  }

  const { type, rooms, payload, audience, entityType, entityId } = event;

  if (typeof type !== "string") {
    return { ok: false, reason: "invalid_type" };
  }
  const trimmedType = type.trim();
  if (
    trimmedType.length === 0 ||
    trimmedType.length > MAX_TYPE_LENGTH ||
    !TYPE_PATTERN.test(trimmedType)
  ) {
    return { ok: false, reason: "invalid_type" };
  }

  if (!Array.isArray(rooms) || rooms.length === 0) {
    return { ok: false, reason: "invalid_rooms" };
  }
  if (rooms.length > MAX_ROOMS) {
    return { ok: false, reason: "too_many_rooms" };
  }
  for (const room of rooms) {
    if (
      typeof room !== "string" ||
      room.length === 0 ||
      room.length > MAX_ROOM_LENGTH ||
      !ROOM_PATTERN.test(room)
    ) {
      return { ok: false, reason: "invalid_room_name" };
    }
  }
  const dedupedRooms = Array.from(new Set(rooms));

  let safePayload: Record<string, unknown> = {};
  if (payload !== undefined) {
    if (!isPlainObject(payload)) {
      return { ok: false, reason: "invalid_payload" };
    }
    safePayload = payload;
  }

  if (audience !== undefined && audience !== null && typeof audience !== "string") {
    return { ok: false, reason: "invalid_audience" };
  }
  if (
    entityType !== undefined &&
    entityType !== null &&
    typeof entityType !== "string"
  ) {
    return { ok: false, reason: "invalid_entityType" };
  }
  if (
    entityId !== undefined &&
    entityId !== null &&
    typeof entityId !== "string"
  ) {
    return { ok: false, reason: "invalid_entityId" };
  }

  return {
    ok: true,
    event: {
      type: trimmedType,
      rooms: dedupedRooms,
      payload: safePayload,
      audience: audience ?? null,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
    },
  };
}

/**
 * Compute the request signature: HMAC_SHA256(secret, `${timestamp}.${rawBody}`).
 * Returned as `sha256=<hex>`.
 */
export function createSignature(
  secret: string,
  timestamp: number | string,
  rawBody: string,
): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(`${timestamp}.${rawBody}`);
  return `sha256=${hmac.digest("hex")}`;
}

function resolveTimeoutMs(): number {
  const raw = process.env.REALTIME_EMIT_TIMEOUT_MS;
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_TIMEOUT_MS;
  }
  return Math.min(Math.max(parsed, MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Attempt to send a realtime event to the Hetzner realtime server.
 * Never throws. Disabled/misconfigured => { ok:false, skipped:true, reason }.
 */
export async function emitRealtimeEventToServer(
  event: RealtimeBridgeEvent,
): Promise<EmitRealtimeResult> {
  try {
    // 1) Enablement gate — disabled by default.
    if (process.env.REALTIME_ENABLE_SOCKET !== "true") {
      return { ok: false, skipped: true, reason: "disabled" };
    }

    const isProduction = isProductionEnv();

    // 2) URL validation (absolute, protocol, no credentials, https in prod).
    const urlResult = validateRealtimeServerUrl(
      process.env.REALTIME_SERVER_URL,
      isProduction,
    );
    if (!urlResult.ok) {
      return { ok: false, skipped: true, reason: urlResult.reason };
    }

    // 3) Secret presence + (in prod) minimum strength. Length never logged.
    const secret = process.env.REALTIME_EVENT_SECRET;
    if (!secret) {
      return { ok: false, skipped: true, reason: "missing_secret" };
    }
    if (isProduction && secret.length < RECOMMENDED_MIN_SECRET_LENGTH) {
      return { ok: false, skipped: true, reason: "weak_secret" };
    }

    // 4) Event validation.
    const validated = validateEventInput(event);
    if (!validated.ok) {
      return { ok: false, skipped: true, reason: validated.reason };
    }

    // 5) Serialize body safely (catches circular structures).
    const body = {
      type: validated.event.type,
      rooms: validated.event.rooms,
      payload: validated.event.payload,
      audience: validated.event.audience,
      entityType: validated.event.entityType,
      entityId: validated.event.entityId,
    };

    let rawBody: string;
    try {
      rawBody = JSON.stringify(body);
    } catch {
      return { ok: false, skipped: true, reason: "unserializable_payload" };
    }

    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return { ok: false, skipped: true, reason: "payload_too_large" };
    }

    // 6) Sign.
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createSignature(secret, timestamp, rawBody);

    // 7) Send with timeout. Fixed path; caller cannot influence it.
    const timeoutMs = resolveTimeoutMs();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${urlResult.origin}${INTERNAL_EVENTS_PATH}`, {
        method: "POST",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
          "X-Ascendra-Timestamp": String(timestamp),
          "X-Ascendra-Signature": signature,
          "User-Agent": BRIDGE_USER_AGENT,
        },
        body: rawBody,
      });

      if (!response.ok) {
        return { ok: false, skipped: false, status: response.status };
      }

      return { ok: true, skipped: false, status: response.status };
    } catch (error) {
      const reason =
        error instanceof Error && error.name === "AbortError"
          ? "timeout"
          : "network_error";
      return { ok: false, skipped: false, reason };
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Absolute last-resort guard: never throw to callers.
    return { ok: false, skipped: true, reason: "unexpected_error" };
  }
}
