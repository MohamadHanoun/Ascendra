"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import {
  verifyValorantMatch,
  findRecentCustomMatches,
} from "@/lib/gameIntegrations/riotValorantAdapter";
import {
  verifyDotaMatch,
  findRecentDotaMatches,
} from "@/lib/gameIntegrations/steamDota2Adapter";
import { notifyMatchConfirmed } from "@/lib/matchNotifications";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";
import {
  adminOverrideMatchResult as engineAdminOverride,
  confirmMatchResult as engineConfirmMatchResult,
  disputeMatchResult as engineDisputeMatchResult,
  submitManualMatchReport as engineSubmitManualMatchReport,
  completeMatchGame,
  advanceBracketAfterMatch,
} from "@/lib/tournamentMatchEngine";
import { GameProvider, MatchGameStatus, MatchStatus, Prisma } from "@prisma/client";

export type MatchActionResult = {
  ok: boolean;
  message: string;
};

function success(message: string): MatchActionResult {
  return { ok: true, message };
}

function fail(message: string): MatchActionResult {
  return { ok: false, message };
}

function getValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function getInt(formData: FormData, name: string, fallback: number) {
  const raw = getValue(formData, name);
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? fallback : parsed;
}

type MatchIdActionMessages = {
  loginRequired: string;
  matchIdMissing: string;
  teamIdMissing: string;
  winnerTeamRequired: string;
  scoresRequired: string;
  enterValorantMatchId: string;
  enterDotaMatchId: string;
  invalidGameNumber: string;
  matchNotFound: string;
  teamsRequiredVerification: string;
  matchAlreadyFinal: string;
  notParticipant: string;
  verificationRejected: string;
  verifiedRecorded: string;
  mediumConfidence: string;
  reportAutoConfirmed: string;
  reportDisputed: string;
  reportWaiting: string;
  disputeReasonRequired: string;
  disputeFiled: string;
  adminsOnlySearch: string;
  teamsRequiredSearch: string;
  noRecentValorant: string;
  noRecentDota: string;
  foundOneCandidate: string;
  foundCandidates: string;
};

