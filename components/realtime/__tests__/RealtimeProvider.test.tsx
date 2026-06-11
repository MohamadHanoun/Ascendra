import { describe, expect, it, vi } from "vitest";

import {
  createRealtimeController,
  isRealtimeEnabled,
  isSafePublicRoom,
  filterPublicRooms,
  validateTokenResponse,
  computeRefreshDelayMs,
} from "../realtimeClientUtils";

// The React component itself is a thin wrapper; the testable logic lives in the
// injected controller (no jsdom / socket.io-client required here).

const NOW = 1_700_000_000_000;
const FUTURE = new Date(NOW + 120_000).toISOString();

function makeFakeSocket() {
  const handlers: Record<string, (...args: unknown[]) => void> = {};
  const emits: Array<{ event: string; room: unknown }> = [];
  const socket = {
    auth: undefined as unknown,
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers[event] = handler;
    }),
    emit: vi.fn((event: string, room: unknown, ack?: (a: unknown) => void) => {
      emits.push({ event, room });
      if (typeof ack === "function") ack({ ok: true, room });
    }),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
  };
  return { socket, handlers, emits };
}

function okTokenResponse(rooms: string[]) {
  return {
    status: 200,
    ok: true,
    json: async () => ({ ok: true, token: "tkn", rooms, expiresAt: FUTURE }),
  };
}

function makeController(overrides: Record<string, unknown> = {}) {
  const statuses: string[] = [];
  const errors: string[] = [];
  const events: unknown[] = [];
  const timers: Array<{ fn: () => void; ms: number }> = [];
  const ioCalls: Array<{ url: string; opts: Record<string, unknown> }> = [];
  let fake = makeFakeSocket();

  const fetchImpl = vi.fn(async () => okTokenResponse(["notifications:u1"]) as unknown as Response);
  const ioFactory = vi.fn((url: string, opts: Record<string, unknown>) => {
    ioCalls.push({ url, opts });
    fake = makeFakeSocket();
    return fake.socket;
  });

  const controller = createRealtimeController({
    enabled: true,
    url: "https://realtime.example.com",
    ioFactory,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    onStatus: (s) => statuses.push(s),
    onError: (e) => errors.push(e),
    onEvent: (e) => events.push(e),
    now: () => NOW,
    setTimeoutImpl: (fn: () => void, ms: number) => {
      timers.push({ fn, ms });
      return timers.length - 1;
    },
    clearTimeoutImpl: vi.fn(),
    ...overrides,
  });

  return { controller, statuses, errors, events, timers, ioCalls, fetchImpl, ioFactory, getSocket: () => fake };
}

describe("pure helpers", () => {
  it("isRealtimeEnabled requires flag=true and a url", () => {
    expect(isRealtimeEnabled("true", "https://x")).toBe(true);
    expect(isRealtimeEnabled("false", "https://x")).toBe(false);
    expect(isRealtimeEnabled("true", "")).toBe(false);
    expect(isRealtimeEnabled(undefined, undefined)).toBe(false);
  });

  it("isSafePublicRoom allows only leaderboard/tournaments/tournament/match", () => {
    expect(isSafePublicRoom("leaderboard")).toBe(true);
    expect(isSafePublicRoom("tournaments")).toBe(true);
    expect(isSafePublicRoom("tournament:t1")).toBe(true);
    expect(isSafePublicRoom("match:m1")).toBe(true);
    for (const bad of [
      "admin",
      "user:u1",
      "notifications:u1",
      "profile:u1",
      "team:t1",
      "tournament:bad id",
      "tournaments:t1",
      "tournamentsX",
    ]) {
      expect(isSafePublicRoom(bad)).toBe(false);
    }
  });

  it("filterPublicRooms drops everything unsafe and dedupes", () => {
    expect(
      filterPublicRooms(["leaderboard", "leaderboard", "admin", "tournament:t1", "user:x"]),
    ).toEqual(["leaderboard", "tournament:t1"]);
  });

  it("validateTokenResponse enforces shape", () => {
    expect(validateTokenResponse({ ok: true, token: "t", rooms: ["user:u1"], expiresAt: FUTURE })).toBeTruthy();
    expect(validateTokenResponse({ ok: false, token: "t", rooms: [], expiresAt: FUTURE })).toBeNull();
    expect(validateTokenResponse({ ok: true, token: "", rooms: [], expiresAt: FUTURE })).toBeNull();
    expect(validateTokenResponse({ ok: true, token: "t", rooms: ["bad room"], expiresAt: FUTURE })).toBeNull();
    expect(validateTokenResponse({ ok: true, token: "t", rooms: [], expiresAt: "nope" })).toBeNull();
  });

  it("computeRefreshDelayMs aims ahead of expiry and clamps", () => {
    expect(computeRefreshDelayMs(FUTURE, NOW, 60_000)).toBe(60_000);
    expect(computeRefreshDelayMs(new Date(NOW + 1000).toISOString(), NOW, 60_000)).toBe(1000);
    expect(computeRefreshDelayMs("invalid", NOW)).toBeNull();
  });
});

describe("controller — disabled / misconfigured", () => {
  it("disabled: no token fetch and no io()", async () => {
    const { controller, fetchImpl, ioFactory, statuses } = makeController({ enabled: false });
    await controller.start();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(ioFactory).not.toHaveBeenCalled();
    expect(statuses.at(-1)).toBe("disabled");
  });

  it("missing url: no token fetch and no io()", async () => {
    const { controller, fetchImpl, ioFactory, statuses } = makeController({ url: undefined });
    await controller.start();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(ioFactory).not.toHaveBeenCalled();
    expect(statuses.at(-1)).toBe("disabled");
  });
});

