"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import {
  createNotificationsOnceForUsers,
  getAdminNotificationUserIds,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";

export type TournamentRegistrationActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

type TournamentRegistrationActionMessages = {
  loginRequired: string;
  discordMemberRequired: string;
  tournamentAndTeamRequired: string;
  tournamentNotFound: string;
  registrationClosed: string;
  tournamentUnavailable: string;
  slotsFull: string;
  teamNotFound: string;
  onlyLeaderCanRegister: string;
  wrongGame: string;
  teamSizeRequired: string;
  pendingInvites: string;
  alreadyRegistered: string;
  registeredSuccess: string;
  registrationIdMissing: string;
  registrationNotFound: string;
  onlyLeaderCanCancel: string;
  alreadyCancelled: string;
  approvedCannotCancel: string;
  cancellationClosed: string;
  cannotCancelTournament: string;
  cancelledSuccess: string;
};

const actionMessages: Record<Locale, TournamentRegistrationActionMessages> = {
  en: {
    loginRequired: "Please login first.",
    discordMemberRequired:
      "You must be an Ascendra Discord member to register.",
    tournamentAndTeamRequired: "Tournament and team are required.",
    tournamentNotFound: "Tournament was not found.",
    registrationClosed: "Registration is currently closed for this tournament.",
    tournamentUnavailable: "This tournament is not available for registration.",
    slotsFull: "All approved tournament slots are full.",
    teamNotFound: "Team was not found.",
    onlyLeaderCanRegister: "Only the team leader can register this team.",
    wrongGame: "This team does not match the tournament game.",
    teamSizeRequired: "This tournament requires {count} player(s).",
    pendingInvites: "Resolve pending team invites before registering.",
    alreadyRegistered: "This team is already registered for this tournament.",
    registeredSuccess:
      "Team registered successfully. Waiting for admin review.",
    registrationIdMissing: "Registration ID is missing.",
    registrationNotFound: "Registration was not found.",
    onlyLeaderCanCancel: "Only the team leader can cancel this registration.",
    alreadyCancelled: "This registration is already cancelled.",
    approvedCannotCancel:
      "Approved registrations cannot be cancelled by players. Please contact an admin.",
    cancellationClosed:
      "Registration cancellation is closed for this tournament.",
    cannotCancelTournament:
      "This tournament registration can no longer be cancelled.",
    cancelledSuccess: "Registration cancelled successfully.",
  },

  ar: {
    loginRequired: "يرجى تسجيل الدخول أولًا.",
    discordMemberRequired:
      "يجب أن تكون عضوًا في Discord الخاص بـ Ascendra للتسجيل.",
    tournamentAndTeamRequired: "البطولة والفريق مطلوبان.",
    tournamentNotFound: "لم يتم العثور على البطولة.",
    registrationClosed: "التسجيل مغلق حاليًا لهذه البطولة.",
    tournamentUnavailable: "هذه البطولة غير متاحة للتسجيل.",
    slotsFull: "جميع المقاعد المقبولة في البطولة ممتلئة.",
    teamNotFound: "لم يتم العثور على الفريق.",
    onlyLeaderCanRegister: "يمكن لقائد الفريق فقط تسجيل هذا الفريق.",
    wrongGame: "لعبة هذا الفريق لا تطابق لعبة البطولة.",
    teamSizeRequired: "هذه البطولة تتطلب {count} لاعب.",
    pendingInvites: "يرجى حل الدعوات المعلقة في الفريق قبل التسجيل.",
    alreadyRegistered: "هذا الفريق مسجل بالفعل في هذه البطولة.",
    registeredSuccess: "تم تسجيل الفريق بنجاح. بانتظار مراجعة الإدارة.",
    registrationIdMissing: "معرّف التسجيل مفقود.",
    registrationNotFound: "لم يتم العثور على التسجيل.",
    onlyLeaderCanCancel: "يمكن لقائد الفريق فقط إلغاء هذا التسجيل.",
    alreadyCancelled: "تم إلغاء هذا التسجيل مسبقًا.",
    approvedCannotCancel:
      "لا يمكن للاعبين إلغاء التسجيلات المقبولة. يرجى التواصل مع الإدارة.",
    cancellationClosed: "إلغاء التسجيل مغلق لهذه البطولة.",
    cannotCancelTournament: "لم يعد من الممكن إلغاء التسجيل في هذه البطولة.",
    cancelledSuccess: "تم إلغاء التسجيل بنجاح.",
  },
};

function success(
  message: string,
  redirectTo?: string,
): TournamentRegistrationActionResult {
  return {
    ok: true,
    message,
    redirectTo,
  };
}

function fail(
  message: string,
  redirectTo?: string,
): TournamentRegistrationActionResult {
  return {
    ok: false,
    message,
    redirectTo,
  };
}

function getValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function formatMessage(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

async function getMessages() {
  const locale = await getLocale();

  return actionMessages[locale];
}

async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.databaseId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: session.user.databaseId,
    },
  });
}

function buildSnapshotMembers(
  members: Array<{
    id: string;
    role: string;
    joinedAt: Date;
    user: {
      id: string;
      discordId: string;
      username: string;
      avatar: string | null;
    };
  }>,
) {
  return members.map((member) => ({
    memberId: member.id,
    userId: member.user.id,
    discordId: member.user.discordId,
    username: member.user.username,
    avatar: member.user.avatar,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
  }));
}

function shouldRequestRoleRemoval(status: string) {
  return !["not_needed", "removed"].includes(status);
}

function revalidateTournamentRegistrationViews(tournamentId: string) {
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");
  revalidatePath("/profile");
  revalidatePath("/admin");
}

async function publishRegistrationRealtimeEvent(params: {
  tournamentId: string;
  teamId: string;
  type: "registered" | "cancelled";
}) {
  await Promise.all([
    createRealtimeEvent({
      type: "tournament.registration.updated",
      audience: "public",
      entityType: "tournament",
      entityId: params.tournamentId,
      payload: params,
    }),

    createRealtimeEvent({
      type:
        params.type === "registered"
          ? "registration.registered"
          : "registration.cancelled",
      audience: "public",
      entityType: "team",
      entityId: params.teamId,
      payload: params,
    }),
  ]);
}

async function notifyRegistrationUsers(input: {
  userIds: string[];
  type: string;
  title: string;
  message: string;
  href: string;
  registrationId: string;
  tournamentId: string;
  teamId: string;
  dedupeKey: string;
}) {
  try {
    await createNotificationsOnceForUsers({
      userIds: input.userIds,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href,
      dedupeKey: input.dedupeKey,
      metadata: {
        registrationId: input.registrationId,
        tournamentId: input.tournamentId,
        teamId: input.teamId,
      },
    });
  } catch (error) {
    console.error(
      "[RegistrationNotifications] Failed to create notifications:",
      error,
    );
  }
}

