import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

// ─── getClientIp ──────────────────────────────────────────────────────────────

describe("getClientIp", () => {
  function makeRequest(headers: Record<string, string> = {}) {
    return new Request("http://localhost/api/test", { headers });
  }

  it("returns the first IP from x-forwarded-for", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("returns a single IP from x-forwarded-for with no comma", () => {
    const req = makeRequest({ "x-forwarded-for": "10.0.0.1" });
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it("trims whitespace from x-forwarded-for IPs", () => {
    const req = makeRequest({ "x-forwarded-for": "  1.2.3.4  , 5.6.7.8" });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls through to x-real-ip when x-forwarded-for is absent", () => {
    const req = makeRequest({ "x-real-ip": "9.9.9.9" });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });

  it("trims whitespace from x-real-ip", () => {
    const req = makeRequest({ "x-real-ip": "  9.9.9.9  " });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });

  it("returns 'unknown' when no IP header is present", () => {
    const req = makeRequest();
    expect(getClientIp(req)).toBe("unknown");
  });

  it("prefers x-forwarded-for over x-real-ip", () => {
    const req = makeRequest({
      "x-forwarded-for": "1.1.1.1",
      "x-real-ip": "2.2.2.2",
    });
    expect(getClientIp(req)).toBe("1.1.1.1");
  });
});

// ─── createRateLimiter ────────────────────────────────────────────────────────

describe("createRateLimiter", () => {
  function makeRequest(ip = "1.2.3.4") {
    return new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": ip },
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests below the limit", () => {
    const limiter = createRateLimiter(3, 60_000);
    expect(limiter(makeRequest())).toBeNull();
    expect(limiter(makeRequest())).toBeNull();
    expect(limiter(makeRequest())).toBeNull();
  });

  it("blocks the request that exceeds the limit", () => {
    const limiter = createRateLimiter(2, 60_000);
    limiter(makeRequest());
    limiter(makeRequest());
    const response = limiter(makeRequest());
    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);
  });

  it("returns 429 with correct JSON error body", async () => {
    const limiter = createRateLimiter(1, 60_000);
    limiter(makeRequest());
    const response = limiter(makeRequest());
    expect(response?.status).toBe(429);
    const body = await response?.json();
    expect(body).toEqual({
      error: "Too many requests. Please try again later.",
    });
  });

  it("includes required headers on 429 response", () => {
    const limiter = createRateLimiter(1, 60_000);
    limiter(makeRequest());
    const response = limiter(makeRequest());
    expect(response?.headers.get("Retry-After")).toBeTruthy();
    expect(response?.headers.get("X-RateLimit-Limit")).toBe("1");
    expect(response?.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response?.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });

  it("resets the window after windowMs elapses", () => {
    const limiter = createRateLimiter(1, 60_000);
    limiter(makeRequest());
    const blocked = limiter(makeRequest());
    expect(blocked?.status).toBe(429);

    vi.advanceTimersByTime(60_001);

    const afterReset = limiter(makeRequest());
    expect(afterReset).toBeNull();
  });

  it("tracks different IPs independently", () => {
    const limiter = createRateLimiter(1, 60_000);
    expect(limiter(makeRequest("1.1.1.1"))).toBeNull();
    expect(limiter(makeRequest("2.2.2.2"))).toBeNull();
    // Both IPs now at 1/1 — next request for each should be blocked
    expect(limiter(makeRequest("1.1.1.1"))?.status).toBe(429);
    expect(limiter(makeRequest("2.2.2.2"))?.status).toBe(429);
  });

  it("allows requests from a different IP when one IP is blocked", () => {
    const limiter = createRateLimiter(1, 60_000);
    limiter(makeRequest("blocked-ip"));
    expect(limiter(makeRequest("blocked-ip"))?.status).toBe(429);
    expect(limiter(makeRequest("other-ip"))).toBeNull();
  });

  it("Retry-After is positive seconds remaining in the window", () => {
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    const limiter = createRateLimiter(1, 60_000);
    limiter(makeRequest());

    vi.advanceTimersByTime(10_000); // 10s into the 60s window

    const response = limiter(makeRequest());
    const retryAfter = Number(response?.headers.get("Retry-After"));
    // ~50s remaining (allow 1s rounding)
    expect(retryAfter).toBeGreaterThanOrEqual(49);
    expect(retryAfter).toBeLessThanOrEqual(51);
  });

  it("falls back to 'unknown' IP and still rate-limits", () => {
    const limiter = createRateLimiter(1, 60_000);
    const req = new Request("http://localhost/api/test"); // no IP headers
    limiter(req);
    expect(limiter(req)?.status).toBe(429);
  });
});
