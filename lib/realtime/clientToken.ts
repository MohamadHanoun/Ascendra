import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Realtime client token (Batch 1F — server-only).
 *
 * Mints + verifies short-lived, self-contained signed tokens the browser will
 * later present in the Socket.IO handshake to join its private/admin rooms.
 *
 * Format (no JWT dependency):
 *   base64url(jsonPayload) + "." + base64url(HMAC_SHA256(secret, base64url(jsonPayload)))
 *
 * Payload (minimal by design — NEVER include Discord IDs, email, username,
 * OAuth tokens, cookies, or any session data):
 *   { sub, isAdmin, rooms, iat, exp, version }
 *
 * The realtime server has an independent copy of the verifier
 * (realtime-server/src/clientToken.mjs); the two MUST stay in sync.
 */

export const CLIENT_TOKEN_VERSION = 1;

const DEFAULT_TTL_SECONDS = 300; // 5 minutes
const MIN_TTL_SECONDS = 60;
const MAX_TTL_SECONDS = 600; // 10 minutes
const IAT_SKEW_SECONDS = 60;
const MAX_TOKEN_LENGTH = 4096;

const ROOM_PATTERN = /^[a-zA-Z0-9:_-]+$/;
const MAX_ROOM_LENGTH = 160;

export type ClientTokenClaims = {
  sub: string;
  isAdmin: boolean;
  rooms: string[];
  iat: number;
  exp: number;
  version: number;
};

export function isValidRoomName(room: unknown): room is string {
  return (
    typeof room === "string" &&
    room.length > 0 &&
    room.length <= MAX_ROOM_LENGTH &&
    ROOM_PATTERN.test(room)
  );
}

export function resolveClientTokenTtlSeconds(
  raw: string | undefined,
): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_TTL_SECONDS;
  }
  return Math.min(Math.max(parsed, MIN_TTL_SECONDS), MAX_TTL_SECONDS);
}

/**
 * Build the exact, minimal set of rooms an authenticated user may join.
 * Only the user's own private rooms (+ admin rooms for admins). No team rooms
 * yet — deferred to a later batch.
 */
export function buildAllowedRooms(input: {
  databaseId: string;
  isAdmin: boolean;
}): string[] {
  const rooms: string[] = [];
  const add = (room: string) => {
    if (isValidRoomName(room) && !rooms.includes(room)) {
      rooms.push(room);
    }
  };

  add(`user:${input.databaseId}`);
  add(`notifications:${input.databaseId}`);
  add(`profile:${input.databaseId}`);

  if (input.isAdmin) {
    add("admin");
    add("admin:queue");
  }

  return rooms;
}

function toBase64Url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(input: string): Buffer {
  const padLength = input.length % 4 === 0 ? 0 : 4 - (input.length % 4);
  const normalized =
    input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLength);
  return Buffer.from(normalized, "base64");
}

/**
 * Sign a token. The caller is responsible for ensuring `secret` is present and
 * (in production) strong enough.
 */
export function signClientToken(input: {
  secret: string;
  sub: string;
  isAdmin: boolean;
  rooms: string[];
  ttlSeconds: number;
  now?: number;
}): { token: string; payload: ClientTokenClaims } {
  const iat = Math.floor((input.now ?? Date.now()) / 1000);
  const exp = iat + input.ttlSeconds;

  const payload: ClientTokenClaims = {
    sub: input.sub,
    isAdmin: input.isAdmin === true,
    rooms: input.rooms,
    iat,
    exp,
    version: CLIENT_TOKEN_VERSION,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", input.secret)
    .update(encodedPayload)
    .digest();
  const encodedSignature = toBase64Url(signature);

  return { token: `${encodedPayload}.${encodedSignature}`, payload };
}

/**
 * Verify a token. Never throws. Returns claims only when fully valid.
 */
export function verifyClientToken(input: {
  secret: string;
  token: unknown;
  now?: number;
}):
  | { ok: true; claims: ClientTokenClaims }
  | { ok: false; reason: string } {
  try {
    if (!input.secret) {
      return { ok: false, reason: "no_secret" };
    }
    if (
      typeof input.token !== "string" ||
      input.token.length === 0 ||
      input.token.length > MAX_TOKEN_LENGTH
    ) {
      return { ok: false, reason: "invalid_token" };
    }

    const parts = input.token.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return { ok: false, reason: "malformed" };
    }

    const [encodedPayload, encodedSignature] = parts;
    const expected = createHmac("sha256", input.secret)
      .update(encodedPayload)
      .digest();

    let provided: Buffer;
    try {
      provided = fromBase64Url(encodedSignature);
    } catch {
      return { ok: false, reason: "bad_signature" };
    }

    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      return { ok: false, reason: "signature_mismatch" };
    }

    let payload: unknown;
    try {
      payload = JSON.parse(fromBase64Url(encodedPayload).toString("utf8"));
    } catch {
      return { ok: false, reason: "bad_payload" };
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return { ok: false, reason: "bad_payload" };
    }

    const record = payload as Record<string, unknown>;

    if (record.version !== CLIENT_TOKEN_VERSION) {
      return { ok: false, reason: "unsupported_version" };
    }
    if (typeof record.sub !== "string" || record.sub.length === 0) {
      return { ok: false, reason: "missing_sub" };
    }
    if (
      !Array.isArray(record.rooms) ||
      !record.rooms.every((room) => isValidRoomName(room))
    ) {
      return { ok: false, reason: "invalid_rooms" };
    }
    if (
      typeof record.iat !== "number" ||
      typeof record.exp !== "number" ||
      !Number.isFinite(record.iat) ||
      !Number.isFinite(record.exp)
    ) {
      return { ok: false, reason: "invalid_times" };
    }

    const nowSeconds = Math.floor((input.now ?? Date.now()) / 1000);
    if (record.iat > nowSeconds + IAT_SKEW_SECONDS) {
      return { ok: false, reason: "not_yet_valid" };
    }
    if (record.exp <= nowSeconds) {
      return { ok: false, reason: "expired" };
    }

    return {
      ok: true,
      claims: {
        sub: record.sub,
        isAdmin: record.isAdmin === true,
        rooms: record.rooms as string[],
        iat: record.iat,
        exp: record.exp,
        version: CLIENT_TOKEN_VERSION,
      },
    };
  } catch {
    return { ok: false, reason: "verify_error" };
  }
}
