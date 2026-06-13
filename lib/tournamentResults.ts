import { revalidatePath } from "next/cache";
import { MatchStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  createOrGetDefaultRankingSeason,
  createPointEvent,
} from "@/lib/ranking/rankingService";
import { createRealtimeEvent } from "@/lib/realtime";
import { dispatchRealtimeEventSoon } from "@/lib/realtime/dispatchRealtime";

const scoringDefaults = {
  participation: 10,
  matchWin: 8,
  placements: {
    1: 120,
    2: 75,
    3: 45,
    4: 25,
  },
  forfeitLoss: -15,
  noShow: -25,
  disqualification: -50,
} as const;

type AwardResult =
  | {
      ok: true;
      skipped: false;
      tournamentId: string;
      placements: TournamentPlacement[];
      teamPointEvents: number;
      playerPointEvents: number;
    }
  | {
      ok: true;
      skipped: true;
      tournamentId: string;
      reason: string;
    }
  | {
      ok: false;
      tournamentId: string;
      error: string;
    };

type AwardTournamentResultsOptions = {
  revalidateViews?: boolean;
};

type TournamentForAwarding = {
  id: string;
  title: string;
  format: string;
  gameId: string | null;
  seasonId: string | null;
  game: { name: string } | null;
};

type FinalMatchInput = {
  id: string;
  tournamentId: string;
  teamAId: string | null;
  teamBId: string | null;
  winnerTeamId: string | null;
  nextMatchId: string | null;
  status: MatchStatus;
};

type SemifinalMatchInput = {
  id: string;
  teamAId: string | null;
  teamBId: string | null;
  winnerTeamId: string | null;
};

export type TournamentPlacement = {
  teamId: string;
  placement: 1 | 2 | 3 | 4;
};

type TeamSnapshot = {
  teamId: string;
  teamName: string;
  gameName: string | null;
  snapshotMembers?: Prisma.InputJsonValue;
};

type TeamPointEventInput = {
  tournament: TournamentForAwarding;
  seasonId: string;
  teamId: string;
  points: number;
  type: string;
  reason: string;
  dedupeKey: string;
  metadata: Prisma.InputJsonValue;
  matchId?: string | null;
};

type PlayerPointEventInput = TeamPointEventInput & {
  snapshotMembers?: Prisma.InputJsonValue;
};

function getLoserTeamId(match: {
  teamAId: string | null;
  teamBId: string | null;
  winnerTeamId: string | null;
}) {
  if (!match.teamAId || !match.teamBId || !match.winnerTeamId) {
    return null;
  }

  if (match.winnerTeamId === match.teamAId) {
    return match.teamBId;
  }

  if (match.winnerTeamId === match.teamBId) {
    return match.teamAId;
  }

  return null;
}

export function buildFinalPlacements(
  finalMatch: FinalMatchInput | null,
  semifinalMatches: SemifinalMatchInput[] = [],
): TournamentPlacement[] {
  if (
    !finalMatch ||
    finalMatch.status !== MatchStatus.completed ||
    finalMatch.nextMatchId !== null ||
    !finalMatch.winnerTeamId
  ) {
    return [];
  }

  const finalLoserTeamId = getLoserTeamId(finalMatch);
  if (!finalLoserTeamId) {
    return [];
  }

  const placements: TournamentPlacement[] = [
    { teamId: finalMatch.winnerTeamId, placement: 1 },
    { teamId: finalLoserTeamId, placement: 2 },
  ];

  const semifinalLosers = semifinalMatches
    .map((match) => getLoserTeamId(match))
    .filter((teamId): teamId is string => Boolean(teamId));
  const uniqueSemifinalLosers = Array.from(new Set(semifinalLosers));

  if (semifinalMatches.length === 2 && uniqueSemifinalLosers.length === 2) {
    placements.push(
      ...uniqueSemifinalLosers.map((teamId) => ({
        teamId,
        placement: 3 as const,
      })),
    );
  }

  return placements;
}

export function getPlacementPoints(placement: number, multiplier = 1) {
  const basePoints =
    scoringDefaults.placements[
      placement as keyof typeof scoringDefaults.placements
    ] ?? 0;

  return Math.round(basePoints * multiplier);
}

