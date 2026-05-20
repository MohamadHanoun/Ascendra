"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AdminRegistrationActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

function success(message: string): AdminRegistrationActionResult {
  return {
    ok: true,
    message,
  };
}

function fail(
  message: string,
  redirectTo?: string,
): AdminRegistrationActionResult {
  return {
    ok: false,
    message,
    redirectTo,
  };
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

async function requireAdmin(): Promise<AdminRegistrationActionResult | null> {
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
    return fail("Only Ascendra admins can manage tournament registrations.");
  }

  return null;
}

function getRegistrationId(formData: FormData) {
  return String(
    formData.get("registrationId") || formData.get("id") || "",
  ).trim();
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
    Boolean(registration.discordRoleId) ||
    Boolean(registration.discordChannelId)
  );
}

export async function approveRegistrationInline(
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
      tournament: true,
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

  const roleName = buildRoleName(
    registration.tournament.game,
    registration.team.name,
  );

  const channelName = buildChannelName(
    registration.tournament.game,
    registration.team.name,
  );

  const memberDiscordIds = getMemberDiscordIds(registration.team.members);

  await prisma.$transaction(async (tx) => {
    await tx.tournamentRegistration.update({
      where: {
        id: registration.id,
      },
      data: {
        status: "approved",
        rejectionReason: null,
        approvedAt: new Date(),
        reviewedAt: new Date(),

        discordRoleStatus: "pending_create",
        discordRoleName: roleName,
        discordRoleError: null,
        discordRoleRequestedAt: new Date(),

        discordChannelName: channelName,
      },
    });

    await tx.botEvent.create({
      data: {
        type: "team_discord_access_create",
        entityType: "registration",
        entityId: registration.id,
        payload: {
          registrationId: registration.id,

          tournamentId: registration.tournament.id,
          tournamentTitle: registration.tournament.title,

          game: registration.tournament.game,

          teamId: registration.team.id,
          teamName: registration.team.name,

          roleName,
          channelName,

          guildId: process.env.DISCORD_GUILD_ID,

          memberDiscordIds,

          websiteUrl: `${getSiteUrl()}/tournaments/${registration.tournament.id}`,
        },
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath(`/tournaments/${registration.tournamentId}`);
  revalidatePath("/profile");

  return success("Registration approved successfully.");
}

export async function rejectRegistrationInline(
  formData: FormData,
): Promise<AdminRegistrationActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const registrationId = getRegistrationId(formData);
  const rejectionReason = String(formData.get("rejectionReason") || "").trim();

  if (!registrationId) {
    return fail("Registration ID is missing.");
  }

  if (!rejectionReason) {
    return fail("Rejection reason is required.");
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      id: registrationId,
    },
    include: {
      tournament: true,
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

  const shouldRemoveAccess = needsDiscordAccessRemove(registration);
  const memberDiscordIds = getMemberDiscordIds(registration.team.members);

  await prisma.$transaction(async (tx) => {
    await tx.tournamentRegistration.update({
      where: {
        id: registration.id,
      },
      data: {
        status: "rejected",
        rejectionReason,
        reviewedAt: new Date(),
        discordRoleStatus: shouldRemoveAccess ? "pending_remove" : "not_needed",
        discordRoleRequestedAt: shouldRemoveAccess ? new Date() : undefined,
      },
    });

    if (shouldRemoveAccess) {
      await tx.botEvent.create({
        data: {
          type: "team_discord_access_remove",
          entityType: "registration",
          entityId: registration.id,
          payload: {
            registrationId: registration.id,

            tournamentId: registration.tournament.id,
            tournamentTitle: registration.tournament.title,

            teamId: registration.team.id,
            teamName: registration.team.name,

            roleId: registration.discordRoleId,
            roleName: registration.discordRoleName,

            channelId: registration.discordChannelId,
            channelName: registration.discordChannelName,

            guildId: process.env.DISCORD_GUILD_ID,

            memberDiscordIds,
          },
        },
      });
    }
  });

  revalidatePath("/admin");
  revalidatePath(`/tournaments/${registration.tournamentId}`);
  revalidatePath("/profile");

  return success("Registration rejected successfully.");
}

export async function cancelRegistrationInline(
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
      tournament: true,
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

  const shouldRemoveAccess = needsDiscordAccessRemove(registration);
  const memberDiscordIds = getMemberDiscordIds(registration.team.members);

  await prisma.$transaction(async (tx) => {
    await tx.tournamentRegistration.update({
      where: {
        id: registration.id,
      },
      data: {
        status: "cancelled",
        reviewedAt: new Date(),
        cancelledAt: new Date(),
        discordRoleStatus: shouldRemoveAccess ? "pending_remove" : "not_needed",
        discordRoleRequestedAt: shouldRemoveAccess ? new Date() : undefined,
      },
    });

    if (shouldRemoveAccess) {
      await tx.botEvent.create({
        data: {
          type: "team_discord_access_remove",
          entityType: "registration",
          entityId: registration.id,
          payload: {
            registrationId: registration.id,

            tournamentId: registration.tournament.id,
            tournamentTitle: registration.tournament.title,

            teamId: registration.team.id,
            teamName: registration.team.name,

            roleId: registration.discordRoleId,
            roleName: registration.discordRoleName,

            channelId: registration.discordChannelId,
            channelName: registration.discordChannelName,

            guildId: process.env.DISCORD_GUILD_ID,

            memberDiscordIds,
          },
        },
      });
    }
  });

  revalidatePath("/admin");
  revalidatePath(`/tournaments/${registration.tournamentId}`);
  revalidatePath("/profile");

  return success("Registration cancelled successfully.");
}