async function registerTeamForTournament(
  formData: FormData,
): Promise<TournamentRegistrationActionResult> {
  const messages = await getMessages();
  const user = await getCurrentUser();

  if (!user) {
    return fail(messages.loginRequired, "/login");
  }

  if (!user.isGuildMember) {
    return fail(messages.discordMemberRequired);
  }

  const tournamentId = getValue(formData, "tournamentId");
  const teamId = getValue(formData, "teamId");

  if (!tournamentId || !teamId) {
    return fail(messages.tournamentAndTeamRequired);
  }

  const tournament = await prisma.tournament.findUnique({
    where: {
      id: tournamentId,
    },
    include: {
      registrations: {
        where: {
          status: "approved",
        },
      },
    },
  });

  if (!tournament) {
    return fail(messages.tournamentNotFound);
  }

  if (tournament.registrationStatus !== "open") {
    return fail(messages.registrationClosed);
  }

  if (["closed", "cancelled", "ended"].includes(tournament.status)) {
    return fail(messages.tournamentUnavailable);
  }

  if (tournament.registrations.length >= tournament.maxTeams) {
    return fail(messages.slotsFull);
  }

  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
    include: {
      game: { select: { name: true } },
      members: {
        include: {
          user: true,
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
      invites: {
        where: {
          status: "pending",
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!team) {
    return fail(messages.teamNotFound);
  }

  if (team.leaderId !== user.id) {
    return fail(messages.onlyLeaderCanRegister);
  }

  if (team.gameId !== tournament.gameId) {
    return fail(messages.wrongGame);
  }

  if (team.members.length < tournament.teamSize) {
    return fail(
      formatMessage(messages.teamSizeRequired, {
        count: String(tournament.teamSize),
      }),
    );
  }

  if (team.invites.length > 0) {
    return fail(messages.pendingInvites);
  }

  const existingRegistration = await prisma.tournamentRegistration.findUnique({
    where: {
      tournamentId_teamId: {
        tournamentId: tournament.id,
        teamId: team.id,
      },
    },
  });

  if (
    existingRegistration &&
    ["registered", "approved"].includes(existingRegistration.status)
  ) {
    return fail(messages.alreadyRegistered);
  }

  const snapshotMembers = buildSnapshotMembers(team.members);
  const registration = existingRegistration
    ? await prisma.tournamentRegistration.update({
        where: {
          id: existingRegistration.id,
        },
        data: {
          status: "registered",
          registeredById: user.id,
          rejectionReason: null,
          approvedAt: null,
          cancelledAt: null,
          reviewedAt: null,

          snapshotTeamName: team.name,
          snapshotTeamGame: team.game?.name ?? null,
          snapshotMembers,

          discordRoleStatus: "not_needed",
          discordRoleName: null,
          discordRoleId: null,
          discordChannelName: null,
          discordChannelId: null,
          discordRoleError: null,
          discordRoleRequestedAt: null,
          discordRoleSyncedAt: null,
        },
      })
    : await prisma.tournamentRegistration.create({
        data: {
          tournamentId: tournament.id,
          teamId: team.id,
          registeredById: user.id,
          status: "registered",

          snapshotTeamName: team.name,
          snapshotTeamGame: team.game?.name ?? null,
          snapshotMembers,

          discordRoleStatus: "not_needed",
        },
      });

  await publishRegistrationRealtimeEvent({
    tournamentId: tournament.id,
    teamId: team.id,
    type: "registered",
  });

  const teamUserIds = Array.from(
    new Set([team.leaderId, ...team.members.map((member) => member.userId)]),
  );

  await notifyRegistrationUsers({
    userIds: teamUserIds,
    type: "registration.submitted",
    title: "Registration submitted",
    message: `${team.name} registered for ${tournament.title}.`,
    href: `/tournaments/${tournament.id}`,
    registrationId: registration.id,
    tournamentId: tournament.id,
    teamId: team.id,
    dedupeKey: `registration.submitted:${registration.id}:team`,
  });

  await notifyRegistrationUsers({
    userIds: await getAdminNotificationUserIds(),
    type: "registration.submitted",
    title: "Registration submitted",
    message: `${team.name} registered for ${tournament.title}.`,
    href: "/admin?tab=registrations",
    registrationId: registration.id,
    tournamentId: tournament.id,
    teamId: team.id,
    dedupeKey: `registration.submitted:${registration.id}:admin`,
  });

  revalidateTournamentRegistrationViews(tournament.id);

  return success(messages.registeredSuccess);
}

async function cancelTournamentRegistration(
  formData: FormData,
): Promise<TournamentRegistrationActionResult> {
  const messages = await getMessages();
  const user = await getCurrentUser();

  if (!user) {
    return fail(messages.loginRequired, "/login");
  }

  const registrationId = getValue(formData, "registrationId");

  if (!registrationId) {
    return fail(messages.registrationIdMissing);
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      id: registrationId,
    },
    include: {
      team: {
        include: {
          members: true,
        },
      },
      tournament: true,
    },
  });

  if (!registration) {
    return fail(messages.registrationNotFound);
  }

  if (registration.team.leaderId !== user.id) {
    return fail(messages.onlyLeaderCanCancel);
  }

  if (registration.status === "cancelled") {
    return fail(messages.alreadyCancelled);
  }

  if (registration.status === "approved") {
    return fail(messages.approvedCannotCancel);
  }

  if (registration.tournament.registrationStatus !== "open") {
    return fail(messages.cancellationClosed);
  }

  if (
    ["closed", "cancelled", "ended"].includes(registration.tournament.status)
  ) {
    return fail(messages.cannotCancelTournament);
  }

  const needsRoleRemoval = shouldRequestRoleRemoval(
    registration.discordRoleStatus,
  );

  await prisma.tournamentRegistration.update({
    where: {
      id: registration.id,
    },
    data: {
      status: "cancelled",
      approvedAt: null,
      cancelledAt: new Date(),
      reviewedAt: new Date(),

      discordRoleStatus: needsRoleRemoval ? "pending_remove" : "not_needed",
      discordRoleError: null,
      discordRoleRequestedAt: needsRoleRemoval ? new Date() : null,
      discordRoleSyncedAt: null,
    },
  });

  await publishRegistrationRealtimeEvent({
    tournamentId: registration.tournamentId,
    teamId: registration.teamId,
    type: "cancelled",
  });

  await notifyRegistrationUsers({
    userIds: Array.from(
      new Set([
        registration.team.leaderId,
        ...registration.team.members.map((member) => member.userId),
      ]),
    ),
    type: "registration.cancelled",
    title: "Registration cancelled",
    message: `Registration cancelled for ${registration.tournament.title}.`,
    href: `/tournaments/${registration.tournamentId}`,
    registrationId: registration.id,
    tournamentId: registration.tournamentId,
    teamId: registration.teamId,
    dedupeKey: `registration.cancelled:${registration.id}:team`,
  });

  revalidateTournamentRegistrationViews(registration.tournamentId);

  return success(messages.cancelledSuccess);
}

export async function registerRegistrationInline(
  formData: FormData,
): Promise<TournamentRegistrationActionResult> {
  return registerTeamForTournament(formData);
}

export async function cancelRegistrationInline(
  formData: FormData,
): Promise<TournamentRegistrationActionResult> {
  return cancelTournamentRegistration(formData);
}

export async function registerTeamForTournamentInline(
  formData: FormData,
): Promise<TournamentRegistrationActionResult> {
  return registerTeamForTournament(formData);
}

export async function cancelTournamentRegistrationInline(
  formData: FormData,
): Promise<TournamentRegistrationActionResult> {
  return cancelTournamentRegistration(formData);
}
