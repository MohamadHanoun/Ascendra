import type { Prisma } from "@prisma/client";

import type { LeaderboardTeam, LeaderboardUser } from "@/data/leaderboard";
import { prisma } from "@/lib/prisma";
import {
  aggregatePlayerLeaderboard,
  aggregateTeamLeaderboard,
  getActiveRankingSeason,
} from "@/lib/ranking/rankingService";

export type LeaderboardType = "players" | "teams";
export type LeaderboardSeasonScope = "current" | "all";

export type LeaderboardGameOption = {
  id: string;
  name: string;
  slug: string;
};

export type LeaderboardDataOptions = {
  game?: string | null;
  type?: string | null;
  season?: string | null;
  limit?: number;
};

type ResultStat = {
  tournamentResults: number;
  bestPlacement: number | null;
};

function parseLeaderboardType(value: string | null | undefined): LeaderboardType {
  return value === "teams" ? "teams" : "players";
}

function parseSeasonScope(value: string | null | undefined): LeaderboardSeasonScope {
  return value === "all" || value === "lifetime" ? "all" : "current";
}

function parseSnapshotUserIds(snapshotMembers: unknown) {
  if (!Array.isArray(snapshotMembers)) {
    return [];
  }

  return Array.from(
    new Set(
      snapshotMembers
        .map((member) => {
          if (!member || typeof member !== "object" || Array.isArray(member)) {
            return null;
          }

          const userId = (member as Record<string, unknown>).userId;
          return typeof userId === "string" ? userId : null;
        })
        .filter((userId): userId is string => Boolean(userId)),
    ),
  );
}

function buildTournamentResultWhere(input: {
  seasonId?: string;
  gameId?: string;
}): Prisma.TournamentResultWhereInput {
  return {
    tournament: {
      ...(input.seasonId ? { seasonId: input.seasonId } : {}),
      ...(input.gameId ? { gameId: input.gameId } : {}),
    },
  };
}

function addResultStat(
  map: Map<string, ResultStat>,
  id: string,
  placement: number,
) {
  const existing = map.get(id) ?? {
    tournamentResults: 0,
    bestPlacement: null,
  };

  existing.tournamentResults += 1;
  existing.bestPlacement =
    existing.bestPlacement === null
      ? placement
      : Math.min(existing.bestPlacement, placement);

  map.set(id, existing);
}

export async function getLeaderboardGames(): Promise<LeaderboardGameOption[]> {
  return prisma.game.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

export function resolveLeaderboardGame(
  value: string | null | undefined,
  games: LeaderboardGameOption[],
) {
  if (!value || value === "Overall" || value === "overall") {
    return null;
  }

  return (
    games.find((game) => game.slug === value || game.name === value) ?? null
  );
}

async function getLeaderboardSeason(scope: LeaderboardSeasonScope) {
  if (scope === "all") {
    return { activeSeason: null, seasonId: undefined };
  }

  const activeSeason = await getActiveRankingSeason();
  return {
    activeSeason,
    seasonId: activeSeason?.id ?? "__no_active_ranking_season__",
  };
}

async function getTeamResultStats(input: {
  teamIds: string[];
  seasonId?: string;
  gameId?: string;
}) {
  const stats = new Map<string, ResultStat>();

  if (input.teamIds.length === 0) {
    return stats;
  }

  const results = await prisma.tournamentResult.findMany({
    where: {
      teamId: { in: input.teamIds },
      ...buildTournamentResultWhere(input),
    },
    select: {
      teamId: true,
      placement: true,
    },
  });

  for (const result of results) {
    addResultStat(stats, result.teamId, result.placement);
  }

  return stats;
}

async function getPlayerResultStats(input: {
  userIds: string[];
  seasonId?: string;
  gameId?: string;
}) {
  const stats = new Map<string, ResultStat>();
  const userIds = new Set(input.userIds);

  if (userIds.size === 0) {
    return stats;
  }

  const results = await prisma.tournamentResult.findMany({
    where: buildTournamentResultWhere(input),
    select: {
      placement: true,
      snapshotMembers: true,
    },
  });

  for (const result of results) {
    for (const userId of parseSnapshotUserIds(result.snapshotMembers)) {
      if (userIds.has(userId)) {
        addResultStat(stats, userId, result.placement);
      }
    }
  }

  return stats;
}

async function getTeamDetails(teamIds: string[]) {
  if (teamIds.length === 0) {
    return new Map<
      string,
      { leaderName: string | null; membersCount: number }
    >();
  }

  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: {
      id: true,
      leader: { select: { username: true } },
      _count: { select: { members: true } },
    },
  });

  return new Map(
    teams.map((team) => [
      team.id,
      {
        leaderName: team.leader.username,
        membersCount: team._count.members,
      },
    ]),
  );
}

export async function getLeaderboardData(options: LeaderboardDataOptions) {
  const type = parseLeaderboardType(options.type);
  const scope = parseSeasonScope(options.season);
  const games = await getLeaderboardGames();
  const selectedGame = resolveLeaderboardGame(options.game, games);
  const { activeSeason, seasonId } = await getLeaderboardSeason(scope);
  const rankingFilters = {
    seasonId,
    gameId: selectedGame?.id,
    limit: options.limit,
  };

  if (type === "teams") {
    const leaderboard = await aggregateTeamLeaderboard(rankingFilters);
    const teamIds = leaderboard.map((entry) => entry.teamId);
    const [resultStats, teamDetails] = await Promise.all([
      getTeamResultStats({
        teamIds,
        seasonId,
        gameId: selectedGame?.id,
      }),
      getTeamDetails(teamIds),
    ]);

    const teams: LeaderboardTeam[] = leaderboard.map((entry) => {
      const stats = resultStats.get(entry.teamId);
      const details = teamDetails.get(entry.teamId);

      return {
        id: entry.teamId,
        name: entry.team?.name ?? "Unknown team",
        game: entry.team?.game?.name ?? null,
        leaderName: details?.leaderName ?? null,
        membersCount: details?.membersCount ?? 0,
        tournamentPoints: entry.totalPoints,
        tournamentResults: stats?.tournamentResults ?? 0,
        bestPlacement: stats?.bestPlacement ?? null,
        rank: entry.rank,
        tier: entry.tier.name,
      };
    });

    return {
      type,
      scope,
      activeSeason,
      selectedGame,
      games,
      data: teams,
    };
  }

  const leaderboard = await aggregatePlayerLeaderboard(rankingFilters);
  const userIds = leaderboard.map((entry) => entry.userId);
  const resultStats = await getPlayerResultStats({
    userIds,
    seasonId,
    gameId: selectedGame?.id,
  });

  const players: LeaderboardUser[] = leaderboard.map((entry) => {
    const stats = resultStats.get(entry.userId);

    return {
      id: entry.userId,
      username: entry.user?.username ?? "Unknown player",
      avatar: entry.user?.avatar ?? null,
      role: "player",
      tournamentPoints: entry.totalPoints,
      tournamentResults: stats?.tournamentResults ?? 0,
      bestPlacement: stats?.bestPlacement ?? null,
      rank: entry.rank,
      tier: entry.tier.name,
    };
  });

  return {
    type,
    scope,
    activeSeason,
    selectedGame,
    games,
    data: players,
  };
}
