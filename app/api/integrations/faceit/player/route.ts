/**
 * Internal server-side FACEIT player lookup.
 *
 * GET /api/integrations/faceit/player?nickname=<nickname>&game=cs2
 *
 * For manual testing only — not exposed in any public UI.
 * FACEIT_API_KEY is never sent to the browser.
 *
 * Responses:
 *   200  { player_id, nickname, avatar, country, steam_id_64, steam_nickname,
 *          faceit_url, cs2 }
 *   400  { error: "nickname query param is required" }
 *   404  { error: "Player not found on FACEIT" }
 *   500  { error: "FACEIT integration is not configured" }
 *   500  { error: "FACEIT lookup failed" }
 *
 * Manual test (dev):
 *   http://localhost:3000/api/integrations/faceit/player?nickname=Abu_3Day
 */

import { NextResponse } from "next/server";

import { FaceitApiError, getFaceitPlayerByNickname } from "@/lib/faceit";
import { createRateLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimiter = createRateLimiter(30, 60_000);

export async function GET(request: Request) {
  const limited = rateLimiter(request);
  if (limited) return limited;
  const url = new URL(request.url);
  const nickname = url.searchParams.get("nickname")?.trim();
  const game = url.searchParams.get("game")?.trim() || "cs2";

  if (!nickname) {
    return NextResponse.json(
      { error: "nickname query param is required" },
      { status: 400 },
    );
  }

  try {
    const player = await getFaceitPlayerByNickname(nickname, game);

    // Return only safe, non-secret fields.
    const cs2Game = player.games?.[game];

    return NextResponse.json({
      player_id: player.player_id,
      nickname: player.nickname,
      avatar: player.avatar ?? null,
      country: player.country ?? null,
      steam_id_64: player.steam_id_64 ?? null,
      steam_nickname: player.steam_nickname ?? null,
      faceit_url: player.faceit_url ?? null,
      [game]: cs2Game
        ? {
            skill_level: cs2Game.skill_level ?? null,
            faceit_elo: cs2Game.faceit_elo ?? null,
            region: cs2Game.region ?? null,
            game_player_name: cs2Game.game_player_name ?? null,
          }
        : null,
    });
  } catch (err) {
    if (err instanceof FaceitApiError) {
      if (err.status === 404) {
        return NextResponse.json(
          { error: "Player not found on FACEIT" },
          { status: 404 },
        );
      }
      // Do not expose raw API error body to callers.
      return NextResponse.json(
        { error: "FACEIT lookup failed" },
        { status: 502 },
      );
    }

    if (
      err instanceof Error &&
      err.message.includes("FACEIT_API_KEY is not configured")
    ) {
      return NextResponse.json(
        { error: "FACEIT integration is not configured" },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: "FACEIT lookup failed" }, { status: 500 });
  }
}
