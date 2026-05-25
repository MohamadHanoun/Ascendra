import { revalidatePath } from "next/cache";
import { MatchStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";
import { awardTournamentResultsAndPoints } from "@/lib/tournamentResults";

import type { JobRunResult, SyncConfig } from "./types";

const BATCH_SIZE = 100;
const TERMINAL_CANCELLED_STATUS = "cancelled";
const ENDED_STATUS = "ended";
const OPEN_STATUS = "open";
const CLOSED_STATUS = "closed";

type TournamentLifecycleInput = {
  id: string;
  status: string;
  registrationStatus: string;
  registrationOpensAt: Date | null;
  registrationClosesAt: Date | null;
  startsAt: Date | null;
  endsAt: Date | null;
  endedAt: Date | null;
  tournamentMatches: Array<{
    id: string;
  }>;
};

type TournamentLifecycleUpdate = {
  status?: string;
  registrationStatus?: string;
  endedAt?: Date;
};

function makeResult(): JobRunResult {
  return {
    ok: true,
    job: "syncTournamentLifecycle",
    processed: 0,
    failed: 0,
    skipped: 0,
    durationMs: 0,
    errors: [],
  };
}

function isAtOrAfter(now: Date, date: Date | null) {
  return Boolean(date && now.getTime() >= date.getTime());
}

function isBefore(now: Date, date: Date | null) {
  return Boolean(date && now.getTime() < date.getTime());
}

function hasCompletedFinalMatch(tournament: TournamentLifecycleInput) {
  return tournament.tournamentMatches.length > 0;
}

export function getTournamentLifecycleUpdate(
  tournament: TournamentLifecycleInput,
  now = new Date(),
): TournamentLifecycleUpdate | null {
  if (tournament.status === TERMINAL_CANCELLED_STATUS) {
    return null;
  }

  const update: TournamentLifecycleUpdate = {};
  const shouldEnd =
    tournament.status === ENDED_STATUS ||
    isAtOrAfter(now, tournament.endsAt) ||
    hasCompletedFinalMatch(tournament);

  if (shouldEnd) {
    if (tournament.status !== ENDED_STATUS) {
      update.status = ENDED_STATUS;
    }

    if (tournament.registrationStatus !== CLOSED_STATUS) {
      update.registrationStatus = CLOSED_STATUS;
    }

    if (!tournament.endedAt) {
      update.endedAt = now;
    }

    return Object.keys(update).length > 0 ? update : null;
  }

  if (
    isAtOrAfter(now, tournament.registrationClosesAt) &&
    tournament.registrationStatus !== CLOSED_STATUS
  ) {
    update.registrationStatus = CLOSED_STATUS;
  } else if (
    isAtOrAfter(now, tournament.registrationOpensAt) &&
    (!tournament.registrationClosesAt ||
      isBefore(now, tournament.registrationClosesAt)) &&
    tournament.registrationStatus !== OPEN_STATUS
  ) {
    update.registrationStatus = OPEN_STATUS;
  }

  if (
    isAtOrAfter(now, tournament.startsAt) &&
    tournament.status !== OPEN_STATUS
  ) {
    update.status = OPEN_STATUS;
  }

  return Object.keys(update).length > 0 ? update : null;
}

function revalidateTournamentViews(tournamentId: string) {
  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/tournaments/${tournamentId}`);
}

async function publishLifecycleEvents(
  tournament: TournamentLifecycleInput,
  update: TournamentLifecycleUpdate,
) {
  const events: Promise<void>[] = [];

  if (update.status && update.status !== tournament.status) {
    events.push(
      createRealtimeEvent({
        type: "tournament.status.updated",
        audience: "public",
        entityType: "tournament",
        entityId: tournament.id,
        payload: {
          tournamentId: tournament.id,
          status: update.status,
        },
      }),
    );
  }

  if (
    update.registrationStatus &&
    update.registrationStatus !== tournament.registrationStatus
  ) {
    events.push(
      createRealtimeEvent({
        type: "tournament.registrationStatus.updated",
        audience: "public",
        entityType: "tournament",
        entityId: tournament.id,
        payload: {
          tournamentId: tournament.id,
          registrationStatus: update.registrationStatus,
        },
      }),
    );
  }

  await Promise.all(events);
}

export async function syncTournamentLifecycle(
  config: Pick<SyncConfig, "batchSize"> = {},
): Promise<JobRunResult> {
  const start = Date.now();
  const now = new Date();
  const result = makeResult();
  const batchSize = config.batchSize ?? BATCH_SIZE;

  const tournaments = await prisma.tournament.findMany({
    where: {
      status: { not: TERMINAL_CANCELLED_STATUS },
      OR: [
        {
          status: { notIn: [ENDED_STATUS] },
          registrationOpensAt: { lte: now },
          registrationStatus: { not: OPEN_STATUS },
          OR: [
            { registrationClosesAt: null },
            { registrationClosesAt: { gt: now } },
          ],
        },
        {
          registrationClosesAt: { lte: now },
          registrationStatus: { not: CLOSED_STATUS },
        },
        {
          startsAt: { lte: now },
          status: { notIn: [OPEN_STATUS, ENDED_STATUS] },
        },
        {
          endsAt: { lte: now },
          OR: [
            { status: { not: ENDED_STATUS } },
            { registrationStatus: { not: CLOSED_STATUS } },
            { endedAt: null },
          ],
        },
        {
          tournamentMatches: {
            some: {
              nextMatchId: null,
              status: MatchStatus.completed,
            },
          },
          OR: [
            { status: { not: ENDED_STATUS } },
            { registrationStatus: { not: CLOSED_STATUS } },
            { endedAt: null },
          ],
        },
        {
          status: ENDED_STATUS,
          OR: [{ registrationStatus: { not: CLOSED_STATUS } }, { endedAt: null }],
        },
      ],
    },
    select: {
      id: true,
      status: true,
      registrationStatus: true,
      registrationOpensAt: true,
      registrationClosesAt: true,
      startsAt: true,
      endsAt: true,
      endedAt: true,
      tournamentMatches: {
        where: {
          nextMatchId: null,
          status: MatchStatus.completed,
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
    orderBy: { updatedAt: "asc" },
    take: batchSize,
  });

  for (const tournament of tournaments) {
    const update = getTournamentLifecycleUpdate(tournament, now);

    if (!update) {
      result.skipped += 1;
      continue;
    }

    try {
      if (hasCompletedFinalMatch(tournament)) {
        const awardResult = await awardTournamentResultsAndPoints(tournament.id);
        if (!awardResult.ok) {
          throw new Error(awardResult.error);
        }
      }

      await prisma.tournament.update({
        where: { id: tournament.id },
        data: update,
      });

      await publishLifecycleEvents(tournament, update);
      revalidateTournamentViews(tournament.id);
      result.processed += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "unexpected_error";
      result.failed += 1;
      result.errors.push(`tournament:${tournament.id}: ${message}`);
    }
  }

  result.ok = result.failed === 0;
  result.durationMs = Date.now() - start;
  return result;
}
