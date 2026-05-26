import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  extractFaceitWebhookEventType,
  extractFaceitWebhookMatchId,
  sanitizeFaceitWebhookPayload,
} from "@/lib/faceitWebhookLog";

// ─── extractFaceitWebhookEventType ───────────────────────────────────────────

describe("extractFaceitWebhookEventType", () => {
  it("extracts top-level 'event' field", () => {
    expect(
      extractFaceitWebhookEventType({ event: "match_status_finished" }),
    ).toBe("match_status_finished");
  });

  it("extracts top-level 'event_type' field", () => {
    expect(
      extractFaceitWebhookEventType({ event_type: "match_demo_ready" }),
    ).toBe("match_demo_ready");
  });

  it("extracts top-level 'type' field", () => {
    expect(extractFaceitWebhookEventType({ type: "match_cancelled" })).toBe(
      "match_cancelled",
    );
  });

  it("extracts nested payload.event", () => {
    expect(
      extractFaceitWebhookEventType({
        payload: { event: "match_status_finished" },
      }),
    ).toBe("match_status_finished");
  });

  it("prefers top-level 'event' over nested", () => {
    expect(
      extractFaceitWebhookEventType({
        event: "match_status_finished",
        payload: { event: "other_event" },
      }),
    ).toBe("match_status_finished");
  });

  it("returns null for null input", () => {
    expect(extractFaceitWebhookEventType(null)).toBeNull();
  });

  it("returns null for empty object", () => {
    expect(extractFaceitWebhookEventType({})).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(extractFaceitWebhookEventType("match_status_finished")).toBeNull();
  });

  it("returns null for array input", () => {
    expect(extractFaceitWebhookEventType([])).toBeNull();
  });

  it("skips empty string values", () => {
    expect(extractFaceitWebhookEventType({ event: "", type: "match_ready" })).toBe(
      "match_ready",
    );
  });
});

// ─── extractFaceitWebhookMatchId ─────────────────────────────────────────────

describe("extractFaceitWebhookMatchId", () => {
  it("extracts payload.match_id", () => {
    expect(
      extractFaceitWebhookMatchId({
        payload: { match_id: "1-abc123" },
      }),
    ).toBe("1-abc123");
  });

  it("extracts payload.id", () => {
    expect(
      extractFaceitWebhookMatchId({
        payload: { id: "1-59d69823-3169-45a8-9973-e9cf825d5588" },
      }),
    ).toBe("1-59d69823-3169-45a8-9973-e9cf825d5588");
  });

  it("extracts top-level match_id when no nested payload", () => {
    expect(
      extractFaceitWebhookMatchId({ match_id: "1-xyz999" }),
    ).toBe("1-xyz999");
  });

  it("extracts top-level id as last resort", () => {
    expect(extractFaceitWebhookMatchId({ id: "1-fallback" })).toBe(
      "1-fallback",
    );
  });

  it("prefers nested payload.match_id over payload.id", () => {
    expect(
      extractFaceitWebhookMatchId({
        payload: { match_id: "preferred", id: "fallback" },
      }),
    ).toBe("preferred");
  });

  it("returns null for null input", () => {
    expect(extractFaceitWebhookMatchId(null)).toBeNull();
  });

  it("returns null for empty object", () => {
    expect(extractFaceitWebhookMatchId({})).toBeNull();
  });

  it("returns null for array input", () => {
    expect(extractFaceitWebhookMatchId([])).toBeNull();
  });

  it("skips empty string id", () => {
    expect(
      extractFaceitWebhookMatchId({ payload: { id: "" }, match_id: "real-id" }),
    ).toBe("real-id");
  });
});

// ─── sanitizeFaceitWebhookPayload ─────────────────────────────────────────────

describe("sanitizeFaceitWebhookPayload", () => {
  it("returns null for null input", () => {
    expect(sanitizeFaceitWebhookPayload(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(sanitizeFaceitWebhookPayload(undefined)).toBeNull();
  });

  it("strips keys containing 'secret'", () => {
    const result = sanitizeFaceitWebhookPayload({
      event: "match_status_finished",
      my_secret: "SUPERSECRET",
      webhook_secret: "also-secret",
    }) as Record<string, unknown>;
    expect(result.event).toBe("match_status_finished");
    expect(result.my_secret).toBeUndefined();
    expect(result.webhook_secret).toBeUndefined();
  });

  it("strips keys containing 'authorization'", () => {
    const result = sanitizeFaceitWebhookPayload({
      authorization: "Bearer token123",
      data: "safe",
    }) as Record<string, unknown>;
    expect(result.authorization).toBeUndefined();
    expect(result.data).toBe("safe");
  });

  it("strips keys containing 'token'", () => {
    const result = sanitizeFaceitWebhookPayload({
      access_token: "abc",
      event: "ok",
    }) as Record<string, unknown>;
    expect(result.access_token).toBeUndefined();
    expect(result.event).toBe("ok");
  });

  it("strips keys containing 'key' or 'api_key'", () => {
    const result = sanitizeFaceitWebhookPayload({
      api_key: "sk-123",
      faceit_key: "abc",
      match_id: "1-xyz",
    }) as Record<string, unknown>;
    expect(result.api_key).toBeUndefined();
    expect(result.faceit_key).toBeUndefined();
    expect(result.match_id).toBe("1-xyz");
  });

  it("truncates long string values to 500 chars", () => {
    const longString = "a".repeat(600);
    const result = sanitizeFaceitWebhookPayload({
      event: longString,
    }) as Record<string, unknown>;
    expect((result.event as string).length).toBe(500);
  });

  it("sanitizes nested objects", () => {
    const result = sanitizeFaceitWebhookPayload({
      payload: {
        id: "1-abc",
        secret: "should-be-removed",
        status: "FINISHED",
      },
    }) as Record<string, Record<string, unknown>>;
    expect(result.payload.id).toBe("1-abc");
    expect(result.payload.secret).toBeUndefined();
    expect(result.payload.status).toBe("FINISHED");
  });

  it("does not crash on non-object input", () => {
    expect(() => sanitizeFaceitWebhookPayload("raw string")).not.toThrow();
    expect(() => sanitizeFaceitWebhookPayload(42)).not.toThrow();
    expect(() => sanitizeFaceitWebhookPayload(true)).not.toThrow();
  });

  it("handles arrays safely", () => {
    const result = sanitizeFaceitWebhookPayload([
      { id: "1", secret: "bad" },
      { id: "2" },
    ]) as Array<Record<string, unknown>>;
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].id).toBe("1");
    expect(result[0].secret).toBeUndefined();
    expect(result[1].id).toBe("2");
  });

  it("stops recursing at depth 4", () => {
    const deep = { a: { b: { c: { d: { e: { secret: "deep" } } } } } };
    expect(() => sanitizeFaceitWebhookPayload(deep)).not.toThrow();
  });

  it("preserves numbers and booleans", () => {
    const result = sanitizeFaceitWebhookPayload({
      count: 5,
      active: true,
      score: 13.0,
    }) as Record<string, unknown>;
    expect(result.count).toBe(5);
    expect(result.active).toBe(true);
    expect(result.score).toBe(13.0);
  });
});
