import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";

const defaultNotificationLimit = 10;
const maxNotificationLimit = 50;
const maxTypeLength = 80;
const maxTitleLength = 160;
const maxMessageLength = 500;
const maxHrefLength = 2048;

export type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  message: string;
  href?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export type CreateNotificationOnceInput = CreateNotificationInput & {
  dedupeKey: string;
};

export type CreateNotificationsOnceForUsersInput = Omit<
  CreateNotificationOnceInput,
  "userId"
> & {
  userIds: string[];
};

type NotificationData = {
  userId: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  metadata?: Prisma.InputJsonValue;
};

function normalizeRequiredText(
  value: string,
  fieldName: string,
  maxLength: number,
) {
  const normalized = value.replace(/\s+/g, " ").trim().slice(0, maxLength);

  if (!normalized) {
    throw new Error(`Notification ${fieldName} is required.`);
  }

  return normalized;
}

function getMetadataString(
  metadata: Prisma.InputJsonValue | undefined,
  key: string,
) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = (metadata as Record<string, Prisma.InputJsonValue>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isSafeInternalHref(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

export function normalizeNotificationHref(
  value: string | null | undefined,
  metadata?: Prisma.InputJsonValue,
) {
  const normalized = (value || "").trim().slice(0, maxHrefLength);

  if (normalized === "/admin?tab=registrations") {
    const tournamentId = getMetadataString(metadata, "tournamentId");

    if (tournamentId) {
      return `/admin/tournaments/${tournamentId}#registrations`;
    }
  }

  if (normalized === "/admin?tab=matches") {
    const tournamentId = getMetadataString(metadata, "tournamentId");
    const matchId = getMetadataString(metadata, "matchId");

    if (tournamentId && matchId) {
      return `/admin/tournaments/${tournamentId}/matches#match-${matchId}`;
    }

    return "/admin/match-operations?review=needs";
  }

  if (!normalized || !isSafeInternalHref(normalized)) {
    return null;
  }

  return normalized;
}

function normalizeLimit(limit?: number | null) {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return defaultNotificationLimit;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), maxNotificationLimit);
}

function uniqueUserIds(userIds: string[]) {
  return Array.from(new Set(userIds.map((id) => id.trim()).filter(Boolean)));
}

function buildNotificationData(
  input: CreateNotificationInput,
): NotificationData {
  const userId = input.userId.trim();

  if (!userId) {
    throw new Error("Notification userId is required.");
  }

  return {
    userId,
    type: normalizeRequiredText(input.type, "type", maxTypeLength),
    title: normalizeRequiredText(input.title, "title", maxTitleLength),
    message: normalizeRequiredText(input.message, "message", maxMessageLength),
    href: normalizeNotificationHref(input.href, input.metadata),
    ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
  };
}

function appendDedupeKey(
  metadata: Prisma.InputJsonValue | undefined,
  dedupeKey: string,
): Prisma.InputJsonValue {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return {
      ...(metadata as Record<string, Prisma.InputJsonValue>),
      dedupeKey,
    };
  }

  return {
    dedupeKey,
  };
}

async function publishNotificationRealtimeEvent(type: string) {
  await createRealtimeEvent({
    type,
    audience: "public",
    entityType: "notification",
    payload: {},
  });
}

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: buildNotificationData(input),
  });

  await publishNotificationRealtimeEvent("notification.created");

  return notification;
}

export async function createNotificationOnce(
  input: CreateNotificationOnceInput,
) {
  const dedupeKey = normalizeRequiredText(input.dedupeKey, "dedupeKey", 240);
  const data = buildNotificationData({
    ...input,
    metadata: appendDedupeKey(input.metadata, dedupeKey),
  });

  const existingNotification = await prisma.notification.findFirst({
    where: {
      userId: data.userId,
      type: data.type,
      metadata: {
        path: ["dedupeKey"],
        equals: dedupeKey,
      },
    },
  });

  if (existingNotification) {
    return existingNotification;
  }

  const notification = await prisma.notification.create({
    data,
  });

  await publishNotificationRealtimeEvent("notification.created");

  return notification;
}

export async function createNotificationsOnceForUsers(
  input: CreateNotificationsOnceForUsersInput,
) {
  const userIds = uniqueUserIds(input.userIds);

  if (userIds.length === 0) {
    return [];
  }

  return Promise.all(
    userIds.map((userId) =>
      createNotificationOnce({
        ...input,
        userId,
        dedupeKey: `${input.dedupeKey}:${userId}`,
      }),
    ),
  );
}

export async function getAdminNotificationUserIds() {
  const adminDiscordIds = (process.env.ADMIN_DISCORD_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (adminDiscordIds.length === 0) {
    return [];
  }

  const admins = await prisma.user.findMany({
    where: {
      discordId: {
        in: adminDiscordIds,
      },
    },
    select: {
      id: true,
    },
  });

  return admins.map((admin) => admin.id);
}

export async function createNotificationsForUsers(
  inputs: CreateNotificationInput[],
) {
  if (inputs.length === 0) {
    return { count: 0 };
  }

  const result = await prisma.notification.createMany({
    data: inputs.map(buildNotificationData),
  });

  await publishNotificationRealtimeEvent("notification.created");

  return result;
}

export async function getUnreadNotifications(
  userId: string,
  limit?: number | null,
) {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    return [];
  }

  return prisma.notification.findMany({
    where: {
      userId: normalizedUserId,
      readAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: normalizeLimit(limit),
  });
}

export async function getNotificationSummary(
  userId: string,
  limit?: number | null,
) {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    return {
      unreadCount: 0,
      notifications: [],
    };
  }

  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({
      where: {
        userId: normalizedUserId,
        readAt: null,
      },
    }),
    prisma.notification.findMany({
      where: {
        userId: normalizedUserId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: normalizeLimit(limit),
    }),
  ]);

  return {
    unreadCount,
    notifications,
  };
}

export async function markNotificationRead(
  notificationId: string,
  userId: string,
) {
  const normalizedNotificationId = notificationId.trim();
  const normalizedUserId = userId.trim();

  if (!normalizedNotificationId || !normalizedUserId) {
    return { count: 0 };
  }

  const result = await prisma.notification.updateMany({
    where: {
      id: normalizedNotificationId,
      userId: normalizedUserId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  if (result.count > 0) {
    await publishNotificationRealtimeEvent("notification.updated");
  }

  return result;
}

export async function markAllNotificationsRead(userId: string) {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    return { count: 0 };
  }

  const result = await prisma.notification.updateMany({
    where: {
      userId: normalizedUserId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  if (result.count > 0) {
    await publishNotificationRealtimeEvent("notification.updated");
  }

  return result;
}
