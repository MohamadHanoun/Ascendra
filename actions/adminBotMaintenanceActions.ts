"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";
import {
  getServerLogErrorMessage,
  logServerAdminAction,
  logServerBotError,
} from "@/lib/serverDiscordLogs";

const commandLogWhere: Prisma.BotEventWhereInput = {
  OR: [
    {
      type: "slash_command_used",
    },
    {
      type: "slash_command_failed",
    },
    {
      entityType: "slash_command",
    },
  ],
};

async function requireAdmin() {
  const session = await auth();

  const sessionUser = session?.user as
    | {
        databaseId?: string;
        isAdmin?: boolean;
      }
    | undefined;

  if (!sessionUser?.databaseId) {
    redirect(
      "/admin/bot?botSection=maintenance&type=error&message=Please%20login%20first.",
    );
  }

  if (!sessionUser.isAdmin) {
    redirect(
      "/admin/bot?botSection=maintenance&type=error&message=Only%20Ascendra%20admins%20can%20run%20maintenance.",
    );
  }
}

function getDays(formData: FormData, fallback: number) {
  const value = Number(formData.get("days") || fallback);

  if ([1, 3, 7, 14, 30, 60, 90].includes(value)) {
    return value;
  }

  return fallback;
}

function getCutoffDate(days: number) {
  const cutoffDate = new Date();

  cutoffDate.setDate(cutoffDate.getDate() - days);

  return cutoffDate;
}

function revalidateBotViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/bot");
}

async function publishMaintenanceEvent(params: {
  action: string;
  deletedCount: number;
  days: number;
}) {
  await createRealtimeEvent({
    type: "bot.maintenance.cleaned",
    audience: "admin",
    entityType: "bot",
    entityId: "maintenance",
    payload: params,
  });
}

function redirectWithResult(
  message: string,
  type: "success" | "error" = "success",
) {
  redirect(
    `/admin/bot?botSection=maintenance&type=${type}&message=${encodeURIComponent(
      message,
    )}`,
  );
}

async function logMaintenanceFailure(
  title: string,
  error: unknown,
  fields: Array<{ name: string; value: string | number; inline?: boolean }> = [],
) {
  await logServerBotError({
    title,
    description: getServerLogErrorMessage(error),
    fields,
  });
}

export async function cleanupOldBotEventsMaintenanceInline(formData: FormData) {
  await requireAdmin();

  const days = getDays(formData, 30);
  const cutoffDate = getCutoffDate(days);
  let deletedCount = 0;

  try {
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
    deletedCount = result.count;

    await publishMaintenanceEvent({
      action: "cleanup_old_bot_events",
      deletedCount,
      days,
    });
    await logServerAdminAction({
      title: "Old bot events cleaned",
      fields: [
        { name: "Deleted", value: deletedCount },
        { name: "Days", value: days },
      ],
    });
  } catch (error) {
    await logMaintenanceFailure("Old bot events cleanup failed", error, [
      { name: "Days", value: days },
    ]);
    throw error;
  }

  revalidateBotViews();

  redirectWithResult(`${deletedCount} old bot event(s) deleted.`);
}

export async function cleanupOldCommandLogsMaintenanceInline(
  formData: FormData,
) {
  await requireAdmin();

  const days = getDays(formData, 30);
  const cutoffDate = getCutoffDate(days);
  let deletedCount = 0;

  try {
    const result = await prisma.botEvent.deleteMany({
      where: {
        AND: [
          commandLogWhere,
          {
            createdAt: {
              lt: cutoffDate,
            },
          },
        ],
      },
    });
    deletedCount = result.count;

    await publishMaintenanceEvent({
      action: "cleanup_old_command_logs",
      deletedCount,
      days,
    });
    await logServerAdminAction({
      title: "Old command logs cleaned",
      fields: [
        { name: "Deleted", value: deletedCount },
        { name: "Days", value: days },
      ],
    });
  } catch (error) {
    await logMaintenanceFailure("Old command logs cleanup failed", error, [
      { name: "Days", value: days },
    ]);
    throw error;
  }

  revalidateBotViews();

  redirectWithResult(`${deletedCount} old command log(s) deleted.`);
}

export async function cleanupOldRealtimeEventsMaintenanceInline(
  formData: FormData,
) {
  await requireAdmin();

  const days = getDays(formData, 7);
  const cutoffDate = getCutoffDate(days);
  let deletedCount = 0;

  try {
    const result = await prisma.realtimeEvent.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    deletedCount = result.count;

    await publishMaintenanceEvent({
      action: "cleanup_old_realtime_events",
      deletedCount,
      days,
    });
    await logServerAdminAction({
      title: "Old realtime events cleaned",
      fields: [
        { name: "Deleted", value: deletedCount },
        { name: "Days", value: days },
      ],
    });
  } catch (error) {
    await logMaintenanceFailure("Old realtime events cleanup failed", error, [
      { name: "Days", value: days },
    ]);
    throw error;
  }

  revalidateBotViews();

  redirectWithResult(`${deletedCount} old realtime event(s) deleted.`);
}

export async function cleanupOldFailedBotEventsMaintenanceInline(
  formData: FormData,
) {
  await requireAdmin();

  const days = getDays(formData, 30);
  const cutoffDate = getCutoffDate(days);
  let deletedCount = 0;

  try {
    const result = await prisma.botEvent.deleteMany({
      where: {
        status: "failed",
        updatedAt: {
          lt: cutoffDate,
        },
      },
    });
    deletedCount = result.count;

    await publishMaintenanceEvent({
      action: "cleanup_old_failed_bot_events",
      deletedCount,
      days,
    });
    await logServerAdminAction({
      title: "Old failed events deleted",
      fields: [
        { name: "Deleted", value: deletedCount },
        { name: "Days", value: days },
      ],
    });
  } catch (error) {
    await logMaintenanceFailure("Old failed events deletion failed", error, [
      { name: "Days", value: days },
    ]);
    throw error;
  }

  revalidateBotViews();

  redirectWithResult(`${deletedCount} old failed bot event(s) deleted.`);
}

export async function cleanupFailedCommandLogsMaintenanceInline() {
  await requireAdmin();
  let deletedCount = 0;

  try {
    const result = await prisma.botEvent.deleteMany({
      where: {
        AND: [
          commandLogWhere,
          {
            status: "failed",
          },
        ],
      },
    });
    deletedCount = result.count;

    await publishMaintenanceEvent({
      action: "cleanup_failed_command_logs",
      deletedCount,
      days: 0,
    });
    await logServerAdminAction({
      title: "Failed command logs deleted",
      fields: [{ name: "Deleted", value: deletedCount }],
    });
  } catch (error) {
    await logMaintenanceFailure("Failed command logs deletion failed", error);
    throw error;
  }

  revalidateBotViews();

  redirectWithResult(`${deletedCount} failed command log(s) deleted.`);
}
