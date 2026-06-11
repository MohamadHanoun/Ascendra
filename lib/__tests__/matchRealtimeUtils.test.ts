import { describe, expect, it } from "vitest";

import { shouldRefreshMatchFromRealtimeEvent } from "@/components/match/matchRealtimeUtils";

const MATCH_ID = "match123";

describe("shouldRefreshMatchFromRealtimeEvent", () => {
  it("refreshes on tournament.match.report_submitted matching via entityId", () => {
    expect(
      shouldRefreshMatchFromRealtimeEvent(
        {
          type: "tournament.match.report_submitted",
          entityId: MATCH_ID,
          payload: {},
        },
        MATCH_ID,
      ),
    ).toBe(true);
  });

  it("refreshes on tournament.match.report_submitted matching via payload.matchId", () => {
    expect(
      shouldRefreshMatchFromRealtimeEvent(
        {
          type: "tournament.match.report_submitted",
          payload: { matchId: MATCH_ID, tournamentId: "tour123" },
        },
        MATCH_ID,
      ),
    ).toBe(true);
  });

  it("does not refresh for a different matchId", () => {
    expect(
      shouldRefreshMatchFromRealtimeEvent(
        {
          type: "tournament.match.report_submitted",
          entityId: "other456",
          payload: { matchId: "other456", tournamentId: "tour123" },
        },
        MATCH_ID,
      ),
    ).toBe(false);
  });

  it("does not refresh when only the tournamentId matches", () => {
    expect(
      shouldRefreshMatchFromRealtimeEvent(
        {
          type: "tournament.match.report_submitted",
          payload: { tournamentId: "tour123" },
        },
        MATCH_ID,
      ),
    ).toBe(false);
  });

  it("refreshes on tournament.match.confirmed matching via entityId", () => {
    expect(
      shouldRefreshMatchFromRealtimeEvent(
        {
          type: "tournament.match.confirmed",
          entityId: MATCH_ID,
          payload: {},
        },
        MATCH_ID,
      ),
    ).toBe(true);
  });

  it("refreshes on tournament.match.confirmed matching via payload.matchId", () => {
    expect(
      shouldRefreshMatchFromRealtimeEvent(
        {
          type: "tournament.match.confirmed",
          payload: { matchId: MATCH_ID, tournamentId: "tour123" },
        },
        MATCH_ID,
      ),
    ).toBe(true);
  });

  it("does not refresh on tournament.match.confirmed for a different matchId", () => {
    expect(
      shouldRefreshMatchFromRealtimeEvent(
        {
          type: "tournament.match.confirmed",
          entityId: "other456",
          payload: { matchId: "other456", tournamentId: "tour123" },
        },
        MATCH_ID,
      ),
    ).toBe(false);
  });

  it("does not refresh for unapproved event types", () => {
    for (const type of [
      "tournament.match.disputed",
      "tournament.match.advanced",
      "tournament.match.game_completed",
      "tournament.match.checkin_updated",
      "tournament.match.proof_synced",
      "tournament.match.room_linked",
      "tournament.match.communication_updated",
      "tournament.result.updated",
      "tournament.bracket.generated",
      "tournament.status.updated",
      "leaderboard.updated",
      "notification.created",
    ]) {
      expect(
        shouldRefreshMatchFromRealtimeEvent(
          { type, entityId: MATCH_ID, payload: { matchId: MATCH_ID } },
          MATCH_ID,
        ),
      ).toBe(false);
    }
  });

  it("requires a non-empty matchId argument", () => {
    expect(
      shouldRefreshMatchFromRealtimeEvent(
        { type: "tournament.match.report_submitted", entityId: "" },
        "",
      ),
    ).toBe(false);
  });

  it("never throws on malformed input", () => {
    for (const bad of [null, undefined, 42, "x", [], { type: 7 }, { payload: [] }]) {
      expect(() =>
        shouldRefreshMatchFromRealtimeEvent(bad, MATCH_ID),
      ).not.toThrow();
      expect(shouldRefreshMatchFromRealtimeEvent(bad, MATCH_ID)).toBe(false);
    }
  });
});
