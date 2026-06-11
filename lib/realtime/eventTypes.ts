/**
 * Realtime event-name registry (FOUNDATION ONLY).
 *
 * Batch 1A — Realtime Foundation / Dormant Server Skeleton.
 *
 * Purpose
 * -------
 * This file is a central, read-only catalogue of the realtime event names,
 * audiences, entity types, and (future) channel names used across the app.
 *
 * IMPORTANT
 * ---------
 * - This is a registry/foundation only. It is NOT yet wired into the runtime.
 * - Do NOT refactor existing emitters/listeners to import these constants in
 *   this batch. Existing string literals stay exactly as they are.
 * - Do NOT change any current event names. The values here mirror the strings
 *   already used in the codebase so that future phases can migrate safely.
 * - The current realtime system (DB-backed polling via `RealtimeEvent` +
 *   `/api/realtime/events`) remains the single source of truth for now.
 *
 * Pure constants/types only. No external dependencies. No side effects.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Audiences
//
// The current system supports exactly two audiences on the RealtimeEvent table.
// ─────────────────────────────────────────────────────────────────────────────

export const REALTIME_AUDIENCES = {
  PUBLIC: "public",
  ADMIN: "admin",
} as const;

export type RealtimeAudience =
  (typeof REALTIME_AUDIENCES)[keyof typeof REALTIME_AUDIENCES];

// ─────────────────────────────────────────────────────────────────────────────
// Entity types
//
// Mirrors the `entityType` values passed to createRealtimeEvent today.
// ─────────────────────────────────────────────────────────────────────────────

export const REALTIME_ENTITY_TYPES = {
  TOURNAMENT: "tournament",
  TOURNAMENT_MATCH: "tournamentMatch",
  REGISTRATION: "registration",
  NOTIFICATION: "notification",
  LEADERBOARD: "leaderboard",
  PROFILE: "profile",
  TEAM: "team",
  BOT: "bot",
} as const;

export type RealtimeEntityType =
  (typeof REALTIME_ENTITY_TYPES)[keyof typeof REALTIME_ENTITY_TYPES];

// ─────────────────────────────────────────────────────────────────────────────
// Event types
//
// Grouped by domain for readability. Every value below corresponds to a string
// literal that already exists in the codebase (emitter and/or listener).
// Grouping is cosmetic; the canonical flat list is REALTIME_EVENT_TYPES.
// ─────────────────────────────────────────────────────────────────────────────

export const NOTIFICATION_EVENT_TYPES = {
  NOTIFICATION_CREATED: "notification.created",
  NOTIFICATION_UPDATED: "notification.updated",
} as const;

export const TOURNAMENT_EVENT_TYPES = {
  // Global tournament-list change signal (RC10) — list surfaces only.
  TOURNAMENTS_UPDATED: "tournaments.updated",
  TOURNAMENT_UPDATED: "tournament.updated",
  TOURNAMENT_DELETED: "tournament.deleted",
  TOURNAMENT_STATUS_UPDATED: "tournament.status.updated",
  TOURNAMENT_REGISTRATION_STATUS_UPDATED:
    "tournament.registrationStatus.updated",
  TOURNAMENT_REGISTRATION_UPDATED: "tournament.registration.updated",
  TOURNAMENT_BRACKET_GENERATED: "tournament.bracket.generated",
  TOURNAMENT_RESULT_UPDATED: "tournament.result.updated",
} as const;

export const TOURNAMENT_DISCORD_ANNOUNCEMENT_EVENT_TYPES = {
  TOURNAMENT_DISCORD_ANNOUNCEMENT_SYNCED: "tournament.discordAnnouncement.synced",
  TOURNAMENT_DISCORD_ANNOUNCEMENT_FAILED: "tournament.discordAnnouncement.failed",
  TOURNAMENT_DISCORD_ANNOUNCEMENT_DELETED:
    "tournament.discordAnnouncement.deleted",
} as const;

export const MATCH_EVENT_TYPES = {
  MATCH_REPORT_SUBMITTED: "tournament.match.report_submitted",
  MATCH_CONFIRMED: "tournament.match.confirmed",
  MATCH_DISPUTED: "tournament.match.disputed",
  MATCH_GAME_COMPLETED: "tournament.match.game_completed",
  MATCH_ADVANCED: "tournament.match.advanced",
  MATCH_ROOM_LINKED: "tournament.match.room_linked",
  MATCH_COMMUNICATION_UPDATED: "tournament.match.communication_updated",
  MATCH_CHECKIN_UPDATED: "tournament.match.checkin_updated",
  MATCH_PROOF_SYNCED: "tournament.match.proof_synced",
} as const;

export const LEADERBOARD_EVENT_TYPES = {
  LEADERBOARD_UPDATED: "leaderboard.updated",
} as const;

export const PROFILE_EVENT_TYPES = {
  PROFILE_UPDATED: "profile.updated",
} as const;

export const REGISTRATION_EVENT_TYPES = {
  REGISTRATION_APPROVED: "registration.approved",
  REGISTRATION_REJECTED: "registration.rejected",
  REGISTRATION_CANCELLED: "registration.cancelled",
  REGISTRATION_REGISTERED: "registration.registered",
  REGISTRATION_SUBMITTED: "registration.submitted",
  REGISTRATION_DISCORD_SYNC_QUEUED: "registration.discordSync.queued",
  REGISTRATION_DISCORD_REMOVE_QUEUED: "registration.discordRemove.queued",
} as const;

export const TEAM_EVENT_TYPES = {
  TEAM_CREATED: "team.created",
  TEAM_UPDATED: "team.updated",
  TEAM_DELETED: "team.deleted",
  TEAM_APPROVED: "team.approved",
  TEAM_REJECTED: "team.rejected",
  TEAM_ACTIVE: "team.active",
  TEAM_SUBMITTED: "team.submitted",
  TEAM_INVITE_CREATED: "team.invite.created",
  TEAM_INVITE_CANCELLED: "team.invite.cancelled",
  TEAM_INVITE_ACCEPTED: "team.invite.accepted",
  TEAM_INVITE_REJECTED: "team.invite.rejected",
  TEAM_MEMBER_REMOVED: "team.member.removed",
  TEAM_MEMBER_LEFT: "team.member.left",
  TEAM_LEADER_TRANSFERRED: "team.leader.transferred",
} as const;

/**
 * Listener-only team event names.
 *
 * These appear in client listener allow-lists (e.g. ProfileRealtime,
 * AdminRegistrationsRealtime) but do not currently have a confirmed emitter.
 * They are catalogued here for completeness so future phases can decide whether
 * to wire emitters or remove the listeners. Do NOT treat their presence here as
 * an instruction to add emitters in this batch.
 */
