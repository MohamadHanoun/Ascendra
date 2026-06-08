import { describe, expect, it } from "vitest";

import { verifyClientToken } from "../clientToken.mjs";
import { canJoinRoom } from "../acl.mjs";
// Cross-import the app-side signer to prove the Next.js issuer and the realtime
// server verifier interoperate (same token format). server-only is mocked in
// vitest.setup.ts so this import is safe in tests.
import {
  signClientToken,
  buildAllowedRooms,
} from "../../../lib/realtime/clientToken.ts";

const SECRET = "k".repeat(40);

function claimsFor({ sub, isAdmin, rooms, ttlSeconds = 300, now }) {
  const { token } = signClientToken({
    secret: SECRET,
    sub,
    isAdmin,
    rooms,
    ttlSeconds,
    now,
  });
  const verified = verifyClientToken({ secret: SECRET, token });
  return { token, verified };
}

describe("public rooms (anonymous)", () => {
  it("allows leaderboard / tournament:{id} / match:{id} with no token", () => {
    expect(canJoinRoom("leaderboard", null).allowed).toBe(true);
    expect(canJoinRoom("tournament:t1", null).allowed).toBe(true);
    expect(canJoinRoom("match:m1", null).allowed).toBe(true);
  });

  it("denies private/admin rooms with no token", () => {
    expect(canJoinRoom("user:userA", null).allowed).toBe(false);
    expect(canJoinRoom("notifications:userA", null).allowed).toBe(false);
    expect(canJoinRoom("admin", null).allowed).toBe(false);
    expect(canJoinRoom("team:t1", null).allowed).toBe(false);
  });
});

describe("user token ACL", () => {
  const { verified } = claimsFor({
    sub: "userA",
    isAdmin: false,
    rooms: buildAllowedRooms({ databaseId: "userA", isAdmin: false }),
  });

  it("verifies the Next.js-signed token", () => {
    expect(verified.ok).toBe(true);
  });

  it("permits the user's own private rooms", () => {
    const claims = verified.ok ? verified.claims : null;
    expect(canJoinRoom("user:userA", claims).allowed).toBe(true);
    expect(canJoinRoom("notifications:userA", claims).allowed).toBe(true);
    expect(canJoinRoom("profile:userA", claims).allowed).toBe(true);
  });

  it("denies another user's rooms (exact-claim only)", () => {
    const claims = verified.ok ? verified.claims : null;
    expect(canJoinRoom("user:userB", claims).allowed).toBe(false);
    expect(canJoinRoom("notifications:userB", claims).allowed).toBe(false);
    expect(canJoinRoom("user:userAX", claims).allowed).toBe(false);
  });

  it("denies admin rooms for a non-admin user", () => {
    const claims = verified.ok ? verified.claims : null;
    expect(canJoinRoom("admin", claims).allowed).toBe(false);
    expect(canJoinRoom("admin:queue", claims).allowed).toBe(false);
  });

  it("denies team rooms (not issued / not claimed)", () => {
    const claims = verified.ok ? verified.claims : null;
    expect(canJoinRoom("team:t1", claims).allowed).toBe(false);
  });
});

describe("admin token ACL", () => {
  const { verified } = claimsFor({
    sub: "adm",
    isAdmin: true,
    rooms: buildAllowedRooms({ databaseId: "adm", isAdmin: true }),
  });

  it("permits exactly the claimed admin rooms", () => {
    const claims = verified.ok ? verified.claims : null;
    expect(canJoinRoom("admin", claims).allowed).toBe(true);
    expect(canJoinRoom("admin:queue", claims).allowed).toBe(true);
  });

  it("denies unclaimed admin rooms (no wildcard escalation)", () => {
    const claims = verified.ok ? verified.claims : null;
    expect(canJoinRoom("admin:tournament:t1", claims).allowed).toBe(false);
  });
});

describe("forged / invalid tokens", () => {
  it("denies admin even when the claim says admin but isAdmin is false", () => {
    // Validly signed, but isAdmin=false with an admin room claim.
    const { verified } = claimsFor({
      sub: "sneaky",
      isAdmin: false,
      rooms: ["admin"],
    });
    const claims = verified.ok ? verified.claims : null;
    expect(canJoinRoom("admin", claims).allowed).toBe(false);
  });

  it("treats a tampered token as anonymous (private joins denied)", () => {
    const { token } = claimsFor({
      sub: "userA",
      isAdmin: false,
      rooms: ["user:userA"],
    });
    const tampered = `${token}x`;
    const verified = verifyClientToken({ secret: SECRET, token: tampered });
    const claims = verified.ok ? verified.claims : null;
    expect(verified.ok).toBe(false);
    expect(canJoinRoom("user:userA", claims).allowed).toBe(false);
    expect(canJoinRoom("leaderboard", claims).allowed).toBe(true);
  });

  it("treats an expired token as anonymous (private joins denied)", () => {
    const { verified } = claimsFor({
      sub: "userA",
      isAdmin: false,
      rooms: ["user:userA"],
      ttlSeconds: 60,
      now: Date.now() - 1_000_000,
    });
    const claims = verified.ok ? verified.claims : null;
    expect(verified.ok).toBe(false);
    expect(canJoinRoom("user:userA", claims).allowed).toBe(false);
  });
});
