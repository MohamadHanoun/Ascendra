import { describe, expect, it } from "vitest";

import { createHmac } from "node:crypto";

import {
  clampInt,
  getClientIp,
  createRateLimiter,
  createReplayCache,
  buildSignatureKey,
  createOriginResolver,
  isLocalhostOrigin,
} from "../security.mjs";
import { verifyHmacSignature } from "../auth.mjs";

describe("clampInt", () => {
  it("parses and clamps within bounds, with fallback", () => {
    expect(clampInt("50", 1, 100, 10)).toBe(50);
    expect(clampInt("500", 1, 100, 10)).toBe(100);
    expect(clampInt("0", 1, 100, 10)).toBe(1);
    expect(clampInt("nope", 1, 100, 10)).toBe(10);
    expect(clampInt(undefined, 1, 100, 10)).toBe(10);
  });
});

describe("getClientIp", () => {
  it("prefers the leftmost X-Forwarded-For entry", () => {
    expect(
      getClientIp({ headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } }),
    ).toBe("1.2.3.4");
  });

  it("falls back to socket address then 'unknown'", () => {
    expect(getClientIp({ headers: {}, socket: { remoteAddress: "9.9.9.9" } })).toBe(
      "9.9.9.9",
    );
    expect(getClientIp({ headers: {} })).toBe("unknown");
  });
});

describe("createRateLimiter", () => {
  it("blocks after the limit within the window", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const t0 = 1_000_000;
    expect(limiter("ip", t0).allowed).toBe(true);
    expect(limiter("ip", t0).allowed).toBe(true);
    expect(limiter("ip", t0).allowed).toBe(true);
    const blocked = limiter("ip", t0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1_000 });
    const t0 = 2_000_000;
    expect(limiter("ip", t0).allowed).toBe(true);
    expect(limiter("ip", t0).allowed).toBe(false);
    expect(limiter("ip", t0 + 1_001).allowed).toBe(true);
  });

  it("isolates separate keys", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    const t0 = 3_000_000;
    expect(limiter("a", t0).allowed).toBe(true);
    expect(limiter("b", t0).allowed).toBe(true);
    expect(limiter("a", t0).allowed).toBe(false);
  });
});

describe("createReplayCache", () => {
  it("treats a repeated key as a replay within the window", () => {
    const cache = createReplayCache({ windowSeconds: 120 });
    const t0 = 1_000_000;
    expect(cache.seen("k", t0)).toBe(false);
    expect(cache.seen("k", t0)).toBe(true);
  });

  it("expires entries after the window and cleans up", () => {
    const cache = createReplayCache({ windowSeconds: 120 });
    const t0 = 1_000_000;
    expect(cache.seen("k", t0)).toBe(false);
    // After the TTL, the same key is accepted again (not a replay).
    expect(cache.seen("k", t0 + 121_000)).toBe(false);
    cache.cleanup(t0 + 10_000_000);
    expect(cache.size).toBe(0);
  });

  it("stays bounded under many distinct keys", () => {
    const cache = createReplayCache({ windowSeconds: 120, maxEntries: 10 });
    for (let i = 0; i < 100; i += 1) {
      cache.seen(`k${i}`, 1_000_000 + i);
    }
    expect(cache.size).toBeLessThanOrEqual(10);
  });
});

describe("replay protection end-to-end with HMAC", () => {
  it("accepts a fresh signature once and rejects its reuse", () => {
    const secret = "k".repeat(40);
    const cache = createReplayCache({ windowSeconds: 120 });
    const ts = Math.floor(Date.now() / 1000);
    const rawBody = '{"type":"leaderboard.updated","rooms":["leaderboard"]}';
    const digest = createHmac("sha256", secret)
      .update(`${ts}.${rawBody}`)
      .digest("hex");

    const verify = verifyHmacSignature({
      secret,
      timestampHeader: String(ts),
      signatureHeader: `sha256=${digest}`,
      rawBody,
    });
    expect(verify.ok).toBe(true);

    const key = buildSignatureKey(String(ts), digest);
    expect(cache.seen(key)).toBe(false); // first use accepted
    expect(cache.seen(key)).toBe(true); // replay rejected
  });
});

describe("createOriginResolver", () => {
  function resolve(resolver, origin) {
    let allowed;
    resolver(origin, (_err, ok) => {
      allowed = ok;
    });
    return allowed;
  }

  it("allows non-browser requests (no Origin header)", () => {
    const resolver = createOriginResolver({ allowedOrigins: [], isProduction: true });
    expect(resolve(resolver, undefined)).toBe(true);
  });

  it("allows only explicitly listed origins in production", () => {
    const resolver = createOriginResolver({
      allowedOrigins: ["https://www.ascendrahub.com"],
      isProduction: true,
    });
    expect(resolve(resolver, "https://www.ascendrahub.com")).toBe(true);
    expect(resolve(resolver, "https://evil.example.com")).toBe(false);
    expect(resolve(resolver, "http://localhost:3000")).toBe(false);
  });

  it("rejects all browser origins when ALLOWED_ORIGINS is empty in production", () => {
    const resolver = createOriginResolver({ allowedOrigins: [], isProduction: true });
    expect(resolve(resolver, "https://www.ascendrahub.com")).toBe(false);
  });

  it("allows localhost origins only in development", () => {
    const dev = createOriginResolver({ allowedOrigins: [], isProduction: false });
    expect(resolve(dev, "http://localhost:3000")).toBe(true);
    expect(resolve(dev, "http://127.0.0.1:5173")).toBe(true);
    expect(resolve(dev, "https://evil.example.com")).toBe(false);
  });

  it("isLocalhostOrigin only matches localhost/127.0.0.1", () => {
    expect(isLocalhostOrigin("http://localhost:3000")).toBe(true);
    expect(isLocalhostOrigin("http://127.0.0.1")).toBe(true);
    expect(isLocalhostOrigin("https://ascendrahub.com")).toBe(false);
    expect(isLocalhostOrigin("not a url")).toBe(false);
  });
});
