/**
 * Pure refresh-decision helper for the tournament-details realtime consumer
 * (Batch 2A; RC4 added tournament.status.updated; RC7 added
 * tournament.match.advanced — bracket progression affects the tournament
 * bracket/details, and the mapper already delivers public match events to the
 * parent tournament:{id} room). Decides whether a socket realtime event
 * should trigger a tournament-page `router.refresh()`. The event is only used
 * to match the mounted tournament — never as a data source for UI state — and
 * this never throws.
 */

const TOURNAMENT_DETAILS_REFRESH_TYPES = new Set([
  "tournament.result.updated",
  "tournament.bracket.generated",
  "tournament.status.updated",
  "tournament.match.advanced",
]);

export function shouldRefreshTournamentDetailsFromRealtimeEvent(
  event: unknown,
  tournamentId: string,
): boolean {
  if (
    !event ||
    typeof event !== "object" ||
    typeof tournamentId !== "string" ||
    tournamentId.length === 0
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
    !TOURNAMENT_DETAILS_REFRESH_TYPES.has(record.type)
  ) {
    return false;
  }

  if (record.entityId === tournamentId) {
    return true;
  }

  const payload = record.payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return (payload as Record<string, unknown>).tournamentId === tournamentId;
  }

  return false;
}
