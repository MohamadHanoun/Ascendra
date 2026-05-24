"use server";

import { auth } from "@/auth";
import {
  createNotificationsOnceForUsers,
  getAdminNotificationUserIds,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const activeRegistrationStatuses = ["registered", "approved"];

function tournamentRedirect(message: string): never {
  redirect(`/tournaments?message=${encodeURIComponent(message)}`);
}

function tournamentError(error: string): never {
  redirect(`/tournaments?error=${encodeURIComponent(error)}`);
}

async function requireUser() {
  const session = await auth();

  if (!session?.user?.databaseId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.databaseId },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
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

export async function registerTeamForTournament(formData: FormData) {
  const user = await requireUser();

  const tournamentId = String(formData.get("tournamentId") || "").trim();
  const teamId = String(formData.get("teamId") || "").trim();

  if (!tournamentId || !teamId) {
    tournamentError("Tournament and team are required.");
  }

  if (!user.isGuildMember) {
    tournamentError(
      "You must be a member of the Ascendra Discord server to register.",
    );
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      registrations: {
        where: { status: { in: activeRegistrationStatuses } },
      },
    },
  });

  if (!tournament) {
    tournamentError("Tournament was not found.");
  }

  if (
    tournament.status !== "open" ||
    tournament.registrationStatus !== "open"
  ) {
    tournamentError("Registration is not open for this tournament.");
  }

  if (tournament.registrations.length >= tournament.maxTeams) {
    tournamentError("This tournament is already full.");
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) {
    tournamentError("Team was not found.");
  }

  if (team.leaderId !== user.id) {
    tournamentError("Only the team leader can register this team.");
  }

  if (team.status !== "approved") {
    tournamentError("Only approved teams can register for tournaments.");
  }

  if (team.gameId !== tournament.gameId) {
    tournamentError("This team does not match the tournament game.");
  }

  if (team.members.length < tournament.teamSize) {
    tournamentError(
      `This tournament requires at least ${tournament.teamSize} players.`,
    );
  }

  const leaderActiveRegistration =
    await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentId: tournament.id,
        status: { in: activeRegistrationStatuses },
        team: { leaderId: user.id },
      },
    });

  if (leaderActiveRegistration) {
    tournamentError("You already registered a team for this tournament.");
  }

  const existingRegistration = await prisma.tournamentRegistration.findUnique({
    where: {
      tournamentId_teamId: {
        tournamentId: tournament.id,
        teamId: team.id,
      },
    },
  });

  if (existingRegistration && existingRegistration.status !== "cancelled") {
    tournamentError("This team is already registered for this tournament.");
  }

  const registration = existingRegistration
    ? await prisma.tournamentRegistration.update({
        where: { id: existingRegistration.id },
        data: { status: "registered", registeredById: user.id },
      })
    : await prisma.tournamentRegistration.create({
        data: {
          tournamentId: tournament.id,
          teamId: team.id,
          registeredById: user.id,
          status: "registered",
        },
      });

  const teamUserIds = Array.from(
    new Set([team.leaderId, ...team.members.map((member) => member.userId)]),
  );

  await notifyRegistrationUsers({
    userIds: teamUserIds,
    type: "registration.submitted",
    title: "Registration submitted",
    message: `${team.name} registered for ${tournament.title}.`,
    href: `/tournaments/${tournament.id}`,
    registrationId: registration.id,
    tournamentId: tournament.id,
    teamId: team.id,
    dedupeKey: `registration.submitted:${registration.id}:team`,
  });

  await notifyRegistrationUsers({
    userIds: await getAdminNotificationUserIds(),
    type: "registration.submitted",
    title: "Registration submitted",
    message: `${team.name} registered for ${tournament.title}.`,
    href: "/admin?tab=registrations",
    registrationId: registration.id,
    tournamentId: tournament.id,
    teamId: team.id,
    dedupeKey: `registration.submitted:${registration.id}:admin`,
  });

  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${tournament.id}`);
  revalidatePath("/profile");
  revalidatePath("/admin");

  tournamentRedirect("Team registered successfully.");
}

export async function cancelTournamentRegistration(formData: FormData) {
  const user = await requireUser();

  const registrationId = String(
    formData.get("registrationId") || "",
  ).trim();

  if (!registrationId) {
    tournamentError("Registration ID is missing.");
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: { id: registrationId },
    include: { team: { include: { members: true } }, tournament: true },
  });

  if (!registration) {
    tournamentError("Registration was not found.");
  }

  if (registration.team.leaderId !== user.id) {
    tournamentError("Only the team leader can cancel this registration.");
  }

  if (registration.status === "cancelled") {
    tournamentError("This registration is already cancelled.");
  }

  await prisma.tournamentRegistration.update({
    where: { id: registration.id },
    data: { status: "cancelled" },
  });

  await notifyRegistrationUsers({
    userIds: Array.from(
      new Set([
        registration.team.leaderId,
        ...registration.team.members.map((member) => member.userId),
      ]),
    ),
    type: "registration.cancelled",
    title: "Registration cancelled",
    message: `Registration cancelled for ${registration.tournament.title}.`,
    href: `/tournaments/${registration.tournamentId}`,
    registrationId: registration.id,
    tournamentId: registration.tournamentId,
    teamId: registration.teamId,
    dedupeKey: `registration.cancelled:${registration.id}:team`,
  });

  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${registration.tournamentId}`);
  revalidatePath("/profile");
  revalidatePath("/admin");

  tournamentRedirect("Registration cancelled.");
}
