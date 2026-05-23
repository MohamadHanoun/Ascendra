"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";

export type TeamInlineActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

type TeamInlineActionMessages = {
  loginRequired: string;
  teamNotFound: string;
  onlyLeaderCanManage: string;
  teamLocked: string;
  teamIdNameGameRequired: string;
  invalidGame: string;
  teamUpdated: string;
  teamAndPlayerRequired: string;
  playerNotFound: string;
  playerMustJoinDiscord: string;
  alreadyLeader: string;
  alreadyInTeam: string;
  alreadyPendingInvite: string;
  inviteSent: string;
  teamIdMemberIdRequired: string;
  memberNotFound: string;
  leaderCannotBeRemoved: string;
  memberRemoved: string;
  teamIdMissing: string;
  leaderCannotLeave: string;
  notTeamMember: string;
  leftTeam: string;
  alreadyTeamLeader: string;
  leadershipTransferred: string;
  teamIdInviteIdRequired: string;
  invitationNotFound: string;
  invitationWrongTeam: string;
  onlyLeaderCanCancelInvites: string;
  invitationCancelled: string;
  teamSubmitted: string;
  cannotDeleteWithHistory: string;
  teamDeleted: string;
};


const actionMessages: Record<Locale, TeamInlineActionMessages> = {
  en: {
    loginRequired: "Please login first.",
    teamNotFound: "Team was not found.",
    onlyLeaderCanManage: "Only the team leader can manage this team.",
    teamLocked: 'This team is locked while registered for "{title}".',
    teamIdNameGameRequired: "Team ID, name, and game are required.",
    invalidGame: "Invalid game selected.",
    teamUpdated: "Team updated successfully.",
    teamAndPlayerRequired: "Team and player are required.",
    playerNotFound:
      "Player was not found. They must login to the website first.",
    playerMustJoinDiscord:
      "This player must join the Ascendra Discord server first.",
    alreadyLeader: "You are already the leader of this team.",
    alreadyInTeam: "This player is already in the team.",
    alreadyPendingInvite: "This player already has a pending invitation.",
    inviteSent: "Invitation sent successfully.",
    teamIdMemberIdRequired: "Team ID and member ID are required.",
    memberNotFound: "Team member was not found.",
    leaderCannotBeRemoved: "The team leader cannot be removed.",
    memberRemoved: "Team member removed.",
    teamIdMissing: "Team ID is missing.",
    leaderCannotLeave:
      "The team leader cannot leave the team. Delete the team or transfer leadership first.",
    notTeamMember: "You are not a member of this team.",
    leftTeam: "You left the team.",
    alreadyTeamLeader: "You are already the team leader.",
    leadershipTransferred: "Leadership transferred to {username}.",
    teamIdInviteIdRequired: "Team ID and invite ID are required.",
    invitationNotFound: "Invitation was not found.",
    invitationWrongTeam: "This invitation does not belong to this team.",
    onlyLeaderCanCancelInvites: "Only the team leader can cancel invitations.",
    invitationCancelled: "Invitation cancelled.",
    teamSubmitted: "Team submitted for admin review.",
    cannotDeleteWithHistory:
      "This team cannot be deleted because it has tournament history.",
    teamDeleted: "Team deleted.",
  },

  ar: {
    loginRequired: "يرجى تسجيل الدخول أولًا.",
    teamNotFound: "لم يتم العثور على الفريق.",
    onlyLeaderCanManage: "يمكن لقائد الفريق فقط إدارة هذا الفريق.",
    teamLocked: 'هذا الفريق مقفل أثناء تسجيله في بطولة "{title}".',
    teamIdNameGameRequired: "معرّف الفريق والاسم واللعبة مطلوبة.",
    invalidGame: "تم اختيار لعبة غير صالحة.",
    teamUpdated: "تم تحديث الفريق بنجاح.",
    teamAndPlayerRequired: "الفريق واللاعب مطلوبان.",
    playerNotFound:
      "لم يتم العثور على اللاعب. يجب أن يسجل الدخول إلى الموقع أولًا.",
    playerMustJoinDiscord:
      "يجب على هذا اللاعب الانضمام إلى Discord الخاص بـ Ascendra أولًا.",
    alreadyLeader: "أنت بالفعل قائد هذا الفريق.",
    alreadyInTeam: "هذا اللاعب موجود بالفعل في الفريق.",
    alreadyPendingInvite: "هذا اللاعب لديه دعوة معلقة بالفعل.",
    inviteSent: "تم إرسال الدعوة بنجاح.",
    teamIdMemberIdRequired: "معرّف الفريق ومعرّف العضو مطلوبان.",
    memberNotFound: "لم يتم العثور على عضو الفريق.",
    leaderCannotBeRemoved: "لا يمكن إزالة قائد الفريق.",
    memberRemoved: "تمت إزالة عضو الفريق.",
    teamIdMissing: "معرّف الفريق مفقود.",
    leaderCannotLeave:
      "لا يمكن لقائد الفريق مغادرة الفريق. احذف الفريق أو انقل القيادة أولًا.",
    notTeamMember: "أنت لست عضوًا في هذا الفريق.",
    leftTeam: "لقد غادرت الفريق.",
    alreadyTeamLeader: "أنت بالفعل قائد الفريق.",
    leadershipTransferred: "تم نقل القيادة إلى {username}.",
    teamIdInviteIdRequired: "معرّف الفريق ومعرّف الدعوة مطلوبان.",
    invitationNotFound: "لم يتم العثور على الدعوة.",
    invitationWrongTeam: "هذه الدعوة لا تنتمي إلى هذا الفريق.",
    onlyLeaderCanCancelInvites: "يمكن لقائد الفريق فقط إلغاء الدعوات.",
    invitationCancelled: "تم إلغاء الدعوة.",
    teamSubmitted: "تم إرسال الفريق لمراجعة الإدارة.",
    cannotDeleteWithHistory:
      "لا يمكن حذف هذا الفريق لأنه يملك سجلًا في البطولات.",
    teamDeleted: "تم حذف الفريق.",
  },
};

