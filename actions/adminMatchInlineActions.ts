"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import {
  adminOverrideMatchResult,
  confirmMatchResult,
  createMatchesForTournament,
} from "@/lib/tournamentMatchEngine";
import { notifyMatchRoomReady } from "@/lib/matchNotifications";
import { AuditStatus, GameProvider, MatchStatus, Prisma, ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Same shape as AdminTeamActionResult — compatible for InlineAdminActionForm
export type AdminMatchInlineResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

function ok(message: string): AdminMatchInlineResult {
  return { ok: true, message };
}

function fail(message: string): AdminMatchInlineResult {
  return { ok: false, message };
}

function str(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function num(formData: FormData, name: string, fallback: number) {
  const v = parseInt(str(formData, name), 10);
  return isNaN(v) ? fallback : v;
}

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { databaseId?: string; isAdmin?: boolean } | undefined;
  if (!user?.databaseId) return null;
  if (!user.isAdmin) return null;
  return { id: user.databaseId };
}

function revalidate(tournamentId: string, matchId?: string) {
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/admin/tournaments/${tournamentId}/matches`);
  revalidatePath("/admin/match-operations");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/matches`);
  if (matchId) {
    revalidatePath(`/tournaments/${tournamentId}/matches/${matchId}`);
  }
  revalidatePath("/admin");
  revalidatePath("/profile/matches");
}

async function writeAudit(opts: {
  action: string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  ok: boolean;
  error?: string;
}) {
  try {
    await prisma.gameApiAuditLog.create({
      data: {
        provider: GameProvider.manual,
        action: opts.action,
        request: opts.request ? (opts.request as Prisma.InputJsonValue) : Prisma.JsonNull,
        response: opts.response ? (opts.response as Prisma.InputJsonValue) : Prisma.JsonNull,
        status: opts.ok ? AuditStatus.success : AuditStatus.failure,
        error: opts.error ?? null,
      },
    });
  } catch {
    // audit log must never break the action
  }
}

// ─── Confirm reported result ──────────────────────────────────────────────────

export async function confirmMatchInline(
  formData: FormData,
): Promise<AdminMatchInlineResult> {
  const admin = await requireAdmin();
  if (!admin) return fail("Admin access required.");

  const matchId = str(formData, "matchId");
  if (!matchId) return fail("Match ID is missing.");

  const result = await confirmMatchResult(matchId, admin.id);
  if (!result.ok) return fail(result.error);

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { tournamentId: true },
  });
  if (match) revalidate(match.tournamentId, matchId);

  return ok("Match result confirmed.");
}

// ─── Admin override ───────────────────────────────────────────────────────────

export async function overrideMatchInline(
  formData: FormData,
): Promise<AdminMatchInlineResult> {
  const admin = await requireAdmin();
  if (!admin) return fail("Admin access required.");

  const matchId = str(formData, "matchId");
  const winnerTeamId = str(formData, "winnerTeamId");
  if (!matchId) return fail("Match ID is missing.");
  if (!winnerTeamId) return fail("Winner team is required.");

  const teamAScore = num(formData, "teamAScore", -1);
  const teamBScore = num(formData, "teamBScore", -1);
  if (teamAScore < 0 || teamBScore < 0) return fail("Both scores are required.");

  const note = str(formData, "note") || null;

  const result = await adminOverrideMatchResult({
    matchId,
    adminUserId: admin.id,
    winnerTeamId,
    teamAScore,
    teamBScore,
    note,
  });
  if (!result.ok) return fail(result.error);

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { tournamentId: true },
  });
  if (match) revalidate(match.tournamentId, matchId);

  return ok("Match result overridden.");
}

// ─── Reset match result ───────────────────────────────────────────────────────

