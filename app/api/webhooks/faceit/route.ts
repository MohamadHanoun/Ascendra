/**
 * FACEIT webhook receiver — Phase 1 skeleton.
 *
 * Authentication
 * --------------
 * Every incoming request must carry FACEIT_WEBHOOK_SECRET in one of two ways:
 *   • Authorization: Bearer <secret>   (preferred — aligns with Vercel Cron pattern)
 *   • ?secret=<secret>                 (fallback for manual testing)
 * Comparison is always constant-time to prevent timing attacks.
 *
 * Current behaviour
 * -----------------
 * Parses the event type and logs minimal safe info in development.
 * Does NOT update the database yet — all result processing is TODO (Phase 2+).
 *
 * TODO (Phase 2): implement these event handlers:
 *   - match_status_finished  → fetch match details + stats via getFaceitMatchDetails /
 *                              getFaceitMatchStats, run parseFaceitCs2MatchResult,
 *                              map FACEIT teams to Ascendra teams by faceitTeamId,
 *                              upsert TournamentMatch result pending admin review
 *                              (or auto-confirm if tournament.faceitAutoConfirm is set).
 *   - match_demo_ready       → store demo URL on TournamentMatch.faceitDemoUrl.
 *   - match_cancelled        → mark TournamentMatch as cancelled if not yet confirmed.
 */

import crypto from "node:crypto";

import { NextResponse } from "next/server";

import type { FaceitWebhookPayload } from "@/lib/faceitTypes";

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

  // Phase 2: add match_status_finished, match_demo_ready, match_cancelled handlers here.
  // Example structure:
  //
  // if (eventType === "match_status_finished") {
  //   const matchId = payload.payload?.id as string | undefined;
  //   if (matchId) {
  //     const details = await getFaceitMatchDetails(matchId);
  //     const stats = await getFaceitMatchStats(matchId);
  //     const parsed = parseFaceitCs2MatchResult({ matchId, details, stats });
  //     // map parsed.teams → Ascendra TournamentMatch by faceitMatchId
  //     // upsert result pending review or auto-confirm
  //   }
  // }

  return NextResponse.json({ ok: true });
}