const matchIdActionMessages: Record<Locale, MatchIdActionMessages> = {
  en: {
    loginRequired: "Please login first.",
    matchIdMissing: "Match ID is missing.",
    teamIdMissing: "Team ID is missing.",
    winnerTeamRequired: "Winner team is required.",
    scoresRequired: "Both team scores are required.",
    enterValorantMatchId: "Please enter a VALORANT match ID.",
    enterDotaMatchId: "Please enter a Dota 2 match ID.",
    invalidGameNumber: "Game number is invalid.",
    matchNotFound: "Match not found.",
    teamsRequiredVerification:
      "Both teams must be assigned before verification.",
    matchAlreadyFinal: "This match is already finalised.",
    notParticipant: "You are not a participant in this match.",
    verificationRejected: "Verification rejected: {reason}",
    verifiedRecorded: "Match verified and recorded automatically.",
    mediumConfidence:
      "Match ID submitted. Confidence is medium — an admin will review before the result is confirmed.",
    reportAutoConfirmed: "Report submitted and auto-confirmed by the other team.",
    reportDisputed:
      "Report submitted. Both teams disagree — match flagged as disputed for admin review.",
    reportWaiting: "Report submitted. Waiting for the other team to confirm.",
    disputeReasonRequired: "A reason is required to open a dispute.",
    disputeFiled: "Dispute filed. Admins will review the match.",
    adminsOnlySearch: "Only admins can search recent matches.",
    teamsRequiredSearch: "Both teams must be assigned before searching.",
    noRecentValorant:
      "No recent custom VALORANT matches found for these teams. Ensure players have linked their Riot accounts.",
    noRecentDota:
      "No recent Dota 2 matches found for these teams. Ensure players have linked their Steam accounts.",
    foundOneCandidate: "Found 1 candidate.",
    foundCandidates: "Found {count} candidates.",
  },
  ar: {
    loginRequired: "يرجى تسجيل الدخول أولًا.",
    matchIdMissing: "معرّف المباراة مفقود.",
    teamIdMissing: "معرّف الفريق مفقود.",
    winnerTeamRequired: "يجب تحديد الفريق الفائز.",
    scoresRequired: "يجب إدخال نتيجتي الفريقين.",
    enterValorantMatchId: "يرجى إدخال معرّف مباراة VALORANT.",
    enterDotaMatchId: "يرجى إدخال معرّف مباراة Dota 2.",
    invalidGameNumber: "رقم اللعبة غير صالح.",
    matchNotFound: "لم يتم العثور على المباراة.",
    teamsRequiredVerification: "يجب تحديد الفريقين قبل التحقق.",
    matchAlreadyFinal: "هذه المباراة نهائية بالفعل.",
    notParticipant: "أنت لست مشاركًا في هذه المباراة.",
    verificationRejected: "تم رفض التحقق: {reason}",
    verifiedRecorded: "تم التحقق من المباراة وتسجيلها تلقائيًا.",
    mediumConfidence:
      "تم إرسال معرّف المباراة. مستوى الثقة متوسط، وسيراجعه أحد المشرفين قبل تأكيد النتيجة.",
    reportAutoConfirmed: "تم إرسال التقرير وتأكيده تلقائيًا من الفريق الآخر.",
    reportDisputed:
      "تم إرسال التقرير. يوجد اختلاف بين الفريقين، وتم وضع المباراة للمراجعة.",
    reportWaiting: "تم إرسال التقرير. بانتظار تأكيد الفريق الآخر.",
    disputeReasonRequired: "يجب إدخال سبب لفتح اعتراض.",
    disputeFiled: "تم إرسال الاعتراض. سيراجع المشرفون المباراة.",
    adminsOnlySearch: "يمكن للمشرفين فقط البحث عن المباريات الحديثة.",
    teamsRequiredSearch: "يجب تحديد الفريقين قبل البحث.",
    noRecentValorant:
      "لم يتم العثور على مباريات VALORANT مخصصة حديثة لهذه الفرق. تأكد من أن اللاعبين ربطوا حسابات Riot الخاصة بهم.",
    noRecentDota:
      "لم يتم العثور على مباريات Dota 2 حديثة لهذه الفرق. تأكد من أن اللاعبين ربطوا حسابات Steam الخاصة بهم.",
    foundOneCandidate: "تم العثور على نتيجة واحدة محتملة.",
    foundCandidates: "تم العثور على {count} نتائج محتملة.",
  },
};

function getActionLocale(formData: FormData): Locale {
  return formData.get("locale") === "ar" ? "ar" : "en";
}

function formatActionMessage(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, value),
    template,
  );
}

async function requireUser() {
  const session = await auth();
  const user = session?.user as
    | { databaseId?: string; isAdmin?: boolean }
    | undefined;

  if (!user?.databaseId) return null;
  return { id: user.databaseId, isAdmin: Boolean(user.isAdmin) };
}

async function loadMatchTournamentId(matchId: string): Promise<string | null> {
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { tournamentId: true },
  });
  return match?.tournamentId ?? null;
}

function revalidateMatchPaths(tournamentId: string) {
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");
  revalidatePath("/admin");
  revalidatePath("/profile");
}

// ─── Player submits a result ─────────────────────────────────────────────────

