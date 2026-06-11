import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tournament: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/realtime", () => ({
  createRealtimeEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/realtime/dispatchRealtime", () => ({
  dispatchRealtimeEventSoon: vi.fn(),
}));

vi.mock("@/lib/tournamentResults", () => ({
  awardTournamentResultsAndPoints: vi.fn().mockResolvedValue({ ok: true }),
}));

import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";
import { dispatchRealtimeEventSoon } from "@/lib/realtime/dispatchRealtime";

import {
  getTournamentLifecycleUpdate,
  syncTournamentLifecycleForTournament,
} from "../jobs/tournamentLifecycleJobs";

const now = new Date("2026-05-25T12:00:00.000Z");

function tournament(overrides: Record<string, unknown> = {}) {
  return {
    id: "tournament-1",
    status: "upcoming",
    registrationStatus: "closed",
    registrationOpensAt: null,
    registrationClosesAt: null,
    startsAt: null,
    endsAt: null,
    endedAt: null,
    tournamentMatches: [],
    ...overrides,
  };
}

describe("getTournamentLifecycleUpdate", () => {
  it("opens registration within the registration window", () => {
    const update = getTournamentLifecycleUpdate(
      tournament({
        registrationOpensAt: new Date("2026-05-25T11:00:00.000Z"),
        registrationClosesAt: new Date("2026-05-25T13:00:00.000Z"),
      }),
      now,
    );

    expect(update).toEqual({ registrationStatus: "open" });
  });

  it("closes registration at or after registration close", () => {
    const update = getTournamentLifecycleUpdate(
      tournament({
        registrationStatus: "open",
        registrationClosesAt: new Date("2026-05-25T12:00:00.000Z"),
      }),
      now,
    );

    expect(update).toEqual({ registrationStatus: "closed" });
  });

  it("opens the tournament at or after start time", () => {
    const update = getTournamentLifecycleUpdate(
      tournament({
        startsAt: new Date("2026-05-25T11:59:00.000Z"),
      }),
      now,
    );

    expect(update).toEqual({ status: "open" });
  });

  it("ends the tournament at or after end time", () => {
    const update = getTournamentLifecycleUpdate(
      tournament({
        status: "open",
        registrationStatus: "open",
        endsAt: new Date("2026-05-25T12:00:00.000Z"),
      }),
      now,
    );

    expect(update).toEqual({
      status: "ended",
      registrationStatus: "closed",
      endedAt: now,
    });
  });

  it("ends the tournament when the final match is completed", () => {
    const update = getTournamentLifecycleUpdate(
      tournament({
        status: "open",
        registrationStatus: "closed",
        tournamentMatches: [{ id: "final-match" }],
      }),
      now,
    );

    expect(update).toEqual({
      status: "ended",
      endedAt: now,
    });
  });

  it("does not overwrite cancelled tournaments", () => {
    const update = getTournamentLifecycleUpdate(
      tournament({
        status: "cancelled",
        registrationStatus: "open",
        endsAt: new Date("2026-05-25T11:00:00.000Z"),
      }),
      now,
    );

    expect(update).toBeNull();
  });

  it("returns null when no lifecycle fields need changes", () => {
    const update = getTournamentLifecycleUpdate(
      tournament({
        status: "ended",
        registrationStatus: "closed",
        endedAt: new Date("2026-05-25T10:00:00.000Z"),
      }),
      now,
    );

    expect(update).toBeNull();
  });
});

// RC4 (Batch 4A): the lifecycle job's status-change path dispatches exactly
// one flag-gated tournament.status.updated socket event with an ID-only
// payload, after the DB RealtimeEvent (which remains the source of truth).
describe("syncTournamentLifecycleForTournament — RC4 dispatch site", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.tournament.update).mockResolvedValue(
      {} as never,
    );
  });

  it("dispatches tournament.status.updated once with an ID-only payload on a status change", async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(
      tournament({
        startsAt: new Date("2000-01-01T00:00:00.000Z"),
      }) as never,
    );

    const result = await syncTournamentLifecycleForTournament("tournament-1");

    expect(result.ok).toBe(true);
    expect(result.processed).toBe(1);

    // DB-first: the polling RealtimeEvent is still written.
    expect(createRealtimeEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "tournament.status.updated" }),
    );

    expect(dispatchRealtimeEventSoon).toHaveBeenCalledTimes(1);
    expect(dispatchRealtimeEventSoon).toHaveBeenCalledWith({
      type: "tournament.status.updated",
      audience: "public",
      entityType: "tournament",
      entityId: "tournament-1",
      payload: { tournamentId: "tournament-1" },
    });
  });

  it("does not dispatch when only registrationStatus changes (stays polling-only)", async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(
      tournament({
        registrationOpensAt: new Date("2000-01-01T00:00:00.000Z"),
        registrationClosesAt: new Date("2099-01-01T00:00:00.000Z"),
      }) as never,
    );

    const result = await syncTournamentLifecycleForTournament("tournament-1");

    expect(result.ok).toBe(true);
    expect(result.processed).toBe(1);
    expect(createRealtimeEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "tournament.registrationStatus.updated" }),
    );
    expect(dispatchRealtimeEventSoon).not.toHaveBeenCalled();
  });

  it("does not dispatch when there is nothing to update", async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(
      tournament() as never,
    );

    const result = await syncTournamentLifecycleForTournament("tournament-1");

    expect(result.skipped).toBe(1);
    expect(dispatchRealtimeEventSoon).not.toHaveBeenCalled();
  });
});
