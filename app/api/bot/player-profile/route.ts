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

const teamSelect = {
  id: true,
  name: true,
  game: { select: { name: true, slug: true } },
  status: true,
  createdAt: true,
  leaderId: true,
  members: {
    select: {
      id: true,
    },
  },
  registrations: {
    orderBy: {
      createdAt: "desc" as const,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      tournament: {
        select: {
          id: true,
          title: true,
          game: { select: { name: true } },
          status: true,
          registrationStatus: true,
          startsAt: true,
        },
      },
    },
  },
  results: {
    select: {
      id: true,
      points: true,
      placement: true,
      tournament: {
        select: {
          id: true,
          title: true,
          game: { select: { name: true } },
        },
      },
    },
  },
};

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

  const discordId = request.nextUrl.searchParams.get("discordId")?.trim();

  if (!discordId) {
    return NextResponse.json(
      {
        success: false,
        message: "Discord ID is required.",
      },
      {
        status: 400,
      },
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      discordId,
    },
    select: {
      id: true,
      discordId: true,
      username: true,
      avatar: true,
      role: true,
      isGuildMember: true,
      createdAt: true,
      ownedTeams: {
        select: teamSelect,
      },
      teamMemberships: {
        select: {
          role: true,
          joinedAt: true,
          team: {
            select: teamSelect,
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Profile was not found.",
      },
      {
        status: 404,
      },
    );
  }

  type UserWithTeams = NonNullable<typeof user>;
  type TeamRecord = UserWithTeams["ownedTeams"][number];

  const teamsMap = new Map<
    string,
    {
      role: string;
      joinedAt: Date;
      team: TeamRecord;
    }
  >();

  function addTeam(role: string, joinedAt: Date, team: TeamRecord) {
    const existing = teamsMap.get(team.id);

    if (!existing || role === "leader") {
      teamsMap.set(team.id, {
        role,
        joinedAt,
        team,
      });
    }
  }

  for (const team of user.ownedTeams) {
    addTeam("leader", team.createdAt, team);
  }

  for (const membership of user.teamMemberships) {
    addTeam(membership.role || "member", membership.joinedAt, membership.team);
  }

  const teams = Array.from(teamsMap.values()).map((item) => {
    const totalPoints = getTotalPoints(item.team.results);
    const bestPlacement = getBestPlacement(item.team.results);
    const latestRegistration = item.team.registrations[0] || null;

    return {
      id: item.team.id,
      name: item.team.name,
      game: item.team.game?.name ?? null,
      status: item.team.status,
      role: item.role,
      membersCount: item.team.members.length,
      registrationsCount: item.team.registrations.length,
      resultsCount: item.team.results.length,
      tournamentPoints: totalPoints,
      bestPlacement,
      latestRegistration: latestRegistration
        ? {
            id: latestRegistration.id,
            status: latestRegistration.status,
            tournamentId: latestRegistration.tournament.id,
            tournamentTitle: latestRegistration.tournament.title,
            tournamentGame: latestRegistration.tournament.game?.name ?? null,
            tournamentStatus: latestRegistration.tournament.status,
            registrationStatus:
              latestRegistration.tournament.registrationStatus,
            tournamentDate: latestRegistration.tournament.startsAt?.toISOString() ?? null,
          }
        : null,
    };
  });

  const allResults = Array.from(teamsMap.values()).flatMap(
    (item) => item.team.results,
  );

  const registrations = Array.from(teamsMap.values())
    .flatMap((item) =>
      item.team.registrations.map((registration) => ({
        id: registration.id,
        status: registration.status,
        teamId: item.team.id,
        teamName: item.team.name,
        tournamentId: registration.tournament.id,
        tournamentTitle: registration.tournament.title,
        tournamentGame: registration.tournament.game?.name ?? null,
        tournamentStatus: registration.tournament.status,
        registrationStatus: registration.tournament.registrationStatus,
        tournamentDate: registration.tournament.startsAt?.toISOString() ?? null,
        createdAt: registration.createdAt,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return NextResponse.json({
    success: true,
    profile: {
      id: user.id,
      discordId: user.discordId,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      isGuildMember: user.isGuildMember,
      createdAt: user.createdAt,
      totals: {
        teams: teams.length,
        registrations: registrations.length,
        results: allResults.length,
        tournamentPoints: getTotalPoints(allResults),
        bestPlacement: getBestPlacement(allResults),
      },
      teams,
      registrations,
    },
  });
}