export async function submitMatchReport(
  _prevState: MatchActionResult,
  formData: FormData,
): Promise<MatchActionResult> {
  const messages = matchIdActionMessages[getActionLocale(formData)];
  const sessionUser = await requireUser();
  if (!sessionUser) return fail(messages.loginRequired);

  const matchId = getValue(formData, "matchId");
  const teamId = getValue(formData, "teamId");
  const winnerTeamId = getValue(formData, "winnerTeamId");

  if (!matchId) return fail(messages.matchIdMissing);
  if (!teamId) return fail(messages.teamIdMissing);
  if (!winnerTeamId) return fail(messages.winnerTeamRequired);

  const teamAScore = getInt(formData, "teamAScore", -1);
  const teamBScore = getInt(formData, "teamBScore", -1);
  if (teamAScore < 0 || teamBScore < 0) {
    return fail(messages.scoresRequired);
  }

  const evidenceUrl = getValue(formData, "evidenceUrl") || null;
  const note = getValue(formData, "note") || null;

  const result = await engineSubmitManualMatchReport({
    matchId,
    userId: sessionUser.id,
    teamId,
    winnerTeamId,
    teamAScore,
    teamBScore,
    evidenceUrl,
    note,
  });

  if (!result.ok) return fail(result.error);

  const tournamentId = await loadMatchTournamentId(matchId);
  if (tournamentId) revalidateMatchPaths(tournamentId);

  if (result.data.autoConfirmed) {
    return success(messages.reportAutoConfirmed);
  }
  if (result.data.disputed) {
    return success(messages.reportDisputed);
  }
  return success(messages.reportWaiting);
}

// ─── Admin confirms a result ────────────────────────────────────────────────

export async function confirmMatchResult(
  _prevState: MatchActionResult,
  formData: FormData,
): Promise<MatchActionResult> {
  const sessionUser = await requireUser();
  if (!sessionUser) return fail("Please login first.");
  if (!sessionUser.isAdmin) {
    return fail("Only Ascendra admins can confirm match results.");
  }

  const matchId = getValue(formData, "matchId");
  if (!matchId) return fail("Match ID is missing.");

  const result = await engineConfirmMatchResult(matchId, sessionUser.id);
  if (!result.ok) return fail(result.error);

  const tournamentId = await loadMatchTournamentId(matchId);
  if (tournamentId) revalidateMatchPaths(tournamentId);

  return success("Match result confirmed.");
}

// ─── Player or admin disputes a result ──────────────────────────────────────

export async function disputeMatchResult(
  _prevState: MatchActionResult,
  formData: FormData,
): Promise<MatchActionResult> {
  const messages = matchIdActionMessages[getActionLocale(formData)];
  const sessionUser = await requireUser();
  if (!sessionUser) return fail(messages.loginRequired);

  const matchId = getValue(formData, "matchId");
  const reason = getValue(formData, "reason");

  if (!matchId) return fail(messages.matchIdMissing);
  if (!reason) return fail(messages.disputeReasonRequired);

  const result = await engineDisputeMatchResult(
    matchId,
    sessionUser.id,
    reason,
  );
  if (!result.ok) return fail(result.error);

  const tournamentId = await loadMatchTournamentId(matchId);
  if (tournamentId) revalidateMatchPaths(tournamentId);

  return success(messages.disputeFiled);
}

// ─── Admin force-sets a result ──────────────────────────────────────────────

export async function adminOverrideMatchResult(
  _prevState: MatchActionResult,
  formData: FormData,
): Promise<MatchActionResult> {
  const sessionUser = await requireUser();
  if (!sessionUser) return fail("Please login first.");
  if (!sessionUser.isAdmin) {
    return fail("Only Ascendra admins can override match results.");
  }

  const matchId = getValue(formData, "matchId");
  const winnerTeamId = getValue(formData, "winnerTeamId");

  if (!matchId) return fail("Match ID is missing.");
  if (!winnerTeamId) return fail("Winner team is required.");

  const teamAScore = getInt(formData, "teamAScore", -1);
  const teamBScore = getInt(formData, "teamBScore", -1);
  if (teamAScore < 0 || teamBScore < 0) {
    return fail("Both team scores are required.");
  }

  const note = getValue(formData, "note") || null;

  const result = await engineAdminOverride({
    matchId,
    adminUserId: sessionUser.id,
    winnerTeamId,
    teamAScore,
    teamBScore,
    note,
  });

  if (!result.ok) return fail(result.error);

  const tournamentId = await loadMatchTournamentId(matchId);
  if (tournamentId) revalidateMatchPaths(tournamentId);

  return success("Match result overridden by admin.");
}

