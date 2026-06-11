/**
 * Room-join access control for the realtime server (Batch 1F).
 *
 * Decides whether a socket may join a given room, based on whether it presented
 * a valid client token (claims) and what that token explicitly authorizes.
 *
 * Rules:
 *  - PUBLIC rooms (leaderboard, tournaments, tournament:{id}, match:{id}) —
 *    anonymous OK.
 *  - PRIVATE rooms (user:/notifications:/profile:/team:) — require a valid token
 *    whose `rooms` array EXACTLY contains the requested room.
 *  - ADMIN rooms (admin, admin:*) — require a valid token with isAdmin === true
 *    AND the exact room in `rooms`.
 *  - Exact-room claims only: there is no wildcard/prefix escalation. team:{id}
 *    is therefore inaccessible until the token explicitly includes it.
 *
 * Assumes the caller already validated the room name (isValidRoomName).
 */

import { isPubliclyJoinable } from "./channels.mjs";

function isAdminRoom(room) {
  return room === "admin" || room.startsWith("admin:");
}

/**
 * @param {string} room
 * @param {{ sub:string, isAdmin:boolean, rooms:string[] } | null | undefined} claims
 * @returns {{ allowed: boolean, scope?: string, reason?: string }}
 */
export function canJoinRoom(room, claims) {
  // Public rooms: anonymous allowed.
  if (isPubliclyJoinable(room)) {
    return { allowed: true, scope: "public" };
  }

  // Everything else requires a valid token that explicitly claims this room.
  if (!claims || !Array.isArray(claims.rooms) || !claims.rooms.includes(room)) {
    return { allowed: false, reason: "forbidden" };
  }

  // Admin rooms additionally require the admin flag.
  if (isAdminRoom(room)) {
    if (claims.isAdmin === true) {
      return { allowed: true, scope: "admin" };
    }
    return { allowed: false, reason: "forbidden" };
  }

  // Private user-scoped room with an exact claim.
  return { allowed: true, scope: "private" };
}
