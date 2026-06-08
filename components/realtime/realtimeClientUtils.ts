/**
 * Pure helpers + a framework-agnostic controller for the browser realtime
 * client (Batch 1O). No React, no `socket.io-client` import here — the Socket.IO
 * factory is INJECTED so this module stays testable in a node environment and so
 * the only file importing `socket.io-client` is RealtimeProvider.tsx.
 *
 * Security:
 *  - Never reads server secrets; never touches localStorage/sessionStorage/cookies.
 *  - Tokens live only in memory (closure), fetched from /api/realtime/token.
 *  - publicRooms are restricted to leaderboard / tournament:{id} / match:{id}.
 *  - Never throws to callers; never logs tokens or full payloads.
 */

export type RealtimeStatus =
  | "disabled"
  | "idle"
  | "token_loading"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type RealtimeEventEnvelope = {
  type?: string;
  audience?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: unknown;
  at?: string;
};

export type TokenResponse = {
  token: string;
  rooms: string[];
  expiresAt: string;
};

const TOKEN_PATH = "/api/realtime/token";
const DEFAULT_REFRESH_LEAD_MS = 60_000;
const MIN_REFRESH_DELAY_MS = 1_000;
const ROOM_PATTERN = /^[a-zA-Z0-9:_-]+$/;
const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_ROOM_LENGTH = 160;

/** Realtime is enabled only with the explicit flag AND a non-empty URL. */
export function isRealtimeEnabled(
  flag: string | undefined,
  url: string | undefined,
): boolean {
  return flag === "true" && typeof url === "string" && url.trim().length > 0;
}

function isValidId(value: string): boolean {
  return value.length > 0 && value.length <= MAX_ROOM_LENGTH && ID_PATTERN.test(value);
}

/** Public rooms a client may self-join: leaderboard / tournament:{id} / match:{id}. */
export function isSafePublicRoom(room: unknown): room is string {
  if (typeof room !== "string" || room.length === 0 || room.length > MAX_ROOM_LENGTH) {
    return false;
  }
  if (room === "leaderboard") return true;
  if (room.startsWith("tournament:")) return isValidId(room.slice("tournament:".length));
  if (room.startsWith("match:")) return isValidId(room.slice("match:".length));
  return false;
}

export function filterPublicRooms(rooms: unknown): string[] {
  if (!Array.isArray(rooms)) return [];
  return Array.from(new Set(rooms.filter(isSafePublicRoom)));
}

/** Validate the /api/realtime/token response shape. Returns null when invalid. */
export function validateTokenResponse(data: unknown): TokenResponse | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  if (record.ok !== true) return null;
  if (typeof record.token !== "string" || record.token.length === 0) return null;
  if (typeof record.expiresAt !== "string" || Number.isNaN(Date.parse(record.expiresAt))) {
    return null;
  }
  if (
    !Array.isArray(record.rooms) ||
    !record.rooms.every((r) => typeof r === "string" && ROOM_PATTERN.test(r) && r.length <= MAX_ROOM_LENGTH)
  ) {
    return null;
  }
  return {
    token: record.token,
    rooms: record.rooms as string[],
    expiresAt: record.expiresAt,
  };
}

/**
 * Delay (ms) before refreshing, aiming `leadMs` before expiry. Returns null when
 * expiry is unparseable; clamps to a minimum so we never busy-loop.
 */
export function computeRefreshDelayMs(
  expiresAt: string,
  now: number,
  leadMs: number = DEFAULT_REFRESH_LEAD_MS,
): number | null {
  const exp = Date.parse(expiresAt);
  if (Number.isNaN(exp)) return null;
  return Math.max(exp - now - leadMs, MIN_REFRESH_DELAY_MS);
}

// ─── Minimal injected Socket type ─────────────────────────────────────────────

export type RealtimeSocketLike = {
  auth?: unknown;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
  connect: () => void;
  disconnect: () => void;
  removeAllListeners?: () => void;
};

export type RealtimeControllerConfig = {
  enabled: boolean;
  url: string | undefined;
  ioFactory: (url: string, opts: Record<string, unknown>) => RealtimeSocketLike;
  fetchImpl?: typeof fetch;
  tokenPath?: string;
  publicRooms?: string[];
  refreshLeadMs?: number;
  onStatus?: (status: RealtimeStatus) => void;
  onError?: (message: string) => void;
  onEvent?: (event: RealtimeEventEnvelope) => void;
  onRooms?: (rooms: string[]) => void;
  now?: () => number;
  setTimeoutImpl?: (fn: () => void, ms: number) => unknown;
  clearTimeoutImpl?: (handle: unknown) => void;
};

export type RealtimeController = {
  start: () => Promise<void>;
  stop: () => void;
  reconnect: () => void;
  /** Ref-counted join of a PUBLIC room. Returns a leave fn. Invalid rooms => no-op. */
  joinPublicRoom: (room: string) => () => void;
  getStatus: () => RealtimeStatus;
  getJoinedRooms: () => string[];
};

/**
 * Framework-agnostic realtime lifecycle: token fetch → connect → join → refresh
 * → cleanup. The Socket.IO factory + fetch are injected. Never throws.
 */
