"use server";

import { auth } from "@/auth";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";

export type NotificationActionResult = {
  ok: boolean;
  message: string;
  count?: number;
};

function success(message: string, count?: number): NotificationActionResult {
  return {
    ok: true,
    message,
    count,
  };
}

function fail(message: string): NotificationActionResult {
  return {
    ok: false,
    message,
  };
}

async function getCurrentUserId() {
  const session = await auth();

  return session?.user?.databaseId || null;
}

export async function markNotificationReadAction(
  formData: FormData,
): Promise<NotificationActionResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return fail("Please login first.");
  }

  const notificationId = String(
    formData.get("notificationId") || formData.get("id") || "",
  ).trim();

  if (!notificationId) {
    return fail("Notification ID is missing.");
  }

  const result = await markNotificationRead(notificationId, userId);

  return success("Notification marked as read.", result.count);
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return fail("Please login first.");
  }

  const result = await markAllNotificationsRead(userId);

  return success("Notifications marked as read.", result.count);
}