export const TEAM_LISTENER_ONLY_EVENT_TYPES = {
  TEAM_MEMBER_UPDATED: "team.member.updated",
  TEAM_MEMBER_ADDED: "team.member.added",
  TEAM_INVITE_UPDATED: "team.invite.updated",
} as const;

export const BOT_EVENT_TYPES = {
  BOT_HEARTBEAT: "bot.heartbeat",
  BOT_EVENT_UPDATED: "bot.event.updated",
  BOT_COMMAND_QUEUED: "bot.command.queued",
  BOT_EVENTS_LOCKED: "bot.events.locked",
  BOT_EVENTS_RECOVERED: "bot.events.recovered",
  BOT_EVENTS_FAILED: "bot.events.failed",
  BOT_EVENTS_PROCESSING_RESET: "bot.events.processing.reset",
  BOT_EVENTS_PENDING_CANCELLED: "bot.events.pending.cancelled",
  BOT_EVENTS_CLEANED: "bot.events.cleaned",
  BOT_QUEUE_PAUSED: "bot.queue.paused",
  BOT_QUEUE_RESUMED: "bot.queue.resumed",
  BOT_MAINTENANCE_CLEANED: "bot.maintenance.cleaned",
} as const;

export const SLASH_COMMAND_EVENT_TYPES = {
  SLASH_COMMAND_USED: "slashCommand.used",
  SLASH_COMMAND_FAILED: "slashCommand.failed",
  SLASH_COMMAND_LOGS_CLEANED: "slashCommand.logs.cleaned",
} as const;

