/**
 * FACEIT webhook receiver — Phase 3.
 *
 * Authentication
 * --------------
 * Every incoming request must carry FACEIT_WEBHOOK_SECRET in one of two ways:
 *   • Authorization: Bearer <secret>   (preferred)
 *   • ?secret=<secret>                 (fallback for manual testing)
 * Comparison is always constant-time to prevent timing attacks.
 *
 * Phase 3 behaviour
 * -----------------
 * On match_status_finished or match_demo_ready:
 *   - Extracts the FACEIT match ID from payload.id
 *   - Looks up a TournamentMatch by faceitMatchId
 *   - If found: re-fetches details + stats and updates FACEIT proof fields only
 *
 * This handler NEVER:
 *   - Updates the official match result (status, winnerTeamId)
 *   - Advances brackets
 *   - Auto-confirms results
 *
 * match_cancelled: TODO — mark TournamentMatch as cancelled if not yet confirmed.
 */

import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { FaceitApiError, getFaceitMatchDetails, getFaceitMatchStats } from "@/lib/faceit";
import { parseFaceitCs2MatchResult } from "@/lib/faceitCs2Parser";
import type { FaceitWebhookPayload } from "@/lib/faceitTypes";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifySecret(request: Request): boolean {
  const secret = process.env.FACEIT_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader && safeEqual(authHeader, `Bearer ${secret}`)) return true;

  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret && safeEqual(querySecret, secret)) return true;

  return false;
}

async function syncProofForFaceitMatch(faceitMatchId: string): Promise<void> {
  // Only update if this FACEIT match ID is already linked to an Ascendra match.
  const existingMatch = await prisma.tournamentMatch.findUnique({
    where: { faceitMatchId },
    select: { id: true },
  });
  if (!existingMatch) return;

  let details: Awaited<ReturnType<typeof getFaceitMatchDetails>>;
  try {
    details = await getFaceitMatchDetails(faceitMatchId);
  } catch (err) {
    if (err instanceof FaceitApiError) return; // silently skip on API errors
    return;
  }

  let stats: Awaited<ReturnType<typeof getFaceitMatchStats>>;
  try {
    stats = await getFaceitMatchStats(faceitMatchId);
  } catch {
    // Stats may not be ready yet; skip silently.
    return;
  }

  if (!stats.rounds || stats.rounds.length === 0) return;

  const parsed = parseFaceitCs2MatchResult({ matchId: faceitMatchId, details, stats });

  const demoUrl = parsed.demoUrls[0] ?? null;
  const matchUrl = typeof details.faceit_url === "string" ? details.faceit_url : null;
  const isVerified = parsed.status === "FINISHED" && parsed.score !== undefined;

  // Update FACEIT proof fields only. Official result fields are never touched.
  await prisma.tournamentMatch.update({
    where: { faceitMatchId },
    data: {
      faceitMatchUrl: matchUrl,
      faceitStatus: parsed.status,
      faceitDemoUrl: demoUrl,
      faceitMap: parsed.map ?? null,
      faceitScoreRaw: parsed.score?.raw ?? null,
      faceitFaction1Score: parsed.score?.faction1 ?? null,
      faceitFaction2Score: parsed.score?.faction2 ?? null,
      faceitWinnerFaceitTeamId: parsed.winnerFaceitTeamId ?? null,
      faceitParsedResult: {
        teams: parsed.teams.map((t) => ({
          faceitTeamId: t.faceitTeamId,
          name: t.name,
          finalScore: t.finalScore,
          won: t.won,
          players: t.players,
        })),
      } as unknown as Prisma.InputJsonValue,
      faceitSyncedAt: new Date(),
      faceitVerifiedAt: isVerified ? new Date() : null,
    },
  }).catch(() => undefined); // swallow DB errors — webhook must not 500
}

export async function POST(request: Request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: FaceitWebhookPayload;
  try {
    payload = (await request.json()) as FaceitWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const eventType = payload.event ?? "unknown";

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[faceit-webhook] event=${eventType} event_id=${payload.event_id ?? "-"}`,
    );
  }

  if (
    eventType === "match_status_finished" ||
    eventType === "match_demo_ready"
  ) {
    const faceitMatchId = payload.payload?.id;
    if (typeof faceitMatchId === "string" && faceitMatchId.length > 0) {
      await syncProofForFaceitMatch(faceitMatchId);
    }
  }

  // TODO (future): match_cancelled → mark TournamentMatch as cancelled if not yet confirmed.

  return NextResponse.json({ ok: true });
}
