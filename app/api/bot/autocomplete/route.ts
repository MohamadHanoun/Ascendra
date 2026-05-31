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
