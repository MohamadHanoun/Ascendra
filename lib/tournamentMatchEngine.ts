import {
  AuditStatus,
  GameProvider,
  MatchGameStatus,
  MatchStatus,
  Prisma,
  ReportStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";
import { isSupportedTournamentFormat } from "@/lib/tournamentFormatSupport";
import {
  notifyBracketAdvanced,
  notifyManualResultSubmitted,
  notifyMatchConfirmed,
  notifyMatchDisputed,
  notifyMatchScheduled,
} from "@/lib/matchNotifications";
import { awardTournamentResultsAndPoints } from "@/lib/tournamentResults";

export type EngineResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function ok<T>(data: T): EngineResult<T> {
  return { ok: true, data };
}

function fail<T = never>(error: string): EngineResult<T> {
  return { ok: false, error };
}

async function writeAudit(input: {
  provider?: GameProvider;
  action: string;
  request?: Prisma.InputJsonValue;
  response?: Prisma.InputJsonValue;
  status: AuditStatus;
  error?: string | null;
}) {
  try {
    await prisma.gameApiAuditLog.create({
      data: {
        provider: input.provider ?? GameProvider.manual,
        action: input.action,
        request: input.request,
        response: input.response,
        status: input.status,
        error: input.error ?? null,
      },
    });
  } catch (error) {
    console.error("[matchEngine] Failed to write audit log:", error);
  }
}

async function emitMatchEvent(
  type: string,
  matchId: string,
  tournamentId: string,
  audience: "public" | "admin" = "public",
  extra?: Record<string, unknown>,
) {
  await createRealtimeEvent({
    type,
    audience,
    entityType: "tournamentMatch",
    entityId: matchId,
    payload: {
      tournamentId,
      matchId,
      ...(extra ?? {}),
    },
  });
}

async function awardFinalTournamentResults(tournamentId: string) {
  try {
    const result = await awardTournamentResultsAndPoints(tournamentId);

    if (!result.ok) {
      await writeAudit({
        action: "tournament.results.award",
        request: { tournamentId },
        status: AuditStatus.failure,
        error: result.error,
      });
    }
  } catch (error) {
    await writeAudit({
      action: "tournament.results.award",
      request: { tournamentId },
      status: AuditStatus.failure,
      error: error instanceof Error ? error.message : "unexpected_error",
    });
  }
}

// ─── Bracket Generation ──────────────────────────────────────────────────────

type BracketSeed = {
  teamId: string | null;
};

function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  let power = 1;
  while (power < n) power *= 2;
  return power;
}

function buildSingleEliminationSeeds(teamIds: string[]): BracketSeed[] {
  const slotCount = nextPowerOfTwo(Math.max(teamIds.length, 2));
  const seeds: BracketSeed[] = [];

  for (let index = 0; index < slotCount; index += 1) {
    seeds.push({ teamId: teamIds[index] ?? null });
  }

  return seeds;
}

export async function createMatchesForTournament(
  tournamentId: string,
): Promise<
  EngineResult<{ created: number; rounds: number; totalMatches: number }>
> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, bestOf: true, format: true },
  });

  if (!tournament) return fail("Tournament was not found.");

  if (!isSupportedTournamentFormat(tournament.format)) {
    return fail(
      "Bracket generation is not supported for this tournament format. Only Single Elimination is currently supported.",
    );
  }

  const existing = await prisma.tournamentMatch.count({
    where: { tournamentId },
  });

  if (existing > 0) {
    return fail(
      "This tournament already has generated matches. Delete them before regenerating.",
    );
  }

  const approved = await prisma.tournamentRegistration.findMany({
    where: { tournamentId, status: "approved" },
    select: { teamId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (approved.length < 2) {
    return fail(
      "Need at least 2 approved teams before generating the bracket.",
    );
  }

  const seeds = buildSingleEliminationSeeds(approved.map((r) => r.teamId));
  const totalSlots = seeds.length;
  const totalRounds = Math.round(Math.log2(totalSlots));
  const bestOf = tournament.bestOf || 1;

  type DraftMatch = {
    roundNumber: number;
    matchNumber: number;
    teamAId: string | null;
    teamBId: string | null;
    isBye: boolean;
    nextRound: number | null;
    nextMatchNumber: number | null;
    nextSlot: "A" | "B" | null;
  };

  const drafts: DraftMatch[] = [];

  const firstRoundMatchCount = totalSlots / 2;

  for (let i = 0; i < firstRoundMatchCount; i += 1) {
    const teamA = seeds[i * 2].teamId;
    const teamB = seeds[i * 2 + 1].teamId;
    const isBye = !teamA || !teamB;
    const matchNumber = i + 1;
    const nextMatchNumber = Math.floor(i / 2) + 1;
    const nextSlot: "A" | "B" = i % 2 === 0 ? "A" : "B";

    drafts.push({
      roundNumber: 1,
      matchNumber,
      teamAId: teamA,
      teamBId: teamB,
      isBye,
      nextRound: totalRounds > 1 ? 2 : null,
      nextMatchNumber: totalRounds > 1 ? nextMatchNumber : null,
      nextSlot: totalRounds > 1 ? nextSlot : null,
    });
  }

  for (let round = 2; round <= totalRounds; round += 1) {
    const matchesInRound = totalSlots / Math.pow(2, round);
    for (let i = 0; i < matchesInRound; i += 1) {
      const matchNumber = i + 1;
      const isFinal = round === totalRounds;
      drafts.push({
        roundNumber: round,
        matchNumber,
        teamAId: null,
        teamBId: null,
        isBye: false,
        nextRound: isFinal ? null : round + 1,
        nextMatchNumber: isFinal ? null : Math.floor(i / 2) + 1,
        nextSlot: isFinal ? null : i % 2 === 0 ? "A" : "B",
      });
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const createdRows: {
      id: string;
      tournamentId: string;
      roundNumber: number;
      matchNumber: number;
      teamAId: string | null;
      teamBId: string | null;
      status: MatchStatus;
    }[] = [];

    for (const draft of drafts) {
      const row = await tx.tournamentMatch.create({
        data: {
          tournamentId,
          roundNumber: draft.roundNumber,
          matchNumber: draft.matchNumber,
          teamAId: draft.teamAId,
          teamBId: draft.teamBId,
          bestOf,
          isBye: draft.isBye,
          status: draft.isBye ? MatchStatus.bye : MatchStatus.scheduled,
          winnerTeamId: draft.isBye
            ? (draft.teamAId ?? draft.teamBId ?? null)
            : null,
          completedAt: draft.isBye ? new Date() : null,
        },
        select: {
          id: true,
          tournamentId: true,
          roundNumber: true,
          matchNumber: true,
          teamAId: true,
          teamBId: true,
          status: true,
        },
      });
      createdRows.push(row);
    }

    const byRoundAndNumber = new Map<string, string>();
    for (const row of createdRows) {
      byRoundAndNumber.set(`${row.roundNumber}:${row.matchNumber}`, row.id);
    }

    for (const draft of drafts) {
      if (
        draft.nextRound == null ||
        draft.nextMatchNumber == null ||
        draft.nextSlot == null
      ) {
        continue;
      }

      const currentId = byRoundAndNumber.get(
        `${draft.roundNumber}:${draft.matchNumber}`,
      );
      const nextId = byRoundAndNumber.get(
        `${draft.nextRound}:${draft.nextMatchNumber}`,
      );

      if (!currentId || !nextId) continue;

      await tx.tournamentMatch.update({
        where: { id: currentId },
        data: { nextMatchId: nextId, nextMatchSlot: draft.nextSlot },
      });
    }

    return createdRows;
  });

  await Promise.all(
    created
      .filter(
        (match) =>
          match.status === MatchStatus.scheduled &&
          Boolean(match.teamAId) &&
          Boolean(match.teamBId),
      )
      .map((match) => notifyMatchScheduled(match)),
  );

  for (const draft of drafts) {
    if (!draft.isBye) continue;
    const winnerTeamId = draft.teamAId ?? draft.teamBId ?? null;
    if (!winnerTeamId) continue;
    const match = await prisma.tournamentMatch.findUnique({
      where: {
        tournamentId_roundNumber_matchNumber: {
          tournamentId,
          roundNumber: draft.roundNumber,
          matchNumber: draft.matchNumber,
        },
      },
      select: { id: true },
    });
    if (match) await advanceBracketAfterMatch(match.id);
  }

  await writeAudit({
    action: "match.bracket.generated",
    request: { tournamentId },
    response: { matches: created.length, rounds: totalRounds },
    status: AuditStatus.success,
  });

  await createRealtimeEvent({
    type: "tournament.bracket.generated",
    audience: "public",
    entityType: "tournament",
    entityId: tournamentId,
    payload: { tournamentId, totalMatches: created.length, rounds: totalRounds },
  });

  return ok({
    created: created.length,
    rounds: totalRounds,
    totalMatches: created.length,
  });
}

// ─── Read State ──────────────────────────────────────────────────────────────

export async function getTournamentMatchState(tournamentId: string) {
  return prisma.tournamentMatch.findMany({
    where: { tournamentId },
    orderBy: [{ roundNumber: "asc" }, { matchNumber: "asc" }],
    include: {
      games: { orderBy: { gameNumber: "asc" } },
      reports: { orderBy: { createdAt: "desc" } },
      room: true,
    },
  });
}

// ─── Permission Helpers ──────────────────────────────────────────────────────

async function loadMatchOrFail(matchId: string) {
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: { reports: { orderBy: { createdAt: "desc" } } },
  });
  if (!match) return null;
  return match;
}

