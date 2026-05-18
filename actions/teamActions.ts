"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const allowedGames = ["Valorant", "League of Legends", "CS2", "Dota2"];

function profileRedirect(message: string): never {
  redirect(`/profile?message=${encodeURIComponent(message)}`);
}

function profileError(message: string): never {
  redirect(`/profile?error=${encodeURIComponent(message)}`);
}

function teamRedirect(teamId: string, message: string): never {
  redirect(`/profile/teams/${teamId}?message=${encodeURIComponent(message)}`);
}

function teamError(teamId: string, message: string): never {
  if (!teamId) {
    return profileError(message);
  }

  redirect(`/profile/teams/${teamId}?error=${encodeURIComponent(message)}`);
}

function getTeamId(formData: FormData) {
  return String(formData.get("teamId") || formData.get("id") || "").trim();
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

function requireGuildMember(user: { isGuildMember: boolean }, teamId?: string) {
  if (!user.isGuildMember) {
    if (teamId) {
      return teamError(
        teamId,
        "Join the RTN Discord server to use team features.",
      );
    }

    return profileError("Join the RTN Discord server to use team features.");
  }
}

async function requireTeamLeader(teamId: string, userId: string) {
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
    return teamError(teamId, "Team was not found.");
  }

  if (team.leaderId !== userId) {
    return teamError(team.id, "Only the team leader can manage this team.");
  }

  return team;
}

function requireEditableTeam(_teamId: string, _status: string) {
  return;
}

export async function createTeam(formData: FormData) {
  const user = await requireUser();
  requireGuildMember(user);

  const name = String(formData.get("name") || "").trim();
  const game = String(formData.get("game") || "").trim();

  if (!name || !game) {
    return profileError("Team name and game are required.");
  }

  if (!allowedGames.includes(game)) {
    return profileError("Invalid game selected.");
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
    return profileError("You already have a team with this name.");
  }

  const team = await prisma.$transaction(async (tx) => {
    const createdTeam = await tx.team.create({
      data: {
        name,
        game,
        leaderId: user.id,
        status: "approved",
        rejectedAt: null,
        rejectionReason: null,
        submittedAt: null,
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

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  teamRedirect(team.id, "Team created successfully.");
}

export async function updateTeam(formData: FormData) {
  const user = await requireUser();

  const teamId = getTeamId(formData);
  requireGuildMember(user, teamId);

  const name = String(formData.get("name") || "").trim();
  const game = String(formData.get("game") || "").trim();

  if (!teamId || !name || !game) {
    return teamError(teamId, "Team ID, name, and game are required.");
  }

  if (!allowedGames.includes(game)) {
    return teamError(teamId, "Invalid game selected.");
  }

  const team = await requireTeamLeader(teamId, user.id);
  requireEditableTeam(team.id, team.status);

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

  teamRedirect(updatedTeam.id, "Team updated successfully.");
}

export async function invitePlayerToTeam(formData: FormData) {
  const user = await requireUser();

  const teamId = getTeamId(formData);
  requireGuildMember(user, teamId);

  const player = String(formData.get("player") || "").trim();

  if (!teamId || !player) {
    return teamError(teamId, "Team and player are required.");
  }

  const team = await requireTeamLeader(teamId, user.id);
  requireEditableTeam(team.id, team.status);

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
    return teamError(
      team.id,
      "Player was not found. They must login to the website first.",
    );
  }

  if (!invitedUser.isGuildMember) {
    return teamError(
      team.id,
      "This player must join the RTN Discord server first.",
    );
  }

  if (invitedUser.id === user.id) {
    return teamError(team.id, "You are already the leader of this team.");
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
    return teamError(team.id, "This player is already in the team.");
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
    return teamError(team.id, "This player already has a pending invitation.");
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

  teamRedirect(team.id, "Invitation sent successfully.");
}

export async function cancelTeamInvite(formData: FormData) {
  const user = await requireUser();

  const teamIdFromForm = getTeamId(formData);
  const inviteId = String(formData.get("inviteId") || "").trim();

  if (!inviteId) {
    return teamError(teamIdFromForm, "Invite ID is missing.");
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
    return teamError(teamIdFromForm, "Invitation was not found.");
  }

  if (invite.team.leaderId !== user.id) {
    return teamError(
      invite.teamId,
      "Only the team leader can cancel invitations.",
    );
  }

  await prisma.teamInvite.delete({
    where: {
      id: invite.id,
    },
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${invite.teamId}`);

  teamRedirect(invite.teamId, "Invitation cancelled.");
}

export async function removeTeamMember(formData: FormData) {
  const user = await requireUser();

  const teamId = getTeamId(formData);
  requireGuildMember(user, teamId);

  const memberId = String(formData.get("memberId") || "").trim();

  if (!teamId || !memberId) {
    return teamError(teamId, "Team ID and member ID are required.");
  }

  const team = await requireTeamLeader(teamId, user.id);
  requireEditableTeam(team.id, team.status);

  const member = await prisma.teamMember.findUnique({
    where: {
      id: memberId,
    },
  });

  if (!member || member.teamId !== team.id) {
    return teamError(team.id, "Team member was not found.");
  }

  if (member.userId === user.id || member.role === "leader") {
    return teamError(team.id, "The team leader cannot be removed.");
  }

  await prisma.teamMember.delete({
    where: {
      id: member.id,
    },
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);

  teamRedirect(team.id, "Team member removed.");
}

export async function submitTeamForReview(formData: FormData) {
  const user = await requireUser();

  const teamId = getTeamId(formData);
  requireGuildMember(user, teamId);

  if (!teamId) {
    return teamError(teamId, "Team ID is missing.");
  }

  const team = await requireTeamLeader(teamId, user.id);

  if (!["draft", "rejected"].includes(team.status)) {
    return teamError(team.id, "This team cannot be submitted right now.");
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

  teamRedirect(team.id, "Team submitted for admin review.");
}

export async function deleteTeam(formData: FormData) {
  const user = await requireUser();

  const teamId = getTeamId(formData);

  if (!teamId) {
    return profileError("Team ID is missing.");
  }

  const team = await requireTeamLeader(teamId, user.id);


  await prisma.team.delete({
    where: {
      id: team.id,
    },
  });

  revalidatePath("/profile");

  profileRedirect("Team deleted.");
}

export async function respondToTeamInvite(formData: FormData) {
  const user = await requireUser();
  requireGuildMember(user);

  const inviteId = String(formData.get("inviteId") || "").trim();
  const response = String(formData.get("response") || "").trim();

  if (!inviteId || !["accepted", "rejected"].includes(response)) {
    return profileError("Invalid invitation response.");
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
    return profileError("Invitation was not found.");
  }

  if (invite.invitedUserId !== user.id) {
    return profileError("This invitation does not belong to you.");
  }

  if (invite.status !== "pending") {
    return profileError("This invitation has already been handled.");
  }

  if (invite.team.status === "pending") {
    return profileError("This team has already been submitted for review.");
  }

  if (invite.team.status === "approved") {
    return profileError("Approved team changes are not available yet.");
  }

  if (response === "accepted") {
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.create({
        data: {
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

    revalidatePath("/profile");
    revalidatePath(`/profile/teams/${invite.teamId}`);

    profileRedirect("Invitation accepted.");
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

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${invite.teamId}`);

  profileRedirect("Invitation rejected.");
}
