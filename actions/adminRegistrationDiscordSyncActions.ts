"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import type { AdminRegistrationActionResult } from "@/actions/adminRegistrationInlineActions";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";

function success(message: string): AdminRegistrationActionResult {
  return {
    ok: true,
    message,
  };
}

function fail(message: string): AdminRegistrationActionResult {
  return {
    ok: false,
    message,
  };
}

async function requireAdmin(): Promise<AdminRegistrationActionResult | null> {
  const session = await auth();

  const sessionUser = session?.user as
    | {
        databaseId?: string;
        isAdmin?: boolean;
      }
    | undefined;

  if (!sessionUser?.databaseId) {
    return fail("Please login first.");
  }

  if (!sessionUser.isAdmin) {
    return fail("Only Ascendra admins can manage Discord sync.");
  }

  return null;
}

function getRegistrationId(formData: FormData) {
  return String(
    formData.get("registrationId") || formData.get("id") || "",
  ).trim();
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function buildRoleName(game: string, teamName: string) {
  return `${game} | ${teamName}`.slice(0, 100);
}

function buildChannelName(game: string, teamName: string) {
  const channelName = `${game}-${teamName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return (channelName || "team-room").slice(0, 90);
}

function getMemberDiscordIds(
  members: Array<{
    user: {
      discordId: string;
    };
  }>,
) {
  return members
    .map((member) => member.user.discordId)
    .filter((discordId): discordId is string => Boolean(discordId));
}

function getLeaderDiscordId(team: {
  leaderId: string;
  members: Array<{
    userId: string;
    user: {
      discordId: string;
    };
  }>;
}) {
  return (
    team.members.find((member) => member.userId === team.leaderId)?.user
      .discordId || null
  );
}

function needsDiscordAccessRemove(registration: {
  status: string;
  discordRoleStatus: string;
  discordRoleId: string | null;
  discordChannelId: string | null;
}) {
  return (
    registration.status === "approved" ||
    registration.discordRoleStatus === "pending_create" ||
    registration.discordRoleStatus === "active" ||
    registration.discordRoleStatus === "failed" ||
    Boolean(registration.discordRoleId) ||
    Boolean(registration.discordChannelId)
  );
}

export async function forceSyncRegistrationDiscordAccess(
  formData: FormData,
): Promise<AdminRegistrationActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const registrationId = getRegistrationId(formData);

  if (!registrationId) {
    return fail("Registration ID is missing.");
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      id: registrationId,
    },
    include: {
      tournament: { include: { game: true } },
      team: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!registration) {
    return fail("Registration was not found.");
  }

  if (registration.status !== "approved") {
    return fail("Only approved registrations can be synced to Discord.");
  }

  const roleName = buildRoleName(
    registration.tournament.game?.name ?? "Game",
    registration.team.name,
  );

  const channelName = buildChannelName(
    registration.tournament.game?.name ?? "Game",
    registration.team.name,
  );

  const memberDiscordIds = getMemberDiscordIds(registration.team.members);
  const leaderDiscordId = getLeaderDiscordId(registration.team);

  await prisma.$transaction(async (tx) => {
    await tx.tournamentRegistration.update({
      where: {
        id: registration.id,
      },
      data: {
        discordRoleStatus: "pending_create",
        discordRoleName: roleName,
        discordChannelName: channelName,
        discordRoleError: null,
        discordRoleRequestedAt: new Date(),
      },
    });

    await tx.botEvent.create({
      data: {
        type: "team_discord_access_create",
        entityType: "registration",
        entityId: registration.id,
        payload: {
          action: "manual_sync",

          registrationId: registration.id,

          tournamentId: registration.tournament.id,
          tournamentTitle: registration.tournament.title,

          game: registration.tournament.game?.name ?? null,

          teamId: registration.team.id,
          teamName: registration.team.name,

          roleName,
          channelName,

          guildId: process.env.DISCORD_GUILD_ID,

          memberDiscordIds,
          leaderDiscordId,

          websiteUrl: `${getSiteUrl()}/tournaments/${registration.tournament.id}`,
        },
      },
    });
  });

  await Promise.all([
    createRealtimeEvent({
      type: "registration.discordSync.queued",
      audience: "admin",
      entityType: "registration",
      entityId: registration.id,
      payload: {
        registrationId: registration.id,
        tournamentId: registration.tournamentId,
        teamName: registration.team.name,
      },
    }),
    createRealtimeEvent({
      type: "tournament.registration.updated",
      audience: "public",
      entityType: "tournament",
      entityId: registration.tournamentId,
      payload: {
        tournamentId: registration.tournamentId,
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath(`/tournaments/${registration.tournamentId}`);
  revalidatePath("/profile");

  return success("Discord access sync queued successfully.");
}

export async function forceRemoveRegistrationDiscordAccess(
  formData: FormData,
): Promise<AdminRegistrationActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const registrationId = getRegistrationId(formData);

  if (!registrationId) {
    return fail("Registration ID is missing.");
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      id: registrationId,
    },
    include: {
      tournament: { include: { game: true } },
      team: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!registration) {
    return fail("Registration was not found.");
  }

  if (!needsDiscordAccessRemove(registration)) {
    return fail("No Discord access exists or needs removal.");
  }

  const memberDiscordIds = getMemberDiscordIds(registration.team.members);
  const leaderDiscordId = getLeaderDiscordId(registration.team);

  await prisma.$transaction(async (tx) => {
    await tx.tournamentRegistration.update({
      where: {
        id: registration.id,
      },
      data: {
        discordRoleStatus: "pending_remove",
        discordRoleError: null,
        discordRoleRequestedAt: new Date(),
      },
    });

    await tx.botEvent.create({
      data: {
        type: "team_discord_access_remove",
        entityType: "registration",
        entityId: registration.id,
        payload: {
          action: "manual_remove",

          registrationId: registration.id,

          tournamentId: registration.tournament.id,
          tournamentTitle: registration.tournament.title,
          game: registration.tournament.game?.name ?? null,

          teamId: registration.team.id,
          teamName: registration.team.name,

          roleId: registration.discordRoleId,
          roleName: registration.discordRoleName,

          channelId: registration.discordChannelId,
          channelName: registration.discordChannelName,

          guildId: process.env.DISCORD_GUILD_ID,

          memberDiscordIds,
          leaderDiscordId,
        },
      },
    });
  });

  await Promise.all([
    createRealtimeEvent({
      type: "registration.discordRemove.queued",
      audience: "admin",
      entityType: "registration",
      entityId: registration.id,
      payload: {
        registrationId: registration.id,
        tournamentId: registration.tournamentId,
        teamName: registration.team.name,
      },
    }),
    createRealtimeEvent({
      type: "tournament.registration.updated",
      audience: "public",
      entityType: "tournament",
      entityId: registration.tournamentId,
      payload: {
        tournamentId: registration.tournamentId,
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath(`/tournaments/${registration.tournamentId}`);
  revalidatePath("/profile");

  return success("Discord access removal queued successfully.");
}
