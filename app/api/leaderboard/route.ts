import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        teamMemberships: {
          include: {
            team: {
              include: {
                registrations: {
                  where: {
                    status: "approved",
                  },
                  select: {
                    id: true,
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
        const approvedRegistrations = user.teamMemberships.reduce(
          (total, membership) => total + membership.team.registrations.length,
          0,
        );

        return {
          id: user.id,
          username: user.username,
          role: user.role,
          approvedRegistrations,
          tournamentPoints: approvedRegistrations * 10,
        };
      })
      .sort((a, b) => {
        if (b.tournamentPoints !== a.tournamentPoints) {
          return b.tournamentPoints - a.tournamentPoints;
        }

        return b.approvedRegistrations - a.approvedRegistrations;
      })
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

    return NextResponse.json({
      success: true,
      source: "database",
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
