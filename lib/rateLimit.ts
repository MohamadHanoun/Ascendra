import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// In-memory fixed-window rate limiter (per server instance / process).
//
// This provides basic abuse protection for a single Node.js process.
// It does NOT share state across multiple server instances or pods.
//
// Upgrade path for distributed production:
//   Replace the Map store with a Redis/Upstash sliding-window implementation,
//   e.g. @upstash/ratelimit with a Redis connection.  The public API of
//   createRateLimiter stays the same so call sites don't change.
// ─────────────────────────────────────────────────────────────────────────────

type RateLimitRecord = {
  count: number;
  windowStart: number;
};

/**
 * Extract the best-guess client IP from standard reverse-proxy headers.
 *
 * Priority:
 *   1. x-forwarded-for  – first (leftmost) IP in the comma-separated list
 *   2. x-real-ip        – set by nginx and some CDNs
 *   3. "unknown"        – fallback when no header is present
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0].trim();
    if (first) return first;
  }

  const xri = request.headers.get("x-real-ip");
  if (xri) {
    const trimmed = xri.trim();
    if (trimmed) return trimmed;
  }

  return "unknown";
}

/**
 * Create a fixed-window in-memory rate limiter.
 *
 * @param limit    Maximum number of requests allowed per window.
 * @param windowMs Window duration in milliseconds.
 * @returns        A check function that returns `null` when the request is
 *                 allowed, or a 429 `Response` when the limit is exceeded.
 *
 * @example
 * const limiter = createRateLimiter(60, 60_000); // 60 req/min
 *
 * export async function GET(request: Request) {
 *   const limited = limiter(request);
 *   if (limited) return limited;
 *   // ... handler logic
 * }
 */
export function createRateLimiter(
  limit: number,
  windowMs: number,
): (request: Request) => Response | null {
  const store = new Map<string, RateLimitRecord>();

  return function check(request: Request): Response | null {
    const ip = getClientIp(request);
    const now = Date.now();

    const record = store.get(ip);
    const windowExpired = !record || now - record.windowStart >= windowMs;

    if (windowExpired) {
      store.set(ip, { count: 1, windowStart: now });
      return null;
    }

    const resetAt = record.windowStart + windowMs;
    const resetUnix = Math.ceil(resetAt / 1000);
    const retryAfterSecs = Math.max(1, Math.ceil((resetAt - now) / 1000));

    if (record.count >= limit) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSecs),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(resetUnix),
          },
        },
      );
    }

    record.count += 1;
    return null;
  };
}
