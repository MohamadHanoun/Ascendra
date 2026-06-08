/**
 * Pure refresh-decision helper for the leaderboard realtime consumer (Batch 1S).
 *
 * Decides whether a realtime event (from polling OR socket) should trigger a
 * leaderboard `router.refresh()`. It only inspects the event TYPE — the payload
 * is never trusted for data — and never throws.
 */

const LEADERBOARD_REFRESH_TYPES = new Set([
  "leaderboard.updated",
  "tournament.result.updated",
]);

export function shouldRefreshLeaderboardFromRealtimeEvent(
  event: unknown,
): boolean {
  if (!event || typeof event !== "object") {
    return false;
  }
  const type = (event as { type?: unknown }).type;
  return typeof type === "string" && LEADERBOARD_REFRESH_TYPES.has(type);
}
