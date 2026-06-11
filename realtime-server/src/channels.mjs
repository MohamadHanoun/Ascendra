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
  // RC10: global tournament-list room (exact name, public, no wildcard).
  TOURNAMENTS: "tournaments",
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
  tournaments: () => STATIC_CHANNELS.TOURNAMENTS,
  admin: () => STATIC_CHANNELS.ADMIN,
  adminTournament: (tournamentId) => `admin:tournament:${tournamentId}`,
  adminQueue: () => STATIC_CHANNELS.ADMIN_QUEUE,
});

// Prefixes/names that are safe for anonymous clients to join in this dormant
// phase. Everything else requires future token-based ACLs.
const PUBLIC_ROOM_PREFIXES = ["tournament:", "match:"];
const PUBLIC_ROOM_EXACT = new Set([
  STATIC_CHANNELS.LEADERBOARD,
  STATIC_CHANNELS.TOURNAMENTS,
]);

// Names that must NEVER be joinable without a verified token/ACL.
const PROTECTED_ROOM_PREFIXES = [
  "user:",
  "notifications:",
  "profile:",
  "team:",
  "admin",
];

// Strict room-name rules (mirror the emit bridge: /^[a-zA-Z0-9:_-]+$/).
export const MAX_ROOM_NAME_LENGTH = 160;
const ROOM_NAME_PATTERN = /^[a-zA-Z0-9:_-]+$/;
// The ID segment after a prefix may not contain a colon (no nested rooms).
const ID_SEGMENT_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function isValidRoomName(room) {
  return (
    typeof room === "string" &&
    room.length > 0 &&
    room.length <= MAX_ROOM_NAME_LENGTH &&
    ROOM_NAME_PATTERN.test(room)
  );
}

// For prefixed public rooms, ensure the ID segment itself is a clean token
// (rejects e.g. "tournament:" with empty/colon-bearing IDs).
function hasValidIdSegment(room, prefix) {
  const id = room.slice(prefix.length);
  return ID_SEGMENT_PATTERN.test(id);
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

  return PUBLIC_ROOM_PREFIXES.some(
    (prefix) => room.startsWith(prefix) && hasValidIdSegment(room, prefix),
  );
}
