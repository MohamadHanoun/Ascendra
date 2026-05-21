"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type TeamInlineActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

const allowedGames = ["Valorant", "League of Legends", "CS2", "Dota2"];

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

async function getLeaderTeam(teamId: string, userId: string) {
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
      error: "Team was not found.",
    };
  }

  if (team.leaderId !== userId) {
    return {
      team: null,
      error: "Only the team leader can manage this team.",
    };
  }

  return {
    team,
    error: null,
  };
}

function getEditableError(_status: string) {
  return null;
}

async function getBlockingActiveRegistration({
  teamId,
  memberCountAfterChange,
}: {
  teamId: string;
  memberCountAfterChange: number;
}) {
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
        teamSize: {
          gt: memberCountAfterChange,
        },
      },
    },
    select: {
      status: true,
      tournament: {
        select: {
          title: true,
          teamSize: true,
        },
      },
    },
  });
}
async function getActiveTeamRegistration(teamId: string) {
  return prisma.tournamentRegistration.findFirst({
    where: {
      teamId,
      status: {
        notIn: ["rejected", "cancelled", "canceled"],
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
          game: true,
        },
      },
    },
  });
}

function getTeamSizeBlockMessage(
  tournamentTitle: string,
  requiredTeamSize: number,
) {
  return `This action is blocked because it would make the team too small for "${tournamentTitle}". This tournament requires ${requiredTeamSize} players.`;
}

