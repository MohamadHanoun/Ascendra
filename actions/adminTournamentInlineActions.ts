"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";

export type AdminTournamentActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

type TournamentForAnnouncement = {
  id: string;
  title: string;
  game: { name: string; slug: string } | null;
  description: string;
  startsAt: Date | null;
  prize: string | null;
  imageUrl: string | null;
  maxTeams: number;
  teamSize: number;
  status: string;
  registrationStatus: string;
  discordAnnouncementChannelId: string | null;
  discordAnnouncementMessageId: string | null;
  discordAnnouncementUrl: string | null;
};

function success(message: string): AdminTournamentActionResult {
  return { ok: true, message };
}

function fail(
  message: string,
  redirectTo?: string,
): AdminTournamentActionResult {
  return { ok: false, message, redirectTo };
}

function getValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function getNumber(formData: FormData, name: string) {
  const value = Number(formData.get(name));

  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function normalizeImageUrl(imageUrl: string) {
  if (!imageUrl) return null;

  if (imageUrl.startsWith("https://") || imageUrl.startsWith("http://")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/")) return imageUrl;

  return "invalid";
}

function buildTournamentAnnouncementPayload(
  tournament: TournamentForAnnouncement,
) {
  return {
    tournamentId: tournament.id,
    title: tournament.title,
    game: tournament.game?.name ?? null,
    description: tournament.description,
    startsAt: tournament.startsAt?.toISOString() ?? null,
    prize: tournament.prize,
    imageUrl: tournament.imageUrl,
    maxTeams: tournament.maxTeams,
    teamSize: tournament.teamSize,
    status: tournament.status,
    registrationStatus: tournament.registrationStatus,
    websiteUrl: `${getSiteUrl()}/tournaments/${tournament.id}`,
    announcementChannelId: tournament.discordAnnouncementChannelId,
    announcementMessageId: tournament.discordAnnouncementMessageId,
    announcementUrl: tournament.discordAnnouncementUrl,
  };
}

async function queueTournamentAnnouncementEvent(
  type: "tournament_announcement_create" | "tournament_announcement_update",
  tournament: TournamentForAnnouncement,
) {
  if (type === "tournament_announcement_update") {
    await prisma.botEvent.updateMany({
      where: {
        type: "tournament_announcement_update",
        entityType: "tournament",
        entityId: tournament.id,
        status: { in: ["queued", "failed"] },
      },
      data: {
        status: "cancelled",
        lockedAt: null,
        processedAt: new Date(),
        error: "Replaced by a newer tournament announcement update.",
      },
    });
  }

  await prisma.botEvent.create({
    data: {
      type,
      entityType: "tournament",
      entityId: tournament.id,
      priority: type === "tournament_announcement_create" ? 30 : 20,
      payload: buildTournamentAnnouncementPayload(tournament),
    },
  });
}

function revalidateTournamentViews(tournamentId: string) {
  revalidatePath("/admin");
  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${tournamentId}`);
}

async function requireAdmin(): Promise<AdminTournamentActionResult | null> {
  const session = await auth();

  const sessionUser = session?.user as
    | { databaseId?: string; isAdmin?: boolean }
    | undefined;

  if (!sessionUser?.databaseId) {
    return fail("Please login first.", "/login");
  }

  if (!sessionUser.isAdmin) {
    return fail("Only Ascendra admins can manage tournaments.");
  }

  return null;
}

async function validateTournamentForm(formData: FormData) {
  const title = getValue(formData, "title");
  const gameSlug = getValue(formData, "gameSlug");
  const description = getValue(formData, "description");
  const prize = getValue(formData, "prize");
  const imageUrl = normalizeImageUrl(getValue(formData, "imageUrl"));
  const status = getValue(formData, "status") || "upcoming";
  const registrationStatus = getValue(formData, "registrationStatus") || "open";
  const maxTeams = getNumber(formData, "maxTeams");
  const teamSize = getNumber(formData, "teamSize");

  if (!title) {
    return { ok: false as const, message: "Tournament title is required." };
  }

  if (!gameSlug) {
    return { ok: false as const, message: "Game is required." };
  }

  const game = await prisma.game.findUnique({ where: { slug: gameSlug } });

  if (!game) {
    return { ok: false as const, message: "Invalid game selected." };
  }

  if (!description) {
    return { ok: false as const, message: "Description is required." };
  }

  if (imageUrl === "invalid") {
    return {
      ok: false as const,
      message: "Image URL must start with http://, https://, or /.",
    };
  }

  if (!maxTeams || maxTeams < 1) {
    return { ok: false as const, message: "Max teams must be at least 1." };
  }

  if (!teamSize || teamSize < 1) {
    return { ok: false as const, message: "Team size must be at least 1." };
  }

  return {
    ok: true as const,
    data: {
      title,
      gameId: game.id,
      description,
      prize: prize || null,
      imageUrl,
      maxTeams,
      teamSize,
      status,
      registrationStatus,
    },
  };
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

async function snapshotTournament(
  tx: Prisma.TransactionClient,
  tournamentId: string,
) {
  const registrations = await tx.tournamentRegistration.findMany({
    where: { tournamentId },
    include: {
      team: {
        include: {
          game: true,
          members: {
            include: { user: true },
            orderBy: { joinedAt: "asc" },
          },
        },
      },
    },
  });

  for (const registration of registrations) {
    if (registration.snapshotTeamName) continue;

    await tx.tournamentRegistration.update({
      where: { id: registration.id },
      data: {
        snapshotTeamName: registration.team.name,
        snapshotTeamGame: registration.team.game?.name ?? null,
        snapshotMembers: buildSnapshotMembers(registration.team.members),
      },
    });
  }

  const results = await tx.tournamentResult.findMany({
    where: { tournamentId },
    include: {
      team: {
        include: {
          game: true,
          members: {
            include: { user: true },
            orderBy: { joinedAt: "asc" },
          },
        },
      },
    },
  });

  for (const result of results) {
    if (result.snapshotTeamName) continue;

    await tx.tournamentResult.update({
      where: { id: result.id },
      data: {
        snapshotTeamName: result.team.name,
        snapshotTeamGame: result.team.game?.name ?? null,
        snapshotMembers: buildSnapshotMembers(result.team.members),
      },
    });
  }
}

export async function createTournamentInline(
  formData: FormData,
): Promise<AdminTournamentActionResult> {
  const authError = await requireAdmin();

  if (authError) return authError;

  const validation = await validateTournamentForm(formData);

  if (!validation.ok) return fail(validation.message);

  const tournament = await prisma.tournament.create({
    data: validation.data,
    include: { game: true },
  });

  await queueTournamentAnnouncementEvent(
    "tournament_announcement_create",
    tournament,
  );

  await createRealtimeEvent({
    type: "tournament.created",
    audience: "public",
    entityType: "tournament",
    entityId: tournament.id,
    payload: {
      tournamentId: tournament.id,
      title: tournament.title,
      game: tournament.game?.name ?? null,
    },
  });

  revalidateTournamentViews(tournament.id);

  return success("Tournament created successfully.");
}

export async function updateTournamentInline(
  formData: FormData,
): Promise<AdminTournamentActionResult> {
  const authError = await requireAdmin();

  if (authError) return authError;

  const tournamentId =
    getValue(formData, "tournamentId") || getValue(formData, "id");

  if (!tournamentId) return fail("Tournament ID is missing.");

  const validation = await validateTournamentForm(formData);

  if (!validation.ok) return fail(validation.message);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament) return fail("Tournament was not found.");

  const approvedCount = await prisma.tournamentRegistration.count({
    where: { tournamentId: tournament.id, status: "approved" },
  });

  if (validation.data.maxTeams < approvedCount) {
    return fail("Max teams cannot be lower than approved teams.");
  }

  const updatedTournament = await prisma.tournament.update({
    where: { id: tournament.id },
    data: validation.data,
    include: { game: true },
  });

  await queueTournamentAnnouncementEvent(
    "tournament_announcement_update",
    updatedTournament,
  );

  await createRealtimeEvent({
    type: "tournament.updated",
    audience: "public",
    entityType: "tournament",
    entityId: tournament.id,
    payload: { tournamentId: tournament.id },
  });

  revalidateTournamentViews(tournament.id);

  return success("Tournament updated successfully.");
}

export async function deleteTournamentInline(
  formData: FormData,
): Promise<AdminTournamentActionResult> {
  const authError = await requireAdmin();

  if (authError) return authError;

  const tournamentId =
    getValue(formData, "tournamentId") || getValue(formData, "id");

  if (!tournamentId) return fail("Tournament ID is missing.");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament) return fail("Tournament was not found.");

  await prisma.tournament.delete({ where: { id: tournament.id } });

  await createRealtimeEvent({
    type: "tournament.deleted",
    audience: "public",
    entityType: "tournament",
    entityId: tournament.id,
    payload: { tournamentId: tournament.id, title: tournament.title },
  });

  revalidatePath("/admin");
  revalidatePath("/tournaments");

  return {
    ok: true,
    message: "Tournament deleted successfully.",
    redirectTo: "/admin?tab=tournaments",
  };
}

export async function openTournamentRegistrationInline(
  formData: FormData,
): Promise<AdminTournamentActionResult> {
  return setTournamentRegistrationStatus(formData, "open");
}

export async function closeTournamentRegistrationInline(
  formData: FormData,
): Promise<AdminTournamentActionResult> {
  return setTournamentRegistrationStatus(formData, "closed");
}

async function setTournamentRegistrationStatus(
  formData: FormData,
  registrationStatus: "open" | "closed",
): Promise<AdminTournamentActionResult> {
  const authError = await requireAdmin();

  if (authError) return authError;

  const tournamentId =
    getValue(formData, "tournamentId") || getValue(formData, "id");

  if (!tournamentId) return fail("Tournament ID is missing.");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament) return fail("Tournament was not found.");

  if (tournament.status === "ended") {
    return fail("Ended tournaments cannot reopen registration.");
  }

  const updatedTournament = await prisma.tournament.update({
    where: { id: tournament.id },
    data: { registrationStatus },
    include: { game: true },
  });

  await queueTournamentAnnouncementEvent(
    "tournament_announcement_update",
    updatedTournament,
  );

  await createRealtimeEvent({
    type: "tournament.registrationStatus.updated",
    audience: "public",
    entityType: "tournament",
    entityId: tournament.id,
    payload: { tournamentId: tournament.id, registrationStatus },
  });

  revalidateTournamentViews(tournament.id);

  return success(
    registrationStatus === "open"
      ? "Tournament registration opened."
      : "Tournament registration closed.",
  );
}

export async function setTournamentOpenInline(
  formData: FormData,
): Promise<AdminTournamentActionResult> {
  return setTournamentStatus(formData, "open");
}

export async function setTournamentUpcomingInline(
  formData: FormData,
): Promise<AdminTournamentActionResult> {
  return setTournamentStatus(formData, "upcoming");
}

export async function setTournamentClosedInline(
  formData: FormData,
): Promise<AdminTournamentActionResult> {
  return setTournamentStatus(formData, "closed");
}

export async function setTournamentCancelledInline(
  formData: FormData,
): Promise<AdminTournamentActionResult> {
  return setTournamentStatus(formData, "cancelled");
}

export async function setTournamentEndedInline(
  formData: FormData,
): Promise<AdminTournamentActionResult> {
  return setTournamentStatus(formData, "ended");
}

async function setTournamentStatus(
  formData: FormData,
  status: "upcoming" | "open" | "closed" | "cancelled" | "ended",
): Promise<AdminTournamentActionResult> {
  const authError = await requireAdmin();

  if (authError) return authError;

  const tournamentId =
    getValue(formData, "tournamentId") || getValue(formData, "id");

  if (!tournamentId) return fail("Tournament ID is missing.");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament) return fail("Tournament was not found.");

  const updatedTournament = await prisma.$transaction(async (tx) => {
    if (status === "ended") {
      await snapshotTournament(tx, tournament.id);
    }

    return tx.tournament.update({
      where: { id: tournament.id },
      data: {
        status,
        registrationStatus:
          status === "ended" ? "closed" : tournament.registrationStatus,
        endedAt: status === "ended" ? tournament.endedAt || new Date() : null,
      },
      include: { game: true },
    });
  });

  await queueTournamentAnnouncementEvent(
    "tournament_announcement_update",
    updatedTournament,
  );

  await createRealtimeEvent({
    type: "tournament.status.updated",
    audience: "public",
    entityType: "tournament",
    entityId: tournament.id,
    payload: { tournamentId: tournament.id, status },
  });

  revalidateTournamentViews(tournament.id);

  return success(`Tournament status changed to ${status}.`);
}
