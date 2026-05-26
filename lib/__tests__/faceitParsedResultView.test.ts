import { describe, expect, it } from "vitest";

import {
  hasFaceitPlayerRows,
  normalizeFaceitParsedResultView,
} from "@/lib/faceitParsedResultView";

describe("normalizeFaceitParsedResultView", () => {
  it("normalizes a stored parsed result with grouped player stats", () => {
    const view = normalizeFaceitParsedResultView({
      teams: [
        {
          faceitTeamId: "team-1",
          name: "team_alpha",
          finalScore: 13,
          won: true,
          players: [
            {
              faceitPlayerId: "player-1",
              nickname: "alpha",
              kills: 19,
              deaths: 16,
              assists: 3,
              adr: 76.7,
              headshotsPercent: 37,
              mvps: 2,
              kdRatio: 1.19,
            },
          ],
        },
      ],
    });

    expect(view.teams).toHaveLength(1);
    expect(view.teams[0]).toMatchObject({
      faceitTeamId: "team-1",
      name: "team_alpha",
      finalScore: 13,
      won: true,
    });
    expect(view.teams[0].players[0]).toMatchObject({
      faceitPlayerId: "player-1",
      nickname: "alpha",
      kills: 19,
      deaths: 16,
      assists: 3,
      adr: 76.7,
      headshotsPercent: 37,
      mvps: 2,
      kdRatio: 1.19,
    });
    expect(hasFaceitPlayerRows(view)).toBe(true);
  });

  it("returns an empty view for missing parsed result", () => {
    expect(normalizeFaceitParsedResultView(null)).toEqual({ teams: [] });
    expect(normalizeFaceitParsedResultView(undefined)).toEqual({ teams: [] });
    expect(hasFaceitPlayerRows({ teams: [] })).toBe(false);
  });

  it("keeps player rows when some stats are missing", () => {
    const view = normalizeFaceitParsedResultView({
      teams: [
        {
          faceitTeamId: "team-1",
          players: [
            {
              faceitPlayerId: "player-1",
              nickname: "partial",
              kills: 12,
            },
          ],
        },
      ],
    });

    expect(view.teams[0].players[0]).toMatchObject({
      nickname: "partial",
      kills: 12,
    });
    expect(view.teams[0].players[0].deaths).toBeUndefined();
    expect(view.teams[0].players[0].adr).toBeUndefined();
  });

  it("does not throw for unexpected shapes", () => {
    const view = normalizeFaceitParsedResultView({
      teams: [
        null,
        "bad",
        {
          players: [null, "bad-player", { nickname: "safe" }],
        },
      ],
    });

    expect(view.teams).toHaveLength(1);
    expect(view.teams[0].players).toEqual([
      {
        faceitPlayerId: null,
        nickname: "safe",
        kills: undefined,
        deaths: undefined,
        assists: undefined,
        adr: undefined,
        headshotsPercent: undefined,
        mvps: undefined,
        kdRatio: undefined,
      },
    ]);
  });

  it("accepts numeric strings from older JSON shapes", () => {
    const view = normalizeFaceitParsedResultView({
      teams: [
        {
          finalScore: "10",
          players: [
            {
              nickname: "legacy",
              kills: "20",
              adr: "91.1",
              kdRatio: "1.11",
            },
          ],
        },
      ],
    });

    expect(view.teams[0].finalScore).toBe(10);
    expect(view.teams[0].players[0].kills).toBe(20);
    expect(view.teams[0].players[0].adr).toBe(91.1);
    expect(view.teams[0].players[0].kdRatio).toBe(1.11);
  });
});