export function getTournamentPlacementLabel(placement: number): string {
  const n = Math.max(1, Math.floor(placement));
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

export async function getFinalMatch(tournamentId: string) {
  return prisma.tournamentMatch.findFirst({
    where: {
      tournamentId,
      nextMatchId: null,
      status: MatchStatus.completed,
    },
    orderBy: [{ roundNumber: "desc" }, { matchNumber: "asc" }],
    select: {
      id: true,
      tournamentId: true,
      teamAId: true,
      teamBId: true,
      winnerTeamId: true,
      nextMatchId: true,
      status: true,
    },
  });
}

export async function getSemifinalLosers(
  tournamentId: string,
  finalMatchId: string,
) {
  const semifinalMatches = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      nextMatchId: finalMatchId,
      status: MatchStatus.completed,
    },
    select: {
      id: true,
      teamAId: true,
      teamBId: true,
      winnerTeamId: true,
    },
    orderBy: [{ roundNumber: "asc" }, { matchNumber: "asc" }],
  });

  return semifinalMatches
    .map((match) => getLoserTeamId(match))
    .filter((teamId): teamId is string => Boolean(teamId));
}

export async function getFinalPlacements(tournamentId: string) {
  const finalMatch = await getFinalMatch(tournamentId);
  if (!finalMatch) {
    return [];
  }

  const semifinalMatches = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      nextMatchId: finalMatch.id,
      status: MatchStatus.completed,
    },
    select: {
      id: true,
      teamAId: true,
      teamBId: true,
      winnerTeamId: true,
    },
    orderBy: [{ roundNumber: "asc" }, { matchNumber: "asc" }],
  });

  return buildFinalPlacements(finalMatch, semifinalMatches);
}

export function getTournamentPointMultiplier(_tournament: TournamentForAwarding) {
  // TODO: Use configurable tournament tiers when the tournament model exposes one.
  return 1;
}