// ─── Player/admin submits a VALORANT match ID for verification ───────────────

export type ValorantVerifyResult = {
  ok: boolean;
  message: string;
  confidence?: "high" | "medium" | "rejected";
  checks?: Record<string, unknown>;
  reason?: string;
};

export async function submitValorantMatchId(
  _prevState: ValorantVerifyResult,
  formData: FormData,
): Promise<ValorantVerifyResult> {
  const messages = matchIdActionMessages[getActionLocale(formData)];
  const sessionUser = await requireUser();
  if (!sessionUser) {
    return { ok: false, message: messages.loginRequired };
  }

  const matchId = getValue(formData, "matchId");
  const gameNumberRaw = getValue(formData, "gameNumber");
  const valorantMatchId = getValue(formData, "valorantMatchId").trim();

  if (!matchId) return { ok: false, message: messages.matchIdMissing };
  if (!valorantMatchId) {
    return { ok: false, message: messages.enterValorantMatchId };
  }

  const gameNumber = parseInt(gameNumberRaw, 10);
  if (!Number.isFinite(gameNumber) || gameNumber < 1) {
    return { ok: false, message: messages.invalidGameNumber };
  }

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      teamAId: true,
      teamBId: true,
      scheduledAt: true,
      tournamentId: true,
      roundNumber: true,
      matchNumber: true,
      status: true,
      bestOf: true,
    },
  });

  if (!match) return { ok: false, message: messages.matchNotFound };
  if (!match.teamAId || !match.teamBId) {
    return { ok: false, message: messages.teamsRequiredVerification };
  }

  const terminal: string[] = ["completed", "confirmed", "cancelled", "forfeit", "bye"];
  if (terminal.includes(match.status)) {
    return { ok: false, message: messages.matchAlreadyFinal };
  }

  // Permission: user must be on one of the teams, or an admin.
  if (!sessionUser.isAdmin) {
    const membership = await prisma.teamMember.findFirst({
      where: {
        userId: sessionUser.id,
        teamId: { in: [match.teamAId, match.teamBId] },
      },
      select: { id: true },
    });
    const leaderTeam = membership
      ? null
      : await prisma.team.findFirst({
          where: {
            leaderId: sessionUser.id,
            id: { in: [match.teamAId, match.teamBId] },
          },
          select: { id: true },
        });
    if (!membership && !leaderTeam) {
      return { ok: false, message: messages.notParticipant };
    }
  }

  const verification = await verifyValorantMatch({
    valorantMatchId,
    tournamentId: match.tournamentId,
    matchId: match.id,
    teamAId: match.teamAId,
    teamBId: match.teamBId,
    scheduledAt: match.scheduledAt,
  });

  if (!verification.ok) {
    return { ok: false, message: verification.error };
  }

  const v = verification.result;

  // Persist the game row regardless of confidence so the raw data is stored.
  const existingGame = await prisma.tournamentMatchGame.findFirst({
    where: { matchId, gameNumber },
    select: { id: true },
  });

  const gameRow = existingGame
    ? await prisma.tournamentMatchGame.update({
        where: { id: existingGame.id },
        data: {
          externalMatchId: valorantMatchId,
          rawResult: v.raw as unknown as Prisma.InputJsonValue,
          status:
            v.confidence === "rejected"
              ? MatchGameStatus.cancelled
              : MatchGameStatus.pending,
        },
        select: { id: true },
      })
    : await prisma.tournamentMatchGame.create({
        data: {
          matchId,
          gameNumber,
          externalMatchId: valorantMatchId,
          rawResult: v.raw as unknown as Prisma.InputJsonValue,
          status:
            v.confidence === "rejected"
              ? MatchGameStatus.cancelled
              : MatchGameStatus.pending,
        },
        select: { id: true },
      });

  const checksSummary = {
    uniqueMatchId: v.checks.uniqueMatchId,
    customGame: v.checks.customGame,
    timeWindow: v.checks.timeWindow,
    teamACoverage: Math.round(v.checks.teamACoverage * 100),
    teamBCoverage: Math.round(v.checks.teamBCoverage * 100),
    winnerMapped: v.checks.winnerMapped,
  };

  if (v.confidence === "rejected") {
    revalidateMatchPaths(match.tournamentId);
    return {
      ok: false,
      message: formatActionMessage(messages.verificationRejected, {
        reason: v.reason ?? "",
      }),
      confidence: "rejected",
      checks: checksSummary,
      reason: v.reason,
    };
  }

  if (v.confidence === "high" && v.winnerTeamId) {
    // Auto-complete the game and potentially advance the bracket.
    const completeResult = await completeMatchGame(
      gameRow.id,
      v.winnerTeamId,
      v.raw as unknown as Prisma.InputJsonValue,
    );

    if (completeResult.ok && completeResult.data.seriesComplete) {
      await prisma.tournamentMatch.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.confirmed,
          winnerTeamId: v.winnerTeamId,
          completedAt: new Date(),
          version: { increment: 1 },
        },
      });
      await notifyMatchConfirmed(match, v.winnerTeamId);
      await advanceBracketAfterMatch(matchId);
    }

    revalidateMatchPaths(match.tournamentId);
    return {
      ok: true,
      message: messages.verifiedRecorded,
      confidence: "high",
      checks: checksSummary,
    };
  }

  // Medium confidence — store winnerTeamId but require admin review.
  if (v.winnerTeamId) {
    await prisma.tournamentMatchGame.update({
      where: { id: gameRow.id },
      data: { winnerTeamId: v.winnerTeamId },
    });
  }
  if (!terminal.includes(match.status)) {
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { status: MatchStatus.result_pending, version: { increment: 1 } },
    });
  }

  revalidateMatchPaths(match.tournamentId);
  return {
    ok: true,
    message: messages.mediumConfidence,
    confidence: "medium",
    checks: checksSummary,
    reason: v.reason,
  };
}

