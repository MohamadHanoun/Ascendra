import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  notification: {
    create: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));
const createRealtimeEventMock = vi.hoisted(() => vi.fn());
const dispatchRealtimeEventSoonMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/realtime", () => ({
  createRealtimeEvent: createRealtimeEventMock,
}));

vi.mock("@/lib/realtime/dispatchRealtime", () => ({
  dispatchRealtimeEventSoon: dispatchRealtimeEventSoonMock,
}));

import {
  createNotification,
  createNotificationOnce,
  markNotificationRead,
} from "@/lib/notifications";

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.notification.create.mockResolvedValue({
    id: "notification_1",
    userId: "userA",
  });
  prismaMock.notification.findFirst.mockResolvedValue(null);
  prismaMock.notification.updateMany.mockResolvedValue({ count: 1 });
  prismaMock.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
    Promise.all(operations),
  );
  createRealtimeEventMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("notification.created realtime dispatch", () => {
  it("writes the DB RealtimeEvent first, then schedules private ID-only socket dispatch", async () => {
    await createNotification({
      userId: " userA ",
      type: "team.invite",
      title: "Team invite",
      message: "You have an invite.",
    });

    expect(createRealtimeEventMock).toHaveBeenCalledWith({
      type: "notification.created",
      audience: "public",
      entityType: "notification",
      payload: {},
    });
    expect(dispatchRealtimeEventSoonMock).toHaveBeenCalledWith({
      type: "notification.created",
      audience: "private",
      entityType: "notification",
      entityId: "notification_1",
      targetUserId: "userA",
      payload: {
        notificationId: "notification_1",
      },
    });
    expect(
      createRealtimeEventMock.mock.invocationCallOrder[0],
    ).toBeLessThan(dispatchRealtimeEventSoonMock.mock.invocationCallOrder[0]);
  });

  it("does not dispatch when createNotificationOnce finds an existing notification", async () => {
    prismaMock.notification.findFirst.mockResolvedValue({
      id: "notification_existing",
      userId: "userA",
    });

    await createNotificationOnce({
      userId: "userA",
      type: "team.invite",
      title: "Team invite",
      message: "You have an invite.",
      dedupeKey: "invite:1",
    });

    expect(prismaMock.notification.create).not.toHaveBeenCalled();
    expect(createRealtimeEventMock).not.toHaveBeenCalled();
    expect(dispatchRealtimeEventSoonMock).not.toHaveBeenCalled();
  });

  it("keeps notification.updated on DB polling only", async () => {
    await markNotificationRead("notification_1", "userA");

    expect(createRealtimeEventMock).toHaveBeenCalledWith({
      type: "notification.updated",
      audience: "public",
      entityType: "notification",
      payload: {},
    });
    expect(dispatchRealtimeEventSoonMock).not.toHaveBeenCalled();
  });
});
