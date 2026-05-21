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

  if (event.status !== "failed") {
    return fail("Only failed bot events can be retried.");
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

  if (!["queued", "failed"].includes(event.status)) {
    return fail("Only queued or failed bot events can be cancelled.");
  }

  await prisma.botEvent.update({
    where: {
      id: event.id,
    },
    data: {
      status: "cancelled",
      error: null,
      lockedAt: null,
      processedAt: new Date(),
    },
  });

  await publishBotEventUpdate(event.id, "cancelled");

  revalidateBotViews();

  return success("Bot event cancelled.");
}