// ─── Admin: find recent custom VALORANT matches for a match ──────────────────

export type FindRecentResult = {
  ok: boolean;
  message: string;
  candidates?: Array<{
    valorantMatchId: string;
    minutesAgo: number;
    teamACoverage: number;
    teamBCoverage: number;
  }>;
};

export async function findRecentValorantMatch(
  _prevState: FindRecentResult,
  formData: FormData,
): Promise<FindRecentResult> {
  const messages = matchIdActionMessages[getActionLocale(formData)];
  const sessionUser = await requireUser();
  if (!sessionUser) return { ok: false, message: messages.loginRequired };
  if (!sessionUser.isAdmin) {
    return { ok: false, message: messages.adminsOnlySearch };
  }

  const matchId = getValue(formData, "matchId");
  if (!matchId) return { ok: false, message: messages.matchIdMissing };

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { teamAId: true, teamBId: true, scheduledAt: true },
  });

  if (!match?.teamAId || !match?.teamBId) {
    return {
      ok: false,
      message: messages.teamsRequiredSearch,
    };
  }

  const result = await findRecentCustomMatches({
    teamAId: match.teamAId,
    teamBId: match.teamBId,
    scheduledAt: match.scheduledAt,
  });

  if (!result.ok) return { ok: false, message: result.error };

  if (result.candidates.length === 0) {
    return {
      ok: true,
      message: messages.noRecentValorant,
      candidates: [],
    };
  }

  return {
    ok: true,
    message:
      result.candidates.length === 1
        ? messages.foundOneCandidate
        : formatActionMessage(messages.foundCandidates, {
            count: String(result.candidates.length),
          }),
    candidates: result.candidates.map((c) => ({
      valorantMatchId: c.valorantMatchId,
      minutesAgo: c.minutesAgo,
      teamACoverage: Math.round(c.teamACoverage * 100),
      teamBCoverage: Math.round(c.teamBCoverage * 100),
    })),
  };
}

