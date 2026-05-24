"use server";

import { auth } from "@/auth";
import { createNotificationsOnceForUsers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/login");
  }
}

function redirectWithMessage(message: string): never {
  redirect(`/admin?tab=registrations&message=${encodeURIComponent(message)}`);
}

function redirectWithError(error: string): never {
  redirect(`/admin?tab=registrations&error=${encodeURIComponent(error)}`);
}

async function notifyRegistrationUsers(input: {
  userIds: string[];
  type: string;
  title: string;
  message: string;
  href: string;
  registrationId: string;
  tournamentId: string;
  teamId: string;
  dedupeKey: string;
}) {
  try {
    await createNotificationsOnceForUsers({
      userIds: input.userIds,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href,
      dedupeKey: input.dedupeKey,
      metadata: {
        registrationId: input.registrationId,
        tournamentId: input.tournamentId,
        teamId: input.teamId,
      },
    });
  } catch (error) {
    console.error(
      "[RegistrationNotifications] Failed to create notifications:",
      error,
    );
  }
}

export async function approveTournamentRegistration(formData: FormData) {
  await requireAdmin();

  const registrationId = String(formData.get("registrationId") || "").trim();

  if (!registrationId) {
    redirectWithError("Registration ID is missing.");
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      id: registrationId,
    },
    include: {
      tournament: true,
      team: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!registration) {
    redirectWithError("Registration was not found.");
  }

  if (registration.status === "approved") {
    redirectWithError("Registration is already approved.");
  }

  if (registration.status === "cancelled") {
    redirectWithError("Cancelled registrations cannot be approved.");
  }

  await prisma.tournamentRegistration.update({
    where: {
      id: registration.id,
    },
    data: {
      status: "approved",
    },
  });

  await notifyRegistrationUsers({
    userIds: [
      registration.team.leaderId,
      ...registration.team.members.map((member) => member.userId),
    ],
    type: "registration.approved",
    title: "Registration approved",
    message: `Registration approved for ${registration.tournament.title}.`,
    href: `/tournaments/${registration.tournamentId}`,
    registrationId: registration.id,
    tournamentId: registration.tournamentId,
    teamId: registration.teamId,
    dedupeKey: `registration.approved:${registration.id}`,
  });

  revalidatePath("/admin");
  revalidatePath("/tournaments");
  revalidatePath("/profile");

  redirectWithMessage("Registration approved successfully.");
}

export async function cancelTournamentRegistrationAsAdmin(formData: FormData) {
  await requireAdmin();

  const registrationId = String(formData.get("registrationId") || "").trim();

  if (!registrationId) {
    redirectWithError("Registration ID is missing.");
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
    redirectWithError("Registration was not found.");
  }

  if (registration.status === "cancelled") {
    redirectWithError("Registration is already cancelled.");
  }

  await prisma.tournamentRegistration.update({
    where: {
      id: registration.id,
    },
    data: {
      status: "cancelled",
    },
  });

  await notifyRegistrationUsers({
    userIds: [registration.team.leaderId],
    type: "registration.cancelled",
    title: "Registration cancelled",
    message: `Registration cancelled for ${registration.tournament.title}.`,
    href: `/tournaments/${registration.tournamentId}`,
    registrationId: registration.id,
    tournamentId: registration.tournamentId,
    teamId: registration.teamId,
    dedupeKey: `registration.cancelled:${registration.id}`,
  });

  revalidatePath("/admin");
  revalidatePath("/tournaments");
  revalidatePath("/profile");

  redirectWithMessage("Registration cancelled.");
}