/**
 * Canonical flat registry of all realtime event names.
 *
 * Combines every grouped object above into one frozen lookup. Use this as the
 * single import surface in future phases.
 */
export const REALTIME_EVENT_TYPES = {
  ...NOTIFICATION_EVENT_TYPES,
  ...TOURNAMENT_EVENT_TYPES,
  ...TOURNAMENT_DISCORD_ANNOUNCEMENT_EVENT_TYPES,
  ...MATCH_EVENT_TYPES,
  ...LEADERBOARD_EVENT_TYPES,
  ...PROFILE_EVENT_TYPES,
  ...REGISTRATION_EVENT_TYPES,
  ...TEAM_EVENT_TYPES,
  ...TEAM_LISTENER_ONLY_EVENT_TYPES,
  ...BOT_EVENT_TYPES,
  ...SLASH_COMMAND_EVENT_TYPES,
} as const;

export type RealtimeEventType =
  (typeof REALTIME_EVENT_TYPES)[keyof typeof REALTIME_EVENT_TYPES];

// ─────────────────────────────────────────────────────────────────────────────
// Channels (FUTURE — names/helpers only, no runtime logic)
//
// These describe the room/channel model the future Hetzner Socket.IO server
// will use. They are NOT used by the current polling system. They exist only so
// emitters and clients can converge on a single naming scheme later.
//
// Security note for future phases (not enforced here):
//   - user:{userId}, notifications:{userId}, profile:{userId} are PRIVATE rooms.
//   - team:{teamId} is restricted to team members.
//   - admin / admin:tournament:{id} / admin:queue are admin-only rooms.
//   - tournament:{id}, match:{id}, leaderboard, tournaments are public rooms
//     and must only ever carry minimal, non-sensitive payloads.
// ─────────────────────────────────────────────────────────────────────────────

/** Static (non-parameterised) channel names. */
export const REALTIME_STATIC_CHANNELS = {
  LEADERBOARD: "leaderboard",
  TOURNAMENTS: "tournaments",
  ADMIN: "admin",
  ADMIN_QUEUE: "admin:queue",
} as const;

export type RealtimeStaticChannel =
  (typeof REALTIME_STATIC_CHANNELS)[keyof typeof REALTIME_STATIC_CHANNELS];

/**
 * Pure channel-name builders (no side effects, no I/O).
 * Future phases will use these to construct room names consistently.
 */
export const realtimeChannels = {
  tournament: (tournamentId: string) => `tournament:${tournamentId}` as const,
  match: (matchId: string) => `match:${matchId}` as const,
  user: (userId: string) => `user:${userId}` as const,
  notifications: (userId: string) => `notifications:${userId}` as const,
  profile: (userId: string) => `profile:${userId}` as const,
  team: (teamId: string) => `team:${teamId}` as const,
  leaderboard: () => REALTIME_STATIC_CHANNELS.LEADERBOARD,
  tournaments: () => REALTIME_STATIC_CHANNELS.TOURNAMENTS,
  admin: () => REALTIME_STATIC_CHANNELS.ADMIN,
  adminTournament: (tournamentId: string) =>
    `admin:tournament:${tournamentId}` as const,
  adminQueue: () => REALTIME_STATIC_CHANNELS.ADMIN_QUEUE,
} as const;

/**
 * Union of every possible channel name shape (static + templated).
 * Useful for typing future emit/subscribe signatures.
 */
export type RealtimeChannelName =
  | RealtimeStaticChannel
  | `tournament:${string}`
  | `match:${string}`
  | `user:${string}`
  | `notifications:${string}`
  | `profile:${string}`
  | `team:${string}`
  | `admin:tournament:${string}`;