function extractSnapshotUserIds(snapshotMembers: unknown) {
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

function getSnapshotMembersValue(value: unknown) {
  return Array.isArray(value) ? (value as Prisma.InputJsonValue) : undefined;
}

function revalidateAwardViews(tournamentId: string) {
  revalidatePath("/leaderboard");
  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/profile");
  revalidatePath("/admin");
  revalidatePath(`/admin/tournaments/${tournamentId}`);
}

async function publishAwardRealtimeEvents(tournamentId: string) {
  await Promise.all([
    createRealtimeEvent({
      type: "tournament.result.updated",
      audience: "public",
      entityType: "tournament",
      entityId: tournamentId,
      payload: { tournamentId },
    }),
    createRealtimeEvent({
      type: "leaderboard.updated",
      audience: "public",
      entityType: "leaderboard",
      entityId: "global",
      payload: { tournamentId },
    }),
    createRealtimeEvent({
      type: "profile.updated",
      audience: "public",
      entityType: "profile",
      entityId: "results",
      payload: { tournamentId },
    }),
  ]);

  // RC2 pilots (Batches 1R + 2A) — ONLY leaderboard.updated and
  // tournament.result.updated. Additive and flag-gated (no-op unless
  // REALTIME_ENABLE_SOCKET === "true"). The helper schedules each emit via
  // Next.js after() so the serverless instance stays alive until it settles,
  // without blocking this response. The DB RealtimeEvents above remain the
  // source of truth; these never throw and cannot affect the award mutation.
  // Minimal, ID-only payloads. The manual inline-save admin path
  // (adminTournamentResultActions) intentionally remains polling-only.
  dispatchRealtimeEventSoon({
    type: "leaderboard.updated",
    audience: "public",
    entityType: "leaderboard",
    entityId: "global",
    payload: { tournamentId },
  });
  dispatchRealtimeEventSoon({
    type: "tournament.result.updated",
    audience: "public",
    entityType: "tournament",
    entityId: tournamentId,
    payload: { tournamentId },
  });
}

async function upsertTournamentResult(input: {
  tournament: TournamentForAwarding;
  teamSnapshot: TeamSnapshot;
  placement: TournamentPlacement["placement"];
  points: number;
}) {
  const note = "Auto-awarded from completed bracket final.";
  const snapshotData =
    input.teamSnapshot.snapshotMembers !== undefined
      ? { snapshotMembers: input.teamSnapshot.snapshotMembers }
      : {};

  return prisma.tournamentResult.upsert({
    where: {
      tournamentId_teamId: {
        tournamentId: input.tournament.id,
        teamId: input.teamSnapshot.teamId,
      },
    },
    create: {
      tournamentId: input.tournament.id,
      teamId: input.teamSnapshot.teamId,
      placement: input.placement,
      points: input.points,
      note,
      snapshotTeamName: input.teamSnapshot.teamName,
      snapshotTeamGame: input.teamSnapshot.gameName,
      ...snapshotData,
    },
    update: {
      placement: input.placement,
      points: input.points,
      note,
      snapshotTeamName: input.teamSnapshot.teamName,
      snapshotTeamGame: input.teamSnapshot.gameName,
      ...snapshotData,
    },
  });
}

async function awardTeamPointEvent(input: TeamPointEventInput) {
  await createPointEvent({
    teamId: input.teamId,
    gameId: input.tournament.gameId,
    tournamentId: input.tournament.id,
    matchId: input.matchId ?? null,
    seasonId: input.seasonId,
    points: input.points,
    type: input.type,
    reason: input.reason,
    metadata: input.metadata,
    dedupeKey: input.dedupeKey,
  });
}

async function awardPlayerPointEventsFromSnapshot(input: PlayerPointEventInput) {
  const userIds = extractSnapshotUserIds(input.snapshotMembers);

  if (userIds.length === 0) {
    // TODO: Award player points from locked rosters if registration snapshots are unavailable.
    return 0;
  }

  await Promise.all(
    userIds.map((userId) =>
      createPointEvent({
        userId,
        gameId: input.tournament.gameId,
        tournamentId: input.tournament.id,
        matchId: input.matchId ?? null,
        seasonId: input.seasonId,
        points: input.points,
        type: input.type,
        reason: input.reason,
        metadata: {
          ...(input.metadata as Record<string, unknown>),
          teamId: input.teamId,
        },
        dedupeKey: `${input.dedupeKey}:user:${userId}`,
      }),
    ),
  );

  return userIds.length;
}

function makeTeamEventKey(input: {
  tournamentId: string;
  teamId: string;
  kind: string;
  placement?: number;
  matchId?: string;
}) {
  const parts = [
    "ranking",
    "tournament",
    input.tournamentId,
    "team",
    input.teamId,
    input.kind,
  ];

  if (input.placement) {
    parts.push(String(input.placement));
  }

  if (input.matchId) {
    parts.push("match", input.matchId);
  }

  return parts.join(":");
}

async function getApprovedRegistrationSnapshots(tournamentId: string) {
  const registrations = await prisma.tournamentRegistration.findMany({
    where: {
      tournamentId,
      status: "approved",
    },
    select: {
      teamId: true,
      snapshotTeamName: true,
      snapshotTeamGame: true,
      snapshotMembers: true,
      team: {
        select: {
          id: true,
          name: true,
          game: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return new Map(
    registrations.map((registration) => [
      registration.teamId,
      {
        teamId: registration.teamId,
        teamName: registration.snapshotTeamName ?? registration.team.name,
        gameName:
          registration.snapshotTeamGame ?? registration.team.game?.name ?? null,
        snapshotMembers: getSnapshotMembersValue(registration.snapshotMembers),
      },
    ]),
  );
}

async function getTeamSnapshots(input: {
  tournament: TournamentForAwarding;
  teamIds: string[];
  registrationSnapshots: Map<string, TeamSnapshot>;
}) {
  const teams = await prisma.team.findMany({
    where: { id: { in: input.teamIds } },
    select: {
      id: true,
      name: true,
      game: {
        select: {
          name: true,
        },
      },
    },
  });

  return new Map(
    teams.map((team) => {
      const registrationSnapshot = input.registrationSnapshots.get(team.id);

      return [
        team.id,
        registrationSnapshot ?? {
          teamId: team.id,
          teamName: team.name,
          gameName: team.game?.name ?? input.tournament.game?.name ?? null,
        },
      ];
    }),
  );
}

function getMatchWinPoints(multiplier: number) {
  return Math.round(scoringDefaults.matchWin * multiplier);
}

function getParticipationPoints(multiplier: number) {
  return Math.round(scoringDefaults.participation * multiplier);
}

export async function awardTournamentResultsAndPoints(
  tournamentId: string,
  options: AwardTournamentResultsOptions = {},
): Promise<AwardResult> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      title: true,
      format: true,
      gameId: true,
      seasonId: true,
      game: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!tournament) {
    return {
      ok: false,
      tournamentId,
      error: "Tournament was not found.",
    };
  }

  if (tournament.format !== "single_elimination") {
    return {
      ok: true,
      skipped: true,
      tournamentId,
      reason: "unsupported_format",
    };
  }

  const finalMatch = await getFinalMatch(tournamentId);
  if (!finalMatch) {
    return {
      ok: true,
      skipped: true,
      tournamentId,
      reason: "completed_final_not_found",
    };
  }

  const semifinalMatches = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      nextMatchId: finalMatch.id,
      status: MatchStatus.completed,
    },
    select: {
      id: true,
      teamAId: true,
      teamBId: true,
      winnerTeamId: true,
    },
    orderBy: [{ roundNumber: "asc" }, { matchNumber: "asc" }],
  });
  const placements = buildFinalPlacements(finalMatch, semifinalMatches);

  if (placements.length === 0) {
    return {
      ok: true,
      skipped: true,
      tournamentId,
      reason: "safe_placements_not_found",
    };
  }

  const seasonId =
    tournament.seasonId ?? (await createOrGetDefaultRankingSeason()).id;
  const multiplier = getTournamentPointMultiplier(tournament);
  const registrationSnapshots =
    await getApprovedRegistrationSnapshots(tournamentId);
  const completedWins = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      status: MatchStatus.completed,
      isBye: false,
      winnerTeamId: { not: null },
    },
    select: {
      id: true,
      winnerTeamId: true,
    },
  });

  const teamIds = Array.from(
    new Set([
      ...placements.map((placement) => placement.teamId),
      ...Array.from(registrationSnapshots.keys()),
      ...completedWins
        .map((match) => match.winnerTeamId)
        .filter((teamId): teamId is string => Boolean(teamId)),
    ]),
  );
  const teamSnapshots = await getTeamSnapshots({
    tournament,
    teamIds,
    registrationSnapshots,
  });

  let teamPointEvents = 0;
  let playerPointEvents = 0;

  for (const placement of placements) {
    const teamSnapshot = teamSnapshots.get(placement.teamId);
    if (!teamSnapshot) {
      continue;
    }

    const points = getPlacementPoints(placement.placement, multiplier);

    await upsertTournamentResult({
      tournament,
      teamSnapshot,
      placement: placement.placement,
      points,
    });

    const dedupeKey = makeTeamEventKey({
      tournamentId,
      teamId: placement.teamId,
      kind: "placement",
      placement: placement.placement,
    });
    const metadata = {
      tournamentId,
      teamId: placement.teamId,
      placement: placement.placement,
      basePoints:
        scoringDefaults.placements[
          placement.placement as keyof typeof scoringDefaults.placements
        ],
      multiplier,
    };

    await awardTeamPointEvent({
      tournament,
      seasonId,
      teamId: placement.teamId,
      points,
      type: "tournament.placement",
      reason: `Tournament placement #${placement.placement}`,
      dedupeKey,
      metadata,
    });
    teamPointEvents += 1;
    playerPointEvents += await awardPlayerPointEventsFromSnapshot({
      tournament,
      seasonId,
      teamId: placement.teamId,
      points,
      type: "tournament.placement",
      reason: `Tournament placement #${placement.placement}`,
      dedupeKey,
      metadata,
      snapshotMembers: teamSnapshot.snapshotMembers,
    });
  }

  for (const [teamId, teamSnapshot] of registrationSnapshots) {
    const points = getParticipationPoints(multiplier);
    const dedupeKey = makeTeamEventKey({
      tournamentId,
      teamId,
      kind: "participation",
    });
    const metadata = {
      tournamentId,
      teamId,
      basePoints: scoringDefaults.participation,
      multiplier,
    };

    await awardTeamPointEvent({
      tournament,
      seasonId,
      teamId,
      points,
      type: "tournament.participation",
      reason: "Tournament participation",
      dedupeKey,
      metadata,
    });
    teamPointEvents += 1;
    playerPointEvents += await awardPlayerPointEventsFromSnapshot({
      tournament,
      seasonId,
      teamId,
      points,
      type: "tournament.participation",
      reason: "Tournament participation",
      dedupeKey,
      metadata,
      snapshotMembers: teamSnapshot.snapshotMembers,
    });
  }

  for (const match of completedWins) {
    if (!match.winnerTeamId) {
      continue;
    }

    const teamSnapshot = teamSnapshots.get(match.winnerTeamId);
    if (!teamSnapshot) {
      continue;
    }

    const points = getMatchWinPoints(multiplier);
    const dedupeKey = makeTeamEventKey({
      tournamentId,
      teamId: match.winnerTeamId,
      kind: "match_win",
      matchId: match.id,
    });
    const metadata = {
      tournamentId,
      matchId: match.id,
      teamId: match.winnerTeamId,
      basePoints: scoringDefaults.matchWin,
      multiplier,
    };

    await awardTeamPointEvent({
      tournament,
      seasonId,
      teamId: match.winnerTeamId,
      points,
      type: "tournament.match_win",
      reason: "Tournament match win",
      dedupeKey,
      metadata,
      matchId: match.id,
    });
    teamPointEvents += 1;
    playerPointEvents += await awardPlayerPointEventsFromSnapshot({
      tournament,
      seasonId,
      teamId: match.winnerTeamId,
      points,
      type: "tournament.match_win",
      reason: "Tournament match win",
      dedupeKey,
      metadata,
      matchId: match.id,
      snapshotMembers: teamSnapshot.snapshotMembers,
    });
  }

  await publishAwardRealtimeEvents(tournamentId);
  if (options.revalidateViews ?? true) {
    revalidateAwardViews(tournamentId);
  }

  return {
    ok: true,
    skipped: false,
    tournamentId,
    placements,
    teamPointEvents,
    playerPointEvents,
  };
}
