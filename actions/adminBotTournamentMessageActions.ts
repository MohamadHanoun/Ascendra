"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";

type TournamentDiscordEventType =
  | "tournament_announcement_update"
  | "tournament_announcement_recreate"
  | "tournament_announcement_delete";

export type AdminBotTournamentMessageActionResult = {
  ok: boolean;
  message: string;
};

function success(message: string): AdminBotTournamentMessageActionResult {
  return {
    ok: true,
    message,
  };
}

function fail(message: string): AdminBotTournamentMessageActionResult {
  return {
    ok: false,
    message,
  };
}

async function requireAdmin(): Promise<AdminBotTournamentMessageActionResult | null> {
  const session = await auth();

  const sessionUser = session?.user as
    | {
        databaseId?: string;
        isAdmin?: boolean;
      }
    | undefined;

  if (!sessionUser?.databaseId) {
    return fail("Please login first.");
  }

  if (!sessionUser.isAdmin) {
    return fail("Only Ascendra admins can manage bot messages.");
  }

  return null;
}

function getTournamentId(formData: FormData) {
  return String(formData.get("tournamentId") || "").trim();
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function revalidateBotViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/bot");
  revalidatePath("/tournaments");
}

function buildTournamentAnnouncementPayload(tournament: {
  id: string;
  title: string;
  game: { name: string } | null;
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
}) {
  const siteUrl = getSiteUrl();

  return {
    id: tournament.id,
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
    websiteUrl: `${siteUrl}/tournaments/${tournament.id}`,
    announcementChannelId: tournament.discordAnnouncementChannelId,
    announcementMessageId: tournament.discordAnnouncementMessageId,
    announcementUrl: tournament.discordAnnouncementUrl,
  };
}

async function getTournament(tournamentId: string) {
  return prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      title: true,
      game: { select: { name: true } },
      description: true,
      startsAt: true,
      prize: true,
      imageUrl: true,
      maxTeams: true,
      teamSize: true,
      status: true,
      registrationStatus: true,
      discordAnnouncementChannelId: true,
      discordAnnouncementMessageId: true,
      discordAnnouncementUrl: true,
    },
  });
}

async function queueTournamentDiscordEvent(
  type: TournamentDiscordEventType,
  tournamentId: string,
) {
  const tournament = await getTournament(tournamentId);

  if (!tournament) {
    return fail("Tournament was not found.");
  }

  if (
    type === "tournament_announcement_delete" &&
    (!tournament.discordAnnouncementChannelId ||
      !tournament.discordAnnouncementMessageId)
  ) {
    return fail("No Discord message is stored for this tournament.");
  }

  const event = await prisma.botEvent.create({
    data: {
      type,
      entityType: "tournament",
      entityId: tournament.id,
      priority:
        type === "tournament_announcement_delete"
          ? 125
          : type === "tournament_announcement_recreate"
            ? 120
            : 100,
      payload: buildTournamentAnnouncementPayload(tournament),
    },
  });

  await createRealtimeEvent({
    type: "bot.command.queued",
    audience: "admin",
    entityType: "botEvent",
    entityId: event.id,
    payload: {
      botEventId: event.id,
      eventType: type,
      tournamentId: tournament.id,
    },
  });

  revalidateBotViews();

  if (type === "tournament_announcement_delete") {
    return success("Delete queued.");
  }

  if (type === "tournament_announcement_recreate") {
    return success("Recreate queued.");
  }

  return success("Sync queued.");
}

export async function syncTournamentDiscordMessageInline(
  formData: FormData,
): Promise<AdminBotTournamentMessageActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const tournamentId = getTournamentId(formData);

  if (!tournamentId) {
    return fail("Tournament ID is missing.");
  }

  return queueTournamentDiscordEvent(
    "tournament_announcement_update",
    tournamentId,
  );
}

export async function recreateTournamentDiscordMessageInline(
  formData: FormData,
): Promise<AdminBotTournamentMessageActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const tournamentId = getTournamentId(formData);

  if (!tournamentId) {
    return fail("Tournament ID is missing.");
  }

  return queueTournamentDiscordEvent(
    "tournament_announcement_recreate",
    tournamentId,
  );
}

export async function deleteTournamentDiscordMessageInline(
  formData: FormData,
): Promise<AdminBotTournamentMessageActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const tournamentId = getTournamentId(formData);

  if (!tournamentId) {
    return fail("Tournament ID is missing.");
  }

  return queueTournamentDiscordEvent(
    "tournament_announcement_delete",
    tournamentId,
  );
}
