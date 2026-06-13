/**
 * Authentication helpers for the Ascendra realtime server (FOUNDATION ONLY).
 *
 * - Server-to-server: validates the shared bearer secret on /internal/events.
 * - Client tokens: a placeholder verifier for FUTURE Socket.IO handshake auth.
 *   It is intentionally NOT enforced yet (anonymous connections are allowed).
 *
 * No secret value is ever logged or returned.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { config } from "./config.mjs";

// Maximum allowed clock skew between the bridge and this server (seconds).
const MAX_TIMESTAMP_SKEW_SECONDS = 120;

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
export function isValidEventSecret(authorizationHeader, secret = config.eventSecret) {
  if (!secret) {
    // No secret configured => refuse all internal calls (fail closed).
    return false;
  }

  const token = extractBearerToken(authorizationHeader);
  if (!token) {
    return false;
  }

  return safeEqual(token, secret);
}

/**
 * Timing-safe comparison of two hex strings. Returns false on any length
 * mismatch or invalid input (without leaking which).
 */
function timingSafeEqualHex(aHex, bHex) {
  if (typeof aHex !== "string" || typeof bHex !== "string") {
    return false;
  }

  if (aHex.length !== bHex.length || aHex.length === 0) {
    return false;
  }

  let bufA;
  let bufB;
  try {
    bufA = Buffer.from(aHex, "hex");
    bufB = Buffer.from(bHex, "hex");
  } catch {
    return false;
  }

  if (bufA.length !== bufB.length || bufA.length === 0) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

/**
 * Parse a signature header of the form `sha256=<hex>`. Returns the lowercase
 * hex digest, or null when the format is invalid.
 */
export function parseSignatureHeader(header) {
  if (typeof header !== "string") {
    return null;
  }

  const match = header.trim().match(/^sha256=([0-9a-fA-F]+)$/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Verify the HMAC signature of a raw request body.
 *
 * Pure function: the secret + clock are passed in so it can be unit-tested
 * without environment juggling.
 *
 * @returns { ok: boolean, reason?: string }
 */
export function verifyHmacSignature({
  secret,
  timestampHeader,
  signatureHeader,
  rawBody,
  maxSkewSeconds = MAX_TIMESTAMP_SKEW_SECONDS,
  now = Date.now(),
}) {
  if (!secret) {
    // Fail closed when no secret is configured.
    return { ok: false, reason: "no_secret" };
  }

  const timestamp = Number.parseInt(timestampHeader ?? "", 10);
  if (!Number.isFinite(timestamp)) {
    return { ok: false, reason: "invalid_timestamp" };
  }

  const skew = Math.abs(Math.floor(now / 1000) - timestamp);
  if (skew > maxSkewSeconds) {
    return { ok: false, reason: "timestamp_skew" };
  }

  const provided = parseSignatureHeader(signatureHeader);
  if (!provided) {
    return { ok: false, reason: "invalid_signature_format" };
  }

  const body = typeof rawBody === "string" ? rawBody : "";
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  if (!timingSafeEqualHex(provided, expected)) {
    return { ok: false, reason: "signature_mismatch" };
  }

  return { ok: true };
}

// Client-token verification now lives in clientToken.mjs (Batch 1F).
