import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  calculateCompetitionRanks,
  getTierFromPoints,
  type RankingTier,
} from "@/lib/ranking/rankingUtils";

const defaultSeasonSlug = "default";
const defaultSeasonStart = new Date("1970-01-01T00:00:00.000Z");
const defaultSeasonEnd = new Date("9999-12-31T23:59:59.999Z");

export type RankingLeaderboardFilters = {
  seasonId?: string | null;
  gameId?: string | null;
  limit?: number;
};

export type CreatePointEventInput = {
  teamId?: string | null;
  userId?: string | null;
  gameId?: string | null;
  tournamentId?: string | null;
  matchId?: string | null;
  seasonId?: string | null;
  points: number;
  type: string;
  reason?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  dedupeKey: string;
};

export type TeamLeaderboardEntry = {
  teamId: string;
  totalPoints: number;
  eventCount: number;
  rank: number;
  tier: RankingTier;
  team: {
    id: string;
    name: string;
    gameId: string | null;
    game: { id: string; name: string; slug: string } | null;
  } | null;
};

export type PlayerLeaderboardEntry = {
  userId: string;
  totalPoints: number;
  eventCount: number;
  rank: number;
  tier: RankingTier;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    discordId: string;
  } | null;
};

function buildPointEventWhere(
  filters: RankingLeaderboardFilters,
): Prisma.RankingPointEventWhereInput {
  return {
    ...(filters.seasonId ? { seasonId: filters.seasonId } : {}),
    ...(filters.gameId ? { gameId: filters.gameId } : {}),
  };
}

function normalizeLimit(limit: number | undefined) {
  if (!limit) {
    return undefined;
  }

  return Math.max(1, Math.min(500, Math.floor(limit)));
}

function toNullableJson(value: Prisma.InputJsonValue | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  return value === null ? Prisma.JsonNull : value;
}

export async function getActiveRankingSeason() {
  return prisma.rankingSeason.findFirst({
    where: { isActive: true },
    orderBy: { startsAt: "desc" },
  });
}

export async function createOrGetDefaultRankingSeason() {
  const activeSeason = await getActiveRankingSeason();

  if (activeSeason) {
    return activeSeason;
  }

  return prisma.rankingSeason.upsert({
    where: { slug: defaultSeasonSlug },
    update: { isActive: true },
    create: {
      name: "Default Season",
      slug: defaultSeasonSlug,
      startsAt: defaultSeasonStart,
      endsAt: defaultSeasonEnd,
      isActive: true,
    },
  });
}

export async function createPointEvent(input: CreatePointEventInput) {
  return prisma.rankingPointEvent.upsert({
    where: { dedupeKey: input.dedupeKey },
    update: {},
    create: {
      teamId: input.teamId ?? undefined,
      userId: input.userId ?? undefined,
      gameId: input.gameId ?? undefined,
      tournamentId: input.tournamentId ?? undefined,
      matchId: input.matchId ?? undefined,
      seasonId: input.seasonId ?? undefined,
      points: input.points,
      type: input.type,
      reason: input.reason ?? undefined,
      metadata: toNullableJson(input.metadata),
      dedupeKey: input.dedupeKey,
    },
  });
}

export async function aggregateTeamLeaderboard(
  filters: RankingLeaderboardFilters = {},
): Promise<TeamLeaderboardEntry[]> {
  const groupedEvents = await prisma.rankingPointEvent.groupBy({
    by: ["teamId"],
    where: {
      ...buildPointEventWhere(filters),
      teamId: { not: null },
    },
    _sum: { points: true },
    _count: { _all: true },
    orderBy: {
      _sum: {
        points: "desc",
      },
    },
    take: normalizeLimit(filters.limit),
  });

  const rankedEntries = calculateCompetitionRanks(
    groupedEvents.map((event) => ({
      teamId: event.teamId!,
      totalPoints: event._sum.points ?? 0,
      eventCount: event._count._all,
    })),
  );

  const teams =
    rankedEntries.length > 0
      ? await prisma.team.findMany({
          where: { id: { in: rankedEntries.map((entry) => entry.teamId) } },
          select: {
            id: true,
            name: true,
            gameId: true,
            game: { select: { id: true, name: true, slug: true } },
          },
        })
      : [];
  const teamById = new Map(teams.map((team) => [team.id, team]));

  return rankedEntries.map((entry) => ({
    ...entry,
    tier: getTierFromPoints(entry.totalPoints),
    team: teamById.get(entry.teamId) ?? null,
  }));
}

export async function aggregatePlayerLeaderboard(
  filters: RankingLeaderboardFilters = {},
): Promise<PlayerLeaderboardEntry[]> {
  const groupedEvents = await prisma.rankingPointEvent.groupBy({
    by: ["userId"],
    where: {
      ...buildPointEventWhere(filters),
      userId: { not: null },
    },
    _sum: { points: true },
    _count: { _all: true },
    orderBy: {
      _sum: {
        points: "desc",
      },
    },
    take: normalizeLimit(filters.limit),
  });

  const rankedEntries = calculateCompetitionRanks(
    groupedEvents.map((event) => ({
      userId: event.userId!,
      totalPoints: event._sum.points ?? 0,
      eventCount: event._count._all,
    })),
  );

  const users =
    rankedEntries.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: rankedEntries.map((entry) => entry.userId) } },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            discordId: true,
          },
        })
      : [];
  const userById = new Map(users.map((user) => [user.id, user]));

  return rankedEntries.map((entry) => ({
    ...entry,
    tier: getTierFromPoints(entry.totalPoints),
    user: userById.get(entry.userId) ?? null,
  }));
}
