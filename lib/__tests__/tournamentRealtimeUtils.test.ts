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

  it("refreshes on tournament.bracket.generated matching via entityId", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        {
          type: "tournament.bracket.generated",
          entityId: TOURNAMENT_ID,
          payload: {},
        },
        TOURNAMENT_ID,
      ),
    ).toBe(true);
  });

  it("refreshes on tournament.bracket.generated matching via payload.tournamentId", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        {
          type: "tournament.bracket.generated",
          payload: { tournamentId: TOURNAMENT_ID },
        },
        TOURNAMENT_ID,
      ),
    ).toBe(true);
  });

  it("refreshes on tournament.status.updated matching via entityId", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        {
          type: "tournament.status.updated",
          entityId: TOURNAMENT_ID,
          payload: {},
        },
        TOURNAMENT_ID,
      ),
    ).toBe(true);
  });

  it("refreshes on tournament.status.updated matching via payload.tournamentId", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        {
          type: "tournament.status.updated",
          payload: { tournamentId: TOURNAMENT_ID },
        },
        TOURNAMENT_ID,
      ),
    ).toBe(true);
  });

  it("does not refresh on tournament.status.updated for a different tournament", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        {
          type: "tournament.status.updated",
          entityId: "other456",
          payload: { tournamentId: "other456" },
        },
        TOURNAMENT_ID,
      ),
    ).toBe(false);
  });

  it("refreshes on tournament.registration.updated matching via entityId", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        {
          type: "tournament.registration.updated",
          entityId: TOURNAMENT_ID,
          payload: {},
        },
        TOURNAMENT_ID,
      ),
    ).toBe(true);
  });

  it("refreshes on tournament.registration.updated matching via payload.tournamentId", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        {
          type: "tournament.registration.updated",
          payload: { tournamentId: TOURNAMENT_ID },
        },
        TOURNAMENT_ID,
      ),
    ).toBe(true);
  });

  it("does not refresh on tournament.registration.updated for a different tournament", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        {
          type: "tournament.registration.updated",
          entityId: "other456",
          payload: { tournamentId: "other456" },
        },
        TOURNAMENT_ID,
      ),
    ).toBe(false);
  });

  it("refreshes on tournament.match.advanced matching via payload.tournamentId", () => {
    // For match events the entityId is the MATCH id, so the tournament match
    // must come from payload.tournamentId (the dispatch always includes it).
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        {
          type: "tournament.match.advanced",
          entityId: "match789",
          payload: { tournamentId: TOURNAMENT_ID, matchId: "match789" },
        },
        TOURNAMENT_ID,
      ),
    ).toBe(true);
  });

  it("does not refresh on tournament.match.advanced for a different tournament", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        {
          type: "tournament.match.advanced",
          entityId: "match789",
          payload: { tournamentId: "other456", matchId: "match789" },
        },
        TOURNAMENT_ID,
      ),
    ).toBe(false);
  });

  it("does not refresh on tournament.bracket.generated for a different tournament", () => {
    expect(
      shouldRefreshTournamentDetailsFromRealtimeEvent(
        {
          type: "tournament.bracket.generated",
          entityId: "other456",
          payload: { tournamentId: "other456" },
        },
        TOURNAMENT_ID,
      ),
    ).toBe(false);
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
      "tournament.registrationStatus.updated",
      "tournament.match.confirmed",
      "registration.approved",
      "registration.rejected",
      "registration.cancelled",
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
