import { NextRequest, NextResponse } from "next/server";

import { isBotAuthorized } from "@/lib/botAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AutocompleteOption = {
  name: string;
  value: string;
};


function normalizeQuery(value: string | null) {
  return String(value || "").trim();
}

function compactLabel(value: string, maxLength = 100) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
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

  const entity = normalizeQuery(request.nextUrl.searchParams.get("entity"));
  const query = normalizeQuery(request.nextUrl.searchParams.get("query"));

  if (entity === "tournament") {
    const tournaments = await prisma.tournament.findMany({
      where: query
        ? {
            OR: [
              {
                title: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                game: {
                  name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {},
      orderBy: {
        createdAt: "desc",
      },
      take: 25,
      select: {
        id: true,
        title: true,
        game: { select: { name: true } },
        status: true,
      },
    });

    const options: AutocompleteOption[] = tournaments.map((tournament) => ({
      name: compactLabel(
        `${tournament.title} · ${tournament.game?.name ?? "—"} · ${tournament.status}`,
      ),
      value: tournament.title,
    }));

    return NextResponse.json({
      success: true,
      entity,
      options,
    });
  }

  if (entity === "team") {
    const teams = await prisma.team.findMany({
      where: query
        ? {
            OR: [
              {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                game: {
                  name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {},
      orderBy: {
        createdAt: "desc",
      },
      take: 25,
      select: {
        id: true,
        name: true,
        game: { select: { name: true } },
        status: true,
      },
    });

    const options: AutocompleteOption[] = teams.map((team) => ({
      name: compactLabel(`${team.name} · ${team.game?.name ?? "—"} · ${team.status}`),
      value: team.name,
    }));

    return NextResponse.json({
      success: true,
      entity,
      options,
    });
  }

  if (entity === "match") {
    const matches = await prisma.tournamentMatch.findMany({
      where: query
        ? {
            OR: [
              { id: query },
              {
                tournament: {
                  title: { contains: query, mode: "insensitive" },
                },
              },
            ],
          }
        : {},
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        roundNumber: true,
        matchNumber: true,
        status: true,
        teamAId: true,
        teamBId: true,
        tournament: { select: { title: true } },
      },
    });

    const teamIds = [
      ...new Set(
        matches
          .flatMap((m) => [m.teamAId, m.teamBId])
          .filter((id): id is string => id !== null && id !== undefined),
      ),
    ];

    const teams =
      teamIds.length > 0
        ? await prisma.team.findMany({
            where: { id: { in: teamIds } },
            select: { id: true, name: true },
          })
        : [];

    const teamMap = new Map(teams.map((t) => [t.id, t.name]));

    const options: AutocompleteOption[] = matches.map((m) => {
      const teamA = m.teamAId ? (teamMap.get(m.teamAId) ?? "TBD") : "TBD";
      const teamB = m.teamBId ? (teamMap.get(m.teamBId) ?? "TBD") : "TBD";

      return {
        name: compactLabel(
          `R${m.roundNumber} M${m.matchNumber} · ${teamA} vs ${teamB} · ${m.tournament.title}`,
        ),
        value: m.id,
      };
    });

    return NextResponse.json({ success: true, entity, options });
  }

  return NextResponse.json(
    {
      success: false,
      message: "Unsupported autocomplete entity.",
      options: [],
    },
    {
      status: 400,
    },
  );
}
