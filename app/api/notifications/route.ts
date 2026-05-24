import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { getNotificationSummary } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function mayBeMissingNotificationMigration(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2021", "P2022"].includes(error.code)
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);

  return (
    /notification/i.test(message) &&
    /(does not exist|not found|unknown|missing|P2021|P2022)/i.test(message)
  );
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.databaseId;

    if (!userId) {
      return jsonResponse(
        {
          ok: false,
          error: "Unauthorized",
          unreadCount: 0,
          notifications: [],
        },
        401,
      );
    }

    const { searchParams } = new URL(request.url);
    const summary = await getNotificationSummary(
      userId,
      parseLimit(searchParams.get("limit")),
    );

    return jsonResponse({
      ok: true,
      unreadCount: summary.unreadCount,
      notifications: summary.notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        href: notification.href,
        readAt: notification.readAt?.toISOString() ?? null,
        createdAt: notification.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (mayBeMissingNotificationMigration(error)) {
      console.error(
        "[api/notifications] Notification migration may not be applied.",
        error,
      );
    } else {
      console.error("[api/notifications] Failed to load notifications.", error);
    }

    return jsonResponse(
      {
        ok: false,
        error: "Unable to load notifications.",
        unreadCount: 0,
        notifications: [],
      },
      500,
    );
  }
}
