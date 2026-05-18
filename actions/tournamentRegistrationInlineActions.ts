"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type TournamentRegistrationActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

function success(message: string): TournamentRegistrationActionResult {
  return {
    ok: true,
    message,
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

async function registerTeamForTournament(
  formData: FormData,
): Promise<TournamentRegistrationActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Please login first.", "/login");
  }

  if (!user.isGuildMember) {
    return fail("You must be an RTN Discord member to register.");
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
          status: {
            in: ["registered", "approved"],
          },
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

  if (["closed", "cancelled"].includes(tournament.status)) {
    return fail("This tournament is not available for registration.");
  }

  if (tournament.registrations.length >= tournament.maxSlots) {
    return fail("This tournament is full.");
  }

  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
    include: {
      members: true,
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
      `This tournament requires at least ${tournament.teamSize} player${
        tournament.teamSize === 1 ? "" : "s"
      }.`,
    );
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
      },
    });
  } else {
    await prisma.tournamentRegistration.create({
      data: {
        tournamentId: tournament.id,
        teamId: team.id,
        registeredById: user.id,
        status: "registered",
      },
    });
  }

  revalidatePath(`/tournaments/${tournament.id}`);
  revalidatePath("/profile");
  revalidatePath("/admin");

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

  await prisma.tournamentRegistration.update({
    where: {
      id: registration.id,
    },
    data: {
      status: "cancelled",
      approvedAt: null,
      cancelledAt: new Date(),
      reviewedAt: new Date(),
    },
  });

  revalidatePath(`/tournaments/${registration.tournamentId}`);
  revalidatePath("/profile");
  revalidatePath("/admin");

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
