import { NextRequest, NextResponse } from "next/server";

import { isBotAuthorized } from "@/lib/botAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


function getBestPlacement(results: Array<{ placement: number }>) {
  if (results.length === 0) {
    return null;
  }

  return Math.min(...results.map((result) => result.placement));
}

function getTotalPoints(results: Array<{ points: number }>) {
  return results.reduce((total, result) => total + result.points, 0);
}

export async function GET(request: NextRequest) {
  if (!isBotAuthorized(request)) {
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
            name: {
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

  const teams = await prisma.team.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      name: true,
      game: { select: { name: true, slug: true } },
      status: true,
      submittedAt: true,
      approvedAt: true,
      rejectedAt: true,
      createdAt: true,
      leader: {
        select: {
          id: true,
          discordId: true,
          username: true,
          avatar: true,
          role: true,
        },
      },
      members: {
        orderBy: {
          joinedAt: "asc",
        },
        select: {
          id: true,
          role: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              discordId: true,
              username: true,
              avatar: true,
              role: true,
            },
          },
        },
      },
      registrations: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          rejectionReason: true,
          createdAt: true,
          approvedAt: true,
          cancelledAt: true,
          reviewedAt: true,
          tournament: {
            select: {
              id: true,
              title: true,
              game: { select: { name: true } },
              startsAt: true,
              status: true,
              registrationStatus: true,
            },
          },
        },
      },
      results: {
        orderBy: {
          awardedAt: "desc",
        },
        select: {
          id: true,
          placement: true,
          points: true,
          note: true,
          awardedAt: true,
          tournament: {
            select: {
              id: true,
              title: true,
              game: { select: { name: true } },
              startsAt: true,
              status: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    count: teams.length,
    teams: teams.map((team) => {
      const totalPoints = getTotalPoints(team.results);
      const bestPlacement = getBestPlacement(team.results);

      return {
        id: team.id,
        name: team.name,
        game: team.game?.name ?? null,
        gameSlug: team.game?.slug ?? null,
        status: team.status,
        submittedAt: team.submittedAt,
        approvedAt: team.approvedAt,
        rejectedAt: team.rejectedAt,
        createdAt: team.createdAt,
        leader: team.leader,
        membersCount: team.members.length,
        resultsCount: team.results.length,
        registrationsCount: team.registrations.length,
        tournamentPoints: totalPoints,
        bestPlacement,
        members: team.members.map((member) => ({
          id: member.id,
          role: member.role,
          joinedAt: member.joinedAt,
          user: member.user,
        })),
        registrations: team.registrations.slice(0, 8).map((registration) => ({
          id: registration.id,
          status: registration.status,
          rejectionReason: registration.rejectionReason,
          createdAt: registration.createdAt,
          approvedAt: registration.approvedAt,
          cancelledAt: registration.cancelledAt,
          reviewedAt: registration.reviewedAt,
          tournament: {
            id: registration.tournament.id,
            title: registration.tournament.title,
            game: registration.tournament.game?.name ?? null,
            startsAt: registration.tournament.startsAt?.toISOString() ?? null,
            status: registration.tournament.status,
            registrationStatus: registration.tournament.registrationStatus,
          },
        })),
        results: team.results.slice(0, 8).map((result) => ({
          id: result.id,
          placement: result.placement,
          points: result.points,
          note: result.note,
          awardedAt: result.awardedAt,
          tournament: {
            id: result.tournament.id,
            title: result.tournament.title,
            game: result.tournament.game?.name ?? null,
            startsAt: result.tournament.startsAt?.toISOString() ?? null,
            status: result.tournament.status,
          },
        })),
      };
    }),
  });
}
