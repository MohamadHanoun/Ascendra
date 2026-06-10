import { describe, expect, it } from "vitest";

import { sanitizeRealtimePayload } from "@/lib/realtime/payload";

describe("sanitizeRealtimePayload — public", () => {
  it("removes rejectionReason and keeps only safe IDs", () => {
    const result = sanitizeRealtimePayload({
      type: "tournament.registration.updated",
      audience: "public",
      entityType: "tournament",
      entityId: "tour123",
      payload: {
        tournamentId: "tour123",
        teamId: "team456",
        teamName: "Shadow Wolves",
        rejectionReason: "Roster not eligible",
      },
    });

    expect(result).toEqual({
      tournamentId: "tour123",
      teamId: "team456",
      entityType: "tournament",
      entityId: "tour123",
    });
    expect(result).not.toHaveProperty("teamName");
    expect(result).not.toHaveProperty("rejectionReason");
  });

  it("keeps tournament.result.updated public payloads ID-only", () => {
    const result = sanitizeRealtimePayload({
      type: "tournament.result.updated",
      audience: "public",
      entityType: "tournament",
      entityId: "tour123",
      payload: {
        tournamentId: "tour123",
        teamName: "Shadow Wolves",
        placement: 1,
        points: 120,
        userIds: ["u1", "u2"],
        discordId: "123456789012345678",
      },
    });

    expect(result).toEqual({
      tournamentId: "tour123",
      entityType: "tournament",
      entityId: "tour123",
    });
    for (const forbidden of [
      "teamName",
      "placement",
      "points",
      "userIds",
      "discordId",
    ]) {
      expect(result).not.toHaveProperty(forbidden);
    }
  });

  it("drops Discord-snowflake userIds but keeps cuid-style userIds", () => {
    const withSnowflake = sanitizeRealtimePayload({
      type: "profile.updated",
      audience: "public",
      payload: { userId: "123456789012345678" },
    });
    expect(withSnowflake).not.toHaveProperty("userId");

    const withCuid = sanitizeRealtimePayload({
      type: "profile.updated",
      audience: "public",
      payload: { userId: "ckuser123" },
    });
    expect(withCuid.userId).toBe("ckuser123");
  });
});

describe("sanitizeRealtimePayload — admin", () => {
  it("strips nested token/secret/password/cookie/authorization fields", () => {
    const result = sanitizeRealtimePayload({
      type: "bot.event.updated",
      audience: "admin",
      payload: {
        eventId: "evt1",
        nested: {
          token: "abc",
          clientSecret: "xyz",
          password: "pw",
          sessionCookie: "c",
          authorization: "Bearer x",
          keepMe: "ok",
        },
      },
    });

    expect(result.eventId).toBe("evt1");
    const nested = result.nested as Record<string, unknown>;
    expect(nested).toEqual({ keepMe: "ok" });
  });

  it("removes prototype-pollution keys", () => {
    const malicious = JSON.parse(
      '{"a":1,"__proto__":{"polluted":true},"constructor":{"x":1},"prototype":{"y":2}}',
    );
    const result = sanitizeRealtimePayload({
      type: "bot.event.updated",
      audience: "admin",
      payload: malicious,
    });

    expect(result.a).toBe(1);
    expect(Object.keys(result)).toEqual(["a"]);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("handles circular objects without throwing", () => {
    const circular: Record<string, unknown> = { id: "x" };
    circular.self = circular;

    let result: Record<string, unknown> = {};
    expect(() => {
      result = sanitizeRealtimePayload({
        type: "bot.event.updated",
        audience: "admin",
        payload: circular,
      });
    }).not.toThrow();

    expect(result.id).toBe("x");
    expect(result).not.toHaveProperty("self");
  });

  it("caps long strings and long arrays", () => {
    const result = sanitizeRealtimePayload({
      type: "bot.event.updated",
      audience: "admin",
      payload: {
        big: "a".repeat(2000),
        list: Array.from({ length: 200 }, (_v, i) => i),
      },
    });

    expect((result.big as string).length).toBe(500);
    expect((result.list as unknown[]).length).toBe(50);
  });

  it("drops functions/symbols/undefined/bigint and is JSON serializable", () => {
    const result = sanitizeRealtimePayload({
      type: "bot.event.updated",
      audience: "admin",
      payload: {
        fn: () => 1,
        sym: Symbol("s") as unknown as string,
        undef: undefined,
        big: BigInt(10) as unknown as number,
        when: new Date("2026-06-08T00:00:00.000Z"),
        ok: "value",
      },
    });

    expect(result).not.toHaveProperty("fn");
    expect(result).not.toHaveProperty("sym");
    expect(result).not.toHaveProperty("undef");
    expect(result).not.toHaveProperty("big");
    expect(result.when).toBe("2026-06-08T00:00:00.000Z");
    expect(result.ok).toBe("value");
    expect(() => JSON.stringify(result)).not.toThrow();
  });
});

describe("sanitizeRealtimePayload — safety", () => {
  it("never throws on bad input and returns a plain object", () => {
    expect(
      sanitizeRealtimePayload({
        type: "x",
        payload: null,
      }),
    ).toEqual({});

    expect(
      sanitizeRealtimePayload({
        type: "x",
        audience: "admin",
        payload: [1, 2, 3] as unknown as Record<string, unknown>,
      }),
    ).toEqual({});
  });
});
