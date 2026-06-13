/**
 * In-memory observability metrics for the realtime server (Batch 1J).
 *
 * Counters + timestamps only — per server instance, reset on restart. Holds
 * NO payloads, tokens, secrets, signatures, or raw IPs. Safe to expose (with
 * auth) via /internal/status.
 */

const INTERNAL_REJECT_REASONS = [
  "auth",
  "hmac",
  "replay",
  "rate_limit",
  "validation",
  "body_too_large",
  "method",
];

const JOIN_REJECT_REASONS = [
  "invalid_room",
  "private_denied",
  "admin_denied",
  "rate_limit",
];

function zeroed(keys) {
  return Object.fromEntries(keys.map((k) => [k, 0]));
}

export function createMetrics(now = () => Date.now()) {
  const startTime = now();

  const state = {
    socketConnectionsActive: 0,
    socketConnectionsTotal: 0,
    socketDisconnectsTotal: 0,
    internalEventsAccepted: 0,
    internalEventsRejected: zeroed(INTERNAL_REJECT_REASONS),
    roomJoinAttempts: 0,
    roomJoinsAccepted: 0,
    roomJoinsRejected: zeroed(JOIN_REJECT_REASONS),
    emittedEvents: 0,
    emittedRooms: 0,
    lastEventAt: null,
    lastRejectionAt: null,
  };

  return {
    onConnect() {
      state.socketConnectionsActive += 1;
      state.socketConnectionsTotal += 1;
    },
    onDisconnect() {
      state.socketConnectionsActive = Math.max(0, state.socketConnectionsActive - 1);
      state.socketDisconnectsTotal += 1;
    },
    onInternalAccepted(roomCount = 0) {
      state.internalEventsAccepted += 1;
      state.emittedEvents += 1;
      state.emittedRooms += Number.isFinite(roomCount) ? roomCount : 0;
      state.lastEventAt = now();
    },
    /** @returns the new count for this reason (for abuse-threshold logging). */
    onInternalRejected(reason) {
      state.lastRejectionAt = now();
      if (reason in state.internalEventsRejected) {
        state.internalEventsRejected[reason] += 1;
        return state.internalEventsRejected[reason];
      }
      return 0;
    },
    onJoinAttempt() {
      state.roomJoinAttempts += 1;
    },
    onJoinAccepted() {
      state.roomJoinsAccepted += 1;
    },
    /** @returns the new count for this reason (for abuse-threshold logging). */
    onJoinRejected(reason) {
      state.lastRejectionAt = now();
      if (reason in state.roomJoinsRejected) {
        state.roomJoinsRejected[reason] += 1;
        return state.roomJoinsRejected[reason];
      }
      return 0;
    },
    snapshot() {
      return {
        uptimeSeconds: Math.round((now() - startTime) / 1000),
        connections: state.socketConnectionsActive,
        counters: {
          socketConnectionsActive: state.socketConnectionsActive,
          socketConnectionsTotal: state.socketConnectionsTotal,
          socketDisconnectsTotal: state.socketDisconnectsTotal,
          internalEventsAccepted: state.internalEventsAccepted,
          internalEventsRejected: { ...state.internalEventsRejected },
          roomJoinAttempts: state.roomJoinAttempts,
          roomJoinsAccepted: state.roomJoinsAccepted,
          roomJoinsRejected: { ...state.roomJoinsRejected },
          emittedEvents: state.emittedEvents,
          emittedRooms: state.emittedRooms,
          lastEventAt: state.lastEventAt
            ? new Date(state.lastEventAt).toISOString()
            : null,
          lastRejectionAt: state.lastRejectionAt
            ? new Date(state.lastRejectionAt).toISOString()
            : null,
        },
      };
    },
  };
}