export function createRealtimeController(
  config: RealtimeControllerConfig,
): RealtimeController {
  const {
    enabled,
    url,
    ioFactory,
    fetchImpl = fetch,
    tokenPath = TOKEN_PATH,
    publicRooms = [],
    refreshLeadMs = DEFAULT_REFRESH_LEAD_MS,
    onStatus = () => {},
    onError = () => {},
    onEvent = () => {},
    onRooms = () => {},
    now = () => Date.now(),
    setTimeoutImpl = (fn, ms) => setTimeout(fn, ms),
    clearTimeoutImpl = (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  } = config;

  let status: RealtimeStatus = "disabled";
  let socket: RealtimeSocketLike | null = null;
  let refreshHandle: unknown = null;
  let joinedRooms: string[] = [];
  let stopped = false;
  let connected = false;
  let tokenRooms: string[] = [];
  // Ref-counted dynamic public rooms requested by mounted consumers.
  const publicRoomCounts = new Map<string, number>();

  function currentDesiredRooms(): string[] {
    return Array.from(
      new Set([
        ...tokenRooms,
        ...filterPublicRooms(publicRooms),
        ...publicRoomCounts.keys(),
      ]),
    );
  }

  function emitJoin(room: string) {
    socket?.emit("join", room, (ack: unknown) => {
      if (ack && typeof ack === "object" && (ack as { ok?: boolean }).ok) {
        joinedRooms = Array.from(new Set([...joinedRooms, room]));
        onRooms(joinedRooms);
      }
    });
  }

  function setStatus(next: RealtimeStatus) {
    status = next;
    onStatus(next);
  }

  function setError(message: string) {
    status = "error";
    onError(message);
    onStatus("error");
  }

  function clearRefresh() {
    if (refreshHandle !== null) {
      clearTimeoutImpl(refreshHandle);
      refreshHandle = null;
    }
  }

  function scheduleRefresh(expiresAt: string) {
    clearRefresh();
    const delay = computeRefreshDelayMs(expiresAt, now(), refreshLeadMs);
    if (delay === null) return;
    refreshHandle = setTimeoutImpl(() => {
      void refresh();
    }, delay);
  }

  function teardownSocket() {
    connected = false;
    if (socket) {
      try {
        socket.removeAllListeners?.();
        socket.disconnect();
      } catch {
        /* ignore */
      }
      socket = null;
    }
  }

  async function fetchToken(): Promise<TokenResponse | null | "disabled" | "idle"> {
    try {
      const res = await fetchImpl(tokenPath, {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (res.status === 404) return "disabled";
      if (res.status === 401) return "idle";
      if (!res.ok) {
        setError("token_unavailable");
        return null;
      }
      const data = await res.json();
      const parsed = validateTokenResponse(data);
      if (!parsed) {
        setError("invalid_token_response");
        return null;
      }
      return parsed;
    } catch {
      setError("token_fetch_failed");
      return null;
    }
  }

  function connect(parsed: TokenResponse) {
    if (stopped || !url) return;
    setStatus("connecting");
    tokenRooms = parsed.rooms;

    socket = ioFactory(url, {
      auth: { token: parsed.token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    // Fires on first connect AND on every auto-reconnect → rejoin all rooms.
    socket.on("connect", () => {
      connected = true;
      setStatus("connected");
      joinedRooms = [];
      for (const room of currentDesiredRooms()) {
        emitJoin(room);
      }
    });

    socket.on("connect_error", () => {
      connected = false;
      setError("connect_error");
    });

    socket.on("disconnect", () => {
      connected = false;
      setStatus("disconnected");
    });

    socket.on("ascendra:event", (evt: unknown) => {
      try {
        onEvent((evt ?? {}) as RealtimeEventEnvelope);
      } catch {
        /* never let a subscriber break the socket */
      }
    });

    scheduleRefresh(parsed.expiresAt);
  }

  function joinPublicRoom(room: string): () => void {
    if (!isSafePublicRoom(room)) {
      return () => {};
    }
    const next = (publicRoomCounts.get(room) ?? 0) + 1;
    publicRoomCounts.set(room, next);
    if (next === 1 && connected) {
      emitJoin(room);
    }

    let released = false;
    return () => {
      if (released) return;
      released = true;
      const remaining = (publicRoomCounts.get(room) ?? 0) - 1;
      if (remaining <= 0) {
        publicRoomCounts.delete(room);
        if (connected && socket) {
          socket.emit("leave", room, () => {});
        }
        joinedRooms = joinedRooms.filter((r) => r !== room);
        onRooms(joinedRooms);
      } else {
        publicRoomCounts.set(room, remaining);
      }
    };
  }

  async function refresh() {
    if (stopped) return;
    const parsed = await fetchToken();
    if (typeof parsed === "string" || parsed === null) {
      // disabled / idle / error — stop trying for now.
      teardownSocket();
      if (parsed === "disabled") setStatus("disabled");
      else if (parsed === "idle") setStatus("idle");
      return;
    }
    if (socket) {
      socket.auth = { token: parsed.token };
      try {
        socket.disconnect();
        socket.connect();
      } catch {
        /* ignore */
      }
      scheduleRefresh(parsed.expiresAt);
    } else {
      connect(parsed);
    }
  }

  async function start() {
    stopped = false;
    if (!enabled || !url) {
      setStatus("disabled");
      return;
    }
    setStatus("token_loading");
    const parsed = await fetchToken();
    if (parsed === "disabled") {
      setStatus("disabled");
      return;
    }
    if (parsed === "idle") {
      setStatus("idle");
      return;
    }
    if (parsed === null) {
      return; // error already reported
    }
    connect(parsed);
  }

  function stop() {
    stopped = true;
    clearRefresh();
    teardownSocket();
    joinedRooms = [];
    setStatus("idle");
  }

  function reconnect() {
    teardownSocket();
    void start();
  }

  return {
    start,
    stop,
    reconnect,
    joinPublicRoom,
    getStatus: () => status,
    getJoinedRooms: () => joinedRooms,
  };
}
