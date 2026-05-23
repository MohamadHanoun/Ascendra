import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
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
