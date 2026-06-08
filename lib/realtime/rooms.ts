/**
 * Realtime room mapper (Batch 1C — DORMANT FOUNDATION).
 *
 * Decides which realtime rooms an event should be delivered to. It is NOT wired
 * into any emitter yet — the DB-polling realtime system is unchanged.
 *
 * Security model:
 *  - Room names are derived ONLY from known, validated event fields.
 *  - Rooms are NEVER taken from caller payload (`payload.rooms` is ignored).
 *  - Every returned room is validated against the same strict pattern used by
 *    the emit bridge, deduped, and capped.
 *  - The mapper decides ROOMS only. Payload safety is handled separately by
 *    sanitizeRealtimePayload (lib/realtime/payload.ts).
 *  - Audience drives public vs admin routing so admin-only events never land in
 *    public rooms.
 */

import {
  REALTIME_AUDIENCES,
  REALTIME_ENTITY_TYPES,
  REALTIME_STATIC_CHANNELS,
  realtimeChannels,
} from "@/lib/realtime/eventTypes";

const MAX_ROOMS = 20;
const MAX_ROOM_LENGTH = 160;

// Room names: letters, digits, colon, underscore, hyphen only (matches the emit
// bridge validation in lib/realtime/emitRealtimeEvent.ts).
const ROOM_PATTERN = /^[a-zA-Z0-9:_-]+$/;
// IDs used to build rooms: no colon (avoids accidental room nesting).
const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_ID_LENGTH = 120;

// entityId placeholders used by current emitters that are NOT real entity IDs.
const RESERVED_NON_IDS = new Set([
  "results",
  "team",
  "global",
  "notification",
]);

function isValidId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_ID_LENGTH &&
    ID_PATTERN.test(value) &&
    !RESERVED_NON_IDS.has(value)
  );
}

// Discord IDs are numeric snowflakes; never use them to build user rooms.
function isSafeUserId(value: unknown): value is string {
  return isValidId(value) && !/^\d{17,20}$/.test(value);
}

function getString(
  payload: Record<string, unknown>,
  key: string,
): string | null {
  const value = payload[key];
  return typeof value === "string" ? value : null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type MapRealtimeRoomsInput = {
  type: string;
  audience?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: Record<string, unknown> | null;
};

/**
 * Map an event to a unique, validated set of realtime room names.
 * Never throws. Returns [] when no safe room applies.
 */
export function mapRealtimeEventToRooms(
  input: MapRealtimeRoomsInput,
): string[] {
  try {
    const type = typeof input?.type === "string" ? input.type : "";
    if (!type) {
      return [];
    }

    const audience = input?.audience ?? null;
    const isAdmin = audience === REALTIME_AUDIENCES.ADMIN;
    const entityType = input?.entityType ?? null;
    const entityId = input?.entityId ?? null;
    const payload =
      input?.payload && typeof input.payload === "object" && !Array.isArray(input.payload)
        ? (input.payload as Record<string, unknown>)
        : {};

    const rooms: string[] = [];
    const add = (room: string | null | undefined) => {
      if (
        typeof room === "string" &&
        room.length > 0 &&
        room.length <= MAX_ROOM_LENGTH &&
        ROOM_PATTERN.test(room) &&
        !rooms.includes(room) &&
        rooms.length < MAX_ROOMS
      ) {
        rooms.push(room);
      }
    };

    // Candidate IDs, derived from payload first, then entityId by entityType.
    const tournamentId =
      getString(payload, "tournamentId") ??
      (entityType === REALTIME_ENTITY_TYPES.TOURNAMENT ? entityId : null);
    const matchId =
      getString(payload, "matchId") ??
      (entityType === REALTIME_ENTITY_TYPES.TOURNAMENT_MATCH ? entityId : null);
    const teamId =
      getString(payload, "teamId") ??
      (entityType === REALTIME_ENTITY_TYPES.TEAM ? entityId : null);
    const userId =
      getString(payload, "userId") ??
      (entityType === REALTIME_ENTITY_TYPES.PROFILE ? entityId : null);

    // 1) Leaderboard.
    if (
      type === "leaderboard.updated" ||
      entityType === REALTIME_ENTITY_TYPES.LEADERBOARD
    ) {
      add(realtimeChannels.leaderboard());
      return rooms;
    }

    // 2) Notifications — private user room only; never public.
    if (type.startsWith("notification.")) {
      if (isSafeUserId(userId)) {
        add(realtimeChannels.notifications(userId));
      }
      return rooms;
    }

    // 3) Match events.
    if (type.startsWith("tournament.match.")) {
      if (isAdmin) {
        if (isValidId(tournamentId)) {
          add(realtimeChannels.adminTournament(tournamentId));
        } else {
          add(realtimeChannels.admin());
        }
        return rooms;
      }
      if (isValidId(matchId)) {
        add(realtimeChannels.match(matchId));
      }
      if (isValidId(tournamentId)) {
        add(realtimeChannels.tournament(tournamentId));
      }
      return rooms;
    }

    // 4) Other tournament events.
    if (type.startsWith("tournament.")) {
      if (isAdmin) {
        add(realtimeChannels.admin());
        return rooms;
      }
      if (isValidId(tournamentId)) {
        add(realtimeChannels.tournament(tournamentId));
      }
      return rooms;
    }

    // 5) Registration events.
    if (type.startsWith("registration.")) {
      if (isAdmin) {
        add(realtimeChannels.admin());
        return rooms;
      }
      if (isValidId(tournamentId)) {
        add(realtimeChannels.tournament(tournamentId));
      }
      return rooms;
    }

    // 6) Profile events — private user room.
    if (type.startsWith("profile.")) {
      if (isSafeUserId(userId)) {
        add(realtimeChannels.profile(userId));
      }
      return rooms;
    }

    // 7) Team events — team room.
    if (type.startsWith("team.")) {
      if (isValidId(teamId)) {
        add(realtimeChannels.team(teamId));
      } else if (isAdmin) {
        add(realtimeChannels.admin());
      }
      return rooms;
    }

    // 8) Bot / slash-command events — admin only.
    if (type.startsWith("bot.") || type.startsWith("slashCommand.")) {
      if (isAdmin) {
        add(realtimeChannels.admin());
      }
      return rooms;
    }

    // 9) Unknown events — fall back to a safe entity-based mapping.
    if (entityType === REALTIME_ENTITY_TYPES.TOURNAMENT && isValidId(tournamentId)) {
      add(realtimeChannels.tournament(tournamentId));
    } else if (
      entityType === REALTIME_ENTITY_TYPES.TOURNAMENT_MATCH &&
      isValidId(matchId)
    ) {
      add(realtimeChannels.match(matchId));
    } else if (entityType === REALTIME_ENTITY_TYPES.TEAM && isValidId(teamId)) {
      add(realtimeChannels.team(teamId));
    } else if (
      entityType === REALTIME_ENTITY_TYPES.PROFILE &&
      isSafeUserId(userId)
    ) {
      add(realtimeChannels.profile(userId));
    }

    if (rooms.length === 0 && isAdmin) {
      add(REALTIME_STATIC_CHANNELS.ADMIN);
    }

    return rooms;
  } catch {
    return [];
  }
}
