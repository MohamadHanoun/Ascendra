import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type CreateRealtimeEventInput = {
  type: string;
  audience?: "public" | "admin";
  entityType?: string;
  entityId?: string;
  payload?: Prisma.InputJsonValue;
};

export async function createRealtimeEvent({
  type,
  audience = "public",
  entityType,
  entityId,
  payload,
}: CreateRealtimeEventInput) {
  try {
    await prisma.realtimeEvent.create({
      data: {
        type,
        audience,
        entityType,
        entityId,
        payload: payload ?? {},
      },
    });
  } catch (error) {
    console.error("[RealtimeEvent] Failed to create event:", error);
  }
}

export async function cleanupOldRealtimeEvents(daysToKeep = 7): Promise<number> {
  try {
    const deleteBefore = new Date();

    deleteBefore.setDate(deleteBefore.getDate() - daysToKeep);

    const result = await prisma.realtimeEvent.deleteMany({
      where: {
        createdAt: {
          lt: deleteBefore,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error("[RealtimeEvent] Failed to cleanup events:", error);
    return 0;
  }
}
