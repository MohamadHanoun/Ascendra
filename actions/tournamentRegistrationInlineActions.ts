"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";

export type TournamentRegistrationActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

function success(
  message: string,
  redirectTo?: string,
): TournamentRegistrationActionResult {
  return {
    ok: true,
    message,
    redirectTo,
  };
}

function fail(
  message: string,
  redirectTo?: string,
): TournamentRegistrationActionResult {
  return {
    ok: false,
    message,
    redirectTo,
  };
}

function getValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.databaseId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: session.user.databaseId,
    },
  });
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

function shouldRequestRoleRemoval(status: string) {
  return !["not_needed", "removed"].includes(status);
}

function revalidateTournamentRegistrationViews(tournamentId: string) {
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");
  revalidatePath("/profile");
  revalidatePath("/admin");
}

async function publishRegistrationRealtimeEvent(params: {
  tournamentId: string;
  teamId: string;
  type: "registered" | "cancelled";
}) {
  await Promise.all([
    createRealtimeEvent({
      type: "tournament.registration.updated",
      audience: "public",
      entityType: "tournament",
      entityId: params.tournamentId,
      payload: params,
    }),

    createRealtimeEvent({
      type:
        params.type === "registered"
          ? "registration.registered"
          : "registration.cancelled",
      audience: "public",
      entityType: "team",
      entityId: params.teamId,
      payload: params,
    }),
  ]);
}

async function registerTeamForTournament(
  formData: FormData,
): Promise<TournamentRegistrationActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Please login first.", "/login");
  }

  if (!user.isGuildMember) {
    return fail("You must be an Ascendra Discord member to register.");
  }

  const tournamentId = getValue(formData, "tournamentId");
  const teamId = getValue(formData, "teamId");

  if (!tournamentId || !teamId) {
    return fail("Tournament and team are required.");
  }

  const tournament = await prisma.tournament.findUnique({
    where: {
      id: tournamentId,
    },
    include: {
      registrations: {
        where: {
          status: "approved",
        },
      },
    },
  });

  if (!tournament) {
    return fail("Tournament was not found.");
  }

  if (tournament.registrationStatus !== "open") {
    return fail("Registration is currently closed for this tournament.");
  }

  if (["closed", "cancelled", "ended"].includes(tournament.status)) {
    return fail("This tournament is not available for registration.");
  }

  if (tournament.registrations.length >= tournament.maxSlots) {
    return fail("All approved tournament slots are full.");
  }

  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
    include: {
      members: {
        include: {
          user: true,
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
      invites: {
        where: {
          status: "pending",
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!team) {
    return fail("Team was not found.");
  }

  if (team.leaderId !== user.id) {
    return fail("Only the team leader can register this team.");
  }

  if (team.game !== tournament.game) {
    return fail("This team does not match the tournament game.");
  }

  if (team.members.length < tournament.teamSize) {
    return fail(
      `This tournament requires ${tournament.teamSize} player${
        tournament.teamSize === 1 ? "" : "s"
      }.`,
    );
  }

  if (team.invites.length > 0) {
    return fail("Resolve pending team invites before registering.");
  }

  const existingRegistration = await prisma.tournamentRegistration.findUnique({
    where: {
      tournamentId_teamId: {
        tournamentId: tournament.id,
        teamId: team.id,
      },
    },
  });

  if (
    existingRegistration &&
    ["registered", "approved"].includes(existingRegistration.status)
  ) {
    return fail("This team is already registered for this tournament.");
  }

  const snapshotMembers = buildSnapshotMembers(team.members);

  if (existingRegistration) {
    await prisma.tournamentRegistration.update({
      where: {
        id: existingRegistration.id,
      },
      data: {
        status: "registered",
        registeredById: user.id,
        rejectionReason: null,
        approvedAt: null,
        cancelledAt: null,
        reviewedAt: null,

        snapshotTeamName: team.name,
        snapshotTeamGame: team.game,
        snapshotMembers,

        discordRoleStatus: "not_needed",
        discordRoleName: null,
        discordRoleId: null,
        discordChannelName: null,
        discordChannelId: null,
        discordRoleError: null,
        discordRoleRequestedAt: null,
        discordRoleSyncedAt: null,
      },
    });
  } else {
    await prisma.tournamentRegistration.create({
      data: {
        tournamentId: tournament.id,
        teamId: team.id,
        registeredById: user.id,
        status: "registered",

        snapshotTeamName: team.name,
        snapshotTeamGame: team.game,
        snapshotMembers,

        discordRoleStatus: "not_needed",
      },
    });
  }

  await publishRegistrationRealtimeEvent({
    tournamentId: tournament.id,
    teamId: team.id,
    type: "registered",
  });

  revalidateTournamentRegistrationViews(tournament.id);

  return success("Team registered successfully. Waiting for admin review.");
}

async function cancelTournamentRegistration(
  formData: FormData,
): Promise<TournamentRegistrationActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Please login first.", "/login");
  }

  const registrationId = getValue(formData, "registrationId");

  if (!registrationId) {
    return fail("Registration ID is missing.");
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      id: registrationId,
    },
    include: {
      team: true,
      tournament: true,
    },
  });

  if (!registration) {
    return fail("Registration was not found.");
  }

  if (registration.team.leaderId !== user.id) {
    return fail("Only the team leader can cancel this registration.");
  }

  if (registration.status === "cancelled") {
    return fail("This registration is already cancelled.");
  }

  if (registration.status === "approved") {
    return fail(
      "Approved registrations cannot be cancelled by players. Please contact an admin.",
    );
  }

  if (registration.tournament.registrationStatus !== "open") {
    return fail("Registration cancellation is closed for this tournament.");
  }

  if (
    ["closed", "cancelled", "ended"].includes(registration.tournament.status)
  ) {
    return fail("This tournament registration can no longer be cancelled.");
  }

  const needsRoleRemoval = shouldRequestRoleRemoval(
    registration.discordRoleStatus,
  );

  await prisma.tournamentRegistration.update({
    where: {
      id: registration.id,
    },
    data: {
      status: "cancelled",
      approvedAt: null,
      cancelledAt: new Date(),
      reviewedAt: new Date(),

      discordRoleStatus: needsRoleRemoval ? "pending_remove" : "not_needed",
      discordRoleError: null,
      discordRoleRequestedAt: needsRoleRemoval ? new Date() : null,
      discordRoleSyncedAt: null,
    },
  });

  await publishRegistrationRealtimeEvent({
    tournamentId: registration.tournamentId,
    teamId: registration.teamId,
    type: "cancelled",
  });

  revalidateTournamentRegistrationViews(registration.tournamentId);

  return success("Registration cancelled successfully.");
}

export async function registerRegistrationInline(
  formData: FormData,
): Promise<TournamentRegistrationActionResult> {
  return registerTeamForTournament(formData);
}

export async function cancelRegistrationInline(
  formData: FormData,
): Promise<TournamentRegistrationActionResult> {
  return cancelTournamentRegistration(formData);
}

export async function registerTeamForTournamentInline(
  formData: FormData,
): Promise<TournamentRegistrationActionResult> {
  return registerTeamForTournament(formData);
}

export async function cancelTournamentRegistrationInline(
  formData: FormData,
): Promise<TournamentRegistrationActionResult> {
  return cancelTournamentRegistration(formData);
}
