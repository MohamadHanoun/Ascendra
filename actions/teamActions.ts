"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";

type TeamActionMessages = {
  joinDiscord: string;
  teamNotFound: string;
  onlyLeaderCanManage: string;
  teamLocked: string;
  cannotDeleteWithHistory: string;
  teamNameGameRequired: string;
  teamIdNameGameRequired: string;
  invalidGame: string;
  duplicateTeamName: string;
  teamCreated: string;
  teamUpdated: string;
  teamPlayerRequired: string;
  playerNotFound: string;
  playerMustJoinDiscord: string;
  alreadyLeader: string;
  alreadyInTeam: string;
  alreadyPendingInvite: string;
  inviteSent: string;
  inviteIdMissing: string;
  invitationNotFound: string;
  onlyLeaderCanCancelInvites: string;
  invitationCancelled: string;
  invalidInvitationResponse: string;
  invitationDoesNotBelong: string;
  invitationAlreadyHandled: string;
  invitationAccepted: string;
  invitationDeclined: string;
  teamIdMemberIdRequired: string;
  memberNotFound: string;
  leaderCannotBeRemoved: string;
  memberRemoved: string;
  teamIdMissing: string;
  teamActive: string;
  teamDeleted: string;
};


const actionMessages: Record<Locale, TeamActionMessages> = {
  en: {
    joinDiscord: "Join the Ascendra Discord server to use team features.",
    teamNotFound: "Team was not found.",
    onlyLeaderCanManage: "Only the team leader can manage this team.",
    teamLocked: 'This team is locked while registered for "{title}".',
    cannotDeleteWithHistory:
      "Team cannot be deleted because it has tournament history.",
    teamNameGameRequired: "Team name and game are required.",
    teamIdNameGameRequired: "Team ID, name, and game are required.",
    invalidGame: "Invalid game selected.",
    duplicateTeamName: "You already have a team with this name.",
    teamCreated: "Team created successfully.",
    teamUpdated: "Team updated successfully.",
    teamPlayerRequired: "Team and player are required.",
    playerNotFound:
      "Player was not found. They must login to the website first.",
    playerMustJoinDiscord:
      "This player must join the Ascendra Discord server first.",
    alreadyLeader: "You are already the leader of this team.",
    alreadyInTeam: "This player is already in the team.",
    alreadyPendingInvite: "This player already has a pending invitation.",
    inviteSent: "Invitation sent successfully.",
    inviteIdMissing: "Invite ID is missing.",
    invitationNotFound: "Invitation was not found.",
    onlyLeaderCanCancelInvites: "Only the team leader can cancel invitations.",
    invitationCancelled: "Invitation cancelled.",
    invalidInvitationResponse: "Invalid invitation response.",
    invitationDoesNotBelong: "This invitation does not belong to you.",
    invitationAlreadyHandled: "This invitation has already been handled.",
    invitationAccepted: "Invitation accepted.",
    invitationDeclined: "Invitation declined.",
    teamIdMemberIdRequired: "Team ID and member ID are required.",
    memberNotFound: "Team member was not found.",
    leaderCannotBeRemoved: "The team leader cannot be removed.",
    memberRemoved: "Team member removed.",
    teamIdMissing: "Team ID is missing.",
    teamActive: "Team is active.",
    teamDeleted: "Team deleted.",
  },

  ar: {
    joinDiscord: "انضم إلى Discord الخاص بـ Ascendra لاستخدام ميزات الفرق.",
    teamNotFound: "لم يتم العثور على الفريق.",
    onlyLeaderCanManage: "يمكن لقائد الفريق فقط إدارة هذا الفريق.",
    teamLocked: 'هذا الفريق مقفل أثناء تسجيله في بطولة "{title}".',
    cannotDeleteWithHistory: "لا يمكن حذف الفريق لأنه يملك سجلًا في البطولات.",
    teamNameGameRequired: "اسم الفريق واللعبة مطلوبان.",
    teamIdNameGameRequired: "معرّف الفريق والاسم واللعبة مطلوبة.",
    invalidGame: "تم اختيار لعبة غير صالحة.",
    duplicateTeamName: "لديك بالفعل فريق بهذا الاسم.",
    teamCreated: "تم إنشاء الفريق بنجاح.",
    teamUpdated: "تم تحديث الفريق بنجاح.",
    teamPlayerRequired: "الفريق واللاعب مطلوبان.",
    playerNotFound:
      "لم يتم العثور على اللاعب. يجب أن يسجل الدخول إلى الموقع أولًا.",
    playerMustJoinDiscord:
      "يجب على هذا اللاعب الانضمام إلى Discord الخاص بـ Ascendra أولًا.",
    alreadyLeader: "أنت بالفعل قائد هذا الفريق.",
    alreadyInTeam: "هذا اللاعب موجود بالفعل في الفريق.",
    alreadyPendingInvite: "هذا اللاعب لديه دعوة معلقة بالفعل.",
    inviteSent: "تم إرسال الدعوة بنجاح.",
    inviteIdMissing: "معرّف الدعوة مفقود.",
    invitationNotFound: "لم يتم العثور على الدعوة.",
    onlyLeaderCanCancelInvites: "يمكن لقائد الفريق فقط إلغاء الدعوات.",
    invitationCancelled: "تم إلغاء الدعوة.",
    invalidInvitationResponse: "رد الدعوة غير صالح.",
    invitationDoesNotBelong: "هذه الدعوة لا تخصك.",
    invitationAlreadyHandled: "تم التعامل مع هذه الدعوة مسبقًا.",
    invitationAccepted: "تم قبول الدعوة.",
    invitationDeclined: "تم رفض الدعوة.",
    teamIdMemberIdRequired: "معرّف الفريق ومعرّف العضو مطلوبان.",
    memberNotFound: "لم يتم العثور على عضو الفريق.",
    leaderCannotBeRemoved: "لا يمكن إزالة قائد الفريق.",
    memberRemoved: "تمت إزالة عضو الفريق.",
    teamIdMissing: "معرّف الفريق مفقود.",
    teamActive: "الفريق نشط الآن.",
    teamDeleted: "تم حذف الفريق.",
  },
};

