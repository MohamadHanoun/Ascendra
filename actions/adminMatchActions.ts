"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AdminMatchActionResult = {
  ok: boolean;
  message: string;
};

function success(message: string): AdminMatchActionResult {
  return { ok: true, message };
}

function fail(message: string): AdminMatchActionResult {
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

function getDate(formData: FormData, name: string): Date | null {
  const value = getValue(formData, name);
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

async function requireAdmin(): Promise<AdminMatchActionResult | null> {
  const session = await auth();

  const sessionUser = session?.user as
    | { databaseId?: string; isAdmin?: boolean }
    | undefined;

  if (!sessionUser?.databaseId) return fail("Please login first.");
  if (!sessionUser.isAdmin) return fail("Only Ascendra admins can manage matches.");

  return null;
}

function revalidateMatchPaths(tournamentId: string) {
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath("/admin");
}

export async function createMatch(
  formData: FormData,
): Promise<AdminMatchActionResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const tournamentId = getValue(formData, "tournamentId");
  if (!tournamentId) return fail("Tournament ID is missing.");

  const round = getInt(formData, "round", 0);
  const matchNumber = getInt(formData, "matchNumber", 0);

  if (round < 1) return fail("Round must be at least 1.");
  if (matchNumber < 1) return fail("Match number must be at least 1.");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) return fail("Tournament was not found.");

  const teamAId = getValue(formData, "teamAId") || null;
  const teamBId = getValue(formData, "teamBId") || null;
  const scheduledAt = getDate(formData, "scheduledAt");
  const bestOfRaw = getInt(formData, "bestOf", 1);
  const bestOf = [1, 3, 5, 7].includes(bestOfRaw) ? bestOfRaw : 1;
  const notes = getValue(formData, "notes") || null;

  if (teamAId) {
    const regA = await prisma.tournamentRegistration.findFirst({
      where: { tournamentId, teamId: teamAId, status: "approved" },
    });
    if (!regA) {
      return fail("Team A is not an approved participant in this tournament.");
    }
  }

  if (teamBId) {
    const regB = await prisma.tournamentRegistration.findFirst({
      where: { tournamentId, teamId: teamBId, status: "approved" },
    });
    if (!regB) {
      return fail("Team B is not an approved participant in this tournament.");
    }
  }

  const existing = await prisma.match.findUnique({
    where: {
      tournamentId_round_matchNumber: { tournamentId, round, matchNumber },
    },
  });
  if (existing) {
    return fail(`Match R${round}·M${matchNumber} already exists.`);
  }

  await prisma.match.create({
    data: { tournamentId, round, matchNumber, teamAId, teamBId, scheduledAt, bestOf, notes },
  });

  revalidateMatchPaths(tournamentId);
  return success("Match created successfully.");
}

export async function updateMatchScore(
  formData: FormData,
): Promise<AdminMatchActionResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const matchId = getValue(formData, "matchId");
  if (!matchId) return fail("Match ID is missing.");

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return fail("Match was not found.");

  const scoreA = getInt(formData, "scoreA", 0);
  const scoreB = getInt(formData, "scoreB", 0);
  const winnerTeamId = getValue(formData, "winnerTeamId") || null;

  await prisma.match.update({
    where: { id: matchId },
    data: { scoreA, scoreB, winnerTeamId, status: "completed" },
  });

  revalidateMatchPaths(match.tournamentId);
  return success("Score updated.");
}

export async function updateMatchStatus(
  formData: FormData,
): Promise<AdminMatchActionResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const matchId = getValue(formData, "matchId");
  if (!matchId) return fail("Match ID is missing.");

  const status = getValue(formData, "status");
  const allowed = ["pending", "scheduled", "live", "completed", "cancelled"];
  if (!allowed.includes(status)) return fail("Invalid match status.");

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return fail("Match was not found.");

  await prisma.match.update({ where: { id: matchId }, data: { status } });

  revalidateMatchPaths(match.tournamentId);
  return success(`Match status set to ${status}.`);
}

export async function confirmMatchResult(
  formData: FormData,
): Promise<AdminMatchActionResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const matchId = getValue(formData, "matchId");
  if (!matchId) return fail("Match ID is missing.");

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return fail("Match was not found.");

  await prisma.match.update({
    where: { id: matchId },
    data: { confirmedByAdmin: true },
  });

  revalidateMatchPaths(match.tournamentId);
  return success("Match result confirmed.");
}

export async function deleteMatch(
  formData: FormData,
): Promise<AdminMatchActionResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const matchId = getValue(formData, "matchId");
  if (!matchId) return fail("Match ID is missing.");

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return fail("Match was not found.");

  await prisma.match.delete({ where: { id: matchId } });

  revalidateMatchPaths(match.tournamentId);
  return success("Match deleted.");
}
