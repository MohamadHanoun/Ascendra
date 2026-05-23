"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";

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
      "/admin/bot?botSection=commands&type=error&message=Please%20login%20first.",
    );
  }

  if (!sessionUser.isAdmin) {
    redirect(
      "/admin/bot?botSection=commands&type=error&message=Only%20Ascendra%20admins%20can%20manage%20command%20logs.",
    );
  }
}

function getDaysToKeep(formData: FormData) {
  const value = Number(formData.get("days") || 30);

  if ([7, 14, 30, 60, 90].includes(value)) {
    return value;
  }

  return 30;
}

function getDeleteBefore(days: number) {
  const deleteBefore = new Date();

  deleteBefore.setDate(deleteBefore.getDate() - days);

  return deleteBefore;
}

function revalidateCommandViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/bot");
}

async function publishCommandLogsCleanup(count: number, action: string) {
  await createRealtimeEvent({
    type: "slashCommand.logs.cleaned",
    audience: "admin",
    entityType: "botEvent",
    entityId: "slash_command",
    payload: {
      count,
      action,
    },
  });
}

export async function deleteOldSlashCommandLogsInline(formData: FormData) {
  await requireAdmin();

  const days = getDaysToKeep(formData);
  const deleteBefore = getDeleteBefore(days);

  const result = await prisma.botEvent.deleteMany({
    where: {
      AND: [
        commandLogWhere,
        {
          createdAt: {
            lt: deleteBefore,
          },
        },
      ],
    },
  });

  await publishCommandLogsCleanup(result.count, `delete_old_${days}_days`);

  revalidateCommandViews();

  redirect(
    `/admin/bot?botSection=commands&type=success&message=${encodeURIComponent(
      `${result.count} old command logs deleted.`,
    )}`,
  );
}

export async function deleteFailedSlashCommandLogsInline() {
  await requireAdmin();

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

  await publishCommandLogsCleanup(result.count, "delete_failed");

  revalidateCommandViews();

  redirect(
    `/admin/bot?botSection=commands&type=success&message=${encodeURIComponent(
      `${result.count} failed command logs deleted.`,
    )}`,
  );
}
