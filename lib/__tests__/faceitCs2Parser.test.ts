import { describe, expect, it } from "vitest";

import {
  getFaceitMatchGameId,
  isFaceitCs2MatchDetails,
  parseFaceitCs2MatchResult,
} from "@/lib/faceitCs2Parser";
import type { FaceitMatchDetails, FaceitMatchStatsResponse } from "@/lib/faceitTypes";

// Minimal fixture derived from confirmed real FACEIT response.
// Full JSON lives at faceit-stats.json; this is a trimmed version for unit testing.

const MATCH_ID = "1-59d69823-3169-45a8-9973-e9cf825d5588";

const WINNING_TEAM_ID = "61a9ebce-aa3b-4823-85c4-d427e6806759";
const LOSING_TEAM_ID = "adf4d2c5-75e1-4b99-b068-f68da368519e";

const minimalDetails: FaceitMatchDetails = {
  match_id: MATCH_ID,
  status: "FINISHED",
  faceit_url: "https://www.faceit.com/{lang}/cs2/room/1-59d69823-3169-45a8-9973-e9cf825d5588",
  demo_url: ["https://demos.faceit.com/cs2/demo1.dem.gz"],
};

const minimalStats: FaceitMatchStatsResponse = {
  rounds: [
    {
      round_stats: {
        Score: "13 / 10",
        Map: "de_mirage",
        Winner: WINNING_TEAM_ID,
        Region: "EU",
        Rounds: "23",
      },
      teams: [
        {
          team_id: WINNING_TEAM_ID,
          team_stats: {
            Team: "team_tRidstat",
            "Final Score": "13",
            "Team Win": "1",
          },
          players: [
            {
              player_id: "a2ba494a-6775-4d2a-a0f6-73eeaae6d706",
              nickname: "tRidstat",
              player_stats: {
                Kills: "19",
                Deaths: "16",
                Assists: "3",
                ADR: "76.7",
                "Headshots %": "37",
                MVPs: "2",
                "K/D Ratio": "1.19",
              },
            },
          ],
        },
        {
          team_id: LOSING_TEAM_ID,
          team_stats: {
            Team: "team_Rave_me",
            "Final Score": "10",
            "Team Win": "0",
          },
          players: [
            {
              player_id: "98571cdf-a72e-4e78-884b-5deb752ff3fd",
              nickname: "Rave_me",
              player_stats: {
                Kills: "20",
                Deaths: "18",
                Assists: "4",
                ADR: "91.1",
                "Headshots %": "50",
                MVPs: "0",
                "K/D Ratio": "1.11",
              },
            },
          ],
        },
      ],
    },
  ],
};

describe("getFaceitMatchGameId", () => {
  it("reads FACEIT match game from game", () => {
    expect(getFaceitMatchGameId({ match_id: MATCH_ID, game: "cs2" })).toBe(
      "cs2",
    );
  });

  it("reads FACEIT match game from game_id", () => {
    expect(
      getFaceitMatchGameId({
        match_id: MATCH_ID,
        game_id: "CS2",
      } as FaceitMatchDetails),
    ).toBe("cs2");
  });

  it("falls back to game when game_id is empty", () => {
    expect(
      getFaceitMatchGameId({
        match_id: MATCH_ID,
        game_id: "",
        game: "cs2",
      } as FaceitMatchDetails),
    ).toBe("cs2");
  });

  it("returns null when FACEIT match game is missing", () => {
    expect(getFaceitMatchGameId({ match_id: MATCH_ID })).toBeNull();
  });
});

describe("isFaceitCs2MatchDetails", () => {
  it("accepts CS2 match details", () => {
    expect(isFaceitCs2MatchDetails({ match_id: MATCH_ID, game: "cs2" })).toBe(
      true,
    );
  });

  it("rejects non-CS2 match details", () => {
    expect(
      isFaceitCs2MatchDetails({ match_id: MATCH_ID, game: "valorant" }),
    ).toBe(false);
  });

  it("rejects details without a game id", () => {
    expect(isFaceitCs2MatchDetails({ match_id: MATCH_ID })).toBe(false);
  });
});