export async function updateTeamInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Please login first.", "/login");
  }

  const teamId = getTeamId(formData);
  const name = String(formData.get("name") || "").trim();
  const game = String(formData.get("game") || "").trim();

  if (!teamId || !name || !game) {
    return fail("Team ID, name, and game are required.");
  }

  if (!allowedGames.includes(game)) {
    return fail("Invalid game selected.");
  }

  const { team, error } = await getLeaderTeam(teamId, user.id);

  if (!team) {
    return fail(error || "Team was not found.");
  }

  const editableError = getEditableError(team.status);

  if (editableError) {
    return fail(editableError);
  }
  const activeRegistration = await getActiveTeamRegistration(team.id);

  if (activeRegistration && game !== team.game) {
    return fail(
      `You cannot change this team's game because it has an active registration for "${activeRegistration.tournament.title}".`,
    );
  }

  const updatedTeam = await prisma.team.update({
    where: {
      id: team.id,
    },
    data: {
      name,
      game,
      status: team.status === "rejected" ? "draft" : team.status,
      rejectedAt: null,
      rejectionReason: null,
    },
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${updatedTeam.id}`);

  return success("Team updated successfully.");
}

export async function invitePlayerToTeamInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Please login first.", "/login");
  }

  const teamId = getTeamId(formData);
  const player = String(formData.get("player") || "").trim();

  if (!teamId || !player) {
    return fail("Team and player are required.");
  }

  const { team, error } = await getLeaderTeam(teamId, user.id);

  if (!team) {
    return fail(error || "Team was not found.");
  }
  const activeRegistration = await getActiveTeamRegistration(team.id);

  if (activeRegistration) {
    return fail(
      `This team cannot be deleted because it has an active registration for "${activeRegistration.tournament.title}".`,
    );
  }

  const editableError = getEditableError(team.status);

  if (editableError) {
    return fail(editableError);
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
    return fail("Player was not found. They must login to the website first.");
  }

  if (!invitedUser.isGuildMember) {
    return fail("This player must join the Ascendra Discord server first.");
  }

  if (invitedUser.id === user.id) {
    return fail("You are already the leader of this team.");
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
    return fail("This player is already in the team.");
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
    return fail("This player already has a pending invitation.");
  }

  if (existingInvite) {
    await prisma.teamInvite.update({
      where: {
        id: existingInvite.id,
      },
      data: {
        status: "pending",
        invitedById: user.id,
        respondedAt: null,
        createdAt: new Date(),
      },
    });
  } else {
    await prisma.teamInvite.create({
      data: {
        teamId: team.id,
        invitedUserId: invitedUser.id,
        invitedById: user.id,
        status: "pending",
      },
    });
  }

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  return success("Invitation sent successfully.");
}

export async function removeTeamMemberInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Please login first.", "/login");
  }

  const teamId = getTeamId(formData);
  const memberId = String(formData.get("memberId") || "").trim();

  if (!teamId || !memberId) {
    return fail("Team ID and member ID are required.");
  }

  const { team, error } = await getLeaderTeam(teamId, user.id);

  if (!team) {
    return fail(error || "Team was not found.");
  }

  const editableError = getEditableError(team.status);

  if (editableError) {
    return fail(editableError);
  }

  const member = await prisma.teamMember.findUnique({
    where: {
      id: memberId,
    },
  });

  if (!member || member.teamId !== team.id) {
    return fail("Team member was not found.");
  }

  if (member.userId === user.id || member.role === "leader") {
    return fail("The team leader cannot be removed.");
  }

  const memberCountAfterRemove = team.members.length - 1;

  const blockingRegistration = await getBlockingActiveRegistration({
    teamId: team.id,
    memberCountAfterChange: memberCountAfterRemove,
  });

  if (blockingRegistration) {
    return fail(
      getTeamSizeBlockMessage(
        blockingRegistration.tournament.title,
        blockingRegistration.tournament.teamSize,
      ),
    );
  }

  await prisma.teamMember.delete({
    where: {
      id: member.id,
    },
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  return success("Team member removed.");
}

export async function leaveTeamInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Please login first.", "/login");
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

  if (team.leaderId === user.id) {
    return fail(
      "The team leader cannot leave the team. Delete the team or transfer leadership first.",
    );
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
    return fail("You are not a member of this team.");
  }

  const memberCountAfterLeave = team.members.length - 1;

  const blockingRegistration = await getBlockingActiveRegistration({
    teamId: team.id,
    memberCountAfterChange: memberCountAfterLeave,
  });

  if (blockingRegistration) {
    return fail(
      getTeamSizeBlockMessage(
        blockingRegistration.tournament.title,
        blockingRegistration.tournament.teamSize,
      ),
    );
  }

  await prisma.teamMember.delete({
    where: {
      id: membership.id,
    },
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  const message = encodeURIComponent("You left the team.");

  return success("You left the team.", `/profile?message=${message}`);
}

export async function transferTeamLeadershipInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Please login first.", "/login");
  }

  const teamId = getTeamId(formData);
  const memberId = String(formData.get("memberId") || "").trim();

  if (!teamId || !memberId) {
    return fail("Team ID and member ID are required.");
  }

  const { team, error } = await getLeaderTeam(teamId, user.id);

  if (!team) {
    return fail(error || "Team was not found.");
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
    return fail("Team member was not found.");
  }

  if (targetMember.userId === user.id) {
    return fail("You are already the team leader.");
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

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  return success(`Leadership transferred to ${targetMember.user.username}.`);
}

export async function cancelTeamInviteInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Please login first.", "/login");
  }

  const teamId = getTeamId(formData);
  const inviteId = String(formData.get("inviteId") || "").trim();

  if (!teamId || !inviteId) {
    return fail("Team ID and invite ID are required.");
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
    return fail("Invitation was not found.");
  }

  if (invite.teamId !== teamId) {
    return fail("This invitation does not belong to this team.");
  }

  if (invite.team.leaderId !== user.id) {
    return fail("Only the team leader can cancel invitations.");
  }

  const editableError = getEditableError(invite.team.status);

  if (editableError) {
    return fail(editableError);
  }

  await prisma.teamInvite.delete({
    where: {
      id: invite.id,
    },
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${invite.teamId}`);

  return success("Invitation cancelled.");
}

export async function submitTeamForReviewInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Please login first.", "/login");
  }

  const teamId = getTeamId(formData);

  if (!teamId) {
    return fail("Team ID is missing.");
  }

  const { team, error } = await getLeaderTeam(teamId, user.id);

  if (!team) {
    return fail(error || "Team was not found.");
  }

  if (!["draft", "rejected"].includes(team.status)) {
    return fail("This team cannot be submitted right now.");
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

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  return success("Team submitted for admin review.");
}

export async function deleteTeamInline(
  formData: FormData,
): Promise<TeamInlineActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Please login first.", "/login");
  }

  const teamId = getTeamId(formData);

  if (!teamId) {
    return fail("Team ID is missing.");
  }

  const { team, error } = await getLeaderTeam(teamId, user.id);

  if (!team) {
    return fail(error || "Team was not found.");
  }

  const activeRegistration = await getActiveTeamRegistration(team.id);

  if (activeRegistration) {
    return fail(
      `This team cannot be deleted because it has a ${activeRegistration.status} registration for "${activeRegistration.tournament.title}".`,
    );
  }

  await prisma.team.delete({
    where: {
      id: team.id,
    },
  });

  revalidatePath("/profile");

  const message = encodeURIComponent("Team deleted.");

  return success("Team deleted.", `/profile?message=${message}`);
}
