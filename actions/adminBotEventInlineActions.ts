"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";

export type AdminBotEventActionResult = {
  ok: boolean;
  message: string;
};

type BotCommandType =
  | "bot_command_health_check"
  | "bot_command_refresh_config"
  | "bot_command_restart"
  | "bot_command_send_message";

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

function getFormValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function revalidateBotViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/bot");
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

async function publishBotRuntimeUpdate(type: string, payload = {}) {
  await createRealtimeEvent({
    type,
    audience: "admin",
    entityType: "bot",
    entityId: "runtime",
    payload,
  });
}

async function queueBotCommand(
  type: BotCommandType,
  priority = 90,
  payload: Record<string, unknown> = {},
) {
  const event = await prisma.botEvent.create({
    data: {
      type,
      entityType: "bot",
      entityId: "runtime",
      priority,
      payload: {
        ...payload,
        requestedAt: new Date().toISOString(),
        source: "admin_dashboard",
      },
    },
  });

  await createRealtimeEvent({
    type: "bot.command.queued",
    audience: "admin",
    entityType: "botEvent",
    entityId: event.id,
    payload: {
      botEventId: event.id,
      eventType: type,
    },
  });

  revalidateBotViews();

  return event;
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

  return success("Bot event queued.");
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
    return fail("Only queued, processing, or failed events can be cancelled.");
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
      error: "Reset manually from processing state.",
      processedAt: null,
    },
  });

  await publishBotBulkUpdate("bot.events.processing.reset", result.count);

  revalidateBotViews();

  return success(`Reset ${result.count} event(s).`);
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
      error: "Cancelled from bot dashboard.",
    },
  });

  await publishBotBulkUpdate("bot.events.pending.cancelled", result.count);

  revalidateBotViews();

  return success(`Cancelled ${result.count} event(s).`);
}

export async function pauseBotQueueInline(): Promise<AdminBotEventActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  await prisma.serverSetting.upsert({
    where: {
      key: "bot.queue.paused",
    },
    create: {
      key: "bot.queue.paused",
      value: "true",
      description: "Controls bot event queue processing.",
    },
    update: {
      value: "true",
    },
  });

  await publishBotRuntimeUpdate("bot.queue.paused", {
    paused: true,
  });

  revalidateBotViews();

  return success("Queue paused.");
}

export async function resumeBotQueueInline(): Promise<AdminBotEventActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  await prisma.serverSetting.upsert({
    where: {
      key: "bot.queue.paused",
    },
    create: {
      key: "bot.queue.paused",
      value: "false",
      description: "Controls bot event queue processing.",
    },
    update: {
      value: "false",
    },
  });

  await publishBotRuntimeUpdate("bot.queue.resumed", {
    paused: false,
  });

  revalidateBotViews();

  return success("Queue resumed.");
}

export async function queueBotHealthCheckInline(): Promise<AdminBotEventActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  await queueBotCommand("bot_command_health_check", 100);

  return success("Health check queued.");
}

export async function queueBotRefreshConfigInline(): Promise<AdminBotEventActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  await queueBotCommand("bot_command_refresh_config", 95);

  return success("Config refresh queued.");
}

export async function queueBotRestartInline(): Promise<AdminBotEventActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  await queueBotCommand("bot_command_restart", 120);

  return success("Restart queued.");
}

export async function queueBotSendMessageInline(
  formData: FormData,
): Promise<AdminBotEventActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const channelId = getFormValue(formData, "channelId");
  const title = getFormValue(formData, "title");
  const message = getFormValue(formData, "message");
  const buttonLabel = getFormValue(formData, "buttonLabel");
  const buttonUrl = getFormValue(formData, "buttonUrl");
  const imageUrl = getFormValue(formData, "imageUrl");

  if (!channelId) {
    return fail("Channel ID is required.");
  }

  if (!title && !message) {
    return fail("Title or message is required.");
  }

  if (title.length > 256) {
    return fail("Title is too long.");
  }

  if (message.length > 3900) {
    return fail("Message is too long.");
  }

  await queueBotCommand("bot_command_send_message", 110, {
    channelId,
    title,
    message,
    buttonLabel,
    buttonUrl,
    imageUrl,
  });

  return success("Message queued.");
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

  return success(`Cleaned ${result.count} event(s).`);
}
