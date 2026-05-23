"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";

export type AdminBotEventActionResult = {
  ok: boolean;
  message: string;
};

function success(message: string): AdminBotEventActionResult {
  return {
    ok: true,
    message,
  };
}

function fail(message: string): AdminBotEventActionResult {
  return {
    ok: false,
    message,
  };
}

async function requireAdmin(): Promise<AdminBotEventActionResult | null> {
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
    return fail("Only Ascendra admins can manage bot events.");
  }

  return null;
}

function getEventId(formData: FormData) {
  return String(formData.get("eventId") || "").trim();
}

async function publishBotEventUpdate(eventId: string, status: string) {
  await createRealtimeEvent({
    type: "bot.event.updated",
    audience: "admin",
    entityType: "botEvent",
    entityId: eventId,
    payload: {
      botEventId: eventId,
      status,
    },
  });
}

async function publishBotBulkUpdate(type: string, count: number) {
  await createRealtimeEvent({
    type,
    audience: "admin",
    entityType: "botEvent",
    entityId: "bulk",
    payload: {
      count,
    },
  });
}

function revalidateBotViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/bot");
}

export async function retryBotEventInline(
  formData: FormData,
): Promise<AdminBotEventActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const eventId = getEventId(formData);

  if (!eventId) {
    return fail("Bot event ID is missing.");
  }

  const event = await prisma.botEvent.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!event) {
    return fail("Bot event was not found.");
  }

  if (!["failed", "cancelled"].includes(event.status)) {
    return fail("Only failed or cancelled bot events can be retried.");
  }

  await prisma.botEvent.update({
    where: {
      id: event.id,
    },
    data: {
      status: "queued",
      attempts: 0,
      error: null,
      lockedAt: null,
      processedAt: null,
    },
  });

  await publishBotEventUpdate(event.id, "queued");

  revalidateBotViews();

  return success("Bot event queued again.");
}

export async function cancelBotEventInline(
  formData: FormData,
): Promise<AdminBotEventActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const eventId = getEventId(formData);

  if (!eventId) {
    return fail("Bot event ID is missing.");
  }

  const event = await prisma.botEvent.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!event) {
    return fail("Bot event was not found.");
  }

  if (!["queued", "failed", "processing"].includes(event.status)) {
    return fail(
      "Only queued, processing, or failed bot events can be cancelled.",
    );
  }

  await prisma.botEvent.update({
    where: {
      id: event.id,
    },
    data: {
      status: "cancelled",
      error:
        event.status === "processing"
          ? "Cancelled manually while processing."
          : null,
      lockedAt: null,
      processedAt: new Date(),
    },
  });

  await publishBotEventUpdate(event.id, "cancelled");

  revalidateBotViews();

  return success("Bot event cancelled.");
}

export async function resetProcessingBotEventsInline(): Promise<AdminBotEventActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const result = await prisma.botEvent.updateMany({
    where: {
      status: "processing",
    },
    data: {
      status: "queued",
      lockedAt: null,
      error: "Reset manually from stuck processing state.",
      processedAt: null,
    },
  });

  await publishBotBulkUpdate("bot.events.processing.reset", result.count);

  revalidateBotViews();

  return success(`Reset ${result.count} processing bot event(s).`);
}

export async function cancelPendingBotEventsInline(): Promise<AdminBotEventActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const result = await prisma.botEvent.updateMany({
    where: {
      status: {
        in: ["queued", "failed", "processing"],
      },
    },
    data: {
      status: "cancelled",
      lockedAt: null,
      processedAt: new Date(),
      error: "Cancelled manually from bot dashboard.",
    },
  });

  await publishBotBulkUpdate("bot.events.pending.cancelled", result.count);

  revalidateBotViews();

  return success(`Cancelled ${result.count} pending bot event(s).`);
}

export async function cleanupCompletedBotEventsInline(
  formData: FormData,
): Promise<AdminBotEventActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const days = Number(formData.get("days") || 30);

  if (!Number.isFinite(days) || days < 1) {
    return fail("Cleanup days must be at least 1.");
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await prisma.botEvent.deleteMany({
    where: {
      status: {
        in: ["completed", "cancelled"],
      },
      updatedAt: {
        lt: cutoffDate,
      },
    },
  });

  await createRealtimeEvent({
    type: "bot.events.cleaned",
    audience: "admin",
    entityType: "botEvent",
    entityId: "cleanup",
    payload: {
      deletedCount: result.count,
      olderThanDays: days,
    },
  });

  revalidateBotViews();

  return success(`Cleaned ${result.count} old bot event(s).`);
}
