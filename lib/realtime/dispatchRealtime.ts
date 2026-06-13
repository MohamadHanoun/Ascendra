import "server-only";

import { after } from "next/server";

import {
  emitRealtimeEventToServer,
  type EmitRealtimeResult,
} from "@/lib/realtime/emitRealtimeEvent";
import { sanitizeRealtimePayload } from "@/lib/realtime/payload";
import { mapRealtimeEventToRooms } from "@/lib/realtime/rooms";

/**
 * Unified realtime dispatch helper (Batch 1D foundation; Batch 1R wired the
 * single leaderboard pilot; RC1 hardening made the fire-and-forget variant
 * serverless-safe via Next.js `after()`).
 *
 * Composes the three building blocks in a single safe call:
 *   1. mapRealtimeEventToRooms(...)   — decide safe rooms (never from payload)
 *   2. sanitizeRealtimePayload(...)   — strip sensitive data; public = ID-only
 *   3. emitRealtimeEventToServer(...) — HMAC-signed bridge (env-gated)
 *
 * IMPORTANT
 *  - The ONLY wired emitter is the `leaderboard.updated` pilot in
 *    lib/tournamentResults.ts (enforced by the guardrails, the expansion gate,
 *    and the RC baseline check). The DB-polling realtime system is unchanged.
 *  - Server-only (`import "server-only"`); never reaches the browser.
 *  - Never throws. Never logs secrets or full payloads.
 *  - Does not touch Prisma, lib/realtime.ts, createRealtimeEvent, or the bot.
 */

export type DispatchRealtimeInput = {
  type: string;
  audience?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  /** Internal routing target for private user-scoped rooms; never emitted. */
  targetUserId?: string | null;
  payload?: Record<string, unknown> | null;
};

export type DispatchRealtimeResult = EmitRealtimeResult & {
  rooms?: string[];
};

/**
 * Map → sanitize → send. Always resolves with a structured result.
 */
export async function dispatchRealtimeEvent(
  input: DispatchRealtimeInput,
): Promise<DispatchRealtimeResult> {
  try {
    // 1) Rooms are derived only from validated event fields.
    const rooms = mapRealtimeEventToRooms({
      type: input?.type,
      audience: input?.audience,
      entityType: input?.entityType,
      entityId: input?.entityId,
      targetUserId: input?.targetUserId,
      payload: input?.payload,
    });

    if (rooms.length === 0) {
      return { ok: false, skipped: true, reason: "no_safe_rooms", rooms: [] };
    }

    // 2) Sanitize payload (public = ID-only; secrets always stripped).
    const payload = sanitizeRealtimePayload({
      type: input?.type,
      audience: input?.audience,
      entityType: input?.entityType,
      entityId: input?.entityId,
      payload: input?.payload,
    });

    // 3) Send via the env-gated HMAC bridge.
    const result = await emitRealtimeEventToServer({
      type: input?.type,
      rooms,
      payload,
      audience: input?.audience ?? undefined,
      entityType: input?.entityType ?? null,
      entityId: input?.entityId ?? null,
    });

    return { ...result, rooms };
  } catch {
    // Last-resort guard: never throw, never leak raw error details.
    return { ok: false, skipped: true, reason: "dispatch_error" };
  }
}

/**
 * Fire-and-forget variant for server actions / route handlers.
 *
 * On serverless (Vercel), a merely un-awaited promise can be killed when the
 * function instance is frozen right after the response is sent — silently
 * dropping the emit. `after()` runs the dispatch once the response has been
 * sent and keeps the instance alive until it settles, without blocking or
 * ever failing the caller's mutation.
 *
 * Outside a Next.js request scope (unit tests, scripts) `after()` throws
 * synchronously; we then degrade to the best-effort void dispatch. This
 * function never throws either way.
 */
export function dispatchRealtimeEventSoon(input: DispatchRealtimeInput): void {
  // Kill-switch early-out: schedule nothing at all while realtime is disabled
  // (mirrors the bridge's own enablement gate).
  if (process.env.REALTIME_ENABLE_SOCKET !== "true") {
    return;
  }

  const run = async (): Promise<void> => {
    await dispatchRealtimeEvent(input).catch(() => {
      // dispatchRealtimeEvent never throws, but guard regardless.
    });
  };

  try {
    after(run);
  } catch {
    void run();
  }
}
