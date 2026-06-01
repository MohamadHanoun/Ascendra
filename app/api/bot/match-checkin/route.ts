import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { isBotAuthorized } from "@/lib/botAuth";
import { isCs2Game } from "@/lib/isCs2Game";
import { determineUserMatchTeam } from "@/lib/matchCheckIn";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";
import {
  getServerLogErrorMessage,
  logServerBotError,
  logServerTournamentAction,
} from "@/lib/serverDiscordLogs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckInPayload = {
  ok: boolean;
  alreadyCheckedIn: boolean;
  message: string;
  matchLabel: string | null;
  tournamentTitle: string | null;
  tournamentId: string | null;
  matchId: string | null;
  teamName: string | null;
};

function okResponse(
  message: string,
  extra: Partial<Omit<CheckInPayload, "ok" | "alreadyCheckedIn" | "message">> & {
    alreadyCheckedIn?: boolean;
  } = {},
): NextResponse {
  const payload: CheckInPayload = {
    ok: true,
    alreadyCheckedIn: extra.alreadyCheckedIn ?? false,
    message,
    matchLabel: extra.matchLabel ?? null,
    tournamentTitle: extra.tournamentTitle ?? null,
    tournamentId: extra.tournamentId ?? null,
    matchId: extra.matchId ?? null,
    teamName: extra.teamName ?? null,
  };

  return NextResponse.json(payload);
}

function failResponse(
  message: string,
  extra: { matchId?: string; tournamentId?: string } = {},
): NextResponse {
  const payload: CheckInPayload = {
    ok: false,
    alreadyCheckedIn: false,
    message,
    matchLabel: null,
    tournamentTitle: null,
    tournamentId: extra.tournamentId ?? null,
    matchId: extra.matchId ?? null,
    teamName: null,
  };

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  if (!isBotAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request body." },
      { status: 400 },
    );
  }

  const matchId = String((body as Record<string, unknown>)?.matchId || "").trim();
  const discordUserId = String((body as Record<string, unknown>)?.discordUserId || "").trim();

  if (!matchId || !discordUserId) {
    return NextResponse.json(
      { ok: false, message: "matchId and discordUserId are required." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { discordId: discordUserId },
    select: { id: true, username: true },
  });

  if (!user) {
    return failResponse("No Ascendra profile found for this Discord account.");
  }

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      tournamentId: true,
      roundNumber: true,
      matchNumber: true,
      teamAId: true,
      teamBId: true,
      tournament: {
        select: {
          title: true,
          game: { select: { slug: true, name: true } },
        },
      },
    },
  });

  if (!match) {
    return failResponse("No match found.");
  }

  if (!isCs2Game(match.tournament.game?.slug, match.tournament.game?.name)) {
    return failResponse("Check-in is available for CS2 matches only.", {
      matchId: match.id,
      tournamentId: match.tournamentId,
    });
  }

  const teamIds = [match.teamAId, match.teamBId].filter(
    (id): id is string => Boolean(id),
  );

  if (teamIds.length === 0) {
    return failResponse("You are not registered for this match.", {
      matchId: match.id,
      tournamentId: match.tournamentId,
    });
  }

  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: {
      id: true,
      name: true,
      leaderId: true,
      members: { select: { userId: true } },
    },
  });

  const userTeamId = determineUserMatchTeam({
    userId: user.id,
    teams: teamIds.map((teamId) => {
      const team = teams.find((t) => t.id === teamId);
      return {
        teamId,
        name: team?.name ?? "TBD",
        leaderUserId: team?.leaderId ?? null,
        memberUserIds: team?.members.map((m) => m.userId) ?? [],
      };
    }),
  });

  if (!userTeamId) {
    return failResponse("You are not registered for this match.", {
      matchId: match.id,
      tournamentId: match.tournamentId,
    });
  }

  const teamName = teams.find((t) => t.id === userTeamId)?.name ?? null;
  const matchLabel = `Round ${match.roundNumber}, Match ${match.matchNumber}`;

  const existing = await prisma.tournamentMatchCheckIn.findUnique({
    where: { matchId_userId: { matchId: match.id, userId: user.id } },
    select: { id: true },
  });

  if (existing) {
    return okResponse("You are already checked in.", {
      alreadyCheckedIn: true,
      matchLabel,
      tournamentTitle: match.tournament.title,
      tournamentId: match.tournamentId,
      matchId: match.id,
      teamName,
    });
  }

  try {
    await prisma.tournamentMatchCheckIn.create({
      data: {
        matchId: match.id,
        userId: user.id,
        teamId: userTeamId,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return okResponse("You are already checked in.", {
        alreadyCheckedIn: true,
        matchLabel,
        tournamentTitle: match.tournament.title,
        tournamentId: match.tournamentId,
        matchId: match.id,
        teamName,
      });
    }

    void logServerBotError({
      title: "Check-in failed",
      fields: [
        { name: "Match", value: matchLabel, inline: false },
        { name: "Tournament", value: match.tournament.title },
        { name: "Reason", value: getServerLogErrorMessage(err) },
      ],
    });

    return NextResponse.json(
      {
        ok: false,
        alreadyCheckedIn: false,
        message: "Check-in failed. Please try again.",
        matchLabel,
        tournamentTitle: match.tournament.title,
        tournamentId: match.tournamentId,
        matchId: match.id,
        teamName: null,
      },
      { status: 500 },
    );
  }

  void createRealtimeEvent({
    type: "tournament.match.checkin_updated",
    audience: "admin",
    entityType: "tournamentMatch",
    entityId: match.id,
    payload: {
      matchId: match.id,
      tournamentId: match.tournamentId,
      userId: user.id,
    },
  }).catch(() => {});

  void logServerTournamentAction({
    title: "Player checked in",
    fields: [
      { name: "Tournament", value: match.tournament.title, inline: false },
      { name: "Match", value: matchLabel },
      { name: "Team", value: teamName ?? "—" },
      { name: "Player", value: user.username },
    ],
  });

  return okResponse("Check-in confirmed.", {
    matchLabel,
    tournamentTitle: match.tournament.title,
    tournamentId: match.tournamentId,
    matchId: match.id,
    teamName,
  });
}