function success(message: string, redirectTo?: string): TeamInlineActionResult {
  return {
    ok: true,
    message,
    redirectTo,
  };
}

function fail(message: string, redirectTo?: string): TeamInlineActionResult {
  return {
    ok: false,
    message,
    redirectTo,
  };
}

function getTeamId(formData: FormData) {
  return String(formData.get("teamId") || formData.get("id") || "").trim();
}

function formatMessage(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

function profileMessageRedirect(message: string) {
  return `/profile?message=${encodeURIComponent(message)}`;
}

async function getMessages() {
  const locale = await getLocale();

  return actionMessages[locale];
}

async function publishProfileUpdate(payload: {
  type: string;
  userId?: string;
  teamId?: string;
  inviteId?: string;
}) {
  await createRealtimeEvent({
    type: payload.type,
    audience: "public",
    entityType: "profile",
    entityId: payload.userId || "team",
    payload,
  });
}

async function publishTeamUpdate(payload: {
  type: string;
  teamId: string;
  userIds?: string[];
  inviteId?: string;
}) {
  await Promise.all([
    createRealtimeEvent({
      type: payload.type,
      audience: "public",
      entityType: "team",
      entityId: payload.teamId,
      payload,
    }),
    ...(payload.userIds || []).map((userId) =>
      publishProfileUpdate({
        type: payload.type,
        userId,
        teamId: payload.teamId,
        inviteId: payload.inviteId,
      }),
    ),
  ]);
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

async function getLeaderTeam(
  teamId: string,
  userId: string,
  messages: TeamInlineActionMessages,
) {
  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
    include: {
      members: true,
      invites: true,
    },
  });

  if (!team) {
    return {
      team: null,
      error: messages.teamNotFound,
    };
  }

  if (team.leaderId !== userId) {
    return {
      team: null,
      error: messages.onlyLeaderCanManage,
    };
  }

  return {
    team,
    error: null,
  };
}