async function userIsMemberOfTeam(userId: string, teamId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { id: true },
  });
  if (member) return true;

  const leader = await prisma.team.findFirst({
    where: { id: teamId, leaderId: userId },
    select: { id: true },
  });
  return Boolean(leader);
}

/**
 * Defense-in-depth: even when called directly (not through a server action),
 * confirm/override paths verify the user is in ADMIN_DISCORD_IDS.
 *
 * Test override: pass userId starting with "test-admin:" in NODE_ENV=test
 * to skip the env-var lookup (used by the engine test suite).
 */
async function isUserAdmin(userId: string): Promise<boolean> {
  if (process.env.NODE_ENV === "test" && userId.startsWith("test-admin:")) {
    return true;
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { discordId: true },
  });
  if (!user) return false;
  const adminIds = (process.env.ADMIN_DISCORD_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return adminIds.includes(user.discordId);
}

// ─── Submit Manual Report ───────────────────────────────────────────────────

export type SubmitManualMatchReportInput = {
  matchId: string;
  userId: string;
  teamId: string;
  winnerTeamId: string;
  teamAScore: number;
  teamBScore: number;
  evidenceUrl?: string | null;
  note?: string | null;
};

export async function submitManualMatchReport(
  input: SubmitManualMatchReportInput,
): Promise<
  EngineResult<{
    reportId: string;
    matchStatus: MatchStatus;
    autoConfirmed: boolean;
    disputed: boolean;
  }>