export async function resetMatchInline(
  formData: FormData,
): Promise<AdminMatchInlineResult> {
  const admin = await requireAdmin();
  if (!admin) return fail("Admin access required.");

  const matchId = str(formData, "matchId");
  if (!matchId) return fail("Match ID is missing.");

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { id: true, status: true, tournamentId: true },
  });
  if (!match) return fail("Match not found.");

  const nonResettable: string[] = [
    MatchStatus.scheduled,
    MatchStatus.ready,
    MatchStatus.room_created,
    MatchStatus.in_progress,
    MatchStatus.bye,
    MatchStatus.cancelled,
  ];
  if (nonResettable.includes(match.status)) {
    return fail(`Cannot reset a match with status "${match.status}".`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.matchReport.updateMany({
      where: {
        matchId,
        status: { in: [ReportStatus.confirmed, ReportStatus.submitted] },
      },
      data: { status: ReportStatus.superseded },
    });

    const hasReports = await tx.matchReport.count({ where: { matchId } });

    await tx.tournamentMatch.update({
      where: { id: matchId },
      data: {
        status: hasReports > 0 ? MatchStatus.result_pending : MatchStatus.scheduled,
        winnerTeamId: null,
        completedAt: null,
        version: { increment: 1 },
      },
    });
  });

  await writeAudit({
    action: "match.admin.reset",
    request: { matchId, adminId: admin.id },
    ok: true,
  });

  revalidate(match.tournamentId, match.id);
  return ok("Match result cleared. Status reset to result pending.");
}

// ─── Create / recreate game room ──────────────────────────────────────────────

export async function createMatchRoomInline(
  formData: FormData,
): Promise<AdminMatchInlineResult> {
  const admin = await requireAdmin();
  if (!admin) return fail("Admin access required.");

  const matchId = str(formData, "matchId");
  const roomCode = str(formData, "roomCode") || null;
  const password = str(formData, "password") || null;
  const joinUrl = str(formData, "joinUrl") || null;
  const forceRecreate = str(formData, "forceRecreate") === "true";

  if (!matchId) return fail("Match ID is missing.");

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      tournamentId: true,
      roundNumber: true,
      matchNumber: true,
      teamAId: true,
      teamBId: true,
      room: { select: { id: true } },
    },
  });
  if (!match) return fail("Match not found.");

  if (!match.teamAId || !match.teamBId) {
    return fail("Both teams must be assigned before creating a room.");
  }

  if (match.room) {
    if (!forceRecreate) {
      return fail(
        "This match already has a room. Set force-recreate to replace it.",
      );
    }
    await prisma.gameRoom.delete({ where: { id: match.room.id } });
  }

  await prisma.gameRoom.create({
    data: {
      matchId,
      provider: GameProvider.manual,
      roomCode,
      password,
      joinUrl,
      status: "open",
      metadata: { createdByAdminId: admin.id },
    },
  });

  await notifyMatchRoomReady(match);

  await writeAudit({
    action: "match.room.created",
    request: { matchId, adminId: admin.id, roomCode, forceRecreate },
    ok: true,
  });

  revalidate(match.tournamentId, match.id);
  return ok("Game room created.");
}

// ─── Generate tournament bracket ──────────────────────────────────────────────

export async function generateBracketInline(
  formData: FormData,
): Promise<AdminMatchInlineResult> {
  const admin = await requireAdmin();
  if (!admin) return fail("Admin access required.");

  const tournamentId = str(formData, "tournamentId");
  if (!tournamentId) return fail("Tournament ID is missing.");

  // Safety guard: never generate a bracket while registration is still open —
  // teams approved after generation would be silently excluded from the bracket.
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { registrationStatus: true },
  });
  if (!tournament) return fail("Tournament was not found.");
  if (tournament.registrationStatus === "open") {
    return fail(
      "Close registration before generating the bracket. Generating now could exclude teams approved later.",
    );
  }

  const result = await createMatchesForTournament(tournamentId);
  if (!result.ok) return fail(result.error);

  revalidate(tournamentId);
  return ok(
    `Bracket generated: ${result.data.created} match${result.data.created === 1 ? "" : "es"} across ${result.data.rounds} round${result.data.rounds === 1 ? "" : "s"}.`,
  );
}

// ─── Manual CS2 dedicated-server rooms were removed in 9d-12 (unused).
//     Admins create manual rooms via createMatchRoomInline.
