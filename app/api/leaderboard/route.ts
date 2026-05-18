import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const games = ["Overall", "Valorant", "League of Legends", "CS2", "Dota2"];

export async function GET(request: NextRequest) {
  try {
    const selectedGameParam = request.nextUrl.searchParams.get("game") || "";
    const selectedGame = games.includes(selectedGameParam)
      ? selectedGameParam
      : "Overall";

    const users = await prisma.user.findMany({
      include: {
        teamMemberships: {
          include: {
            team: {
              include: {
                results: {
                  select: {
                    id: true,
                    points: true,
                    placement: true,
                    tournament: {
                      select: {
                        game: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const leaderboard = users
      .map((user) => {
        const userResults = user.teamMemberships.flatMap((membership) =>
          membership.team.results.filter((result) => {
            if (selectedGame === "Overall") {
              return true;
            }

            return result.tournament.game === selectedGame;
          }),
        );

        const tournamentResults = userResults.length;

        const tournamentPoints = userResults.reduce(
          (total, result) => total + result.points,
          0,
        );

        const bestPlacement =
          userResults.length > 0
            ? Math.min(...userResults.map((result) => result.placement))
            : null;

        return {
          id: user.id,
          username: user.username,
          role: user.role,
          tournamentResults,
          tournamentPoints,
          bestPlacement,
        };
      })
      .filter((user) => user.tournamentPoints > 0)
      .sort((a, b) => {
        if (b.tournamentPoints !== a.tournamentPoints) {
          return b.tournamentPoints - a.tournamentPoints;
        }

        if (b.tournamentResults !== a.tournamentResults) {
          return b.tournamentResults - a.tournamentResults;
        }

        return (a.bestPlacement || 999) - (b.bestPlacement || 999);
      })
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

    return NextResponse.json({
      success: true,
      source: "database",
      game: selectedGame,
      data: leaderboard,
    });
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch leaderboard",
      },
      { status: 500 },
    );
  }
}
