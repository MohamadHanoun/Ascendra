import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.replace("Bearer ", "");

  return token === process.env.BOT_API_TOKEN;
}

function isFinalStatus(status: string) {
  return (
    status === "completed" || status === "failed" || status === "cancelled"
  );
}

async function syncRegistrationStatus(params: {
  eventType: string;
  registrationId: string;
  status: string;
  result?: {
    roleId?: string;
    channelId?: string;
  };
  error?: string;
}) {
  const { eventType, registrationId, status, result, error } = params;

  if (eventType === "team_discord_access_create") {
    if (status === "completed") {
      await prisma.tournamentRegistration.update({
        where: {
          id: registrationId,
        },
        data: {
          discordRoleStatus: "active",
          discordRoleId: result?.roleId || undefined,
          discordChannelId: result?.channelId || undefined,
          discordRoleError: null,
          discordRoleSyncedAt: new Date(),
        },
      });

      return;
    }

    if (status === "failed") {
      await prisma.tournamentRegistration.update({
        where: {
          id: registrationId,
        },
        data: {
          discordRoleStatus: "failed",
          discordRoleError: error || "Bot operation failed.",
          discordRoleSyncedAt: new Date(),
        },
      });
    }
  }

  if (eventType === "team_discord_access_remove") {
    if (status === "completed") {
      await prisma.tournamentRegistration.update({
        where: {
          id: registrationId,
        },
        data: {
          discordRoleStatus: "removed",
          discordRoleError: null,
          discordRoleSyncedAt: new Date(),
        },
      });

      return;
    }

    if (status === "failed") {
      await prisma.tournamentRegistration.update({
        where: {
          id: registrationId,
        },
        data: {
          discordRoleStatus: "failed",
          discordRoleError: error || "Bot operation failed.",
          discordRoleSyncedAt: new Date(),
        },
      });
    }
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const body = await request.json();

  const eventId = String(body.eventId || "").trim();
  const status = String(body.status || "").trim();
  const result = body.result ?? null;
  const error = body.error ? String(body.error) : null;

  if (!eventId || !status) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing fields",
      },
      {
        status: 400,
      },
    );
  }

  const event = await prisma.botEvent.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!event) {
    return NextResponse.json(
      {
        ok: false,
        error: "Event was not found.",
      },
      {
        status: 404,
      },
    );
  }

  const updatedEvent = await prisma.botEvent.update({
    where: {
      id: eventId,
    },
    data: {
      status,
      result,
      error,
      lockedAt: null,
      processedAt: isFinalStatus(status) ? new Date() : null,
    },
  });

  if (
    event.entityType === "registration" &&
    event.entityId &&
    (event.type === "team_discord_access_create" ||
      event.type === "team_discord_access_remove")
  ) {
    await syncRegistrationStatus({
      eventType: event.type,
      registrationId: event.entityId,
      status,
      result,
      error: error || undefined,
    });
  }

  return NextResponse.json({
    ok: true,
    event: updatedEvent,
  });
}
