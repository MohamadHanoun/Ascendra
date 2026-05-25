import { NextRequest, NextResponse } from "next/server";

import { getLeaderboardData } from "@/lib/leaderboardData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const leaderboard = await getLeaderboardData({
      game: request.nextUrl.searchParams.get("game"),
      type: request.nextUrl.searchParams.get("type"),
      season: request.nextUrl.searchParams.get("season"),
    });

    return NextResponse.json({
      success: true,
      source: "rankingPointEvent",
      rankingMethod: "competition",
      game: leaderboard.selectedGame?.slug ?? "overall",
      type: leaderboard.type,
      season: leaderboard.scope,
      activeSeason: leaderboard.activeSeason
        ? {
            id: leaderboard.activeSeason.id,
            name: leaderboard.activeSeason.name,
            slug: leaderboard.activeSeason.slug,
          }
        : null,
      data: leaderboard.data,
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
