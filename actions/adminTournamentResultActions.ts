"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";
import type { AdminTournamentActionResult } from "@/actions/adminTournamentInlineActions";

function success(message: string): AdminTournamentActionResult {
  return {
    ok: true,
    message,
  };
}

function fail(
  message: string,
  redirectTo?: string,
): AdminTournamentActionResult {
  return {
    ok: false,
    message,
    redirectTo,
  };
}

function getValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function getNumber(formData: FormData, name: string) {
  const value = Number(formData.get(name));

  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

async function requireAdmin(): Promise<AdminTournamentActionResult | null> {
  const session = await auth();

  const sessionUser = session?.user as
    | {
        databaseId?: string;
        isAdmin?: boolean;
      }
    | undefined;

  if (!sessionUser?.databaseId) {
    return fail("Please login first.", "/login");
  }

  if (!sessionUser.isAdmin) {
    return fail("Only Ascendra admins can manage tournament results.");
  }

  return null;
}

function revalidateResultViews(tournamentId: string) {
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/stats");
  revalidatePath("/profile");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
}

async function publishResultRealtimeEvents(tournamentId: string) {
  await Promise.all([
    createRealtimeEvent({
      type: "tournament.result.updated",
      audience: "public",
      entityType: "tournament",
      entityId: tournamentId,
      payload: {
        tournamentId,
      },
    }),
    createRealtimeEvent({
      type: "leaderboard.updated",
      audience: "public",
      entityType: "leaderboard",
      entityId: "global",
      payload: {
        tournamentId,
      },
    }),
    createRealtimeEvent({
      type: "profile.updated",
      audience: "public",
      entityType: "profile",
      entityId: "results",
      payload: {
        tournamentId,
      },
    }),
  ]);
}

export async function saveTournamentResultInline(
  formData: FormData,
): Promise<AdminTournamentActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const tournamentId = getValue(formData, "tournamentId");
  const teamId = getValue(formData, "teamId");
  const note = getValue(formData, "note") || null;
  const placement = getNumber(formData, "placement");
  const points = getNumber(formData, "points");

  if (!tournamentId) {
    return fail("Tournament ID is missing.");
  }

  if (!teamId) {
    return fail("Select a team first.");
  }

  if (!placement || placement < 1) {
    return fail("Placement must be at least 1.");
  }

  if (points === null || points < 0) {
    return fail("Points must be 0 or higher.");
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      tournamentId_teamId: {
        tournamentId,
        teamId,
      },
    },
    include: {
      tournament: true,
      team: true,
    },
  });

  if (!registration) {
    return fail("This team is not registered for this tournament.");
  }

  if (registration.status !== "approved") {
    return fail("Only approved teams can receive tournament results.");
  }

  const placementOwner = await prisma.tournamentResult.findFirst({
    where: {
      tournamentId,
      placement,
      NOT: {
        teamId,
      },
    },
    include: {
      team: {
        select: {
          name: true,
        },
      },
    },
  });

  if (placementOwner) {
    return fail(
      `Placement #${placement} is already assigned to ${placementOwner.team.name}.`,
    );
  }

  await prisma.tournamentResult.upsert({
    where: {
      tournamentId_teamId: {
        tournamentId,
        teamId,
      },
    },
    create: {
      tournamentId,
      teamId,
      placement,
      points,
      note,
    },
    update: {
      placement,
      points,
      note,
    },
  });

  await publishResultRealtimeEvents(tournamentId);

  revalidateResultViews(tournamentId);

  return success(
    `${registration.team.name} saved as #${placement} with ${points} tournament points.`,
  );
}

export async function deleteTournamentResultInline(
  formData: FormData,
): Promise<AdminTournamentActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const resultId = getValue(formData, "resultId");
  const tournamentId = getValue(formData, "tournamentId");

  if (!resultId) {
    return fail("Result ID is missing.");
  }

  const result = await prisma.tournamentResult.findUnique({
    where: {
      id: resultId,
    },
    include: {
      team: true,
    },
  });

  if (!result) {
    return fail("Tournament result was not found.");
  }

  await prisma.tournamentResult.delete({
    where: {
      id: result.id,
    },
  });

  const finalTournamentId = tournamentId || result.tournamentId;

  await publishResultRealtimeEvents(finalTournamentId);

  revalidateResultViews(finalTournamentId);

  return success(`${result.team.name} result deleted.`);
}
