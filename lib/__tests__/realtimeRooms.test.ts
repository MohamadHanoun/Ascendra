import { describe, expect, it } from "vitest";

import { mapRealtimeEventToRooms } from "@/lib/realtime/rooms";

describe("mapRealtimeEventToRooms", () => {
  it("maps leaderboard.updated to ['leaderboard']", () => {
    expect(
      mapRealtimeEventToRooms({
        type: "leaderboard.updated",
        audience: "public",
        entityType: "leaderboard",
        entityId: "global",
      }),
    ).toEqual(["leaderboard"]);
  });

  it("maps tournament.result.updated to tournament:{id}", () => {
    expect(
      mapRealtimeEventToRooms({
        type: "tournament.result.updated",
        audience: "public",
        entityType: "tournament",
        entityId: "tour123",
        payload: { tournamentId: "tour123" },
      }),
    ).toEqual(["tournament:tour123"]);
  });

  it("maps tournament.bracket.generated to tournament:{id}", () => {
    expect(
      mapRealtimeEventToRooms({
        type: "tournament.bracket.generated",
        audience: "public",
        entityType: "tournament",
        entityId: "tour123",
        payload: { tournamentId: "tour123" },
      }),
    ).toEqual(["tournament:tour123"]);
  });

  it("maps tournament.status.updated to tournament:{id}", () => {
    expect(
      mapRealtimeEventToRooms({
        type: "tournament.status.updated",
        audience: "public",
        entityType: "tournament",
        entityId: "tour123",
        payload: { tournamentId: "tour123" },
      }),
    ).toEqual(["tournament:tour123"]);
  });

  it("maps tournament.registration.updated to tournament:{id}", () => {
    expect(
      mapRealtimeEventToRooms({
        type: "tournament.registration.updated",
        audience: "public",
        entityType: "tournament",
        entityId: "tour123",
        payload: { tournamentId: "tour123", teamId: "team456" },
      }),
    ).toEqual(["tournament:tour123"]);
  });

  it("maps tournament.match.confirmed to match + tournament rooms", () => {
    const rooms = mapRealtimeEventToRooms({
      type: "tournament.match.confirmed",
      audience: "public",
      entityType: "tournamentMatch",
      entityId: "match789",
      payload: { matchId: "match789", tournamentId: "tour123" },
    });

    expect(rooms).toEqual(["match:match789", "tournament:tour123"]);
  });

  it("maps notification.created without userId to []", () => {
    expect(
      mapRealtimeEventToRooms({
        type: "notification.created",
        audience: "public",
        entityType: "notification",
        payload: {},
      }),
    ).toEqual([]);
  });

  it("maps notification.created with a safe userId to notifications:{userId}", () => {
    expect(
      mapRealtimeEventToRooms({
        type: "notification.created",
        audience: "public",
        entityType: "notification",
        payload: { userId: "ckuser123" },
      }),
    ).toEqual(["notifications:ckuser123"]);
  });

  it("does not build a notification room from a Discord-snowflake userId", () => {
    expect(
      mapRealtimeEventToRooms({
        type: "notification.created",
        payload: { userId: "123456789012345678" },
      }),
    ).toEqual([]);
  });

  it("maps registration.rejected (admin) to ['admin'] only", () => {
    expect(
      mapRealtimeEventToRooms({
        type: "registration.rejected",
        audience: "admin",
        entityType: "registration",
        entityId: "reg1",
        payload: { tournamentId: "tour123", rejectionReason: "nope" },
      }),
    ).toEqual(["admin"]);
  });

  it("maps a public unknown event with no safe entity mapping to []", () => {
    expect(
      mapRealtimeEventToRooms({
        type: "weird.event",
        audience: "public",
        payload: {},
      }),
    ).toEqual([]);
  });

  it("does not produce invalid room names from invalid IDs", () => {
    const rooms = mapRealtimeEventToRooms({
      type: "tournament.updated",
      audience: "public",
      payload: { tournamentId: "bad id/with spaces" },
    });
    expect(rooms).toEqual([]);
    for (const room of rooms) {
      expect(/^[a-zA-Z0-9:_-]+$/.test(room)).toBe(true);
    }
  });

  it("returns unique rooms and never exceeds 20", () => {
    const rooms = mapRealtimeEventToRooms({
      type: "tournament.match.confirmed",
      audience: "public",
      payload: { matchId: "m1", tournamentId: "t1" },
    });
    expect(new Set(rooms).size).toBe(rooms.length);
    expect(rooms.length).toBeLessThanOrEqual(20);
  });

  it("never accepts rooms supplied directly in the payload", () => {
    const rooms = mapRealtimeEventToRooms({
      type: "tournament.updated",
      audience: "public",
      payload: {
        tournamentId: "tour123",
        rooms: ["admin", "hacker", "user:victim"],
      },
    });

    expect(rooms).toEqual(["tournament:tour123"]);
    expect(rooms).not.toContain("hacker");
    expect(rooms).not.toContain("admin");
    expect(rooms).not.toContain("user:victim");
  });

  it("never throws on malformed input", () => {
    expect(() =>
      mapRealtimeEventToRooms({ type: undefined as unknown as string }),
    ).not.toThrow();
    expect(
      mapRealtimeEventToRooms({ type: undefined as unknown as string }),
    ).toEqual([]);
  });
});
