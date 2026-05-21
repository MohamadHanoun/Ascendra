"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const allowedGames = ["Valorant", "League of Legends", "CS2", "Dota2"];

function profileRedirect(message: string): never {
  redirect(`/profile?message=${encodeURIComponent(message)}`);
}

function profileError(message: string): never {
  redirect(`/profile?error=${encodeURIComponent(message)}`);
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

function requireGuildMember(user: { isGuildMember: boolean }) {
  if (!user.isGuildMember) {
    profileError("Join the Ascendra Discord server to use team features.");
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
    profileError("Team was not found.");
  }

  if (team.leaderId !== userId) {
    profileError("Only the team leader can manage this team.");
  }

  return team;
}

function requireEditableTeam(_status: string) {
  return;
}
async function hasActiveTournamentRegistration(teamId: string) {
  const count = await prisma.tournamentRegistration.count({
    where: {
      teamId,
      status: {
        in: ["registered", "approved"],
      },
    },
  });

  return count > 0;
}

async function requireTeamNotInActiveRegistration(teamId: string) {
  const hasActiveRegistration = await hasActiveTournamentRegistration(teamId);

  if (hasActiveRegistration) {
    profileError("Team is locked while registered in a tournament.");
  }
}

export async function createTeam(formData: FormData) {
  const user = await requireUser();
  requireGuildMember(user);

  const name = String(formData.get("name") || "").trim();
  const game = String(formData.get("game") || "").trim();

  if (!name || !game) {
    profileError("Team name and game are required.");
  }

  if (!allowedGames.includes(game)) {
    profileError("Invalid game selected.");
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
    profileError("You already have a team with this name.");
  }

  await prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        name,
        game,
        leaderId: user.id,
        status: "approved",
        submittedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    await tx.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: "leader",
      },
    });
  });

  revalidatePath("/profile");
  profileRedirect("Team created successfully.");
}

export async function updateTeam(formData: FormData) {
  const user = await requireUser();
  requireGuildMember(user);

  const teamId = String(formData.get("teamId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const game = String(formData.get("game") || "").trim();

  if (!teamId || !name || !game) {
    profileError("Team ID, name, and game are required.");
  }

  if (!allowedGames.includes(game)) {
    profileError("Invalid game selected.");
  }
  

  const team = await requireTeamLeader(teamId, user.id);
  requireEditableTeam(team.status);

  await requireTeamNotInActiveRegistration(team.id);

  await prisma.team.update({
    where: {
      id: team.id,
    },
    data: {
      name,
      game,
      status: "approved",
      submittedAt: null,
      rejectedAt: null,
      rejectionReason: null,
    },
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);
  profileRedirect("Team updated successfully.");
}

export async function invitePlayerToTeam(formData: FormData) {
  const user = await requireUser();
  requireGuildMember(user);

  const teamId = String(formData.get("teamId") || "").trim();
  const player = String(formData.get("player") || "").trim();

  if (!teamId || !player) {
    profileError("Team and player are required.");
  }

  const team = await requireTeamLeader(teamId, user.id);
  requireEditableTeam(team.status);
  await requireTeamNotInActiveRegistration(team.id);

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
    profileError("Player was not found. They must login to the website first.");
  }

  if (!invitedUser.isGuildMember) {
    profileError("This player must join the Ascendra Discord server first.");
  }

  if (invitedUser.id === user.id) {
    profileError("You are already the leader of this team.");
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
    profileError("This player is already in the team.");
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
    profileError("This player already has a pending invitation.");
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
  profileRedirect("Invitation sent successfully.");
}

export async function cancelTeamInvite(formData: FormData) {
  const user = await requireUser();

  const inviteId = String(formData.get("inviteId") || "").trim();

  if (!inviteId) {
    profileError("Invite ID is missing.");
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
    profileError("Invitation was not found.");
  }

  if (invite.team.leaderId !== user.id) {
    profileError("Only the team leader can cancel invitations.");
  }

  await prisma.teamInvite.delete({
    where: {
      id: invite.id,
    },
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${invite.teamId}`);
  profileRedirect("Invitation cancelled.");
}

export async function respondToTeamInvite(formData: FormData) {
  const user = await requireUser();
  requireGuildMember(user);

  const inviteId = String(formData.get("inviteId") || "").trim();
  const response = String(formData.get("response") || "").trim();

  if (!inviteId || !["accepted", "rejected"].includes(response)) {
    profileError("Invalid invitation response.");
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
    profileError("Invitation was not found.");
  }

  if (invite.invitedUserId !== user.id) {
    profileError("This invitation does not belong to you.");
  }

  if (invite.status !== "pending") {
    profileError("This invitation has already been handled.");
  }

  if (response === "accepted") {
    await prisma.$transaction(async (tx) => {
      const activeRegistration = await prisma.tournamentRegistration.findFirst({
        where: {
          teamId: invite.teamId,
          status: {
            in: ["registered", "approved"],
          },
        },
      });

      if (activeRegistration) {
        profileError("Team is locked while registered in a tournament.");
      }
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

export async function removeTeamMember(formData: FormData) {
  const user = await requireUser();

  const teamId = String(formData.get("teamId") || "").trim();
  const memberId = String(formData.get("memberId") || "").trim();

  if (!teamId || !memberId) {
    profileError("Team ID and member ID are required.");
  }

  const team = await requireTeamLeader(teamId, user.id);
  requireEditableTeam(team.status);
  await requireTeamNotInActiveRegistration(team.id);

  const member = await prisma.teamMember.findUnique({
    where: {
      id: memberId,
    },
  });

  if (!member || member.teamId !== team.id) {
    profileError("Team member was not found.");
  }

  if (member.userId === user.id || member.role === "leader") {
    profileError("The team leader cannot be removed.");
  }

  await prisma.teamMember.delete({
    where: {
      id: member.id,
    },
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);
  profileRedirect("Team member removed.");
}

export async function submitTeamForReview(formData: FormData) {
  const user = await requireUser();
  requireGuildMember(user);

  const teamId = String(formData.get("teamId") || "").trim();

  if (!teamId) {
    profileError("Team ID is missing.");
  }

  const team = await requireTeamLeader(teamId, user.id);

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

  revalidatePath("/profile");
  revalidatePath(`/profile/teams/${team.id}`);
  profileRedirect("Team is active.");
}

export async function deleteTeam(formData: FormData) {
  const user = await requireUser();

  const teamId =
    String(formData.get("teamId") || "").trim() ||
    String(formData.get("id") || "").trim();

  if (!teamId) {
    profileError("Team ID is missing.");
  }

  const team = await requireTeamLeader(teamId, user.id);

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

  revalidatePath("/profile");
  profileRedirect("Team deleted.");
}