> {
  const match = await loadMatchOrFail(input.matchId);
  if (!match) {
    await writeAudit({
      action: "match.report.submit",
      request: { ...input },
      status: AuditStatus.failure,
      error: "match_not_found",
    });
    return fail("Match was not found.");
  }

  if (
    match.status === MatchStatus.completed ||
    match.status === MatchStatus.cancelled ||
    match.status === MatchStatus.bye
  ) {
    return fail("This match no longer accepts reports.");
  }

  if (!match.teamAId || !match.teamBId) {
    return fail("Both teams must be assigned before reporting.");
  }

  if (input.teamId !== match.teamAId && input.teamId !== match.teamBId) {
    return fail("Your team is not part of this match.");
  }

  if (
    input.winnerTeamId !== match.teamAId &&
    input.winnerTeamId !== match.teamBId
  ) {
    return fail("Winner team must be either Team A or Team B.");
  }

  if (input.teamAScore < 0 || input.teamBScore < 0) {
    return fail("Scores must be zero or positive.");
  }

  const isMember = await userIsMemberOfTeam(input.userId, input.teamId);
  if (!isMember) {
    await writeAudit({
      action: "match.report.submit",
      request: { ...input },
      status: AuditStatus.failure,
      error: "not_team_member",
    });
    return fail("You are not a member of this team.");
  }

  const existingFromSameTeam = match.reports.find(
    (r) => r.teamId === input.teamId && r.status === ReportStatus.submitted,
  );

  const created = await prisma.$transaction(async (tx) => {
    if (existingFromSameTeam) {
      await tx.matchReport.update({
        where: { id: existingFromSameTeam.id },
        data: { status: ReportStatus.superseded },
      });
    }

    const newReport = await tx.matchReport.create({
      data: {
        matchId: input.matchId,
        submittedById: input.userId,
        teamId: input.teamId,
        winnerTeamId: input.winnerTeamId,
        teamAScore: input.teamAScore,
        teamBScore: input.teamBScore,
        evidenceUrl: input.evidenceUrl ?? null,
        note: input.note ?? null,
        status: ReportStatus.submitted,
      },
    });

    const otherTeamId =
      input.teamId === match.teamAId ? match.teamBId : match.teamAId;

    const liveReports = await tx.matchReport.findMany({
      where: { matchId: input.matchId, status: ReportStatus.submitted },
    });

    const ownReport = liveReports.find((r) => r.id === newReport.id);
    const otherTeamReport = liveReports.find(
      (r) => r.teamId === otherTeamId && r.id !== newReport.id,
    );

    let autoConfirmed = false;
    let disputed = false;
    let newStatus: MatchStatus = MatchStatus.result_pending;

    if (ownReport && otherTeamReport) {
      const matches =
        otherTeamReport.winnerTeamId === ownReport.winnerTeamId &&
        otherTeamReport.teamAScore === ownReport.teamAScore &&
        otherTeamReport.teamBScore === ownReport.teamBScore;

      if (matches) {
        autoConfirmed = true;
        newStatus = MatchStatus.confirmed;
        await tx.matchReport.updateMany({
          where: { id: { in: [ownReport.id, otherTeamReport.id] } },
          data: { status: ReportStatus.confirmed },
        });
      } else {
        disputed = true;
        newStatus = MatchStatus.disputed;
      }
    }

    await tx.tournamentMatch.update({
      where: { id: input.matchId },
      data: {
        status: newStatus,
        winnerTeamId: autoConfirmed ? ownReport!.winnerTeamId : null,
        completedAt: autoConfirmed ? new Date() : null,
        version: { increment: 1 },
      },
    });

    return {
      reportId: newReport.id,
      matchStatus: newStatus,
      autoConfirmed,
      disputed,
    };
  });

  await writeAudit({
    action: "match.report.submit",
    request: {
      matchId: input.matchId,
      teamId: input.teamId,
      winnerTeamId: input.winnerTeamId,
      teamAScore: input.teamAScore,
      teamBScore: input.teamBScore,
    },
    response: {
      reportId: created.reportId,
      matchStatus: created.matchStatus,
      autoConfirmed: created.autoConfirmed,
      disputed: created.disputed,
    },
    status: AuditStatus.success,
  });

  await emitMatchEvent(
    created.autoConfirmed
      ? "tournament.match.confirmed"
      : created.disputed
        ? "tournament.match.disputed"
        : "tournament.match.report_submitted",
    input.matchId,
    match.tournamentId,
    "public",
    {
      autoConfirmed: created.autoConfirmed,
      disputed: created.disputed,
    },
  );

  await notifyManualResultSubmitted(match, input.teamId, created.reportId);

  if (created.disputed) {
    await notifyMatchDisputed(match);
  }

  if (created.autoConfirmed) {
    await notifyMatchConfirmed(match, input.winnerTeamId, {
      teamAScore: input.teamAScore,
      teamBScore: input.teamBScore,
    });
    await advanceBracketAfterMatch(input.matchId);
  }

  return ok(created);
}

// ─── Admin Confirm ───────────────────────────────────────────────────────────

