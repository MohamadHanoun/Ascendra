import { describe, expect, it } from "vitest";

import { shouldRefreshTournamentDetailsFromRealtimeEvent } from "@/components/tournament/tournamentRealtimeUtils";

const TOURNAMENT_ID = "tour123";

describe("shouldRefreshTournamentDetailsFromRealtimeEvent", () => {
  it("refreshes on tournament.result.updated matching via entityId", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        {
          type: "tournament.result.updated",
          entityId: TOURNAMENT_ID,
          payload: {},
        },
        TOURNAMENT_ID,
      ),
    ).toBe(true);
  });

  it("refreshes on tournament.result.updated matching via payload.tournamentId", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        {
          type: "tournament.result.updated",
          payload: { tournamentId: TOURNAMENT_ID },
        },
        TOURNAMENT_ID,
      ),
    ).toBe(true);
  });

  it("does not refresh for a different tournament", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        {
          type: "tournament.result.updated",
          entityId: "other456",
          payload: { tournamentId: "other456" },
        },
        TOURNAMENT_ID,
      ),
    ).toBe(false);
  });

  it("does not refresh for unapproved event types", () => {
    for (const type of [
      "leaderboard.updated",
      "tournament.updated",
      "tournament.match.confirmed",
      "registration.approved",
      "notification.created",
    ]) {
      expect(
        shouldRefreshTournamentDetailsFromRealtimeEvent(
          { type, entityId: TOURNAMENT_ID, payload: { tournamentId: TOURNAMENT_ID } },
          TOURNAMENT_ID,
        ),
      ).toBe(false);
    }
  });

  it("does not refresh without a tournamentId match anywhere", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        { type: "tournament.result.updated", payload: {} },
        TOURNAMENT_ID,
      ),
    ).toBe(false);
  });

  it("requires a non-empty tournamentId argument", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        { type: "tournament.result.updated", entityId: "" },
        "",
      ),
    ).toBe(false);
  });

  it("never throws on malformed input", () => {
    for (const bad of [null, undefined, 42, "x", [], { type: 7 }, { payload: [] }]) {
      expect(() =>
        shouldRefreshTournamentDetailsFromRealtimeEvent(bad, TOURNAMENT_ID),
      ).not.toThrow();
      expect(
        shouldRefreshTournamentDetailsFromRealtimeEvent(bad, TOURNAMENT_ID),
      ).toBe(false);
    }
  });
});
