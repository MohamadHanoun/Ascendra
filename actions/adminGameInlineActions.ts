"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AdminGameActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

function success(message: string): AdminGameActionResult {
  return { ok: true, message };
}

function fail(message: string, redirectTo?: string): AdminGameActionResult {
  return { ok: false, message, redirectTo };
}

function getValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function getInt(formData: FormData, name: string, fallback: number) {
  const raw = getValue(formData, name);
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? fallback : parsed;
}

async function requireAdmin(): Promise<AdminGameActionResult | null> {
  const session = await auth();

  const sessionUser = session?.user as
    | { databaseId?: string; isAdmin?: boolean }
    | undefined;

  if (!sessionUser?.databaseId) {
    return fail("Please login first.", "/login");
  }

  if (!sessionUser.isAdmin) {
    return fail("Only Ascendra admins can manage games.");
  }

  return null;
}

function validateGameForm(formData: FormData) {
  const name = getValue(formData, "name");
  const slug = getValue(formData, "slug");
  const shortName = getValue(formData, "shortName") || null;
  const description = getValue(formData, "description") || null;
  const platform = getValue(formData, "platform") || null;
  const defaultTeamSize = getInt(formData, "defaultTeamSize", 5);
  const defaultSubstitutes = getInt(formData, "defaultSubstitutes", 0);

  if (!name) {
    return { ok: false as const, message: "Game name is required." };
  }

  if (!slug) {
    return { ok: false as const, message: "Game slug is required." };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      ok: false as const,
      message:
        "Slug must contain only lowercase letters, numbers, and hyphens.",
    };
  }

  if (defaultTeamSize < 1 || defaultTeamSize > 20) {
    return {
      ok: false as const,
      message: "Default team size must be between 1 and 20.",
    };
  }

  return {
    ok: true as const,
    data: {
      name,
      slug,
      shortName,
      description,
      platform,
      defaultTeamSize,
      defaultSubstitutes,
    },
  };
}

function revalidateGamePaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/games");
  revalidatePath("/games");
  revalidatePath("/");
}

export async function createGameInline(
  formData: FormData,
): Promise<AdminGameActionResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const validation = validateGameForm(formData);
  if (!validation.ok) return fail(validation.message);

  const existing = await prisma.game.findUnique({
    where: { slug: validation.data.slug },
  });

  if (existing) {
    return fail("A game with this slug already exists.");
  }

  await prisma.game.create({ data: validation.data });

  revalidateGamePaths();

  return success("Game created successfully.");
}

export async function updateGameInline(
  formData: FormData,
): Promise<AdminGameActionResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const gameId = getValue(formData, "gameId");
  if (!gameId) return fail("Game ID is missing.");

  const validation = validateGameForm(formData);
  if (!validation.ok) return fail(validation.message);

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return fail("Game was not found.");

  const slugConflict = await prisma.game.findFirst({
    where: { slug: validation.data.slug, NOT: { id: gameId } },
  });

  if (slugConflict) {
    return fail("A game with this slug already exists.");
  }

  await prisma.game.update({
    where: { id: gameId },
    data: validation.data,
  });

  revalidateGamePaths();

  return success("Game updated successfully.");
}

export async function activateGameInline(
  formData: FormData,
): Promise<AdminGameActionResult> {
  return setGameActiveStatus(formData, true);
}

export async function deactivateGameInline(
  formData: FormData,
): Promise<AdminGameActionResult> {
  return setGameActiveStatus(formData, false);
}

async function setGameActiveStatus(
  formData: FormData,
  isActive: boolean,
): Promise<AdminGameActionResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const gameId = getValue(formData, "gameId");
  if (!gameId) return fail("Game ID is missing.");

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return fail("Game was not found.");

  await prisma.game.update({ where: { id: gameId }, data: { isActive } });

  revalidateGamePaths();

  return success(isActive ? "Game activated." : "Game deactivated.");
}

export async function deleteGameInline(
  formData: FormData,
): Promise<AdminGameActionResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const gameId = getValue(formData, "gameId");
  if (!gameId) return fail("Game ID is missing.");

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      _count: { select: { tournaments: true, teams: true } },
    },
  });

  if (!game) return fail("Game was not found.");

  if (game._count.tournaments > 0 || game._count.teams > 0) {
    return fail(
      `Cannot delete — this game has ${game._count.tournaments} tournament(s) and ${game._count.teams} team(s) linked to it.`,
    );
  }

  await prisma.game.delete({ where: { id: gameId } });

  revalidateGamePaths();

  return success("Game deleted successfully.");
}