export async function confirmMatchResult(
  matchId: string,
  adminUserId: string,
): Promise<EngineResult<{ matchStatus: MatchStatus; winnerTeamId: string }>> {
  if (!(await isUserAdmin(adminUserId))) {
    await writeAudit({
      action: "match.confirm",
      request: { matchId, adminUserId } as Prisma.InputJsonValue,
      status: AuditStatus.failure,
      error: "not_admin",
    });
    return fail("Only Ascendra admins can confirm match results.");
  }

  const match = await loadMatchOrFail(matchId);
  if (!match) return fail("Match was not found.");

  if (!match.teamAId || !match.teamBId) {
    return fail("Both teams must be assigned before confirming.");
  }

  const candidateReport =
    match.reports.find((r) => r.status === ReportStatus.submitted) ??
    match.reports.find((r) => r.status === ReportStatus.confirmed);

  const winnerTeamId = candidateReport?.winnerTeamId ?? match.winnerTeamId;

  if (!winnerTeamId) {
    return fail(
      "Cannot confirm: no report submitted and no winner currently set.",
    );
  }

  if (winnerTeamId !== match.teamAId && winnerTeamId !== match.teamBId) {
    return fail("Winner does not belong to this match.");
  }

  await prisma.$transaction(async (tx) => {
    if (candidateReport) {
      await tx.matchReport.update({
        where: { id: candidateReport.id },
        data: { status: ReportStatus.confirmed },
      });
      await tx.matchReport.updateMany({
        where: {
          matchId,
          id: { not: candidateReport.id },
          status: ReportStatus.submitted,
        },
        data: { status: ReportStatus.rejected },
      });
    }

    await tx.tournamentMatch.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.confirmed,
        winnerTeamId,
        completedAt: new Date(),
        version: { increment: 1 },
      },
    });
  });

  await writeAudit({
    action: "match.confirm",
    request: { matchId, adminUserId },
    response: { winnerTeamId },
    status: AuditStatus.success,
  });

  await emitMatchEvent(
    "tournament.match.confirmed",
    matchId,
    match.tournamentId,
    "public",
    { winnerTeamId, adminUserId },
  );

  await notifyMatchConfirmed(
    match,
    winnerTeamId,
    candidateReport
      ? {
          teamAScore: candidateReport.teamAScore,
          teamBScore: candidateReport.teamBScore,
        }
      : null,
  );

  await advanceBracketAfterMatch(matchId);

  return ok({ matchStatus: MatchStatus.confirmed, winnerTeamId });
}

// ─── User Dispute ────────────────────────────────────────────────────────────

export async function disputeMatchResult(
  matchId: string,
  userId: string,
  reason: string,
): Promise<EngineResult<{ matchStatus: MatchStatus }>> {
  const match = await loadMatchOrFail(matchId);
  if (!match) return fail("Match was not found.");

  if (!match.teamAId || !match.teamBId) {
    return fail("Match does not have both teams assigned yet.");
  }

  const trimmedReason = (reason || "").trim();
  if (!trimmedReason) return fail("Please provide a reason for the dispute.");
  if (trimmedReason.length > 500) {
    return fail("Dispute reason must be 500 characters or fewer.");
  }

  const memberOfA = await userIsMemberOfTeam(userId, match.teamAId);
  const memberOfB = memberOfA
    ? false
    : await userIsMemberOfTeam(userId, match.teamBId);

  if (!memberOfA && !memberOfB) {
    await writeAudit({
      action: "match.dispute",
      request: { matchId, userId, reason: trimmedReason },
      status: AuditStatus.failure,
      error: "not_team_member",
    });
    return fail("Only players from the competing teams can dispute.");
  }

  if (
    match.status === MatchStatus.completed ||
    match.status === MatchStatus.cancelled ||
    match.status === MatchStatus.bye
  ) {
    return fail("This match can no longer be disputed.");
  }

  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      status: MatchStatus.disputed,
      version: { increment: 1 },
    },
  });

  await writeAudit({
    action: "match.dispute",
    request: { matchId, userId, reason: trimmedReason },
    response: { matchStatus: MatchStatus.disputed },
    status: AuditStatus.success,
  });

  await emitMatchEvent(
    "tournament.match.disputed",
    matchId,
    match.tournamentId,
    "admin",
    { userId, reason: trimmedReason },
  );

  await notifyMatchDisputed(match);

  return ok({ matchStatus: MatchStatus.disputed });
}

// ─── Complete a Game ─────────────────────────────────────────────────────────

export async function completeMatchGame(
  gameId: string,
  winnerTeamId: string,
  rawResult: Prisma.InputJsonValue | null,
): Promise<
  EngineResult<{
    gameId: string;
    matchId: string;
    seriesComplete: boolean;
    matchStatus: MatchStatus;
  }>
