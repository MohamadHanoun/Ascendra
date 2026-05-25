import { beforeEach, describe, expect, it, vi } from "vitest";
import { MatchStatus } from "@prisma/client";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/realtime", () => ({
  createRealtimeEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tournament: {
      findUnique: vi.fn(),
    },
    tournamentMatch: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    tournamentRegistration: {
      findMany: vi.fn(),
    },
    tournamentResult: {
      upsert: vi.fn(),
    },
    team: {
      findMany: vi.fn(),
    },
    rankingSeason: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    rankingPointEvent: {
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  awardTournamentResultsAndPoints,
  buildFinalPlacements,
  getPlacementPoints,
} from "@/lib/tournamentResults";

const tournament = {
  id: "tournament-1",
  title: "Ascendra Cup",
  format: "single_elimination",
  gameId: "game-1",
  seasonId: "season-1",
  game: { name: "Valorant" },
};

const finalMatch = {
  id: "final",
  tournamentId: "tournament-1",
  teamAId: "team-a",
  teamBId: "team-b",
  winnerTeamId: "team-a",
  nextMatchId: null,
  status: MatchStatus.completed,
};

function registration(teamId: string, username: string) {
  return {
    teamId,
    snapshotTeamName: `Snapshot ${teamId}`,
    snapshotTeamGame: "Valorant",
    snapshotMembers: [
      {
        userId: `user-${teamId}`,
        username,
      },
    ],
    team: {
      id: teamId,
      name: `Current ${teamId}`,
      game: { name: "Valorant" },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.rankingPointEvent.upsert as ReturnType<typeof vi.fn>).mockImplementation(
    async (args) => args.create,
  );
  (prisma.tournamentResult.upsert as ReturnType<typeof vi.fn>).mockImplementation(
    async (args) => args.create,
  );
});

describe("buildFinalPlacements", () => {
  it("calculates final winner, final loser, and semifinal losers", () => {
    const placements = buildFinalPlacements(finalMatch, [
      {
        id: "semi-a",
        teamAId: "team-a",
        teamBId: "team-c",
        winnerTeamId: "team-a",
      },
      {
        id: "semi-b",
        teamAId: "team-b",
        teamBId: "team-d",
        winnerTeamId: "team-b",
      },
    ]);

    expect(placements).toEqual([
      { teamId: "team-a", placement: 1 },
      { teamId: "team-b", placement: 2 },
      { teamId: "team-c", placement: 3 },
      { teamId: "team-d", placement: 3 },
    ]);
  });

  it("returns no placements when the final is not safely completed", () => {
    expect(
      buildFinalPlacements({
        ...finalMatch,
        status: MatchStatus.confirmed,
      }),
    ).toEqual([]);
  });
});

describe("getPlacementPoints", () => {
  it("applies the multiplier and rounds to integer points", () => {
    expect(getPlacementPoints(1, 1.5)).toBe(180);
    expect(getPlacementPoints(2, 1.25)).toBe(94);
    expect(getPlacementPoints(3, 1)).toBe(45);
    expect(getPlacementPoints(99, 1)).toBe(0);
  });
});

describe("awardTournamentResultsAndPoints", () => {
  it("skips safely when there is no completed final", async () => {
    (prisma.tournament.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      tournament,
    );
    (prisma.tournamentMatch.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      null,
    );

    const result = await awardTournamentResultsAndPoints("tournament-1");

    expect(result).toEqual({
      ok: true,
      skipped: true,
      tournamentId: "tournament-1",
      reason: "completed_final_not_found",
    });
    expect(prisma.tournamentResult.upsert).not.toHaveBeenCalled();
    expect(prisma.rankingPointEvent.upsert).not.toHaveBeenCalled();
  });

  it("upserts results and stable point events once per award category", async () => {
    (prisma.tournament.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      tournament,
    );
    (prisma.tournamentMatch.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      finalMatch,
    );
    (prisma.tournamentMatch.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([
        {
          id: "semi-a",
          teamAId: "team-a",
          teamBId: "team-c",
          winnerTeamId: "team-a",
        },
        {
          id: "semi-b",
          teamAId: "team-b",
          teamBId: "team-d",
          winnerTeamId: "team-b",
        },
      ])
      .mockResolvedValueOnce([
        { id: "final", winnerTeamId: "team-a" },
        { id: "semi-a", winnerTeamId: "team-a" },
        { id: "semi-b", winnerTeamId: "team-b" },
      ]);
    (prisma.tournamentRegistration.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      [
        registration("team-a", "Alpha"),
        registration("team-b", "Bravo"),
        registration("team-c", "Charlie"),
        registration("team-d", "Delta"),
      ],
    );
    (prisma.team.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: "team-a", name: "Team A", game: { name: "Valorant" } },
      { id: "team-b", name: "Team B", game: { name: "Valorant" } },
      { id: "team-c", name: "Team C", game: { name: "Valorant" } },
      { id: "team-d", name: "Team D", game: { name: "Valorant" } },
    ]);

    const result = await awardTournamentResultsAndPoints("tournament-1");

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        skipped: false,
        tournamentId: "tournament-1",
        teamPointEvents: 11,
        playerPointEvents: 11,
      }),
    );
    expect(prisma.tournamentResult.upsert).toHaveBeenCalledTimes(4);
    expect(prisma.tournamentResult.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          teamId: "team-a",
          placement: 1,
          points: 120,
        }),
      }),
    );
    expect(prisma.tournamentResult.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          teamId: "team-b",
          placement: 2,
          points: 75,
        }),
      }),
    );

    const pointEventCalls = (
      prisma.rankingPointEvent.upsert as ReturnType<typeof vi.fn>
    ).mock.calls;
    const dedupeKeys = pointEventCalls.map(
      ([args]) => args.where.dedupeKey as string,
    );

    expect(pointEventCalls).toHaveLength(22);
    expect(new Set(dedupeKeys).size).toBe(dedupeKeys.length);
    expect(dedupeKeys).toContain(
      "ranking:tournament:tournament-1:team:team-a:placement:1",
    );
    expect(dedupeKeys).toContain(
      "ranking:tournament:tournament-1:team:team-a:placement:1:user:user-team-a",
    );
    expect(dedupeKeys).toContain(
      "ranking:tournament:tournament-1:team:team-a:match_win:match:final",
    );
    expect(dedupeKeys).toContain(
      "ranking:tournament:tournament-1:team:team-a:match_win:match:final:user:user-team-a",
    );
  });
});
