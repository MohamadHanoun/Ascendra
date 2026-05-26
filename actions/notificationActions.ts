"use server";

import { auth } from "@/auth";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";

export type NotificationActionResult = {
  ok: boolean;
  message: string;
  count?: number;
};

type NotificationActionMessages = {
  loginRequired: string;
  notificationIdMissing: string;
  markedRead: string;
  allMarkedRead: string;
};

const notificationActionMessages: Record<Locale, NotificationActionMessages> = {
  en: {
    loginRequired: "Please login first.",
    notificationIdMissing: "Notification ID is missing.",
    markedRead: "Notification marked as read.",
    allMarkedRead: "Notifications marked as read.",
  },
  ar: {
    loginRequired: "يرجى تسجيل الدخول أولًا.",
    notificationIdMissing: "معرّف الإشعار مفقود.",
    markedRead: "تم وضع الإشعار كمقروء.",
    allMarkedRead: "تم وضع جميع الإشعارات كمقروءة.",
  },
};

async function getMessages() {
  const locale = await getLocale();

  return notificationActionMessages[locale];
}

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
  const messages = await getMessages();
  const userId = await getCurrentUserId();

  if (!userId) {
    return fail(messages.loginRequired);
  }

  const notificationId = String(
    formData.get("notificationId") || formData.get("id") || "",
  ).trim();

  if (!notificationId) {
    return fail(messages.notificationIdMissing);
  }

  const result = await markNotificationRead(notificationId, userId);

  return success(messages.markedRead, result.count);
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  const messages = await getMessages();
  const userId = await getCurrentUserId();

  if (!userId) {
    return fail(messages.loginRequired);
  }

  const result = await markAllNotificationsRead(userId);

  return success(messages.allMarkedRead, result.count);
}
