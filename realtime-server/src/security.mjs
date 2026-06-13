/**
 * Security helpers for the Ascendra realtime server (Batch 1E hardening).
 *
 * Pure, dependency-free building blocks:
 *  - clampInt              — bounded integer parsing for env config.
 *  - getClientIp           — best-effort client IP from proxy headers.
 *  - createRateLimiter     — in-memory fixed-window rate limiter (bounded).
 *  - createReplayCache     — in-memory signature replay guard (bounded, TTL).
 *  - buildSignatureKey     — stable key from timestamp + signature digest.
 *
 * All state is in-memory and single-process only. This is acceptable because
 * there is no Redis and exactly one Hetzner realtime process is expected.
 * Nothing here logs or stores secrets/signatures beyond the opaque cache key.
 */

export function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

/**
 * Best-effort client IP. Honours the leftmost X-Forwarded-For entry (set by the
 * reverse proxy) and falls back to the socket address.
 */
export function getClientIp(req) {
  const xff = req?.headers?.["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    const first = xff.split(",")[0].trim();
    if (first) {
      return first;
    }
  }

  const xri = req?.headers?.["x-real-ip"];
  if (typeof xri === "string" && xri.trim()) {
    return xri.trim();
  }

  return req?.socket?.remoteAddress || "unknown";
}

/**
 * Fixed-window in-memory rate limiter.
 *
 * @returns check(key, nowMs?) -> { allowed, remaining, retryAfterSeconds }
 */
export function createRateLimiter({ limit, windowMs, maxKeys = 10_000 } = {}) {
  const store = new Map(); // key -> { count, windowStart }

  function evictIfNeeded(nowMs) {
    if (store.size < maxKeys) {
      return;
    }
    for (const [key, record] of store) {
      if (nowMs - record.windowStart >= windowMs) {
        store.delete(key);
      }
    }
    if (store.size >= maxKeys) {
      const oldest = store.keys().next().value;
      if (oldest !== undefined) {
        store.delete(oldest);
      }
    }
  }

  return function check(key, nowMs = Date.now()) {
    const record = store.get(key);

    if (!record || nowMs - record.windowStart >= windowMs) {
      evictIfNeeded(nowMs);
      store.set(key, { count: 1, windowStart: nowMs });
      return { allowed: true, remaining: Math.max(limit - 1, 0), retryAfterSeconds: 0 };
    }

    if (record.count >= limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((record.windowStart + windowMs - nowMs) / 1000),
      );
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    record.count += 1;
    return {
      allowed: true,
      remaining: Math.max(limit - record.count, 0),
      retryAfterSeconds: 0,
    };
  };
}

/**
 * In-memory replay guard. A key is "seen" once; reuse within the TTL window is a
 * replay. Bounded by maxEntries with expiry-first eviction.
 *
 * @returns { seen(key, nowMs?), cleanup(nowMs?), get size }
 */
export function createReplayCache({ windowSeconds = 120, maxEntries = 5_000 } = {}) {
  const store = new Map(); // key -> expiresAtMs
  const ttlMs = windowSeconds * 1000;

  function cleanup(nowMs = Date.now()) {
    for (const [key, expiresAt] of store) {
      if (expiresAt <= nowMs) {
        store.delete(key);
      }
    }
  }

  function seen(key, nowMs = Date.now()) {
    const existing = store.get(key);
    if (existing !== undefined) {
      if (existing > nowMs) {
        return true; // replay within window
      }
      store.delete(key); // expired entry
    }

    if (store.size >= maxEntries) {
      cleanup(nowMs);
      if (store.size >= maxEntries) {
        const oldest = store.keys().next().value;
        if (oldest !== undefined) {
          store.delete(oldest);
        }
      }
    }

    store.set(key, nowMs + ttlMs);
    return false;
  }

  return {
    seen,
    cleanup,
    get size() {
      return store.size;
    },
  };
}

/**
 * Opaque replay-cache key. The signature digest is already a one-way HMAC, so
 * this key never reveals the secret; we still treat it as non-loggable.
 */
export function buildSignatureKey(timestamp, signatureDigest) {
  return `${timestamp}.${signatureDigest}`;
}

export function isLocalhostOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/**
 * Build a CORS/Socket.IO origin resolver with the project's policy:
 *  - No Origin header => non-browser (server-to-server / curl): allowed. The
 *    Bearer + HMAC layers protect /internal/events regardless.
 *  - Browser origins must be explicitly listed in `allowedOrigins`.
 *  - In development only, any localhost origin is allowed.
 *  - Never a wildcard. Empty allowedOrigins in production => all browser origins
 *    rejected (fail closed).
 */
export function createOriginResolver({
  allowedOrigins = [],
  isProduction = false,
} = {}) {
  return function resolve(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    if (!isProduction && isLocalhostOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  };
}
