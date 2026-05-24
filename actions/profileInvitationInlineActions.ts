"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createNotificationOnce } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export type ProfileInvitationActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

function success(message: string): ProfileInvitationActionResult {
  return {
    ok: true,
    message,
  };
}

function fail(
  message: string,
  redirectTo?: string,
): ProfileInvitationActionResult {
  return {
    ok: false,
    message,
    redirectTo,
  };
}

function getValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function uniqueUserIds(userIds: string[]) {
  return Array.from(new Set(userIds.filter(Boolean)));
}

async function createInviteResponseNotifications(input: {
  userIds: string[];
  type: "team.invite.accepted" | "team.invite.rejected";
  title: string;
  message: string;
  href: string;
  teamId: string;
  inviteId: string;
  actorId: string;
  dedupeKey: string;
}) {
  const userIds = uniqueUserIds(input.userIds);

  if (userIds.length === 0) {
    return;
  }

  try {
    await Promise.all(
      userIds.map((userId) =>
        createNotificationOnce({
          userId,
          type: input.type,
          title: input.title,
          message: input.message,
          href: input.href,
          dedupeKey: `${input.dedupeKey}:${userId}`,
          metadata: {
            teamId: input.teamId,
            inviteId: input.inviteId,
            actorId: input.actorId,
            targetUserId: input.actorId,
          },
        }),
      ),
    );
  } catch (error) {
    console.error("[TeamNotifications] Failed to create notifications:", error);
  }
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

async function respondToInvitation(
  formData: FormData,
  response: "accepted" | "rejected",
): Promise<ProfileInvitationActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Please login first.", "/login");
  }

  const inviteId = getValue(formData, "inviteId");

  if (!inviteId) {
    return fail("Invitation ID is missing.");
  }

  const invite = await prisma.teamInvite.findUnique({
    where: {
      id: inviteId,
    },
    include: {
      team: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!invite) {
    return fail("Invitation was not found.");
  }

  if (invite.invitedUserId !== user.id) {
    return fail("This invitation does not belong to you.");
  }

  if (invite.status !== "pending") {
    return fail("This invitation has already been handled.");
  }

  if (response === "rejected") {
    const respondedAt = new Date();

    await prisma.teamInvite.update({
      where: {
        id: invite.id,
      },
      data: {
        status: "rejected",
        respondedAt,
      },
    });

    await createInviteResponseNotifications({
      userIds: [invite.team.leaderId],
      type: "team.invite.rejected",
      title: "Team invitation declined",
      message: `${user.username} declined the invitation to join ${invite.team.name}.`,
      href: `/profile/teams/${invite.teamId}`,
      teamId: invite.teamId,
      inviteId: invite.id,
      actorId: user.id,
      dedupeKey: `team.invite.rejected:${invite.id}`,
    });

    revalidatePath("/profile");
    revalidatePath(`/profile/teams/${invite.teamId}`);

    return success("Invitation rejected.");
  }

  const respondedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.teamMember.upsert({
      where: {
        teamId_userId: {
          teamId: invite.teamId,
          userId: user.id,
        },
      },
      update: {},
      create: {
        teamId: invite.teamId,
        userId: user.id,
        role: "member",
      },
    });

    await tx.teamInvite.update({
      where: {
        id: invite.id,
      },
      data: {
        status: "accepted",
        respondedAt,
      },
    });
  });

  await createInviteResponseNotifications({
    userIds: [
      ...invite.team.members
        .map((member) => member.userId)
        .filter((userId) => userId !== user.id),
      invite.team.leaderId,
    ],
    type: "team.invite.accepted",
    title: "Team member joined",
    message: `${user.username} joined ${invite.team.name}.`,
    href: `/profile/teams/${invite.teamId}`,
    teamId: invite.teamId,
    inviteId: invite.id,
    actorId: user.id,
    dedupeKey: `team.invite.accepted:${invite.id}`,
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${invite.teamId}`);

  return success("Invitation accepted. You joined the team.");
}

export async function acceptProfileInvitationInline(
  formData: FormData,
): Promise<ProfileInvitationActionResult> {
  return respondToInvitation(formData, "accepted");
}

export async function rejectProfileInvitationInline(
  formData: FormData,
): Promise<ProfileInvitationActionResult> {
  return respondToInvitation(formData, "rejected");
}
