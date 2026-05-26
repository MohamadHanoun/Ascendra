"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { createNotificationOnce } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export type ProfileInvitationActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

type ProfileInvitationActionMessages = {
  loginRequired: string;
  inviteIdMissing: string;
  invitationNotFound: string;
  invitationDoesNotBelong: string;
  invitationAlreadyHandled: string;
  rejectedTitle: string;
  rejectedMessage: string;
  rejectedSuccess: string;
  acceptedTitle: string;
  acceptedMessage: string;
  acceptedSuccess: string;
};

const profileInvitationActionMessages: Record<
  Locale,
  ProfileInvitationActionMessages
> = {
  en: {
    loginRequired: "Please login first.",
    inviteIdMissing: "Invitation ID is missing.",
    invitationNotFound: "Invitation was not found.",
    invitationDoesNotBelong: "This invitation does not belong to you.",
    invitationAlreadyHandled: "This invitation has already been handled.",
    rejectedTitle: "Team invitation declined",
    rejectedMessage: "{username} declined the invitation to join {team}.",
    rejectedSuccess: "Invitation rejected.",
    acceptedTitle: "Team member joined",
    acceptedMessage: "{username} joined {team}.",
    acceptedSuccess: "Invitation accepted. You joined the team.",
  },
  ar: {
    loginRequired: "يرجى تسجيل الدخول أولًا.",
    inviteIdMissing: "معرّف الدعوة مفقود.",
    invitationNotFound: "لم يتم العثور على الدعوة.",
    invitationDoesNotBelong: "هذه الدعوة لا تخصك.",
    invitationAlreadyHandled: "تم التعامل مع هذه الدعوة مسبقًا.",
    rejectedTitle: "تم رفض دعوة الفريق",
    rejectedMessage: "رفض {username} دعوة الانضمام إلى {team}.",
    rejectedSuccess: "تم رفض الدعوة.",
    acceptedTitle: "انضم عضو إلى الفريق",
    acceptedMessage: "انضم {username} إلى {team}.",
    acceptedSuccess: "تم قبول الدعوة. لقد انضممت إلى الفريق.",
  },
};

function formatMessage(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, value),
    template,
  );
}

async function getMessages() {
  const locale = await getLocale();

  return profileInvitationActionMessages[locale];
}

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
  const messages = await getMessages();
  const user = await getCurrentUser();

  if (!user) {
    return fail(messages.loginRequired, "/login");
  }

  const inviteId = getValue(formData, "inviteId");

  if (!inviteId) {
    return fail(messages.inviteIdMissing);
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
    return fail(messages.invitationNotFound);
  }

  if (invite.invitedUserId !== user.id) {
    return fail(messages.invitationDoesNotBelong);
  }

  if (invite.status !== "pending") {
    return fail(messages.invitationAlreadyHandled);
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
      title: messages.rejectedTitle,
      message: formatMessage(messages.rejectedMessage, {
        username: user.username,
        team: invite.team.name,
      }),
      href: `/profile/teams/${invite.teamId}`,
      teamId: invite.teamId,
      inviteId: invite.id,
      actorId: user.id,
      dedupeKey: `team.invite.rejected:${invite.id}`,
    });

    revalidatePath("/profile");
    revalidatePath(`/profile/teams/${invite.teamId}`);

    return success(messages.rejectedSuccess);
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
    title: messages.acceptedTitle,
    message: formatMessage(messages.acceptedMessage, {
      username: user.username,
      team: invite.team.name,
    }),
    href: `/profile/teams/${invite.teamId}`,
    teamId: invite.teamId,
    inviteId: invite.id,
    actorId: user.id,
    dedupeKey: `team.invite.accepted:${invite.id}`,
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${invite.teamId}`);

  return success(messages.acceptedSuccess);
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
