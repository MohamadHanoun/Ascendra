/**
 * Cron endpoint: /api/cron/sync-matches
 *
 * Runs the bounded catch-up jobs:
 *   1. syncPendingMatches      – pulls fresh results from provider APIs
 *   2. syncPendingGameRooms    – re-notifies players about room details
 *   3. retryFailedWebhookEvents – replays failed webhook events
 *   4. syncTournamentLifecycle - updates tournament lifecycle statuses
 *
 * Authentication
 * --------------
 * Every request must carry the CRON_SECRET in one of two ways:
 *   • Authorization: Bearer <secret>   (Vercel's recommended approach)
 *   • ?secret=<secret>                 (manual curl / debug)
 *
 * Vercel.json example (Pro plan – 1 min minimum):
 * {
 *   "crons": [{ "path": "/api/cron/sync-matches", "schedule": "0 * * * *" }]
 * }
 * Vercel automatically adds Authorization: Bearer <CRON_SECRET> when it
 * invokes the endpoint; configure CRON_SECRET in your project environment.
 *
 * Hobby plan: minimum schedule is 1 hour ("0 * * * *"), not 1 minute.
 */

import crypto from "node:crypto";

import { NextResponse } from "next/server";

import {
  retryFailedWebhookEvents,
  syncPendingGameRooms,
  syncPendingMatches,
} from "@/lib/jobs/matchSyncJobs";
import { syncTournamentLifecycle } from "@/lib/jobs/tournamentLifecycleJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Auth ─────────────────────────────────────────────────────────────────────

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  // Fail closed if not configured. Host header is client-controlled and
  // cannot be trusted, so we never fall back to a host-based allowlist.
  if (!secret) return false;

  // Authorization: Bearer <secret> (Vercel cron / production path)
  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader && safeEqual(authHeader, `Bearer ${secret}`)) return true;

  // ?secret=<secret> (manual curl / debug). Constant-time compare.
  const url = new URL(request.url);
  const queryValue = url.searchParams.get("secret");
  if (queryValue && safeEqual(queryValue, secret)) return true;

  return false;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handleSync(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  // Allow running individual jobs via ?job=<name> for manual testing.
  const jobFilter = url.searchParams.get("job");

  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  if (!jobFilter || jobFilter === "syncPendingMatches") {
    try {
      results.syncPendingMatches = await syncPendingMatches();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unexpected_error";
      errors.push(`syncPendingMatches: ${msg}`);
      results.syncPendingMatches = { ok: false, error: msg };
    }
  }

  if (!jobFilter || jobFilter === "syncPendingGameRooms") {
    try {
      results.syncPendingGameRooms = await syncPendingGameRooms();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unexpected_error";
      errors.push(`syncPendingGameRooms: ${msg}`);
      results.syncPendingGameRooms = { ok: false, error: msg };
    }
  }

  if (!jobFilter || jobFilter === "retryFailedWebhookEvents") {
    try {
      results.retryFailedWebhookEvents = await retryFailedWebhookEvents();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unexpected_error";
      errors.push(`retryFailedWebhookEvents: ${msg}`);
      results.retryFailedWebhookEvents = { ok: false, error: msg };
    }
  }

  if (!jobFilter || jobFilter === "syncTournamentLifecycle") {
    try {
      results.syncTournamentLifecycle = await syncTournamentLifecycle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unexpected_error";
      errors.push(`syncTournamentLifecycle: ${msg}`);
      results.syncTournamentLifecycle = { ok: false, error: msg };
    }
  }

  const overallOk = errors.length === 0;
  return NextResponse.json(
    { ok: overallOk, errors: overallOk ? undefined : errors, jobs: results },
    { status: overallOk ? 200 : 207 },
  );
}

export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}
