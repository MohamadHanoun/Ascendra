import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.replace("Bearer ", "");

  return token === process.env.BOT_API_TOKEN;
}

function summarizeRegistrations(
  registrations: Array<{
    status: string;
  }>,
) {
  const approved = registrations.filter(
    (registration) => registration.status === "approved",
  ).length;

  const pending = registrations.filter(
    (registration) =>
      registration.status === "registered" || registration.status === "pending",
  ).length;

  const rejected = registrations.filter(
    (registration) => registration.status === "rejected",
  ).length;

  const cancelled = registrations.filter(
    (registration) => registration.status === "cancelled",
  ).length;

  const active = registrations.filter(
    (registration) =>
      registration.status !== "rejected" && registration.status !== "cancelled",
  ).length;

  return {
    total: registrations.length,
    active,
    approved,
    pending,
    rejected,
    cancelled,
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const query = request.nextUrl.searchParams.get("query")?.trim() || "";

  const where = query
    ? {
        OR: [
          {
            id: query,
          },
          {
            title: {
              contains: query,
              mode: "insensitive" as const,
            },
          },
          {
            game: {
              name: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
    : {};

  const tournaments = await prisma.tournament.findMany({
    where,
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
    take: 5,
    select: {
      id: true,
      title: true,
      game: { select: { name: true, slug: true } },
      description: true,
      startsAt: true,
      prize: true,
      imageUrl: true,
      maxTeams: true,
      teamSize: true,
      status: true,
      registrationStatus: true,
      discordAnnouncementUrl: true,
      createdAt: true,
      registrations: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          team: {
            select: {
              id: true,
              name: true,
              game: { select: { name: true } },
              status: true,
              leader: {
                select: {
                  username: true,
                },
              },
              members: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
      results: {
        select: {
          id: true,
          placement: true,
          points: true,
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          placement: "asc",
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    count: tournaments.length,
    tournaments: tournaments.map((tournament) => {
      const summary = summarizeRegistrations(tournament.registrations);

      return {
        id: tournament.id,
        title: tournament.title,
        game: tournament.game?.name ?? null,
        gameSlug: tournament.game?.slug ?? null,
        description: tournament.description,
        startsAt: tournament.startsAt?.toISOString() ?? null,
        prize: tournament.prize,
        imageUrl: tournament.imageUrl,
        maxTeams: tournament.maxTeams,
        teamSize: tournament.teamSize,
        status: tournament.status,
        registrationStatus: tournament.registrationStatus,
        discordAnnouncementUrl: tournament.discordAnnouncementUrl,
        createdAt: tournament.createdAt,
        registrationsSummary: summary,
        teams: tournament.registrations.slice(0, 8).map((registration) => ({
          id: registration.team.id,
          name: registration.team.name,
          game: registration.team.game?.name ?? null,
          status: registration.team.status,
          registrationStatus: registration.status,
          leaderName: registration.team.leader.username,
          membersCount: registration.team.members.length,
        })),
        results: tournament.results.slice(0, 5).map((result) => ({
          id: result.id,
          teamId: result.team.id,
          teamName: result.team.name,
          placement: result.placement,
          points: result.points,
        })),
      };
    }),
  });
}
