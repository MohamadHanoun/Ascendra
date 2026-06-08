/**
 * Channel/room helpers for the Ascendra realtime server (FOUNDATION ONLY).
 *
 * Pure string builders + a minimal "is this room joinable right now" gate.
 *
 * Current behaviour (dormant phase):
 *   - Only PUBLIC rooms are joinable, and only by explicit allow-list prefix.
 *   - Private/admin rooms are NOT joinable yet (no client-token ACL exists).
 *
 * FUTURE phases will enforce real ACLs using verified client tokens:
 *   - user:{userId}          -> only the matching authenticated user
 *   - notifications:{userId} -> only the matching authenticated user
 *   - profile:{userId}       -> only the matching authenticated user
 *   - team:{teamId}          -> only members of that team
 *   - admin / admin:*        -> only admins
 *
 * This mirrors lib/realtime/eventTypes.ts in the Next.js app. Kept as an
 * independent copy on purpose: the realtime server must not import app code.
 */

export const STATIC_CHANNELS = Object.freeze({
  LEADERBOARD: "leaderboard",
  ADMIN: "admin",
  ADMIN_QUEUE: "admin:queue",
});

export const channels = Object.freeze({
  tournament: (tournamentId) => `tournament:${tournamentId}`,
  match: (matchId) => `match:${matchId}`,
  user: (userId) => `user:${userId}`,
  notifications: (userId) => `notifications:${userId}`,
  profile: (userId) => `profile:${userId}`,
  team: (teamId) => `team:${teamId}`,
  leaderboard: () => STATIC_CHANNELS.LEADERBOARD,
  admin: () => STATIC_CHANNELS.ADMIN,
  adminTournament: (tournamentId) => `admin:tournament:${tournamentId}`,
  adminQueue: () => STATIC_CHANNELS.ADMIN_QUEUE,
});

// Prefixes/names that are safe for anonymous clients to join in this dormant
// phase. Everything else requires future token-based ACLs.
const PUBLIC_ROOM_PREFIXES = ["tournament:", "match:"];
const PUBLIC_ROOM_EXACT = new Set([STATIC_CHANNELS.LEADERBOARD]);

// Names that must NEVER be joinable without a verified token/ACL.
const PROTECTED_ROOM_PREFIXES = [
  "user:",
  "notifications:",
  "profile:",
  "team:",
  "admin",
];

export function isValidRoomName(room) {
  return typeof room === "string" && room.length > 0 && room.length <= 200;
}

export function isProtectedRoom(room) {
  return PROTECTED_ROOM_PREFIXES.some((prefix) => room.startsWith(prefix));
}

/**
 * Whether an anonymous (unauthenticated) client may join `room` right now.
 * Conservative by design: only explicit public rooms pass.
 */
export function isPubliclyJoinable(room) {
  if (!isValidRoomName(room)) {
    return false;
  }

  if (isProtectedRoom(room)) {
    return false;
  }

  if (PUBLIC_ROOM_EXACT.has(room)) {
    return true;
  }

  return PUBLIC_ROOM_PREFIXES.some((prefix) => room.startsWith(prefix));
}
