import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tournament: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/realtime", () => ({
  createRealtimeEvent: vi.fn().mockResolvedValue(undefined),
}));

import { getTournamentLifecycleUpdate } from "../jobs/tournamentLifecycleJobs";

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