> {
  const game = await prisma.tournamentMatchGame.findUnique({
    where: { id: gameId },
    include: { match: true },
  });
  if (!game) return fail("Match game was not found.");
  const match = game.match;

  if (!match.teamAId || !match.teamBId) {
    return fail("Match teams not assigned.");
  }

  if (winnerTeamId !== match.teamAId && winnerTeamId !== match.teamBId) {
    return fail("Winner must be one of the match teams.");
  }

  // Idempotency: if the game was already completed (e.g. by a webhook that
  // raced with a manual sync), do not overwrite the recorded winner. Return
  // the existing series state so the caller can still react to seriesComplete.
  if (game.status === MatchGameStatus.completed) {
    const allGames = await prisma.tournamentMatchGame.findMany({
      where: { matchId: match.id, status: MatchGameStatus.completed },
      select: { winnerTeamId: true },
    });
    let winsA = 0;
    let winsB = 0;
    for (const g of allGames) {
      if (g.winnerTeamId === match.teamAId) winsA += 1;
      if (g.winnerTeamId === match.teamBId) winsB += 1;
    }
    const requiredWins = Math.floor(match.bestOf / 2) + 1;
    const seriesComplete = winsA >= requiredWins || winsB >= requiredWins;
    await writeAudit({
      action: "match.game.complete.noop",
      request: { gameId, winnerTeamId } as Prisma.InputJsonValue,
      response: {
        reason: "already_completed",
        recordedWinner: game.winnerTeamId,
      } as Prisma.InputJsonValue,
      status: AuditStatus.success,
    });
    return ok({
      gameId,
      matchId: match.id,
      seriesComplete,
      matchStatus: match.status,
    });
  }

  const teamAScore = winnerTeamId === match.teamAId ? 1 : 0;
  const teamBScore = winnerTeamId === match.teamBId ? 1 : 0;

  const result = await prisma.$transaction(async (tx) => {
    await tx.tournamentMatchGame.update({
      where: { id: gameId },
      data: {
        status: MatchGameStatus.completed,
        winnerTeamId,
        teamAScore,
        teamBScore,
        rawResult: rawResult ?? Prisma.JsonNull,
      },
    });

    const allGames = await tx.tournamentMatchGame.findMany({
      where: { matchId: match.id, status: MatchGameStatus.completed },
    });

    let winsA = 0;
    let winsB = 0;
    for (const g of allGames) {
      if (g.winnerTeamId === match.teamAId) winsA += 1;
      if (g.winnerTeamId === match.teamBId) winsB += 1;
    }

    const requiredWins = Math.floor(match.bestOf / 2) + 1;
    const seriesComplete = winsA >= requiredWins || winsB >= requiredWins;
    const seriesWinnerTeamId = seriesComplete
      ? winsA > winsB
        ? match.teamAId!
        : match.teamBId!
      : null;

    let nextStatus: MatchStatus = match.status;
    if (seriesComplete) {
      nextStatus = MatchStatus.result_pending;
    } else if (match.status === MatchStatus.scheduled) {
      nextStatus = MatchStatus.in_progress;
    }

    await tx.tournamentMatch.update({
      where: { id: match.id },
      data: {
        status: nextStatus,
        winnerTeamId: seriesWinnerTeamId,
        version: { increment: 1 },
      },
    });

    return { seriesComplete, matchStatus: nextStatus };
  });

  await writeAudit({
    action: "match.game.completed",
    request: { gameId, winnerTeamId },
    response: result,
    status: AuditStatus.success,
  });

  await emitMatchEvent(
    "tournament.match.game_completed",
    match.id,
    match.tournamentId,
    "public",
    { gameId, winnerTeamId, seriesComplete: result.seriesComplete },
  );

  return ok({
    gameId,
    matchId: match.id,
    seriesComplete: result.seriesComplete,
    matchStatus: result.matchStatus,
  });
}

// ─── Bracket Advancement ─────────────────────────────────────────────────────

