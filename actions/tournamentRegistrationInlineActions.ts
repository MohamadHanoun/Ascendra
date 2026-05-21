"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";

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

function revalidateRegistrationViews(tournamentId: string) {
  revalidatePath("/admin");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/profile");
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

  if (registration.status === "approved") {
    return success("Registration is already approved.");
  }

  const approvedRegistrationsCount = await prisma.tournamentRegistration.count({
    where: {
      tournamentId: registration.tournamentId,
      status: "approved",
      id: {
        not: registration.id,
      },
    },
  });

  if (approvedRegistrationsCount >= registration.tournament.maxSlots) {
    return fail("No approved slots are available for this tournament.");
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

  try {
    await prisma.$transaction(
      async (tx) => {
        const approvedCountInsideTransaction =
          await tx.tournamentRegistration.count({
            where: {
              tournamentId: registration.tournamentId,
              status: "approved",
              id: {
                not: registration.id,
              },
            },
          });

        if (
          approvedCountInsideTransaction >= registration.tournament.maxSlots
        ) {
          throw new Error("NO_APPROVED_SLOTS_AVAILABLE");
        }

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
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "NO_APPROVED_SLOTS_AVAILABLE"
    ) {
      return fail("No approved slots are available for this tournament.");
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return fail(
        "Another approval was processed at the same time. Please try again.",
      );
    }

    throw error;
  }

  await Promise.all([
    createRealtimeEvent({
      type: "registration.approved",
      audience: "admin",
      entityType: "registration",
      entityId: registration.id,
      payload: {
        registrationId: registration.id,
        tournamentId: registration.tournamentId,
        teamId: registration.teamId,
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

  revalidateRegistrationViews(registration.tournamentId);

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

    await tx.botEvent.create({
      data: {
        type: "team_discord_access_remove",
        entityType: "registration",
        entityId: registration.id,
        payload: {
          action: "rejected",
          rejectionReason,

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
  });

  await Promise.all([
    createRealtimeEvent({
      type: "registration.rejected",
      audience: "admin",
      entityType: "registration",
      entityId: registration.id,
      payload: {
        registrationId: registration.id,
        tournamentId: registration.tournamentId,
        teamId: registration.teamId,
        teamName: registration.team.name,
        rejectionReason,
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

  revalidateRegistrationViews(registration.tournamentId);

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

    await tx.botEvent.create({
      data: {
        type: "team_discord_access_remove",
        entityType: "registration",
        entityId: registration.id,
        payload: {
          action: "cancelled",

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
  });

  await Promise.all([
    createRealtimeEvent({
      type: "registration.cancelled",
      audience: "admin",
      entityType: "registration",
      entityId: registration.id,
      payload: {
        registrationId: registration.id,
        tournamentId: registration.tournamentId,
        teamId: registration.teamId,
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

  revalidateRegistrationViews(registration.tournamentId);

  return success("Registration cancelled successfully.");
}
