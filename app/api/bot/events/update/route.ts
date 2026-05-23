import { NextResponse } from "next/server";

import { createRealtimeEvent } from "@/lib/realtime";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

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

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

async function syncTournamentAnnouncementStatus(params: {
  eventType: string;
  tournamentId: string;
  status: string;
  result?: unknown;
  error?: string | null;
}) {
  const { eventType, tournamentId, status, result, error } = params;

  const announcementEventTypes = [
    "tournament_announcement_create",
    "tournament_announcement_update",
    "tournament_announcement_recreate",
    "tournament_announcement_delete",
  ];

  if (!announcementEventTypes.includes(eventType)) {
    return;
  }

  const tournament = await prisma.tournament.findUnique({
    where: {
      id: tournamentId,
    },
    select: {
      id: true,
    },
  });

  if (!tournament) {
    return;
  }

  if (status === "completed") {
    const resultData = isRecord(result) ? result : {};

      if (eventType === "tournament_announcement_delete") {
        await prisma.tournament.update({
          where: {
            id: tournamentId,
          },
          data: {
            discordAnnouncementChannelId: null,
            discordAnnouncementMessageId: null,
            discordAnnouncementUrl: null,
            discordAnnouncementSyncedAt: new Date(),
            discordAnnouncementLastError: null,
          },
        });

        await createRealtimeEvent({
          type: "tournament.discordAnnouncement.deleted",
          audience: "admin",
          entityType: "tournament",
          entityId: tournamentId,
          payload: {
            tournamentId,
          },
        });

        return;
      }

    await prisma.tournament.update({
      where: {
        id: tournamentId,
      },
      data: {
        discordAnnouncementChannelId: getOptionalString(resultData.channelId),
        discordAnnouncementMessageId: getOptionalString(resultData.messageId),
        discordAnnouncementUrl: getOptionalString(resultData.messageUrl),
        discordAnnouncementSyncedAt: new Date(),
        discordAnnouncementLastError: null,
      },
    });

    await createRealtimeEvent({
      type: "tournament.discordAnnouncement.synced",
      audience: "admin",
      entityType: "tournament",
      entityId: tournamentId,
      payload: {
        tournamentId,
        channelId: getOptionalString(resultData.channelId),
        messageId: getOptionalString(resultData.messageId),
        messageUrl: getOptionalString(resultData.messageUrl),
      },
    });

    return;
  }

  if (status === "failed") {
    await prisma.tournament.update({
      where: {
        id: tournamentId,
      },
      data: {
        discordAnnouncementLastError:
          error || "Discord announcement sync failed.",
        discordAnnouncementSyncedAt: new Date(),
      },
    });

    await createRealtimeEvent({
      type: "tournament.discordAnnouncement.failed",
      audience: "admin",
      entityType: "tournament",
      entityId: tournamentId,
      payload: {
        tournamentId,
        error: error || "Discord announcement sync failed.",
      },
    });
  }
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

  await createRealtimeEvent({
    type: "bot.event.updated",
    audience: "admin",
    entityType: "botEvent",
    entityId: updatedEvent.id,
    payload: {
      botEventId: updatedEvent.id,
      botEventType: updatedEvent.type,
      status: updatedEvent.status,
      error: updatedEvent.error,
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
      result: isRecord(result)
        ? {
            roleId: getOptionalString(result.roleId),
            channelId: getOptionalString(result.channelId),
          }
        : undefined,
      error: error || undefined,
    });
  }

  if (
    event.entityType === "tournament" &&
    event.entityId &&
    (event.type === "tournament_announcement_create" ||
      event.type === "tournament_announcement_update" ||
      event.type === "tournament_announcement_recreate" ||
      event.type === "tournament_announcement_delete")
  ) {
    await syncTournamentAnnouncementStatus({
      eventType: event.type,
      tournamentId: event.entityId,
      status,
      result,
      error,
    });
  }

  return NextResponse.json({
    ok: true,
    event: updatedEvent,
  });
}
