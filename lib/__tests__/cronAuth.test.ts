import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { safeEqual, verifyCronSecret } from "@/lib/cronAuth";

// ─── safeEqual ────────────────────────────────────────────────────────────────

describe("safeEqual", () => {
  it("returns true for identical strings", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
  });

  it("returns false for strings with the same length but different content", () => {
    expect(safeEqual("abc", "xyz")).toBe(false);
  });

  it("returns false for strings with different lengths", () => {
    expect(safeEqual("abc", "abcd")).toBe(false);
  });

  it("returns false for empty string vs non-empty", () => {
    expect(safeEqual("", "x")).toBe(false);
  });

  it("returns true for two empty strings", () => {
    expect(safeEqual("", "")).toBe(true);
  });

  it("is case-sensitive", () => {
    expect(safeEqual("Secret", "secret")).toBe(false);
  });
});

// ─── verifyCronSecret ─────────────────────────────────────────────────────────

describe("verifyCronSecret", () => {
  const savedSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    delete process.env.CRON_SECRET;
  });

  afterEach(() => {
    if (savedSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = savedSecret;
    }
  });

  function makeRequest(
    headers: Record<string, string> = {},
    url = "http://localhost/api/cron/cleanup-realtime",
  ) {
    return new Request(url, { headers });
  }

  // Missing secret configuration

  it("returns false when CRON_SECRET is not set", () => {
    const req = makeRequest({ authorization: "Bearer sometoken" });
    expect(verifyCronSecret(req)).toBe(false);
  });

  it("returns false when CRON_SECRET is an empty string", () => {
    process.env.CRON_SECRET = "";
    const req = makeRequest({ authorization: "Bearer " });
    expect(verifyCronSecret(req)).toBe(false);
  });

  it("returns false when CRON_SECRET is only whitespace", () => {
    process.env.CRON_SECRET = "   ";
    const req = makeRequest({ authorization: "Bearer    " });
    expect(verifyCronSecret(req)).toBe(false);
  });

  // Valid Authorization header

  it("returns true with a correct Authorization: Bearer header", () => {
    process.env.CRON_SECRET = "test-secret-123";
    const req = makeRequest({ authorization: "Bearer test-secret-123" });
    expect(verifyCronSecret(req)).toBe(true);
  });

  it("returns false with an incorrect Authorization: Bearer header", () => {
    process.env.CRON_SECRET = "test-secret-123";
    const req = makeRequest({ authorization: "Bearer wrong-secret" });
    expect(verifyCronSecret(req)).toBe(false);
  });

  it("returns false when Bearer prefix is missing from Authorization header", () => {
    process.env.CRON_SECRET = "test-secret-123";
    const req = makeRequest({ authorization: "test-secret-123" });
    expect(verifyCronSecret(req)).toBe(false);
  });

  it("returns false when Authorization header is empty", () => {
    process.env.CRON_SECRET = "test-secret-123";
    const req = makeRequest({ authorization: "" });
    expect(verifyCronSecret(req)).toBe(false);
  });

  // Query-string secret must not authenticate (URLs leak into logs/proxies)

  it("returns false with a correct ?secret query param — query auth is not supported", () => {
    process.env.CRON_SECRET = "test-secret-123";
    const req = makeRequest(
      {},
      "http://localhost/api/cron/cleanup-realtime?secret=test-secret-123",
    );
    expect(verifyCronSecret(req)).toBe(false);
  });

  it("returns false with an incorrect ?secret query param", () => {
    process.env.CRON_SECRET = "test-secret-123";
    const req = makeRequest(
      {},
      "http://localhost/api/cron/cleanup-realtime?secret=nope",
    );
    expect(verifyCronSecret(req)).toBe(false);
  });

  it("returns false with no auth provided at all", () => {
    process.env.CRON_SECRET = "test-secret-123";
    const req = makeRequest();
    expect(verifyCronSecret(req)).toBe(false);
  });

  // CRON_SECRET trimming

  it("trims whitespace from CRON_SECRET before comparing", () => {
    process.env.CRON_SECRET = "  trimmed-secret  ";
    const req = makeRequest({ authorization: "Bearer trimmed-secret" });
    expect(verifyCronSecret(req)).toBe(true);
  });
});
