// Server-only: FACEIT webhook event logging helpers.
// Pure extraction/sanitization functions are exported for unit tests.

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// ─── Extraction ───────────────────────────────────────────────────────────────

/**
 * Extracts the event type from a FACEIT webhook payload.
 * Tries common field names across known payload shapes.
 */
export function extractFaceitWebhookEventType(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const p = payload as Record<string, unknown>;
  const inner =
    p.payload && typeof p.payload === "object" && !Array.isArray(p.payload)
      ? (p.payload as Record<string, unknown>)
      : null;

  const candidates: unknown[] = [
    p.event,
    p.event_type,
    p.type,
    inner?.event,
    inner?.type,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  return null;
}

/**
 * Extracts the FACEIT match ID from a webhook payload.
 * Tries common field names across known payload shapes.
 */
export function extractFaceitWebhookMatchId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const p = payload as Record<string, unknown>;
  const inner =
    p.payload && typeof p.payload === "object" && !Array.isArray(p.payload)
      ? (p.payload as Record<string, unknown>)
      : null;

  const candidates: unknown[] = [
    inner?.match_id,
    inner?.id,
    p.match_id,
    p.id,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  return null;
}

// ─── Sanitization ─────────────────────────────────────────────────────────────

const SENSITIVE_KEY_PATTERNS = [
  "secret",
  "authorization",
  "token",
  "password",
  "key",
  "api_key",
];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((p) => lower.includes(p));
}

export type SafeJsonValue =
  | string
  | number
  | boolean
  | null
  | SafeJsonValue[]
  | { [key: string]: SafeJsonValue };

/**
 * Recursively sanitizes a FACEIT webhook payload for safe DB storage.
 * Removes any fields whose names contain sensitive keywords.
 * Limits string values to 500 chars. Max recursion depth: 4.
 */
export function sanitizeFaceitWebhookPayload(
  payload: unknown,
  depth = 0,
): SafeJsonValue {
  if (payload === null || payload === undefined) return null;

  if (typeof payload === "string") {
    return payload.slice(0, 500);
  }

  if (typeof payload === "number" || typeof payload === "boolean") {
    return payload;
  }

  if (Array.isArray(payload)) {
    if (depth >= 4) return [];
    return payload
      .slice(0, 20)
      .map((item) => sanitizeFaceitWebhookPayload(item, depth + 1));
  }

  if (typeof payload === "object") {
    if (depth >= 4) return {};
    const result: { [key: string]: SafeJsonValue } = {};
    for (const [key, value] of Object.entries(
      payload as Record<string, unknown>,
    )) {
      if (isSensitiveKey(key)) continue;
      result[key] = sanitizeFaceitWebhookPayload(value, depth + 1);
    }
    return result;
  }

  return String(payload).slice(0, 500);
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

type CreateLogInput = {
  eventType?: string | null;
  faceitMatchId?: string | null;
  status: string;
  httpStatus?: number | null;
  payload?: SafeJsonValue;
};

export async function createFaceitWebhookLog(
  input: CreateLogInput,
): Promise<string> {
  try {
    const log = await prisma.faceitWebhookLog.create({
      data: {
        eventType: input.eventType ?? null,
        faceitMatchId: input.faceitMatchId ?? null,
        status: input.status,
        httpStatus: input.httpStatus ?? null,
        payload:
          input.payload !== undefined
            ? (input.payload as Prisma.InputJsonValue)
            : Prisma.JsonNull,
      },
      select: { id: true },
    });
    return log.id;
  } catch {
    // Logging must never break the webhook response.
    return "";
  }
}

type UpdateLogPatch = {
  status?: string;
  reason?: string | null;
  tournamentMatchId?: string | null;
  processedAt?: Date | null;
};

export async function updateFaceitWebhookLog(
  id: string,
  patch: UpdateLogPatch,
): Promise<void> {
  if (!id) return;
  await prisma.faceitWebhookLog
    .update({ where: { id }, data: patch })
    .catch(() => undefined);
}
