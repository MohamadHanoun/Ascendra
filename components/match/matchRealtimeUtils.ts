/**
 * Pure refresh-decision helper for the match-page realtime consumer
 * (Batch 5A — RC5; RC6/Batch 6A added tournament.match.confirmed). Decides
 * whether a socket realtime event should trigger a match-page
 * `router.refresh()`. The event is only used to match the mounted match —
 * never as a data source for UI state — and this never throws.
 */

const MATCH_REFRESH_TYPES = new Set([
  "tournament.match.report_submitted",
  "tournament.match.confirmed",
]);

export function shouldRefreshMatchFromRealtimeEvent(
  event: unknown,
  matchId: string,
): boolean {
  if (
    !event ||
    typeof event !== "object" ||
    typeof matchId !== "string" ||
    matchId.length === 0
  ) {
    return false;
  }

  const record = event as {
    type?: unknown;
    entityId?: unknown;
    payload?: unknown;
  };

  if (
    typeof record.type !== "string" ||
    !MATCH_REFRESH_TYPES.has(record.type)
  ) {
    return false;
  }

  if (record.entityId === matchId) {
    return true;
  }

  const payload = record.payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return (payload as Record<string, unknown>).matchId === matchId;
  }

  return false;
}
