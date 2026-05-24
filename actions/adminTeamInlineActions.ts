"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createNotificationsOnceForUsers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export type AdminTeamActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

function success(message: string): AdminTeamActionResult {
  return {
    ok: true,
    message,
  };
}

function fail(message: string, redirectTo?: string): AdminTeamActionResult {
  return {
    ok: false,
    message,
    redirectTo,
  };
}

function getTeamId(formData: FormData) {
  return String(formData.get("teamId") || formData.get("id") || "").trim();
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

async function requireAdmin(): Promise<AdminTeamActionResult | null> {
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
    return fail("Only Ascendra admins can manage team reviews.");
  }

  return null;
}

export async function approveTeamInline(
  formData: FormData,
): Promise<AdminTeamActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const teamId = getTeamId(formData);

  if (!teamId) {
    return fail("Team ID is missing.");
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

  await prisma.team.update({
    where: {
      id: team.id,
    },
    data: {
      status: "approved",
      rejectionReason: null,
      rejectedAt: null,
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
  revalidatePath(`/profile/teams/${team.id}`);

  return success("Team approved successfully.");
}

export async function rejectTeamInline(
  formData: FormData,
): Promise<AdminTeamActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const teamId = getTeamId(formData);
  const rejectionReason = String(formData.get("rejectionReason") || "").trim();

  if (!teamId) {
    return fail("Team ID is missing.");
  }

  if (!rejectionReason) {
    return fail("Rejection reason is required.");
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

  await prisma.team.update({
    where: {
      id: team.id,
    },
    data: {
      status: "rejected",
      rejectionReason,
      rejectedAt: new Date(),
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
  revalidatePath(`/profile/teams/${team.id}`);

  return success("Team rejected successfully.");
}

export async function deleteTeamInline(
  formData: FormData,
): Promise<AdminTeamActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const teamId = getTeamId(formData);

  if (!teamId) {
    return fail("Team ID is missing.");
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

  await prisma.$transaction(async (tx) => {
    await tx.tournamentRegistration.deleteMany({
      where: {
        teamId: team.id,
      },
    });

    await tx.teamInvite.deleteMany({
      where: {
        teamId: team.id,
      },
    });

    await tx.teamMember.deleteMany({
      where: {
        teamId: team.id,
      },
    });

    await tx.team.delete({
      where: {
        id: team.id,
      },
    });
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

  return success("Team deleted successfully.");
}
