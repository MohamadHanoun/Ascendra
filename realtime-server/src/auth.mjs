/**
 * Authentication helpers for the Ascendra realtime server (FOUNDATION ONLY).
 *
 * - Server-to-server: validates the shared bearer secret on /internal/events.
 * - Client tokens: a placeholder verifier for FUTURE Socket.IO handshake auth.
 *   It is intentionally NOT enforced yet (anonymous connections are allowed).
 *
 * No secret value is ever logged or returned.
 */

import { config } from "./config.mjs";

/**
 * Constant-time-ish string comparison to avoid trivial timing leaks.
 * (Length is allowed to leak; that is acceptable for a shared secret.)
 */
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}

/**
 * Extract a bearer token from an Authorization header value.
 * Returns null when the header is missing or malformed.
 */
export function extractBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== "string") {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Validate the server-to-server secret for /internal/events.
 * Returns true only when REALTIME_EVENT_SECRET is configured AND matches.
 */
export function isValidEventSecret(authorizationHeader) {
  if (!config.eventSecret) {
    // No secret configured => refuse all internal calls (fail closed).
    return false;
  }

  const token = extractBearerToken(authorizationHeader);
  if (!token) {
    return false;
  }

  return safeEqual(token, config.eventSecret);
}

/**
 * FUTURE: verify a short-lived client token issued by the Next.js app and
 * signed with REALTIME_CLIENT_TOKEN_SECRET. Will return the allowed rooms and
 * identity claims (userId, isAdmin) so the connection handler can enforce ACLs.
 *
 * NOT enforced in this batch. Returns an "anonymous" descriptor so the rest of
 * the code can be written against a stable shape today.
 */
export function verifyClientToken(/* token */) {
  // Placeholder only — no signature verification yet.
  return {
    ok: true,
    anonymous: true,
    userId: null,
    isAdmin: false,
    allowedRooms: [],
  };
}
