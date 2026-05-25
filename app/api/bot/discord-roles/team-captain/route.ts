import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const activeTournamentStatuses = ["open", "upcoming", "active"];
const approvedRegistrationStatuses = ["approved", "accepted"];

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";

  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice("Bearer ".length).trim();
}

function requireBotAccess(request: Request) {
  const expectedToken = process.env.BOT_API_TOKEN;
  const providedToken = getBearerToken(request);

  return Boolean(expectedToken && providedToken && providedToken === expectedToken);
}

function unauthorized() {
  return NextResponse.json(
    {
      ok: false,
      error: "Unauthorized",
    },
    {
      status: 401,
    },
  );
}

export async function GET(request: Request) {
  if (!requireBotAccess(request)) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const registrationId = url.searchParams.get("registrationId")?.trim();

  if (!registrationId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing registrationId",
      },
      {
        status: 400,
      },
    );
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      id: registrationId,
    },
    select: {
      id: true,
      team: {
        select: {
          leaderId: true,
          leader: {
            select: {
              discordId: true,
            },
          },
        },
      },
    },
  });

  if (!registration) {
    return NextResponse.json(
      {
        ok: false,
        error: "Registration not found",
      },
      {
        status: 404,
      },
    );
  }

  const qualifyingRegistrations =
    await prisma.tournamentRegistration.count({
      where: {
        id: {
          not: registration.id,
        },
        status: {
          in: approvedRegistrationStatuses,
        },
        team: {
          leaderId: registration.team.leaderId,
        },
        tournament: {
          status: {
            in: activeTournamentStatuses,
          },
        },
      },
    });

  return NextResponse.json({
    ok: true,
    leaderDiscordId: registration.team.leader.discordId || null,
    shouldKeepTeamCaptainRole: qualifyingRegistrations > 0,
  });
}
