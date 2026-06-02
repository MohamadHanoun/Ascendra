import { beforeEach, describe, expect, it, vi } from "vitest";

const actionMocks = vi.hoisted(() => {
  const prisma = {
    user: {
      findUnique: vi.fn(),
    },
    teamInvite: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tournamentRegistration: {
      findFirst: vi.fn(),
    },
    teamMember: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  return {
    auth: vi.fn(),
    getLocale: vi.fn(),
    createNotificationOnce: vi.fn(),
    revalidatePath: vi.fn(),
    prisma,
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: actionMocks.revalidatePath,
}));

vi.mock("@/auth", () => ({
  auth: actionMocks.auth,
}));

vi.mock("@/lib/i18nServer", () => ({
  getLocale: actionMocks.getLocale,
}));

vi.mock("@/lib/notifications", () => ({
  createNotificationOnce: actionMocks.createNotificationOnce,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: actionMocks.prisma,
}));

import {
  acceptProfileInvitationInline,
  rejectProfileInvitationInline,
} from "@/actions/profileInvitationInlineActions";

function formData(inviteId = "invite-1") {
  const data = new FormData();
  data.set("inviteId", inviteId);
  return data;
}

function pendingInvite() {
  return {
    id: "invite-1",
    teamId: "team-1",
    invitedUserId: "user-1",
    status: "pending",
    team: {
      id: "team-1",
      name: "Locked Team",
      leaderId: "leader-1",
      members: [{ userId: "leader-1" }],
    },
  };
}

describe("profile invitation inline actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    actionMocks.getLocale.mockResolvedValue("en");
    actionMocks.auth.mockResolvedValue({
      user: { databaseId: "user-1" },
    });
    actionMocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      username: "Player One",
    });
    actionMocks.prisma.teamInvite.findUnique.mockResolvedValue(pendingInvite());
    actionMocks.prisma.teamInvite.update.mockResolvedValue({});
    actionMocks.prisma.tournamentRegistration.findFirst.mockResolvedValue(null);
    actionMocks.createNotificationOnce.mockResolvedValue(undefined);
  });

  it("blocks invitation acceptance when the team has an active tournament registration", async () => {
    actionMocks.prisma.tournamentRegistration.findFirst.mockResolvedValue({
      id: "registration-1",
      status: "approved",
      tournament: {
        title: "Summer Cup",
        status: "open",
      },
    });

    const result = await acceptProfileInvitationInline(formData());

    expect(result.ok).toBe(false);
    expect(result.message).toContain("Summer Cup");
    expect(actionMocks.prisma.tournamentRegistration.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          teamId: "team-1",
          status: { in: ["registered", "approved"] },
          tournament: {
            status: {
              notIn: ["ended", "cancelled"],
            },
          },
        }),
      }),
    );
    expect(actionMocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(actionMocks.prisma.teamMember.upsert).not.toHaveBeenCalled();
    expect(actionMocks.prisma.teamInvite.update).not.toHaveBeenCalled();
  });

  it("continues to allow invitation rejection without the active-registration guard", async () => {
    const result = await rejectProfileInvitationInline(formData());

    expect(result.ok).toBe(true);
    expect(actionMocks.prisma.tournamentRegistration.findFirst).not.toHaveBeenCalled();
    expect(actionMocks.prisma.teamInvite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "invite-1" },
        data: expect.objectContaining({
          status: "rejected",
        }),
      }),
    );
  });
});