describe("controller — token route outcomes", () => {
  it("404 → disabled, no connect", async () => {
    const fetchImpl = vi.fn(async () => ({ status: 404, ok: false }) as unknown as Response);
    const { controller, ioFactory, statuses } = makeController({ fetchImpl });
    await controller.start();
    expect(ioFactory).not.toHaveBeenCalled();
    expect(statuses.at(-1)).toBe("disabled");
  });

  it("401 → idle, no connect", async () => {
    const fetchImpl = vi.fn(async () => ({ status: 401, ok: false }) as unknown as Response);
    const { controller, ioFactory, statuses } = makeController({ fetchImpl });
    await controller.start();
    expect(ioFactory).not.toHaveBeenCalled();
    expect(statuses.at(-1)).toBe("idle");
  });

  it("ok → connects with the token in auth and joins token + allowed public rooms", async () => {
    const fetchImpl = vi.fn(async () => okTokenResponse(["notifications:u1"]) as unknown as Response);
    const ctx = makeController({
      fetchImpl,
      publicRooms: ["leaderboard", "admin", "tournament:t1", "user:hack"],
    });
    await ctx.controller.start();

    expect(ctx.ioFactory).toHaveBeenCalledTimes(1);
    expect(ctx.ioCalls[0].opts.auth).toEqual({ token: "tkn" });

    // simulate the socket connecting
    const fake = ctx.getSocket();
    fake.handlers.connect?.();

    expect(ctx.statuses.at(-1)).toBe("connected");
    const joined = ctx.controller.getJoinedRooms().sort();
    expect(joined).toEqual(
      ["notifications:u1", "leaderboard", "tournament:t1"].sort(),
    );
    expect(joined).not.toContain("admin");
    expect(joined).not.toContain("user:u1");
    expect(joined).not.toContain("user:hack");
  });
});

describe("controller — runtime behavior", () => {
  it("connect_error sets error state without throwing", async () => {
    const ctx = makeController();
    await ctx.controller.start();
    const fake = ctx.getSocket();
    expect(() => fake.handlers.connect_error?.()).not.toThrow();
    expect(ctx.controller.getStatus()).toBe("error");
    expect(ctx.errors).toContain("connect_error");
  });

  it("forwards ascendra:event to subscribers", async () => {
    const ctx = makeController();
    await ctx.controller.start();
    const fake = ctx.getSocket();
    fake.handlers["ascendra:event"]?.({ type: "leaderboard.updated", payload: { tournamentId: "x" } });
    expect(ctx.events).toHaveLength(1);
    expect((ctx.events[0] as { type?: string }).type).toBe("leaderboard.updated");
  });

  it("cleans up the socket on stop()", async () => {
    const ctx = makeController();
    await ctx.controller.start();
    const fake = ctx.getSocket();
    ctx.controller.stop();
    expect(fake.socket.disconnect).toHaveBeenCalled();
    expect(ctx.controller.getStatus()).toBe("idle");
  });

  it("joinPublicRoom rejects private/admin rooms (no emit) and ref-counts public rooms", async () => {
    const ctx = makeController();
    await ctx.controller.start();
    const fake = ctx.getSocket();
    fake.handlers.connect?.();
    fake.emits.length = 0;

    // Private/admin requests are no-ops (no emit).
    for (const bad of ["user:hack", "admin", "notifications:u1", "team:t1"]) {
      const leave = ctx.controller.joinPublicRoom(bad);
      expect(typeof leave).toBe("function");
    }
    expect(fake.emits).toHaveLength(0);

    // Two requests for the same public room → joined once.
    const leaveA = ctx.controller.joinPublicRoom("leaderboard");
    const leaveB = ctx.controller.joinPublicRoom("leaderboard");
    const joins = fake.emits.filter((e) => e.event === "join" && e.room === "leaderboard");
    expect(joins).toHaveLength(1);

    // Leave once → still referenced (no leave emit); leave again → leave emitted.
    leaveA();
    expect(fake.emits.filter((e) => e.event === "leave")).toHaveLength(0);
    leaveB();
    expect(fake.emits.filter((e) => e.event === "leave" && e.room === "leaderboard")).toHaveLength(1);
  });

  it("rejoins requested public rooms on (re)connect", async () => {
    const ctx = makeController();
    await ctx.controller.start();
    const fake = ctx.getSocket();

    // Requested before connect → no emit yet.
    ctx.controller.joinPublicRoom("match:m1");
    expect(fake.emits.filter((e) => e.event === "join" && e.room === "match:m1")).toHaveLength(0);

    // First connect joins token rooms + the requested public room.
    fake.handlers.connect?.();
    const firstJoins = fake.emits.filter((e) => e.event === "join").map((e) => e.room);
    expect(firstJoins).toContain("match:m1");
    expect(firstJoins).toContain("notifications:u1");
    expect(firstJoins).not.toContain("user:u1");

    // Reconnect → rejoins everything.
    fake.emits.length = 0;
    fake.handlers.connect?.();
    const rejoins = fake.emits.filter((e) => e.event === "join").map((e) => e.room);
    expect(rejoins).toContain("match:m1");
  });

  it("schedules a refresh that re-fetches the token before expiry", async () => {
    const fetchImpl = vi.fn(async () => okTokenResponse(["notifications:u1"]) as unknown as Response);
    const ctx = makeController({ fetchImpl });
    await ctx.controller.start();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(ctx.timers).toHaveLength(1);
    expect(ctx.timers[0].ms).toBe(60_000); // 120s expiry - 60s lead

    // fire the scheduled refresh
    await ctx.timers[0].fn();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
