"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AdminRegistrationActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

function success(message: string): AdminRegistrationActionResult {
  return {
    ok: true,
    message,
  };
}

function fail(
  message: string,
  redirectTo?: string,
): AdminRegistrationActionResult {
  return {
    ok: false,
    message,
    redirectTo,
  };
}

async function requireAdmin(): Promise<AdminRegistrationActionResult | null> {
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
    return fail("Only Ascendra admins can manage tournament registrations.");
  }

  return null;
}

function getRegistrationId(formData: FormData) {
  return String(
    formData.get("registrationId") || formData.get("id") || "",
  ).trim();
}

function normalizeRolePart(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s#._-]/gu, "")
    .trim()
    .slice(0, 40);
}

function buildTournamentRoleName({
  tournamentTitle,
  teamName,
}: {
  tournamentTitle: string;
  teamName: string;
}) {
  const tournament = normalizeRolePart(tournamentTitle) || "Tournament";
  const team = normalizeRolePart(teamName) || "Team";

  return `Ascendra | ${tournament} | ${team}`.slice(0, 95);
}

function shouldRequestRoleRemoval(status: string) {
  return !["not_needed", "removed"].includes(status);
}

function revalidateRegistrationViews(tournamentId: string) {
  revalidatePath("/admin");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");
  revalidatePath("/profile");
}

export async function approveRegistrationInline(
  formData: FormData,
): Promise<AdminRegistrationActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const registrationId = getRegistrationId(formData);

  if (!registrationId) {
    return fail("Registration ID is missing.");
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      id: registrationId,
    },
    include: {
      tournament: true,
      team: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!registration) {
    return fail("Registration was not found.");
  }

  if (registration.status === "approved") {
    return fail("This registration is already approved.");
  }

  const roleName = buildTournamentRoleName({
    tournamentTitle: registration.tournament.title,
    teamName: registration.team.name,
  });

  const nextDiscordRoleStatus =
    registration.discordRoleId && registration.discordRoleStatus === "active"
      ? "active"
      : "pending_create";

  await prisma.tournamentRegistration.update({
    where: {
      id: registration.id,
    },
    data: {
      status: "approved",
      rejectionReason: null,
      approvedAt: new Date(),
      reviewedAt: new Date(),
      discordRoleStatus: nextDiscordRoleStatus,
      discordRoleName: roleName,
      discordRoleError: null,
      discordRoleRequestedAt: new Date(),
      discordRoleSyncedAt:
        nextDiscordRoleStatus === "active"
          ? registration.discordRoleSyncedAt
          : null,
    },
  });

  revalidateRegistrationViews(registration.tournamentId);

  return success(
    "Registration approved. Discord role creation is queued for the bot.",
  );
}

export async function rejectRegistrationInline(
  formData: FormData,
): Promise<AdminRegistrationActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const registrationId = getRegistrationId(formData);
  const rejectionReason = String(formData.get("rejectionReason") || "").trim();

  if (!registrationId) {
    return fail("Registration ID is missing.");
  }

  if (!rejectionReason) {
    return fail("Rejection reason is required.");
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      id: registrationId,
    },
    include: {
      tournament: true,
      team: true,
    },
  });

  if (!registration) {
    return fail("Registration was not found.");
  }

  const needsRoleRemoval = shouldRequestRoleRemoval(
    registration.discordRoleStatus,
  );

  await prisma.tournamentRegistration.update({
    where: {
      id: registration.id,
    },
    data: {
      status: "rejected",
      rejectionReason,
      reviewedAt: new Date(),
      approvedAt: null,
      discordRoleStatus: needsRoleRemoval ? "pending_remove" : "not_needed",
      discordRoleError: null,
      discordRoleRequestedAt: needsRoleRemoval ? new Date() : null,
      discordRoleSyncedAt: null,
    },
  });

  revalidateRegistrationViews(registration.tournamentId);

  return success(
    needsRoleRemoval
      ? "Registration rejected. Discord role removal is queued for the bot."
      : "Registration rejected successfully.",
  );
}

export async function cancelRegistrationInline(
  formData: FormData,
): Promise<AdminRegistrationActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const registrationId = getRegistrationId(formData);

  if (!registrationId) {
    return fail("Registration ID is missing.");
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      id: registrationId,
    },
    include: {
      tournament: true,
      team: true,
    },
  });

  if (!registration) {
    return fail("Registration was not found.");
  }

  if (registration.status === "cancelled") {
    return fail("This registration is already cancelled.");
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
      reviewedAt: new Date(),
      cancelledAt: new Date(),
      approvedAt: null,
      discordRoleStatus: needsRoleRemoval ? "pending_remove" : "not_needed",
      discordRoleError: null,
      discordRoleRequestedAt: needsRoleRemoval ? new Date() : null,
      discordRoleSyncedAt: null,
    },
  });

  revalidateRegistrationViews(registration.tournamentId);

  return success(
    needsRoleRemoval
      ? "Registration cancelled. Discord role removal is queued for the bot."
      : "Registration cancelled successfully.",
  );
}