async function getActiveTeamRegistration(teamId: string) {
  return prisma.tournamentRegistration.findFirst({
    where: {
      teamId,
      status: {
        in: ["registered", "approved"],
      },
      tournament: {
        status: {
          notIn: ["ended", "cancelled"],
        },
      },
    },
    select: {
      id: true,
      status: true,
      tournament: {
        select: {
          title: true,
          status: true,
        },
      },
    },
  });
}

async function getBlockingActiveRegistration(
  teamId: string,
  messages: TeamInlineActionMessages,
) {
  const activeRegistration = await getActiveTeamRegistration(teamId);

  if (!activeRegistration) {
    return null;
  }

  return formatMessage(messages.teamLocked, {
    title: activeRegistration.tournament.title,
  });
}

async function getTournamentHistory(teamId: string) {
  const [registrationsCount, resultsCount] = await Promise.all([
    prisma.tournamentRegistration.count({
      where: {
        teamId,
      },
    }),
    prisma.tournamentResult.count({
      where: {
        teamId,
      },
    }),
  ]);

  return {
    registrationsCount,
    resultsCount,
    hasHistory: registrationsCount > 0 || resultsCount > 0,
  };
}

export async function updateTeamInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const messages = await getMessages();
  const user = await getCurrentUser();

  if (!user) {
    return fail(messages.loginRequired, "/login");
  }

  const teamId = getTeamId(formData);
  const name = String(formData.get("name") || "").trim();
  const gameSlug = String(formData.get("gameSlug") || "").trim();

  if (!teamId || !name || !gameSlug) {
    return fail(messages.teamIdNameGameRequired);
  }

  const selectedGame = await prisma.game.findUnique({
    where: { slug: gameSlug, isActive: true },
  });

  if (!selectedGame) {
    return fail(messages.invalidGame);
  }

  const { team, error } = await getLeaderTeam(teamId, user.id, messages);

  if (!team) {
    return fail(error || messages.teamNotFound);
  }

  const activeRegistrationError = await getBlockingActiveRegistration(
    team.id,
    messages,
  );

  if (activeRegistrationError) {
    return fail(activeRegistrationError);
  }

  const updatedTeam = await prisma.team.update({
    where: {
      id: team.id,
    },
    data: {
      name,
      gameId: selectedGame.id,
      status: team.status === "rejected" ? "draft" : team.status,
      rejectedAt: null,
      rejectionReason: null,
    },
  });

  await publishTeamUpdate({
    type: "team.updated",
    teamId: updatedTeam.id,
    userIds: team.members.map((member) => member.userId),
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${updatedTeam.id}`);

  return success(messages.teamUpdated);
}

export async function invitePlayerToTeamInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const messages = await getMessages();
  const user = await getCurrentUser();

  if (!user) {
    return fail(messages.loginRequired, "/login");
  }

  const teamId = getTeamId(formData);
  const player = String(formData.get("player") || "").trim();

  if (!teamId || !player) {
    return fail(messages.teamAndPlayerRequired);
  }

  const { team, error } = await getLeaderTeam(teamId, user.id, messages);

  if (!team) {
    return fail(error || messages.teamNotFound);
  }

  const activeRegistrationError = await getBlockingActiveRegistration(
    team.id,
    messages,
  );

  if (activeRegistrationError) {
    return fail(activeRegistrationError);
  }

  const invitedUser = await prisma.user.findFirst({
    where: {
      OR: [
        {
          discordId: player,
        },
        {
          username: {
            equals: player,
            mode: "insensitive",
          },
        },
      ],
    },
  });

  if (!invitedUser) {
    return fail(messages.playerNotFound);
  }

  if (!invitedUser.isGuildMember) {
    return fail(messages.playerMustJoinDiscord);
  }

  if (invitedUser.id === user.id) {
    return fail(messages.alreadyLeader);
  }

  const existingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: invitedUser.id,
      },
    },
  });

  if (existingMember) {
    return fail(messages.alreadyInTeam);
  }

  const existingInvite = await prisma.teamInvite.findUnique({
    where: {
      teamId_invitedUserId: {
        teamId: team.id,
        invitedUserId: invitedUser.id,
      },
    },
  });

  if (existingInvite?.status === "pending") {
    return fail(messages.alreadyPendingInvite);
  }

  const invite = existingInvite
    ? await prisma.teamInvite.update({
        where: {
          id: existingInvite.id,
        },
        data: {
          status: "pending",
          invitedById: user.id,
          respondedAt: null,
          createdAt: new Date(),
        },
      })
    : await prisma.teamInvite.create({
        data: {
          teamId: team.id,
          invitedUserId: invitedUser.id,
          invitedById: user.id,
          status: "pending",
        },
      });

  await publishTeamUpdate({
    type: "team.invite.created",
    teamId: team.id,
    inviteId: invite.id,
    userIds: [user.id, invitedUser.id],
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  return success(messages.inviteSent);
}

export async function removeTeamMemberInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const messages = await getMessages();
  const user = await getCurrentUser();

  if (!user) {
    return fail(messages.loginRequired, "/login");
  }

  const teamId = getTeamId(formData);
  const memberId = String(formData.get("memberId") || "").trim();

  if (!teamId || !memberId) {
    return fail(messages.teamIdMemberIdRequired);
  }

  const { team, error } = await getLeaderTeam(teamId, user.id, messages);

  if (!team) {
    return fail(error || messages.teamNotFound);
  }

  const activeRegistrationError = await getBlockingActiveRegistration(
    team.id,
    messages,
  );

  if (activeRegistrationError) {
    return fail(activeRegistrationError);
  }

  const member = await prisma.teamMember.findUnique({
    where: {
      id: memberId,
    },
  });

  if (!member || member.teamId !== team.id) {
    return fail(messages.memberNotFound);
  }

  if (member.userId === user.id || member.role === "leader") {
    return fail(messages.leaderCannotBeRemoved);
  }

  await prisma.teamMember.delete({
    where: {
      id: member.id,
    },
  });

  await publishTeamUpdate({
    type: "team.member.removed",
    teamId: team.id,
    userIds: [
      ...team.members.map((teamMember) => teamMember.userId),
      member.userId,
    ],
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  return success(messages.memberRemoved);
}

export async function leaveTeamInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const messages = await getMessages();
  const user = await getCurrentUser();

  if (!user) {
    return fail(messages.loginRequired, "/login");
  }

  const teamId = getTeamId(formData);

  if (!teamId) {
    return fail(messages.teamIdMissing);
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
    return fail(messages.teamNotFound);
  }

  if (team.leaderId === user.id) {
    return fail(messages.leaderCannotLeave);
  }

  const activeRegistrationError = await getBlockingActiveRegistration(
    team.id,
    messages,
  );

  if (activeRegistrationError) {
    return fail(activeRegistrationError);
  }

  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return fail(messages.notTeamMember);
  }

  await prisma.teamMember.delete({
    where: {
      id: membership.id,
    },
  });

  await publishTeamUpdate({
    type: "team.member.left",
    teamId: team.id,
    userIds: team.members.map((member) => member.userId),
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  return success(messages.leftTeam, profileMessageRedirect(messages.leftTeam));
}

export async function transferTeamLeadershipInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const messages = await getMessages();
  const user = await getCurrentUser();

  if (!user) {
    return fail(messages.loginRequired, "/login");
  }

  const teamId = getTeamId(formData);
  const memberId = String(formData.get("memberId") || "").trim();

  if (!teamId || !memberId) {
    return fail(messages.teamIdMemberIdRequired);
  }

  const { team, error } = await getLeaderTeam(teamId, user.id, messages);

  if (!team) {
    return fail(error || messages.teamNotFound);
  }

  const activeRegistrationError = await getBlockingActiveRegistration(
    team.id,
    messages,
  );

  if (activeRegistrationError) {
    return fail(activeRegistrationError);
  }

  const targetMember = await prisma.teamMember.findUnique({
    where: {
      id: memberId,
    },
    include: {
      user: true,
    },
  });

  if (!targetMember || targetMember.teamId !== team.id) {
    return fail(messages.memberNotFound);
  }

  if (targetMember.userId === user.id) {
    return fail(messages.alreadyTeamLeader);
  }

  await prisma.$transaction([
    prisma.team.update({
      where: {
        id: team.id,
      },
      data: {
        leaderId: targetMember.userId,
      },
    }),

    prisma.teamMember.updateMany({
      where: {
        teamId: team.id,
        userId: user.id,
      },
      data: {
        role: "member",
      },
    }),

    prisma.teamMember.update({
      where: {
        id: targetMember.id,
      },
      data: {
        role: "leader",
      },
    }),
  ]);

  await publishTeamUpdate({
    type: "team.leader.transferred",
    teamId: team.id,
    userIds: team.members.map((member) => member.userId),
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  return success(
    formatMessage(messages.leadershipTransferred, {
      username: targetMember.user.username,
    }),
  );
}

export async function cancelTeamInviteInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const messages = await getMessages();
  const user = await getCurrentUser();

  if (!user) {
    return fail(messages.loginRequired, "/login");
  }

  const teamId = getTeamId(formData);
  const inviteId = String(formData.get("inviteId") || "").trim();

  if (!teamId || !inviteId) {
    return fail(messages.teamIdInviteIdRequired);
  }

  const invite = await prisma.teamInvite.findUnique({
    where: {
      id: inviteId,
    },
    include: {
      team: true,
    },
  });

  if (!invite) {
    return fail(messages.invitationNotFound);
  }

  if (invite.teamId !== teamId) {
    return fail(messages.invitationWrongTeam);
  }

  if (invite.team.leaderId !== user.id) {
    return fail(messages.onlyLeaderCanCancelInvites);
  }

  const activeRegistrationError = await getBlockingActiveRegistration(
    invite.teamId,
    messages,
  );

  if (activeRegistrationError) {
    return fail(activeRegistrationError);
  }

  await prisma.teamInvite.delete({
    where: {
      id: invite.id,
    },
  });

  await publishTeamUpdate({
    type: "team.invite.cancelled",
    teamId: invite.teamId,
    inviteId: invite.id,
    userIds: [user.id, invite.invitedUserId],
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${invite.teamId}`);

  return success(messages.invitationCancelled);
}