// ─── Player/admin submits a Dota 2 match ID for verification ─────────────────

export type DotaVerifyResult = {
  ok: boolean;
  message: string;
  confidence?: "high" | "medium" | "rejected";
  checks?: Record<string, unknown>;
  reason?: string;
};

export async function submitDotaMatchId(
  _prevState: DotaVerifyResult,
  formData: FormData,
): Promise<DotaVerifyResult> {
  const messages = matchIdActionMessages[getActionLocale(formData)];
  const sessionUser = await requireUser();
  if (!sessionUser) {
    return { ok: false, message: messages.loginRequired };
  }

  const matchId = getValue(formData, "matchId");
  const gameNumberRaw = getValue(formData, "gameNumber");
  const dotaMatchId = getValue(formData, "dotaMatchId").trim();

  if (!matchId) return { ok: false, message: messages.matchIdMissing };
  if (!dotaMatchId) return { ok: false, message: messages.enterDotaMatchId };

  const gameNumber = parseInt(gameNumberRaw, 10);
  if (!Number.isFinite(gameNumber) || gameNumber < 1) {
    return { ok: false, message: messages.invalidGameNumber };
  }

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      teamAId: true,
      teamBId: true,
      scheduledAt: true,
      tournamentId: true,
      roundNumber: true,
      matchNumber: true,
      status: true,
      bestOf: true,
    },
  });

  if (!match) return { ok: false, message: messages.matchNotFound };
  if (!match.teamAId || !match.teamBId) {
    return { ok: false, message: messages.teamsRequiredVerification };
  }

  const terminal: string[] = ["completed", "confirmed", "cancelled", "forfeit", "bye"];
  if (terminal.includes(match.status)) {
    return { ok: false, message: messages.matchAlreadyFinal };
  }

  // Permission: user must be on one of the teams, or an admin.
  if (!sessionUser.isAdmin) {
    const membership = await prisma.teamMember.findFirst({
      where: {
        userId: sessionUser.id,
        teamId: { in: [match.teamAId, match.teamBId] },
      },
      select: { id: true },
    });
    const leaderTeam = membership
      ? null
      : await prisma.team.findFirst({
          where: {
            leaderId: sessionUser.id,
            id: { in: [match.teamAId, match.teamBId] },
          },
          select: { id: true },
        });
    if (!membership && !leaderTeam) {
      return { ok: false, message: messages.notParticipant };
    }
  }

  const verification = await verifyDotaMatch({
    dotaMatchId,
    tournamentId: match.tournamentId,
    matchId: match.id,
    teamAId: match.teamAId,
    teamBId: match.teamBId,
    scheduledAt: match.scheduledAt,
  });

  if (!verification.ok) {
    return { ok: false, message: verification.error };
  }

  const v = verification.result;

  // Persist the game row regardless of confidence.
  const existingGame = await prisma.tournamentMatchGame.findFirst({
    where: { matchId, gameNumber },
    select: { id: true },
  });

  const gameRow = existingGame
    ? await prisma.tournamentMatchGame.update({
        where: { id: existingGame.id },
        data: {
          externalMatchId: dotaMatchId,
          rawResult: v.raw as unknown as Prisma.InputJsonValue,
          status:
            v.confidence === "rejected"
              ? MatchGameStatus.cancelled
              : MatchGameStatus.pending,
        },
        select: { id: true },
      })
    : await prisma.tournamentMatchGame.create({
        data: {
          matchId,
          gameNumber,
          externalMatchId: dotaMatchId,
          rawResult: v.raw as unknown as Prisma.InputJsonValue,
          status:
            v.confidence === "rejected"
              ? MatchGameStatus.cancelled
              : MatchGameStatus.pending,
        },
        select: { id: true },
      });

  const checksSummary = {
    uniqueMatchId: v.checks.uniqueMatchId,
    lobbyType: v.checks.lobbyType,
    timeWindow: v.checks.timeWindow,
    teamACoverage: Math.round(v.checks.teamACoverage * 100),
    teamBCoverage: Math.round(v.checks.teamBCoverage * 100),
    winnerMapped: v.checks.winnerMapped,
  };

  if (v.confidence === "rejected") {
    revalidateMatchPaths(match.tournamentId);
    return {
      ok: false,
      message: formatActionMessage(messages.verificationRejected, {
        reason: v.reason ?? "",
      }),
      confidence: "rejected",
      checks: checksSummary,
      reason: v.reason,
    };
  }

  if (v.confidence === "high" && v.winnerTeamId) {
    const completeResult = await completeMatchGame(
      gameRow.id,
      v.winnerTeamId,
      v.raw as unknown as Prisma.InputJsonValue,
    );

    if (completeResult.ok && completeResult.data.seriesComplete) {
      await prisma.tournamentMatch.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.confirmed,
          winnerTeamId: v.winnerTeamId,
          completedAt: new Date(),
          version: { increment: 1 },
        },
      });
      await notifyMatchConfirmed(match, v.winnerTeamId);
      await advanceBracketAfterMatch(matchId);
    }

    revalidateMatchPaths(match.tournamentId);
    return {
      ok: true,
      message: messages.verifiedRecorded,
      confidence: "high",
      checks: checksSummary,
    };
  }

  // Medium confidence — store winnerTeamId, flag for admin review.
  if (v.winnerTeamId) {
    await prisma.tournamentMatchGame.update({
      where: { id: gameRow.id },
      data: { winnerTeamId: v.winnerTeamId },
    });
  }
  if (!terminal.includes(match.status)) {
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { status: MatchStatus.result_pending, version: { increment: 1 } },
    });
  }

  revalidateMatchPaths(match.tournamentId);
  return {
    ok: true,
    message: messages.mediumConfidence,
    confidence: "medium",
    checks: checksSummary,
    reason: v.reason,
  };
}

