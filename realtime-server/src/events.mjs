/**
 * Event payload validation + broadcast for the Ascendra realtime server
 * (FOUNDATION ONLY).
 *
 * Validates the JSON body of POST /internal/events and fans it out to the
 * requested Socket.IO rooms. No secrets are logged. Payload contents are not
 * logged at info level.
 */

import { isValidRoomName } from "./channels.mjs";

// Client-facing Socket.IO event name. All server-pushed realtime events use
// this single channel; the `type` field inside the message describes what it is.
export const CLIENT_EVENT_NAME = "ascendra:event";

const MAX_ROOMS = 50;
const MAX_TYPE_LENGTH = 120;

function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Validate and normalise an inbound internal event body.
 * Returns { ok: true, event } or { ok: false, error }.
 */
export function validateEventBody(body) {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Body must be a JSON object." };
  }

  const { type, rooms, payload, audience, entityType, entityId } = body;

  if (typeof type !== "string" || type.trim().length === 0) {
    return { ok: false, error: "`type` must be a non-empty string." };
  }

  if (type.length > MAX_TYPE_LENGTH) {
    return { ok: false, error: "`type` is too long." };
  }

  if (!Array.isArray(rooms)) {
    return { ok: false, error: "`rooms` must be an array of strings." };
  }

  if (rooms.length === 0) {
    return { ok: false, error: "`rooms` must not be empty." };
  }

  if (rooms.length > MAX_ROOMS) {
    return { ok: false, error: "`rooms` has too many entries." };
  }

  if (!rooms.every((room) => isValidRoomName(room))) {
    return { ok: false, error: "`rooms` must be valid room names." };
  }

  if (payload !== undefined && !isPlainObject(payload)) {
    return { ok: false, error: "`payload` must be an object when provided." };
  }

  if (audience !== undefined && typeof audience !== "string") {
    return { ok: false, error: "`audience` must be a string when provided." };
  }

  if (entityType !== undefined && typeof entityType !== "string") {
    return { ok: false, error: "`entityType` must be a string when provided." };
  }

  if (entityId !== undefined && typeof entityId !== "string") {
    return { ok: false, error: "`entityId` must be a string when provided." };
  }

  return {
    ok: true,
    event: {
      type: type.trim(),
      rooms: Array.from(new Set(rooms)),
      payload: payload ?? {},
      audience: audience ?? null,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
    },
  };
}

/**
 * Build the message object delivered to clients. Mirrors the RealtimeEvent
 * shape the app already uses, minus internal-only routing (`rooms`).
 */
export function buildClientMessage(event) {
  return {
    type: event.type,
    audience: event.audience,
    entityType: event.entityType,
    entityId: event.entityId,
    payload: event.payload,
    at: new Date().toISOString(),
  };
}

/**
 * Broadcast a validated event to each of its rooms.
 * Returns the number of rooms targeted.
 */
export function broadcastEvent(io, event) {
  const message = buildClientMessage(event);

  for (const room of event.rooms) {
    io.to(room).emit(CLIENT_EVENT_NAME, message);
  }

  return event.rooms.length;
}
