import { NextResponse } from "next/server";

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

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.databaseId;

  if (!userId) {
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

  const { searchParams } = new URL(request.url);
  const summary = await getNotificationSummary(
    userId,
    parseLimit(searchParams.get("limit")),
  );

  return NextResponse.json({
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
}
