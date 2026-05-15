import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    const formattedTournaments = tournaments.map((tournament) => ({
      id: tournament.id,
      title: tournament.title,
      game: tournament.game,
      date: tournament.date,
      prize: tournament.prize,
      teams: `${tournament.maxSlots} slots`,
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
      {
        success: false,
        message: "Failed to fetch tournaments",
      },
      { status: 500 },
    );
  }
}