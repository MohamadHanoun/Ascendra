import { describe, expect, it } from "vitest";

import { shouldRefreshLeaderboardFromRealtimeEvent } from "@/components/leaderboard/leaderboardRealtimeUtils";

describe("shouldRefreshLeaderboardFromRealtimeEvent", () => {
  it("refreshes for leaderboard.updated and tournament.result.updated", () => {
    expect(shouldRefreshLeaderboardFromRealtimeEvent({ type: "leaderboard.updated" })).toBe(true);
    expect(
      shouldRefreshLeaderboardFromRealtimeEvent({ type: "tournament.result.updated" }),
    ).toBe(true);
  });

  it("does not refresh for unrelated/sensitive/private events", () => {
    for (const type of [
      "notification.created",
      "tournament.match.confirmed",
      "registration.approved",
      "team.updated",
      "profile.updated",
      "bot.heartbeat",
      "unknown.event",
    ]) {
      expect(shouldRefreshLeaderboardFromRealtimeEvent({ type })).toBe(false);
    }
  });

  it("never throws and returns false on malformed input", () => {
    expect(() => shouldRefreshLeaderboardFromRealtimeEvent(null)).not.toThrow();
    expect(shouldRefreshLeaderboardFromRealtimeEvent(null)).toBe(false);
    expect(shouldRefreshLeaderboardFromRealtimeEvent(undefined)).toBe(false);
    expect(shouldRefreshLeaderboardFromRealtimeEvent("leaderboard.updated")).toBe(false);
    expect(shouldRefreshLeaderboardFromRealtimeEvent(42)).toBe(false);
    expect(shouldRefreshLeaderboardFromRealtimeEvent({})).toBe(false);
    expect(shouldRefreshLeaderboardFromRealtimeEvent({ type: 123 })).toBe(false);
    expect(shouldRefreshLeaderboardFromRealtimeEvent([])).toBe(false);
  });
});
