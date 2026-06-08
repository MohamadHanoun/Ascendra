import "server-only";

import {
  emitRealtimeEventToServer,
  type EmitRealtimeResult,
} from "@/lib/realtime/emitRealtimeEvent";
import { sanitizeRealtimePayload } from "@/lib/realtime/payload";
import { mapRealtimeEventToRooms } from "@/lib/realtime/rooms";

/**
 * Unified realtime dispatch helper (Batch 1D — DORMANT FOUNDATION).
 *
 * Composes the three building blocks in a single safe call:
 *   1. mapRealtimeEventToRooms(...)   — decide safe rooms (never from payload)
 *   2. sanitizeRealtimePayload(...)   — strip sensitive data; public = ID-only
 *   3. emitRealtimeEventToServer(...) — HMAC-signed bridge (env-gated, dormant)
 *
 * IMPORTANT — this is dormant and intentionally NOT wired anywhere:
 *  - No existing emitter calls it. The DB-polling realtime system is unchanged.
 *  - Server-only (`import "server-only"`); never reaches the browser.
 *  - Never throws. Never logs secrets or full payloads.
 *  - Does not touch Prisma, lib/realtime.ts, createRealtimeEvent, or the bot.
 */

export type DispatchRealtimeInput = {
  type: string;
  audience?: string | null;
  entityType?: string | null;
  entityId?: string | null;
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
 * Fire-and-forget variant for future call sites. Swallows all errors and never
 * throws. NOT used anywhere in this batch.
 */
export function dispatchRealtimeEventSoon(input: DispatchRealtimeInput): void {
  void dispatchRealtimeEvent(input).catch(() => {
    // Intentionally ignored — dispatch never throws, but guard regardless.
  });
}
