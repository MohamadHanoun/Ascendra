/**
 * Realtime client-token verification for the realtime server (Batch 1F).
 *
 * Independent copy of the verifier in the Next.js app
 * (lib/realtime/clientToken.ts). The two MUST stay in sync — same format,
 * same algorithm. The server only ever VERIFIES tokens; it never signs them.
 *
 * Format:
 *   base64url(jsonPayload) + "." + base64url(HMAC_SHA256(secret, base64url(jsonPayload)))
 *
 * Never logs token contents or signatures. Never throws.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const CLIENT_TOKEN_VERSION = 1;

const IAT_SKEW_SECONDS = 60;
const MAX_TOKEN_LENGTH = 4096;

const ROOM_PATTERN = /^[a-zA-Z0-9:_-]+$/;
const MAX_ROOM_LENGTH = 160;

export function isValidRoomName(room) {
  return (
    typeof room === "string" &&
    room.length > 0 &&
    room.length <= MAX_ROOM_LENGTH &&
    ROOM_PATTERN.test(room)
  );
}

function fromBase64Url(input) {
  const padLength = input.length % 4 === 0 ? 0 : 4 - (input.length % 4);
  const normalized =
    input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLength);
  return Buffer.from(normalized, "base64");
}

export function verifyClientToken({ secret, token, now = Date.now() }) {
  try {
    if (!secret) {
      return { ok: false, reason: "no_secret" };
    }
    if (
      typeof token !== "string" ||
      token.length === 0 ||
      token.length > MAX_TOKEN_LENGTH
    ) {
      return { ok: false, reason: "invalid_token" };
    }

    const parts = token.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return { ok: false, reason: "malformed" };
    }

    const [encodedPayload, encodedSignature] = parts;
    const expected = createHmac("sha256", secret)
      .update(encodedPayload)
      .digest();

    let provided;
    try {
      provided = fromBase64Url(encodedSignature);
    } catch {
      return { ok: false, reason: "bad_signature" };
    }

    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return { ok: false, reason: "signature_mismatch" };
    }

    let payload;
    try {
      payload = JSON.parse(fromBase64Url(encodedPayload).toString("utf8"));
    } catch {
      return { ok: false, reason: "bad_payload" };
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return { ok: false, reason: "bad_payload" };
    }

    if (payload.version !== CLIENT_TOKEN_VERSION) {
      return { ok: false, reason: "unsupported_version" };
    }
    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      return { ok: false, reason: "missing_sub" };
    }
    if (
      !Array.isArray(payload.rooms) ||
      !payload.rooms.every((room) => isValidRoomName(room))
    ) {
      return { ok: false, reason: "invalid_rooms" };
    }
    if (
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number" ||
      !Number.isFinite(payload.iat) ||
      !Number.isFinite(payload.exp)
    ) {
      return { ok: false, reason: "invalid_times" };
    }

    const nowSeconds = Math.floor(now / 1000);
    if (payload.iat > nowSeconds + IAT_SKEW_SECONDS) {
      return { ok: false, reason: "not_yet_valid" };
    }
    if (payload.exp <= nowSeconds) {
      return { ok: false, reason: "expired" };
    }

    return {
      ok: true,
      claims: {
        sub: payload.sub,
        isAdmin: payload.isAdmin === true,
        rooms: payload.rooms,
        iat: payload.iat,
        exp: payload.exp,
        version: CLIENT_TOKEN_VERSION,
      },
    };
  } catch {
    return { ok: false, reason: "verify_error" };
  }
}
