import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { createRateLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";

const rateLimiter = createRateLimiter(60, 60_000);

export async function GET(request: Request) {
  const limited = rateLimiter(request);
  if (limited) return limited;
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        game: { select: { name: true, slug: true } },
        startsAt: true,
        prize: true,
        maxTeams: true,
        status: true,
        description: true,
      },
    });

    const formattedTournaments = tournaments.map((tournament) => ({
      id: tournament.id,
      title: tournament.title,
      game: tournament.game?.name ?? null,
      startsAt: tournament.startsAt?.toISOString() ?? null,
      prize: tournament.prize ?? null,
      teams: `${tournament.maxTeams} slots`,
      status: tournament.status,
      description: tournament.description,
    }));

    return NextResponse.json({
      success: true,
      source: "database",
      data: formattedTournaments,
    });
  } catch (error) {
    console.error("Failed to fetch tournaments:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch tournaments" },
      { status: 500 },
    );
  }
}
