"use server";

import { revalidatePath } from "next/cache";

import type { AdminTournamentActionResult } from "@/actions/adminTournamentInlineActions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";
import { awardTournamentResultsAndPoints } from "@/lib/tournamentResults";
import {
  getServerLogErrorMessage,
  logServerBotError,
  logServerTournamentAction,
} from "@/lib/serverDiscordLogs";

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
  revalidatePath("/tournaments");
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

function buildSnapshotMembers(
  members: Array<{
    id: string;
    role: string;
    joinedAt: Date;
    user: {
      id: string;
      discordId: string;
      username: string;
      avatar: string | null;
    };
  }>,
) {
  return members.map((member) => ({
    memberId: member.id,
    userId: member.user.id,
    discordId: member.user.discordId,
    username: member.user.username,
    avatar: member.user.avatar,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
  }));
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
      team: {
        include: {
          game: { select: { name: true } },
          members: {
            include: {
              user: true,
            },
            orderBy: {
              joinedAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!registration) {
    return fail("This team is not registered for this tournament.");
  }

  if (registration.tournament.status === "cancelled") {
    return fail("Cancelled tournaments cannot receive results.");
  }

  if (registration.status !== "approved") {
    return fail("Only approved teams can receive tournament results.");
  }

  const existingResult = await prisma.tournamentResult.findUnique({
    where: {
      tournamentId_teamId: {
        tournamentId,
        teamId,
      },
    },
  });

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
      `Placement #${placement} is already assigned to ${placementOwner.snapshotTeamName || placementOwner.team.name}.`,
    );
  }

  const snapshotTeamName =
    existingResult?.snapshotTeamName ||
    registration.snapshotTeamName ||
    registration.team.name;

  const snapshotTeamGame =
    (existingResult?.snapshotTeamGame ||
      registration.snapshotTeamGame ||
      registration.team.game?.name) ?? null;

  const snapshotMembers =
    existingResult?.snapshotMembers ||
    registration.snapshotMembers ||
    buildSnapshotMembers(registration.team.members);

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
      snapshotTeamName,
      snapshotTeamGame,
      snapshotMembers,
    },
    update: {
      placement,
      points,
      note,
      snapshotTeamName,
      snapshotTeamGame,
      snapshotMembers,
    },
  });

  // Best-effort: sync ranking point events from completed bracket results.
  // Idempotent via dedupeKey; skips safely when bracket is not yet complete.
  try {
    await awardTournamentResultsAndPoints(tournamentId, { revalidateViews: false });
  } catch {
    // Non-blocking — point award failure must not prevent result save.
  }

  await publishResultRealtimeEvents(tournamentId);

  revalidateResultViews(tournamentId);

  try {
    const topResults = await prisma.tournamentResult.findMany({
      where: { tournamentId },
      orderBy: { placement: "asc" },
      select: {
        snapshotTeamName: true,
        team: { select: { name: true } },
      },
    });

    const winner = topResults[0];
    const runnerUp = topResults[1];

    await logServerTournamentAction({
      title: "Final standings updated",
      fields: [
        {
          name: "Tournament",
          value: registration.tournament.title,
          inline: false,
        },
        {
          name: "Winner",
          value: winner ? winner.snapshotTeamName || winner.team.name : null,
        },
        {
          name: "Runner-up",
          value: runnerUp ? runnerUp.snapshotTeamName || runnerUp.team.name : null,
        },
        { name: "Results count", value: topResults.length },
        { name: "Leaderboard", value: "Updated" },
      ],
    });
  } catch (error) {
    void logServerBotError({
      title: "Final standings notification failed",
      fields: [
        {
          name: "Tournament",
          value: registration.tournament.title,
          inline: false,
        },
        { name: "Reason", value: getServerLogErrorMessage(error) },
      ],
    });
  }

  return success(
    `${snapshotTeamName} saved as #${placement} with ${points} tournament points.`,
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

  return success(
    `${result.snapshotTeamName || result.team.name} result deleted.`,
  );
}