export async function advanceBracketAfterMatch(
  matchId: string,
  opts?: { adminOverride?: boolean },
): Promise<EngineResult<{ advanced: boolean; nextMatchId?: string }>> {
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
  });
  if (!match) return fail("Match was not found.");

  const advanceable =
    match.status === MatchStatus.confirmed ||
    match.status === MatchStatus.completed ||
    match.status === MatchStatus.forfeit ||
    match.status === MatchStatus.bye;

  if (!advanceable) {
    return ok({ advanced: false });
  }

  if (!match.winnerTeamId) {
    return ok({ advanced: false });
  }

  if (!match.nextMatchId || !match.nextMatchSlot) {
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.completed,
        completedAt: match.completedAt ?? new Date(),
      },
    });
    await awardFinalTournamentResults(match.tournamentId);
    return ok({ advanced: false });
  }

  const slotField = match.nextMatchSlot === "A" ? "teamAId" : "teamBId";

  const next = await prisma.tournamentMatch.findUnique({
    where: { id: match.nextMatchId },
    select: { id: true, version: true, teamAId: true, teamBId: true },
  });
  if (!next) return fail("Next match in the bracket was not found.");

  const occupant = next[slotField as "teamAId" | "teamBId"];

  // Idempotency: slot already has this winner — nothing to do
  if (occupant === match.winnerTeamId) {
    return ok({ advanced: false });
  }

  // Slot protection: occupied by a different team, reject unless admin override
  if (occupant !== null && !opts?.adminOverride) {
    await writeAudit({
      action: "match.advance.blocked",
      request: {
        matchId,
        nextMatchId: next.id,
        slot: match.nextMatchSlot,
        occupant,
      } as Prisma.InputJsonValue,
      status: AuditStatus.failure,
      error: "slot_occupied",
    });
    return fail(
      `Bracket slot ${match.nextMatchSlot} in the next match is already occupied by a different team. Use admin override to replace.`,
    );
  }

  const updateResult = await prisma.tournamentMatch.updateMany({
    where: { id: next.id, version: next.version },
    data: { [slotField]: match.winnerTeamId, version: { increment: 1 } },
  });

  if (updateResult.count === 0) {
    await writeAudit({
      action: "match.advance",
      request: { matchId, nextMatchId: next.id },
      status: AuditStatus.retrying,
      error: "version_conflict",
    });
    return fail(
      "Could not advance the winner — bracket state changed concurrently. Retry.",
    );
  }

  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      status: MatchStatus.completed,
      completedAt: match.completedAt ?? new Date(),
    },
  });

  await writeAudit({
    action: "match.advance",
    request: {
      matchId,
      nextMatchId: next.id,
      slot: match.nextMatchSlot,
      adminOverride: opts?.adminOverride ?? false,
    } as Prisma.InputJsonValue,
    response: { winnerTeamId: match.winnerTeamId } as Prisma.InputJsonValue,
    status: AuditStatus.success,
  });

  await emitMatchEvent(
    "tournament.match.advanced",
    matchId,
    match.tournamentId,
    "public",
    { nextMatchId: next.id, slot: match.nextMatchSlot },
  );

  await notifyBracketAdvanced(match, next.id);

  return ok({ advanced: true, nextMatchId: next.id });
}

// ─── FACEIT Auto-Confirm ──────────────────────────────────────────────────────
// Applies an official match result sourced from FACEIT proof data.
// Skips admin-user check; the caller is responsible for env-flag gating.

export type ApplyFaceitAutoResultInput = {
  matchId: string;
  winnerTeamId: string;
  teamAScore: number;
  teamBScore: number;
  mappingMethod: "strict" | "faction_order";
};

