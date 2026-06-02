import { NextRequest, NextResponse } from "next/server";

import { getLeaderboardData } from "@/lib/leaderboardData";
import { createRateLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimiter = createRateLimiter(60, 60_000);

export async function GET(request: NextRequest) {
  const limited = rateLimiter(request);
  if (limited) return limited;

  try {
    const leaderboard = await getLeaderboardData({
      game: request.nextUrl.searchParams.get("game"),
      type: request.nextUrl.searchParams.get("type"),
      season: request.nextUrl.searchParams.get("season"),
    });

    return NextResponse.json({
      success: true,
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
