import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: [
        {
          xp: "desc",
        },
        {
          level: "desc",
        },
      ],
    });

    const leaderboard = users.map((user, index) => ({
      id: user.id,
      username: user.username,
      role: user.role,
      level: user.level,
      xp: user.xp,
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