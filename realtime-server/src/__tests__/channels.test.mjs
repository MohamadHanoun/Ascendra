import { describe, expect, it } from "vitest";

import {
  isValidRoomName,
  isProtectedRoom,
  isPubliclyJoinable,
  MAX_ROOM_NAME_LENGTH,
} from "../channels.mjs";

describe("isValidRoomName", () => {
  it("accepts clean room names", () => {
    expect(isValidRoomName("leaderboard")).toBe(true);
    expect(isValidRoomName("tournament:abc123")).toBe(true);
    expect(isValidRoomName("match:m_1-2")).toBe(true);
  });

  it("rejects invalid characters, empty, and overlong names", () => {
    expect(isValidRoomName("")).toBe(false);
    expect(isValidRoomName("tournament:bad id")).toBe(false);
    expect(isValidRoomName("match:abc/def")).toBe(false);
    expect(isValidRoomName("a".repeat(MAX_ROOM_NAME_LENGTH + 1))).toBe(false);
    expect(isValidRoomName(123)).toBe(false);
  });
});

describe("isPubliclyJoinable", () => {
  it("allows public rooms: leaderboard, tournaments, tournament:{id}, match:{id}", () => {
    expect(isPubliclyJoinable("leaderboard")).toBe(true);
    expect(isPubliclyJoinable("tournaments")).toBe(true);
    expect(isPubliclyJoinable("tournament:tour123")).toBe(true);
    expect(isPubliclyJoinable("match:match789")).toBe(true);
  });

  it("allows only the exact tournaments room (no wildcard/prefix variants)", () => {
    expect(isPubliclyJoinable("tournaments")).toBe(true);
    expect(isPubliclyJoinable("tournaments:t1")).toBe(false);
    expect(isPubliclyJoinable("tournamentsX")).toBe(false);
    expect(isPubliclyJoinable("tournaments-list")).toBe(false);
    expect(isPubliclyJoinable("Tournaments")).toBe(false);
  });

  it("rejects private/admin rooms until token ACLs exist", () => {
    expect(isPubliclyJoinable("admin")).toBe(false);
    expect(isPubliclyJoinable("admin:queue")).toBe(false);
    expect(isPubliclyJoinable("admin:tournament:tour123")).toBe(false);
    expect(isPubliclyJoinable("user:u1")).toBe(false);
    expect(isPubliclyJoinable("notifications:u1")).toBe(false);
    expect(isPubliclyJoinable("profile:u1")).toBe(false);
    expect(isPubliclyJoinable("team:t1")).toBe(false);
  });

  it("rejects invalid / overlong / empty-id public rooms", () => {
    expect(isPubliclyJoinable("tournament:bad id")).toBe(false);
    expect(isPubliclyJoinable("tournament:")).toBe(false);
    expect(isPubliclyJoinable("match:a:b")).toBe(false);
    expect(isPubliclyJoinable("a".repeat(MAX_ROOM_NAME_LENGTH + 1))).toBe(false);
    expect(isPubliclyJoinable("randomroom")).toBe(false);
  });
});

describe("isProtectedRoom", () => {
  it("flags all private/admin prefixes", () => {
    for (const room of [
      "user:1",
      "notifications:1",
      "profile:1",
      "team:1",
      "admin",
      "admin:queue",
    ]) {
      expect(isProtectedRoom(room)).toBe(true);
    }
    expect(isProtectedRoom("tournament:1")).toBe(false);
  });
});