describe("parseFaceitCs2MatchResult", () => {
  it("extracts match id, status, and faceit URL", () => {
    const result = parseFaceitCs2MatchResult({
      matchId: MATCH_ID,
      details: minimalDetails,
      stats: minimalStats,
    });

    expect(result.matchId).toBe(MATCH_ID);
    expect(result.status).toBe("FINISHED");
    expect(result.faceitUrl).toContain("faceit.com");
  });

  it("parses score string '13 / 10' correctly", () => {
    const { score } = parseFaceitCs2MatchResult({
      matchId: MATCH_ID,
      details: minimalDetails,
      stats: minimalStats,
    });

    expect(score?.raw).toBe("13 / 10");
    expect(score?.faction1).toBe(13);
    expect(score?.faction2).toBe(10);
  });

  it("reads the map from round_stats", () => {
    const { map } = parseFaceitCs2MatchResult({
      matchId: MATCH_ID,
      details: minimalDetails,
      stats: minimalStats,
    });

    expect(map).toBe("de_mirage");
  });

  it("identifies the winning team by FACEIT team_id", () => {
    const { winnerFaceitTeamId } = parseFaceitCs2MatchResult({
      matchId: MATCH_ID,
      details: minimalDetails,
      stats: minimalStats,
    });

    expect(winnerFaceitTeamId).toBe(WINNING_TEAM_ID);
  });

  it("sets team finalScore and won flag correctly", () => {
    const { teams } = parseFaceitCs2MatchResult({
      matchId: MATCH_ID,
      details: minimalDetails,
      stats: minimalStats,
    });

    const winner = teams.find((t) => t.faceitTeamId === WINNING_TEAM_ID);
    const loser = teams.find((t) => t.faceitTeamId === LOSING_TEAM_ID);

    expect(winner?.finalScore).toBe(13);
    expect(winner?.won).toBe(true);
    expect(loser?.finalScore).toBe(10);
    expect(loser?.won).toBe(false);
  });

  it("extracts player stats from the winning team", () => {
    const { teams } = parseFaceitCs2MatchResult({
      matchId: MATCH_ID,
      details: minimalDetails,
      stats: minimalStats,
    });

    const winner = teams.find((t) => t.faceitTeamId === WINNING_TEAM_ID);
    const player = winner?.players[0];

    expect(player?.nickname).toBe("tRidstat");
    expect(player?.kills).toBe(19);
    expect(player?.deaths).toBe(16);
    expect(player?.assists).toBe(3);
    expect(player?.adr).toBeCloseTo(76.7);
    expect(player?.headshotsPercent).toBe(37);
    expect(player?.mvps).toBe(2);
    expect(player?.kdRatio).toBeCloseTo(1.19);
  });

  it("collects demo URLs from details", () => {
    const { demoUrls } = parseFaceitCs2MatchResult({
      matchId: MATCH_ID,
      details: minimalDetails,
      stats: minimalStats,
    });

    expect(demoUrls).toHaveLength(1);
    expect(demoUrls[0]).toContain("demos.faceit.com");
  });

  it("does not crash when stats are missing entirely", () => {
    const result = parseFaceitCs2MatchResult({
      matchId: MATCH_ID,
      details: { match_id: MATCH_ID },
      stats: {},
    });

    expect(result.matchId).toBe(MATCH_ID);
    expect(result.score).toBeUndefined();
    expect(result.map).toBeUndefined();
    expect(result.winnerFaceitTeamId).toBeUndefined();
    expect(result.teams).toEqual([]);
    expect(result.demoUrls).toEqual([]);
  });

  it("does not crash when individual player stats are missing", () => {
    const stats: FaceitMatchStatsResponse = {
      rounds: [
        {
          round_stats: { Score: "13 / 10", Map: "de_dust2", Winner: WINNING_TEAM_ID },
          teams: [
            {
              team_id: WINNING_TEAM_ID,
              team_stats: { "Final Score": "13", "Team Win": "1" },
              players: [
                {
                  player_id: "p1",
                  nickname: "ghost",
                  // completely empty player stats
                  player_stats: {},
                },
              ],
            },
          ],
        },
      ],
    };

    const result = parseFaceitCs2MatchResult({
      matchId: MATCH_ID,
      details: { match_id: MATCH_ID },
      stats,
    });

    const player = result.teams[0]?.players[0];
    expect(player?.nickname).toBe("ghost");
    expect(player?.kills).toBeUndefined();
    expect(player?.adr).toBeUndefined();
  });

  it("returns undefined for invalid number strings", () => {
    const stats: FaceitMatchStatsResponse = {
      rounds: [
        {
          round_stats: {},
          teams: [
            {
              team_id: WINNING_TEAM_ID,
              team_stats: { "Final Score": "NaN", "Team Win": "0" },
              players: [
                {
                  player_id: "p1",
                  nickname: "bad_data",
                  player_stats: {
                    Kills: "not-a-number",
                    ADR: "",
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const result = parseFaceitCs2MatchResult({
      matchId: MATCH_ID,
      details: { match_id: MATCH_ID },
      stats,
    });

    expect(result.teams[0]?.finalScore).toBeUndefined();
    const player = result.teams[0]?.players[0];
    expect(player?.kills).toBeUndefined();
    expect(player?.adr).toBeUndefined();
  });
});
