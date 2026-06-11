/**
 * Pure refresh-decision helper for the tournaments-list realtime consumer
 * (Batch 10A → RC10). Decides whether a socket realtime event should trigger
 * a tournament-list `router.refresh()`. The event is only used as a refresh
 * signal — never as a data source for UI state — and this never throws.
 */

const TOURNAMENTS_LIST_REFRESH_TYPES = new Set(["tournaments.updated"]);

export function shouldRefreshTournamentsListFromRealtimeEvent(
  event: unknown,
): boolean {
  if (!event || typeof event !== "object") {
    return false;
  }

  const record = event as { type?: unknown };

  return (
    typeof record.type === "string" &&
    TOURNAMENTS_LIST_REFRESH_TYPES.has(record.type)
  );
}
