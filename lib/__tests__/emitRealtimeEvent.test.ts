import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  createSignature,
  emitRealtimeEventToServer,
  validateEventInput,
  validateRealtimeServerUrl,
} from "@/lib/realtime/emitRealtimeEvent";
// Cross-check against the standalone realtime server's verifier to prove the
// two halves of the bridge interoperate. auth.mjs only depends on node:crypto
// + dotenv (no express/socket.io), so it is safe to import here.
import { verifyHmacSignature } from "../../realtime-server/src/auth.mjs";

describe("validateRealtimeServerUrl", () => {
  it("rejects missing / non-absolute URLs", () => {
    expect(validateRealtimeServerUrl(undefined, false).ok).toBe(false);
    expect(validateRealtimeServerUrl("/internal/events", false).ok).toBe(false);
    expect(validateRealtimeServerUrl("not a url", false).ok).toBe(false);
  });

  it("rejects embedded credentials", () => {
    const result = validateRealtimeServerUrl(
      "https://user:pass@realtime.example.com",
      true,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects unsupported protocols", () => {
    expect(validateRealtimeServerUrl("ftp://example.com", false).ok).toBe(false);
    expect(
      validateRealtimeServerUrl("javascript:alert(1)", false).ok,
    ).toBe(false);
  });

  it("requires https in production", () => {
    expect(
      validateRealtimeServerUrl("http://realtime.example.com", true).ok,
    ).toBe(false);
    const ok = validateRealtimeServerUrl("https://realtime.example.com", true);
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.origin).toBe("https://realtime.example.com");
    }
  });

  it("allows http only for localhost outside production", () => {
    expect(
      validateRealtimeServerUrl("http://localhost:8787", false).ok,
    ).toBe(true);
    expect(
      validateRealtimeServerUrl("http://127.0.0.1:8787", false).ok,
    ).toBe(true);
    expect(
      validateRealtimeServerUrl("http://realtime.example.com", false).ok,
    ).toBe(false);
  });

  it("strips path/query to the safe origin", () => {
    const result = validateRealtimeServerUrl(
      "https://realtime.example.com/evil/path?x=1",
      true,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.origin).toBe("https://realtime.example.com");
    }
  });
});

describe("validateEventInput", () => {
  it("accepts a valid event and dedupes rooms", () => {
    const result = validateEventInput({
      type: "tournament.match.confirmed",
      rooms: ["match:abc", "match:abc", "leaderboard"],
      payload: { matchId: "abc" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.rooms).toEqual(["match:abc", "leaderboard"]);
      expect(result.event.audience).toBeNull();
    }
  });

  it("rejects empty / invalid type", () => {
    expect(validateEventInput({ type: "", rooms: ["a"] }).ok).toBe(false);
    expect(
      validateEventInput({ type: "bad type!", rooms: ["a"] }).ok,
    ).toBe(false);
    expect(
      validateEventInput({ type: "x".repeat(121), rooms: ["a"] }).ok,
    ).toBe(false);
  });

  it("rejects invalid rooms", () => {
    expect(validateEventInput({ type: "t", rooms: [] }).ok).toBe(false);
    expect(
      validateEventInput({ type: "t", rooms: ["bad room"] }).ok,
    ).toBe(false);
    expect(
      validateEventInput({ type: "t", rooms: ["a/b"] }).ok,
    ).toBe(false);
    expect(
      validateEventInput({
        type: "t",
        rooms: Array.from({ length: 21 }, (_v, i) => `r${i}`),
      }).ok,
    ).toBe(false);
  });

  it("rejects non-object payload and non-string fields", () => {
    expect(
      validateEventInput({
        type: "t",
        rooms: ["a"],
        payload: [] as unknown as Record<string, unknown>,
      }).ok,
    ).toBe(false);
    expect(
      validateEventInput({
        type: "t",
        rooms: ["a"],
        audience: 1 as unknown as string,
      }).ok,
    ).toBe(false);
  });
});

describe("createSignature", () => {
  it("produces a deterministic sha256= HMAC", () => {
    const secret = "s".repeat(32);
    const ts = 1700000000;
    const rawBody = '{"type":"t","rooms":["a"]}';
    const expected = `sha256=${createHmac("sha256", secret)
      .update(`${ts}.${rawBody}`)
      .digest("hex")}`;
    expect(createSignature(secret, ts, rawBody)).toBe(expected);
  });
});

describe("emitRealtimeEventToServer", () => {
  it("skips (never throws) when disabled by default", async () => {
    const result = await emitRealtimeEventToServer({
      type: "tournament.match.confirmed",
      rooms: ["match:abc"],
    });
    expect(result.skipped).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("disabled");
  });
});

describe("bridge <-> server HMAC interop", () => {
  const secret = "k".repeat(32);
  const rawBody = '{"type":"t","rooms":["leaderboard"],"payload":{}}';

  it("verifies a correctly signed request", () => {
    const ts = Math.floor(Date.now() / 1000);
    const signature = createSignature(secret, ts, rawBody);
    const result = verifyHmacSignature({
      secret,
      timestampHeader: String(ts),
      signatureHeader: signature,
      rawBody,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a tampered body", () => {
    const ts = Math.floor(Date.now() / 1000);
    const signature = createSignature(secret, ts, rawBody);
    const result = verifyHmacSignature({
      secret,
      timestampHeader: String(ts),
      signatureHeader: signature,
      rawBody: `${rawBody} `,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("signature_mismatch");
  });

  it("rejects an expired timestamp (replay window)", () => {
    const ts = Math.floor(Date.now() / 1000) - 1000;
    const signature = createSignature(secret, ts, rawBody);
    const result = verifyHmacSignature({
      secret,
      timestampHeader: String(ts),
      signatureHeader: signature,
      rawBody,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("timestamp_skew");
  });

  it("rejects a malformed signature header and missing secret", () => {
    const ts = Math.floor(Date.now() / 1000);
    expect(
      verifyHmacSignature({
        secret,
        timestampHeader: String(ts),
        signatureHeader: "deadbeef",
        rawBody,
      }).ok,
    ).toBe(false);
    expect(
      verifyHmacSignature({
        secret: "",
        timestampHeader: String(ts),
        signatureHeader: "sha256=abc",
        rawBody,
      }).ok,
    ).toBe(false);
  });
});