function formatMessage(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

async function getMessages() {
  const locale = await getLocale();

  return actionMessages[locale];
}

function profileRedirect(message: string): never {
  redirect(`/profile?message=${encodeURIComponent(message)}`);
}

function profileError(message: string): never {
  redirect(`/profile?error=${encodeURIComponent(message)}`);
}

function teamRedirect(teamId: string, message: string): never {
  redirect(`/profile/teams/${teamId}?message=${encodeURIComponent(message)}`);
}

async function publishProfileUpdate(payload: {
  userId?: string;
  teamId?: string;
  inviteId?: string;
  type: string;
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

async function requireUser() {
  const session = await auth();

  if (!session?.user?.databaseId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.databaseId,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
}

function requireGuildMember(
  user: { isGuildMember: boolean },
  messages: TeamActionMessages,
) {
  if (!user.isGuildMember) {
    profileError(messages.joinDiscord);
  }
}

async function requireTeamLeader(
  teamId: string,
  userId: string,
  messages: TeamActionMessages,
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
    profileError(messages.teamNotFound);
  }

  if (team.leaderId !== userId) {
    profileError(messages.onlyLeaderCanManage);
  }

  return team;
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

async function requireTeamNotInActiveRegistration(
  teamId: string,
  messages: TeamActionMessages,
) {
  const activeRegistration = await getActiveTeamRegistration(teamId);

  if (activeRegistration) {
    profileError(
      formatMessage(messages.teamLocked, {
        title: activeRegistration.tournament.title,
      }),
    );
  }
}

async function hasTournamentHistory(teamId: string) {
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

  return registrationsCount > 0 || resultsCount > 0;
}

async function requireTeamWithoutTournamentHistory(
  teamId: string,
  messages: TeamActionMessages,
) {
  const hasHistory = await hasTournamentHistory(teamId);

  if (hasHistory) {
    profileError(messages.cannotDeleteWithHistory);
  }
}

export async function createTeam(formData: FormData) {
  const messages = await getMessages();
  const user = await requireUser();
  requireGuildMember(user, messages);

  const name = String(formData.get("name") || "").trim();
  const gameSlug = String(formData.get("gameSlug") || "").trim();

  if (!name || !gameSlug) {
    profileError(messages.teamNameGameRequired);
  }

  const selectedGame = await prisma.game.findUnique({
    where: { slug: gameSlug },
  });

  if (!selectedGame || !selectedGame.isActive) {
    profileError(messages.invalidGame);
  }

  const existingTeam = await prisma.team.findFirst({
    where: {
      leaderId: user.id,
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });

  if (existingTeam) {
    profileError(messages.duplicateTeamName);
  }

  const team = await prisma.$transaction(async (tx) => {
    const createdTeam = await tx.team.create({
      data: {
        name,
        gameId: selectedGame.id,
        leaderId: user.id,
        status: "approved",
        submittedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    await tx.teamMember.create({
      data: {
        teamId: createdTeam.id,
        userId: user.id,
        role: "leader",
      },
    });

    return createdTeam;
  });

  await publishTeamUpdate({
    type: "team.created",
    teamId: team.id,
    userIds: [user.id],
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  teamRedirect(team.id, messages.teamCreated);
}

export async function updateTeam(formData: FormData) {
  const messages = await getMessages();
  const user = await requireUser();
  requireGuildMember(user, messages);

  const teamId = String(formData.get("teamId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const gameSlug = String(formData.get("gameSlug") || "").trim();

  if (!teamId || !name || !gameSlug) {
    profileError(messages.teamIdNameGameRequired);
  }

  const selectedGame = await prisma.game.findUnique({
    where: { slug: gameSlug },
  });

  if (!selectedGame || !selectedGame.isActive) {
    profileError(messages.invalidGame);
  }

  const team = await requireTeamLeader(teamId, user.id, messages);
  await requireTeamNotInActiveRegistration(team.id, messages);

  await prisma.team.update({
    where: { id: team.id },
    data: {
      name,
      gameId: selectedGame.id,
      status: team.status === "rejected" ? "draft" : team.status,
      submittedAt: null,
      rejectedAt: null,
      rejectionReason: null,
    },
  });

  await publishTeamUpdate({
    type: "team.updated",
    teamId: team.id,
    userIds: team.members.map((member) => member.userId),
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  teamRedirect(team.id, messages.teamUpdated);
}

export async function invitePlayerToTeam(formData: FormData) {
  const messages = await getMessages();
  const user = await requireUser();
  requireGuildMember(user, messages);

  const teamId = String(formData.get("teamId") || "").trim();
  const player = String(formData.get("player") || "").trim();

  if (!teamId || !player) {
    profileError(messages.teamPlayerRequired);
  }

  const team = await requireTeamLeader(teamId, user.id, messages);
  await requireTeamNotInActiveRegistration(team.id, messages);

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
    profileError(messages.playerNotFound);
  }

  if (!invitedUser.isGuildMember) {
    profileError(messages.playerMustJoinDiscord);
  }

  if (invitedUser.id === user.id) {
    profileError(messages.alreadyLeader);
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
    profileError(messages.alreadyInTeam);
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
    profileError(messages.alreadyPendingInvite);
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

  teamRedirect(team.id, messages.inviteSent);
}

export async function cancelTeamInvite(formData: FormData) {
  const messages = await getMessages();
  const user = await requireUser();

  const inviteId = String(formData.get("inviteId") || "").trim();

  if (!inviteId) {
    profileError(messages.inviteIdMissing);
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
    profileError(messages.invitationNotFound);
  }

  if (invite.team.leaderId !== user.id) {
    profileError(messages.onlyLeaderCanCancelInvites);
  }

  await requireTeamNotInActiveRegistration(invite.teamId, messages);

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

  teamRedirect(invite.teamId, messages.invitationCancelled);
}

export async function respondToTeamInvite(formData: FormData) {
  const messages = await getMessages();
  const user = await requireUser();
  requireGuildMember(user, messages);

  const inviteId = String(formData.get("inviteId") || "").trim();
  const response = String(formData.get("response") || "").trim();

  if (!inviteId || !["accepted", "rejected"].includes(response)) {
    profileError(messages.invalidInvitationResponse);
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
    profileError(messages.invitationNotFound);
  }

  if (invite.invitedUserId !== user.id) {
    profileError(messages.invitationDoesNotBelong);
  }

  if (invite.status !== "pending") {
    profileError(messages.invitationAlreadyHandled);
  }

  if (response === "accepted") {
    await requireTeamNotInActiveRegistration(invite.teamId, messages);

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
          respondedAt: new Date(),
        },
      });
    });

    await publishTeamUpdate({
      type: "team.invite.accepted",
      teamId: invite.teamId,
      inviteId: invite.id,
      userIds: [
        ...invite.team.members.map((member) => member.userId),
        user.id,
        invite.team.leaderId,
      ],
    });

    revalidatePath("/profile");
    revalidatePath(`/profile/teams/${invite.teamId}`);

    teamRedirect(invite.teamId, messages.invitationAccepted);
  }

  await prisma.teamInvite.update({
    where: {
      id: invite.id,
    },
    data: {
      status: "rejected",
      respondedAt: new Date(),
    },
  });

  await publishTeamUpdate({
    type: "team.invite.rejected",
    teamId: invite.teamId,
    inviteId: invite.id,
    userIds: [user.id, invite.team.leaderId],
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${invite.teamId}`);

  profileRedirect(messages.invitationDeclined);
}

export async function removeTeamMember(formData: FormData) {
  const messages = await getMessages();
  const user = await requireUser();

  const teamId = String(formData.get("teamId") || "").trim();
  const memberId = String(formData.get("memberId") || "").trim();

  if (!teamId || !memberId) {
    profileError(messages.teamIdMemberIdRequired);
  }

  const team = await requireTeamLeader(teamId, user.id, messages);
  await requireTeamNotInActiveRegistration(team.id, messages);

  const member = await prisma.teamMember.findUnique({
    where: {
      id: memberId,
    },
  });

  if (!member || member.teamId !== team.id) {
    profileError(messages.memberNotFound);
  }

  if (member.userId === user.id || member.role === "leader") {
    profileError(messages.leaderCannotBeRemoved);
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

  teamRedirect(team.id, messages.memberRemoved);
}

export async function submitTeamForReview(formData: FormData) {
  const messages = await getMessages();
  const user = await requireUser();
  requireGuildMember(user, messages);

  const teamId = String(formData.get("teamId") || "").trim();

  if (!teamId) {
    profileError(messages.teamIdMissing);
  }

  const team = await requireTeamLeader(teamId, user.id, messages);

  await prisma.team.update({
    where: {
      id: team.id,
    },
    data: {
      status: "approved",
      submittedAt: null,
      rejectedAt: null,
      rejectionReason: null,
    },
  });

  await publishTeamUpdate({
    type: "team.active",
    teamId: team.id,
    userIds: team.members.map((member) => member.userId),
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  teamRedirect(team.id, messages.teamActive);
}

export async function deleteTeam(formData: FormData) {
  const messages = await getMessages();
  const user = await requireUser();

  const teamId =
    String(formData.get("teamId") || "").trim() ||
    String(formData.get("id") || "").trim();

  if (!teamId) {
    profileError(messages.teamIdMissing);
  }

  const team = await requireTeamLeader(teamId, user.id, messages);

  await requireTeamNotInActiveRegistration(team.id, messages);
  await requireTeamWithoutTournamentHistory(team.id, messages);

  const memberUserIds = team.members.map((member) => member.userId);

  await prisma.$transaction(async (tx) => {
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

  await publishTeamUpdate({
    type: "team.deleted",
    teamId: team.id,
    userIds: memberUserIds,
  });

  revalidatePath("/profile");

  profileRedirect(messages.teamDeleted);
}