// ─── Admin: find recent Dota 2 matches for a match ───────────────────────────

export type FindRecentDotaResult = {
  ok: boolean;
  message: string;
  candidates?: Array<{
    dotaMatchId: string;
    minutesAgo: number;
    teamACoverage: number;
    teamBCoverage: number;
  }>;
};

export async function findRecentDotaMatch(
  _prevState: FindRecentDotaResult,
  formData: FormData,
): Promise<FindRecentDotaResult> {
  const messages = matchIdActionMessages[getActionLocale(formData)];
  const sessionUser = await requireUser();
  if (!sessionUser) return { ok: false, message: messages.loginRequired };
  if (!sessionUser.isAdmin) {
    return { ok: false, message: messages.adminsOnlySearch };
  }

  const matchId = getValue(formData, "matchId");
  if (!matchId) return { ok: false, message: messages.matchIdMissing };

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { teamAId: true, teamBId: true, scheduledAt: true },
  });

  if (!match?.teamAId || !match?.teamBId) {
    return { ok: false, message: messages.teamsRequiredSearch };
  }

  const result = await findRecentDotaMatches({
    teamAId: match.teamAId,
    teamBId: match.teamBId,
    scheduledAt: match.scheduledAt,
  });

  if (!result.ok) return { ok: false, message: result.error };

  if (result.candidates.length === 0) {
    return {
      ok: true,
      message: messages.noRecentDota,
      candidates: [],
    };
  }

  return {
    ok: true,
    message:
      result.candidates.length === 1
        ? messages.foundOneCandidate
        : formatActionMessage(messages.foundCandidates, {
            count: String(result.candidates.length),
          }),
    candidates: result.candidates.map((c) => ({
      dotaMatchId: c.dotaMatchId,
      minutesAgo: c.minutesAgo,
      teamACoverage: Math.round(c.teamACoverage * 100),
      teamBCoverage: Math.round(c.teamBCoverage * 100),
    })),
  };
}
