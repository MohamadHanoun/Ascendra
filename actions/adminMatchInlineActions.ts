"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import {
  adminOverrideMatchResult,
  confirmMatchResult,
  createMatchesForTournament,
} from "@/lib/tournamentMatchEngine";
import {
  createRiotTournament,
  createTournamentCodeForMatch,
} from "@/lib/gameIntegrations/riotLolAdapter";
import { notifyMatchRoomReady } from "@/lib/matchNotifications";
import { AuditStatus, GameProvider, MatchGameStatus, MatchStatus, Prisma, ReportStatus } from "@prisma/client";
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

function revalidate(tournamentId: string) {
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/matches`);
  revalidatePath("/admin");
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
  if (match) revalidate(match.tournamentId);

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
  if (match) revalidate(match.tournamentId);

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

  revalidate(match.tournamentId);
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

  revalidate(match.tournamentId);
  return ok("Game room created.");
}

// ─── Generate League of Legends tournament codes ─────────────────────────────

export async function generateLolCodesInline(
  formData: FormData,
): Promise<AdminMatchInlineResult> {
  const admin = await requireAdmin();
  if (!admin) return fail("Admin access required.");

  const matchId = str(formData, "matchId");
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
      bestOf: true,
      tournament: { select: { title: true } },
      games: { select: { id: true, gameNumber: true, externalRoomId: true } },
      room: { select: { id: true, provider: true } },
    },
  });
  if (!match) return fail("Match not found.");
  if (!match.teamAId || !match.teamBId) {
    return fail("Both teams must be assigned before generating LoL codes.");
  }

  const existingCodes = match.games.filter((g) => g.externalRoomId);
  if (existingCodes.length > 0 && !forceRecreate) {
    return fail(
      "This match already has LoL tournament codes. Set force-recreate to replace them.",
    );
  }

  const riotTournament = await createRiotTournament(
    `Ascendra · ${match.tournament.title}`,
  );
  if (!riotTournament.ok) {
    return fail(`Riot tournament creation failed: ${riotTournament.error}`);
  }

  const bestOf = Math.max(1, match.bestOf || 1);
  const generated: Array<{ gameNumber: number; matchGameId: string; code: string }> = [];

  await prisma.$transaction(async (tx) => {
    for (let n = 1; n <= bestOf; n += 1) {
      const existing = match.games.find((g) => g.gameNumber === n);
      const game = existing
        ? await tx.tournamentMatchGame.update({
            where: { id: existing.id },
            data: {
              status: MatchGameStatus.pending,
              externalRoomId: null,
              externalMatchId: null,
              winnerTeamId: null,
              teamAScore: 0,
              teamBScore: 0,
              rawResult: Prisma.JsonNull,
            },
            select: { id: true, gameNumber: true },
          })
        : await tx.tournamentMatchGame.create({
            data: {
              matchId,
              gameNumber: n,
              status: MatchGameStatus.pending,
            },
            select: { id: true, gameNumber: true },
          });
      generated.push({ gameNumber: game.gameNumber, matchGameId: game.id, code: "" });
    }
  });

  for (const entry of generated) {
    const codeResult = await createTournamentCodeForMatch({
      riotTournamentId: riotTournament.tournamentId,
      matchId,
      matchGameId: entry.matchGameId,
      gameNumber: entry.gameNumber,
      count: 1,
    });
    if (!codeResult.ok) {
      await writeAudit({
        action: "match.lol.code.failed",
        request: { matchId, gameNumber: entry.gameNumber, adminId: admin.id },
        ok: false,
        error: codeResult.error,
      });
      return fail(
        `Failed to generate Riot code for game ${entry.gameNumber}: ${codeResult.error}`,
      );
    }
    entry.code = codeResult.codes[0];
    await prisma.tournamentMatchGame.update({
      where: { id: entry.matchGameId },
      data: { externalRoomId: entry.code },
    });
  }

  if (match.room) {
    await prisma.gameRoom.delete({ where: { id: match.room.id } });
  }
  const firstCode = generated[0]?.code ?? null;
  await prisma.gameRoom.create({
    data: {
      matchId,
      provider: GameProvider.riot_lol,
      roomCode: firstCode,
      password: null,
      joinUrl: null,
      status: "open",
      metadata: {
        riotTournamentId: riotTournament.tournamentId,
        mode: process.env.RIOT_TOURNAMENT_MODE || "stub",
        codes: generated.map((g) => ({
          gameNumber: g.gameNumber,
          matchGameId: g.matchGameId,
          code: g.code,
        })),
        createdByAdminId: admin.id,
      },
    },
  });

  await notifyMatchRoomReady(match);

  await writeAudit({
    action: "match.lol.codes.generated",
    request: {
      matchId,
      adminId: admin.id,
      bestOf,
      riotTournamentId: riotTournament.tournamentId,
    },
    response: { codes: generated.map((g) => g.code) },
    ok: true,
  });

  if (match.tournamentId) revalidate(match.tournamentId);
  return ok(
    `Generated ${generated.length} League of Legends tournament code${generated.length === 1 ? "" : "s"}.`,
  );
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

// ─── Create / recreate CS2 game room ─────────────────────────────────────────
//
// GameRoom.metadata shape stored:
//   mode:             "manual" | "dedicated_server"
//   serverIp:         string   — e.g. "192.0.2.10"
//   serverPort:       string   — default "27015"
//   password:         string   — connect password shown to players
//   gotvUrl:          string   — GOTV spectator address shown to players
//   logSource:        string   — future log-relay identifier (not active)
//   createdByAdminId: string
//
// roomCode is set to "IP:Port" for quick display in the room panel.

export async function createCs2RoomInline(
  formData: FormData,
): Promise<AdminMatchInlineResult> {
  const admin = await requireAdmin();
  if (!admin) return fail("Admin access required.");

  const matchId = str(formData, "matchId");
  const serverIp = str(formData, "serverIp") || null;
  const serverPort = str(formData, "serverPort") || "27015";
  const password = str(formData, "password") || null;
  const gotvUrl = str(formData, "gotvUrl") || null;
  const logSource = str(formData, "logSource") || null;
  const mode = str(formData, "mode") === "dedicated_server" ? "dedicated_server" : "manual";
  const forceRecreate = str(formData, "forceRecreate") === "true";

  if (!matchId) return fail("Match ID is missing.");
  if (!serverIp) return fail("Server IP is required.");

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
      return fail("This match already has a room. Set force-recreate to replace it.");
    }
    await prisma.gameRoom.delete({ where: { id: match.room.id } });
  }

  const roomCode = `${serverIp}:${serverPort}`;

  await prisma.gameRoom.create({
    data: {
      matchId,
      provider: GameProvider.steam_cs2,
      roomCode,
      password,
      joinUrl: null,
      status: "open",
      metadata: {
        mode,
        serverIp,
        serverPort,
        password,
        gotvUrl,
        logSource,
        createdByAdminId: admin.id,
      } as Prisma.InputJsonValue,
    },
  });

  await notifyMatchRoomReady(match);

  await writeAudit({
    action: "match.cs2.room.created",
    request: {
      matchId,
      adminId: admin.id,
      serverIp,
      serverPort,
      mode,
      forceRecreate,
    },
    ok: true,
  });

  revalidate(match.tournamentId);
  return ok(`CS2 room created (${mode} mode) — ${roomCode}.`);
}
