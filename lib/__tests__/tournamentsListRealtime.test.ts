import { describe, expect, it } from "vitest";

import { shouldRefreshTournamentsListFromRealtimeEvent } from "@/components/tournament/tournamentsListRealtimeUtils";

describe("shouldRefreshTournamentsListFromRealtimeEvent", () => {
  it("accepts tournaments.updated", () => {
    expect(
      shouldRefreshTournamentsListFromRealtimeEvent({
        type: "tournaments.updated",
        entityType: "tournament",
        entityId: "tour123",
        payload: { tournamentId: "tour123" },
      }),
    ).toBe(true);
  });

  it("accepts tournaments.updated regardless of payload contents", () => {
    expect(
      shouldRefreshTournamentsListFromRealtimeEvent({
        type: "tournaments.updated",
        payload: {},
      }),
    ).toBe(true);
  });

  it("rejects every other event type", () => {
    for (const type of [
      "tournament.updated",
      "tournament.status.updated",
      "tournament.registration.updated",
      "tournament.registrationStatus.updated",
      "tournament.result.updated",
      "tournament.bracket.generated",
      "tournament.match.advanced",
      "leaderboard.updated",
      "notification.created",
      "team.updated",
      "profile.updated",
    ]) {
      expect(
        shouldRefreshTournamentsListFromRealtimeEvent({ type }),
      ).toBe(false);
    }
  });

  it("never throws on malformed events", () => {
    for (const bad of [
      null,
      undefined,
      "tournaments.updated",
      42,
      [],
      {},
      { type: 7 },
      { type: null },
    ]) {
      expect(() =>
        shouldRefreshTournamentsListFromRealtimeEvent(bad),
      ).not.toThrow();
      expect(shouldRefreshTournamentsListFromRealtimeEvent(bad)).toBe(false);
    }
  });
});
