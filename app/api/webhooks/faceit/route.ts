/**
 * FACEIT webhook receiver — Phase 3 + Phase 7 (logging).
 *
 * Authentication
 * --------------
 * Every incoming request must carry FACEIT_WEBHOOK_SECRET as:
 *   Authorization: Bearer <secret>
 * Comparison is always constant-time to prevent timing attacks.
 *
 * Phase 3 behaviour
 * -----------------
 * On match_status_finished or match_demo_ready:
 *   - Extracts the FACEIT match ID from payload.id
 *   - Looks up a TournamentMatch by faceitMatchId
 *   - If found: re-fetches details + stats and updates FACEIT proof fields only
 *
 * Phase 7 behaviour
 * -----------------
 * Every authenticated request creates a FaceitWebhookLog entry:
 *   - status="received" on entry, updated to processed/skipped/failed on exit
 *   - Unauthorized requests are rejected before DB logging or payload parsing
 *   - Sensitive fields are stripped from the stored payload
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
import {
  createFaceitWebhookLog,
  extractFaceitWebhookEventType,
  extractFaceitWebhookMatchId,
  sanitizeFaceitWebhookPayload,
  updateFaceitWebhookLog,
} from "@/lib/faceitWebhookLog";
import type { FaceitWebhookPayload } from "@/lib/faceitTypes";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rateLimit";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookRateLimiter = createRateLimiter(30, 60_000);

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

  return false;
}

type SyncProofResult =
  | { found: false }
  | { found: true; tournamentMatchId: string };

async function syncProofForFaceitMatch(faceitMatchId: string): Promise<SyncProofResult> {
  // Only update if this FACEIT match ID is already linked to an Ascendra match.
  const existingMatch = await prisma.tournamentMatch.findUnique({
    where: { faceitMatchId },
    select: { id: true },
  });
  if (!existingMatch) return { found: false };

  let details: Awaited<ReturnType<typeof getFaceitMatchDetails>>;
  try {
    details = await getFaceitMatchDetails(faceitMatchId);
  } catch (err) {
    if (err instanceof FaceitApiError) throw err;
    throw err;
  }

  let stats: Awaited<ReturnType<typeof getFaceitMatchStats>>;
  try {
    stats = await getFaceitMatchStats(faceitMatchId);
  } catch (err) {
    // Stats may not be ready yet; propagate so caller can log failure.
    throw err;
  }

  if (!stats.rounds || stats.rounds.length === 0) return { found: true, tournamentMatchId: existingMatch.id };

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

  return { found: true, tournamentMatchId: existingMatch.id };
}

export async function POST(request: Request) {
  const limited = webhookRateLimiter(request);
  if (limited) return limited;

  if (!verifySecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const payload = raw as FaceitWebhookPayload;
  const eventType = extractFaceitWebhookEventType(raw) ?? payload.event ?? "unknown";
  const faceitMatchId = extractFaceitWebhookMatchId(raw) ?? payload.payload?.id;
  const sanitizedPayload = sanitizeFaceitWebhookPayload(raw);

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[faceit-webhook] event=${eventType} event_id=${payload.event_id ?? "-"}`,
    );
  }

  const logId = await createFaceitWebhookLog({
    eventType,
    faceitMatchId: typeof faceitMatchId === "string" ? faceitMatchId : null,
    status: "received",
    httpStatus: 200,
    payload: sanitizedPayload,
  });

  if (
    eventType === "match_status_finished" ||
    eventType === "match_demo_ready"
  ) {
    const matchId =
      typeof faceitMatchId === "string" && faceitMatchId.length > 0
        ? faceitMatchId
        : null;

    if (!matchId) {
      await updateFaceitWebhookLog(logId, {
        status: "skipped",
        reason: "no_faceit_match_id_in_payload",
      });
      return NextResponse.json({ ok: true, logged: true, status: "skipped" });
    }

    try {
      const result = await syncProofForFaceitMatch(matchId);
      if (result.found) {
        await updateFaceitWebhookLog(logId, {
          status: "processed",
          tournamentMatchId: result.tournamentMatchId,
          processedAt: new Date(),
        });
        return NextResponse.json({ ok: true, logged: true, status: "processed" });
      } else {
        await updateFaceitWebhookLog(logId, {
          status: "skipped",
          reason: "no_matching_tournament_match",
        });
        return NextResponse.json({ ok: true, logged: true, status: "skipped" });
      }
    } catch (err) {
      const reason =
        err instanceof Error ? err.message.slice(0, 200) : "unknown_error";
      await updateFaceitWebhookLog(logId, { status: "failed", reason });
      return NextResponse.json({ ok: true, logged: true, status: "failed" });
    }
  }

  // TODO (future): match_cancelled → mark TournamentMatch as cancelled if not yet confirmed.

  await updateFaceitWebhookLog(logId, {
    status: "skipped",
    reason: "unsupported_event",
  });
  return NextResponse.json({ ok: true });
}
