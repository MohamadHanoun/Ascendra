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

  return session.user;
}

function adminTeamsRedirect(message: string): never {
  redirect(`/admin?tab=teams&message=${encodeURIComponent(message)}`);
}

function adminTeamsError(error: string): never {
  redirect(`/admin?tab=teams&error=${encodeURIComponent(error)}`);
}

function uniqueUserIds(userIds: string[]) {
  return Array.from(new Set(userIds.filter(Boolean)));
}

async function notifyTeamUsers(input: {
  userIds: string[];
  type: string;
  title: string;
  message: string;
  href: string;
  teamId: string;
  dedupeKey: string;
  rejectionReason?: string;
}) {
  const userIds = uniqueUserIds(input.userIds);

  if (userIds.length === 0) {
    return;
  }

  try {
    await createNotificationsOnceForUsers({
      userIds,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href,
      dedupeKey: input.dedupeKey,
      metadata: {
        teamId: input.teamId,
        ...(input.rejectionReason
          ? { rejectionReason: input.rejectionReason }
          : {}),
      },
    });
  } catch (error) {
    console.error("[TeamNotifications] Failed to create notifications:", error);
  }
}

export async function approveTeam(formData: FormData) {
  await requireAdmin();

  const teamId = String(formData.get("teamId") || "").trim();

  if (!teamId) {
    adminTeamsError("Team ID is missing.");
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
    adminTeamsError("Team was not found.");
  }

  if (team.status === "approved") {
    adminTeamsError("Team is already approved.");
  }

  await prisma.team.update({
    where: {
      id: team.id,
    },
    data: {
      status: "approved",
      approvedAt: new Date(),
      rejectedAt: null,
      rejectionReason: null,
    },
  });

  await notifyTeamUsers({
    userIds: [
      team.leaderId,
      ...team.members.map((member) => member.userId),
    ],
    type: "team.approved",
    title: "Team approved",
    message: `${team.name} was approved.`,
    href: `/profile/teams/${team.id}`,
    teamId: team.id,
    dedupeKey: `team.approved:${team.id}`,
  });

  revalidatePath("/admin");
  revalidatePath("/profile");

  adminTeamsRedirect("Team approved successfully.");
}

export async function rejectTeam(formData: FormData) {
  await requireAdmin();

  const teamId = String(formData.get("teamId") || "").trim();
  const rejectionReason = String(formData.get("rejectionReason") || "").trim();

  if (!teamId) {
    adminTeamsError("Team ID is missing.");
  }

  if (!rejectionReason) {
    adminTeamsError("Rejection reason is required.");
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
    adminTeamsError("Team was not found.");
  }

  if (team.status === "approved") {
    adminTeamsError("Approved teams cannot be rejected.");
  }

  await prisma.team.update({
    where: {
      id: team.id,
    },
    data: {
      status: "rejected",
      rejectedAt: new Date(),
      rejectionReason,
      approvedAt: null,
    },
  });

  await notifyTeamUsers({
    userIds: [
      team.leaderId,
      ...team.members.map((member) => member.userId),
    ],
    type: "team.rejected",
    title: "Team rejected",
    message: `${team.name} was rejected. Reason: ${rejectionReason}`,
    href: `/profile/teams/${team.id}`,
    teamId: team.id,
    dedupeKey: `team.rejected:${team.id}`,
    rejectionReason,
  });

  revalidatePath("/admin");
  revalidatePath("/profile");

  adminTeamsRedirect("Team rejected.");
}

export async function deleteTeamAsAdmin(formData: FormData) {
  await requireAdmin();

  const teamId =
    String(formData.get("teamId") || "").trim() ||
    String(formData.get("id") || "").trim();

  if (!teamId) {
    adminTeamsError("Team ID is missing.");
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
    adminTeamsError("Team was not found.");
  }

  await prisma.team.delete({
    where: {
      id: team.id,
    },
  });

  await notifyTeamUsers({
    userIds: [
      team.leaderId,
      ...team.members.map((member) => member.userId),
    ],
    type: "team.deleted",
    title: "Team deleted",
    message: `${team.name} was deleted.`,
    href: "/profile",
    teamId: team.id,
    dedupeKey: `team.deleted:${team.id}:admin`,
  });

  revalidatePath("/admin");
  revalidatePath("/profile");

  adminTeamsRedirect("Team deleted successfully.");
}
