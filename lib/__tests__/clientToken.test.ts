import { describe, expect, it } from "vitest";

import {
  buildAllowedRooms,
  resolveClientTokenTtlSeconds,
  signClientToken,
  verifyClientToken,
  isValidRoomName,
  CLIENT_TOKEN_VERSION,
} from "@/lib/realtime/clientToken";

const SECRET = "k".repeat(40);

function decodePayload(token: string): Record<string, unknown> {
  const [encoded] = token.split(".");
  const padLength = encoded.length % 4 === 0 ? 0 : 4 - (encoded.length % 4);
  const normalized =
    encoded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLength);
  return JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
}

describe("buildAllowedRooms", () => {
  it("includes only the user's own notification room for the RC9 private pilot", () => {
    expect(buildAllowedRooms({ databaseId: "userA", isAdmin: false })).toEqual([
      "notifications:userA",
    ]);
  });

  it("does not issue admin, team, user, or profile rooms yet", () => {
    const rooms = buildAllowedRooms({ databaseId: "adm", isAdmin: true });
    expect(rooms).toEqual(["notifications:adm"]);
    expect(rooms.some((r) => r.startsWith("user:"))).toBe(false);
    expect(rooms.some((r) => r.startsWith("profile:"))).toBe(false);
    expect(rooms.some((r) => r.startsWith("team:"))).toBe(false);
    expect(rooms.some((r) => r === "admin" || r.startsWith("admin:"))).toBe(
      false,
    );
  });
});

describe("resolveClientTokenTtlSeconds", () => {
  it("defaults and clamps between 60 and 600", () => {
    expect(resolveClientTokenTtlSeconds(undefined)).toBe(300);
    expect(resolveClientTokenTtlSeconds("30")).toBe(60);
    expect(resolveClientTokenTtlSeconds("9999")).toBe(600);
    expect(resolveClientTokenTtlSeconds("120")).toBe(120);
  });
});

describe("signClientToken / verifyClientToken", () => {
  it("signs and verifies a valid token round-trip", () => {
    const { token, payload } = signClientToken({
      secret: SECRET,
      sub: "userA",
      isAdmin: false,
      rooms: buildAllowedRooms({ databaseId: "userA", isAdmin: false }),
      ttlSeconds: 300,
    });

    const result = verifyClientToken({ secret: SECRET, token });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.claims.sub).toBe("userA");
      expect(result.claims.isAdmin).toBe(false);
      expect(result.claims.version).toBe(CLIENT_TOKEN_VERSION);
      expect(result.claims.exp).toBe(payload.exp);
    }
  });

  it("rejects a tampered payload", () => {
    const { token } = signClientToken({
      secret: SECRET,
      sub: "userA",
      isAdmin: false,
      rooms: ["user:userA"],
      ttlSeconds: 300,
    });
    const [, sig] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({
        sub: "userA",
        isAdmin: true,
        rooms: ["admin"],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
        version: 1,
      }),
      "utf8",
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const result = verifyClientToken({
      secret: SECRET,
      token: `${forgedPayload}.${sig}`,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an expired token", () => {
    const past = Date.now() - 1_000_000;
    const { token } = signClientToken({
      secret: SECRET,
      sub: "userA",
      isAdmin: false,
      rooms: ["user:userA"],
      ttlSeconds: 60,
      now: past,
    });
    const result = verifyClientToken({ secret: SECRET, token });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("expired");
    }
  });

  it("rejects when the secret is missing or wrong", () => {
    const { token } = signClientToken({
      secret: SECRET,
      sub: "userA",
      isAdmin: false,
      rooms: ["user:userA"],
      ttlSeconds: 300,
    });
    expect(verifyClientToken({ secret: "", token }).ok).toBe(false);
    expect(
      verifyClientToken({ secret: "different".repeat(4), token }).ok,
    ).toBe(false);
  });

  it("rejects malformed tokens without throwing", () => {
    expect(verifyClientToken({ secret: SECRET, token: "" }).ok).toBe(false);
    expect(verifyClientToken({ secret: SECRET, token: "abc" }).ok).toBe(false);
    expect(verifyClientToken({ secret: SECRET, token: 123 }).ok).toBe(false);
    expect(
      verifyClientToken({ secret: SECRET, token: "a.b.c" }).ok,
    ).toBe(false);
  });

  it("token payload contains only minimal fields (no PII/secrets)", () => {
    const { token } = signClientToken({
      secret: SECRET,
      sub: "userA",
      isAdmin: true,
      rooms: buildAllowedRooms({ databaseId: "userA", isAdmin: true }),
      ttlSeconds: 300,
    });

    const payload = decodePayload(token);
    expect(Object.keys(payload).sort()).toEqual(
      ["exp", "iat", "isAdmin", "rooms", "sub", "version"].sort(),
    );
    for (const forbidden of [
      "discordId",
      "email",
      "username",
      "name",
      "accessToken",
      "refreshToken",
      "cookie",
      "token",
      "secret",
    ]) {
      expect(payload).not.toHaveProperty(forbidden);
    }
  });
});

describe("isValidRoomName", () => {
  it("accepts safe rooms and rejects invalid ones", () => {
    expect(isValidRoomName("user:abc")).toBe(true);
    expect(isValidRoomName("admin:queue")).toBe(true);
    expect(isValidRoomName("bad room")).toBe(false);
    expect(isValidRoomName("a/b")).toBe(false);
    expect(isValidRoomName("")).toBe(false);
  });
});