export async function submitTeamForReviewInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const messages = await getMessages();
  const user = await getCurrentUser();

  if (!user) {
    return fail(messages.loginRequired, "/login");
  }

  const teamId = getTeamId(formData);

  if (!teamId) {
    return fail(messages.teamIdMissing);
  }

  const { team, error } = await getLeaderTeam(teamId, user.id, messages);

  if (!team) {
    return fail(error || messages.teamNotFound);
  }

  await prisma.team.update({
    where: {
      id: team.id,
    },
    data: {
      status: "pending",
      submittedAt: new Date(),
      rejectedAt: null,
      rejectionReason: null,
    },
  });

  await publishTeamUpdate({
    type: "team.submitted",
    teamId: team.id,
    userIds: team.members.map((member) => member.userId),
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  return success(messages.teamSubmitted);
}

export async function deleteTeamInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const messages = await getMessages();
  const user = await getCurrentUser();

  if (!user) {
    return fail(messages.loginRequired, "/login");
  }

  const teamId = getTeamId(formData);

  if (!teamId) {
    return fail(messages.teamIdMissing);
  }

  const { team, error } = await getLeaderTeam(teamId, user.id, messages);

  if (!team) {
    return fail(error || messages.teamNotFound);
  }

  const activeRegistrationError = await getBlockingActiveRegistration(
    team.id,
    messages,
  );

  if (activeRegistrationError) {
    return fail(activeRegistrationError);
  }

  const history = await getTournamentHistory(team.id);

  if (history.hasHistory) {
    return fail(messages.cannotDeleteWithHistory);
  }

  const memberUserIds = team.members.map((member) => member.userId);

  await prisma.team.delete({
    where: {
      id: team.id,
    },
  });

  await publishTeamUpdate({
    type: "team.deleted",
    teamId: team.id,
    userIds: memberUserIds,
  });

  revalidatePath("/profile");

  return success(
    messages.teamDeleted,
    profileMessageRedirect(messages.teamDeleted),
  );
}