export async function applyFaceitAutoResult(
  input: ApplyFaceitAutoResultInput,
): Promise<EngineResult<{ matchStatus: MatchStatus }>> {
  const match = await loadMatchOrFail(input.matchId);
  if (!match) return fail("Match was not found.");

  if (!match.teamAId || !match.teamBId) {
    return fail("Both teams must be assigned before applying FACEIT result.");
  }

  if (
    input.winnerTeamId !== match.teamAId &&
    input.winnerTeamId !== match.teamBId
  ) {
    return fail("Winner must be one of the match teams.");
  }

  if (input.teamAScore < 0 || input.teamBScore < 0) {
    return fail("Scores must be zero or positive.");
  }

  const terminalStatuses = new Set<MatchStatus>([
    MatchStatus.completed,
    MatchStatus.confirmed,
    MatchStatus.cancelled,
    MatchStatus.forfeit,
    MatchStatus.bye,
  ]);
  if (terminalStatuses.has(match.status)) {
    return fail("Match is already completed.");
  }

  const note = `FACEIT auto-confirm (${input.mappingMethod})`;

  await prisma.$transaction(async (tx) => {
    await tx.matchReport.updateMany({
      where: { matchId: input.matchId, status: ReportStatus.submitted },
      data: { status: ReportStatus.rejected },
    });

    await tx.tournamentMatch.update({
      where: { id: input.matchId },
      data: {
        status: MatchStatus.confirmed,
        winnerTeamId: input.winnerTeamId,
        completedAt: new Date(),
        version: { increment: 1 },
      },
    });
  });

  await writeAudit({
    action: "match.faceit_auto_confirm",
    request: {
      matchId: input.matchId,
      winnerTeamId: input.winnerTeamId,
      teamAScore: input.teamAScore,
      teamBScore: input.teamBScore,
      mappingMethod: input.mappingMethod,
      note,
    } as Prisma.InputJsonValue,
    response: { matchStatus: MatchStatus.confirmed } as Prisma.InputJsonValue,
    status: AuditStatus.success,
  });

  await emitMatchEvent(
    "tournament.match.confirmed",
    input.matchId,
    match.tournamentId,
    "public",
    { faceitAutoConfirm: true, winnerTeamId: input.winnerTeamId, mappingMethod: input.mappingMethod },
  );

  await notifyMatchConfirmed(match, input.winnerTeamId, {
    teamAScore: input.teamAScore,
    teamBScore: input.teamBScore,
  });

  await advanceBracketAfterMatch(input.matchId, { adminOverride: true });

  return ok({ matchStatus: MatchStatus.confirmed });
}

// ─── Admin Override ──────────────────────────────────────────────────────────

export type AdminOverrideInput = {
  matchId: string;
  adminUserId: string;
  winnerTeamId: string;
  teamAScore: number;
  teamBScore: number;
  note?: string | null;
};

export async function adminOverrideMatchResult(
  input: AdminOverrideInput,
): Promise<EngineResult<{ matchStatus: MatchStatus }>> {
  if (!(await isUserAdmin(input.adminUserId))) {
    await writeAudit({
      action: "match.admin_override",
      request: { matchId: input.matchId, adminUserId: input.adminUserId } as Prisma.InputJsonValue,
      status: AuditStatus.failure,
      error: "not_admin",
    });
    return fail("Only Ascendra admins can override match results.");
  }

  const match = await loadMatchOrFail(input.matchId);
  if (!match) return fail("Match was not found.");

  if (!match.teamAId || !match.teamBId) {
    return fail("Both teams must be assigned before overriding.");
  }

  if (
    input.winnerTeamId !== match.teamAId &&
    input.winnerTeamId !== match.teamBId
  ) {
    return fail("Winner must be one of the match teams.");
  }

  if (input.teamAScore < 0 || input.teamBScore < 0) {
    return fail("Scores must be zero or positive.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.matchReport.updateMany({
      where: { matchId: input.matchId, status: ReportStatus.submitted },
      data: { status: ReportStatus.rejected },
    });

    await tx.matchReport.create({
      data: {
        matchId: input.matchId,
        submittedById: input.adminUserId,
        teamId: input.winnerTeamId,
        winnerTeamId: input.winnerTeamId,
        teamAScore: input.teamAScore,
        teamBScore: input.teamBScore,
        note: input.note ?? "Admin override",
        status: ReportStatus.confirmed,
      },
    });

    await tx.tournamentMatch.update({
      where: { id: input.matchId },
      data: {
        status: MatchStatus.confirmed,
        winnerTeamId: input.winnerTeamId,
        completedAt: new Date(),
        version: { increment: 1 },
      },
    });
  });

  await writeAudit({
    action: "match.admin_override",
    request: { ...input },
    response: { matchStatus: MatchStatus.confirmed },
    status: AuditStatus.success,
  });

  await emitMatchEvent(
    "tournament.match.confirmed",
    input.matchId,
    match.tournamentId,
    "public",
    { adminOverride: true, winnerTeamId: input.winnerTeamId },
  );

  await notifyMatchConfirmed(match, input.winnerTeamId, {
    teamAScore: input.teamAScore,
    teamBScore: input.teamBScore,
  });

  await advanceBracketAfterMatch(input.matchId, { adminOverride: true });

  return ok({ matchStatus: MatchStatus.confirmed });
}
