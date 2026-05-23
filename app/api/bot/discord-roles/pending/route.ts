import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DiscordRoleQueueStatus = "pending_create" | "pending_remove" | "failed";

const queuedStatuses: DiscordRoleQueueStatus[] = [
  "pending_create",
  "pending_remove",
  "failed",
];

function unauthorized() {
  return NextResponse.json(
    {
      ok: false,
      message: "Unauthorized.",
    },
    {
      status: 401,
    },
  );
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";

  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice("Bearer ".length).trim();
}

function requireBotAccess(request: Request) {
  const expectedToken = process.env.BOT_API_TOKEN;
  const providedToken = getBearerToken(request);

  if (!expectedToken || !providedToken) {
    return false;
  }

  return providedToken === expectedToken;
}

function getBotAction(status: string) {
  if (status === "pending_create" || status === "failed") {
    return "create_role";
  }

  if (status === "pending_remove") {
    return "remove_role";
  }

  return "none";
}

export async function GET(request: Request) {
  if (!requireBotAccess(request)) {
    return unauthorized();
  }

  const registrations = await prisma.tournamentRegistration.findMany({
    where: {
      discordRoleStatus: {
        in: queuedStatuses,
      },
    },
    select: {
      id: true,
      status: true,
      discordRoleStatus: true,
      discordRoleName: true,
      discordRoleId: true,
      discordRoleError: true,
      discordRoleRequestedAt: true,
      discordRoleSyncedAt: true,
      tournament: {
        select: {
          id: true,
          title: true,
          game: { select: { name: true } },
          startsAt: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
          game: { select: { name: true } },
          leaderId: true,
          members: {
            select: {
              id: true,
              userId: true,
              role: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  discordId: true,
                },
              },
            },
            orderBy: {
              joinedAt: "asc",
            },
          },
        },
      },
    },
    orderBy: {
      discordRoleRequestedAt: "asc",
    },
    take: 50,
  });

  return NextResponse.json({
    ok: true,
    count: registrations.length,
    registrations: registrations.map((registration) => ({
      registrationId: registration.id,
      registrationStatus: registration.status,
      action: getBotAction(registration.discordRoleStatus),
      discordRoleStatus: registration.discordRoleStatus,
      discordRoleName: registration.discordRoleName,
      discordRoleId: registration.discordRoleId,
      discordRoleError: registration.discordRoleError,
      discordRoleRequestedAt: registration.discordRoleRequestedAt,
      discordRoleSyncedAt: registration.discordRoleSyncedAt,
      tournament: {
        id: registration.tournament.id,
        title: registration.tournament.title,
        game: registration.tournament.game?.name ?? null,
        startsAt: registration.tournament.startsAt?.toISOString() ?? null,
      },
      team: {
        id: registration.team.id,
        name: registration.team.name,
        game: registration.team.game?.name ?? null,
        leaderId: registration.team.leaderId,
        members: registration.team.members.map((member) => ({
          id: member.id,
          userId: member.userId,
          role: member.role,
          username: member.user.username,
          discordId: member.user.discordId,
          isLeader: member.userId === registration.team.leaderId,
        })),
      },
    })),
  });
}
