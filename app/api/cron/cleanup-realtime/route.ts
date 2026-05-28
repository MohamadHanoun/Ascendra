/**
 * Cron endpoint: /api/cron/cleanup-realtime
 *
 * Deletes RealtimeEvent rows older than 7 days to prevent unbounded table growth.
 * Runs independently of the bot heartbeat so cleanup works even when the bot is offline.
 *
 * Authentication
 * --------------
 * Every request must carry the CRON_SECRET in one of two ways:
 *   • Authorization: Bearer <secret>   (Vercel's recommended approach)
 *   • ?secret=<secret>                 (manual curl / debug)
 *
 * Vercel automatically adds Authorization: Bearer <CRON_SECRET> when it invokes
 * the endpoint; configure CRON_SECRET in your Vercel project environment variables.
 *
 * Schedule: once daily (see vercel.json — "0 3 * * *" = 03:00 UTC).
 * Hobby plan: minimum schedule is 1 hour; daily is supported on all plans.
 */

import { NextResponse } from "next/server";

import { verifyCronSecret } from "@/lib/cronAuth";
import { cleanupOldRealtimeEvents } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const deletedCount = await cleanupOldRealtimeEvents();

  return NextResponse.json({ ok: true, deletedCount });
}
