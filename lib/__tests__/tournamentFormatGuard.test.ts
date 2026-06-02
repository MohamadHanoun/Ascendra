import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  isSupportedTournamentFormat,
  SUPPORTED_FORMATS,
} from "@/lib/tournamentFormatSupport";

// ─── Mocks required by tournamentMatchEngine ──────────────────────────────────

vi.mock("@/lib/prisma", () => {
  const tournament = { findUnique: vi.fn() };
  const tournamentMatch = { count: vi.fn() };
  const tournamentRegistration = { findMany: vi.fn() };

  return {
    prisma: {
      tournament,
      tournamentMatch,
      tournamentRegistration,
    },
  };
});

vi.mock("@/lib/realtime", () => ({
  createRealtimeEvent: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/matchNotifications", () => ({
  notifyBracketAdvanced: vi.fn().mockResolvedValue({}),
  notifyMatchScheduled: vi.fn().mockResolvedValue({}),
  notifyMatchConfirmed: vi.fn().mockResolvedValue({}),
  notifyMatchDisputed: vi.fn().mockResolvedValue({}),
  notifyManualResultSubmitted: vi.fn().mockResolvedValue({}),
  notifyMatchRoomReady: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/tournamentResults", () => ({
  awardTournamentResultsAndPoints: vi.fn().mockResolvedValue({
    ok: true,
    skipped: false,
  }),
}));

// Import AFTER mocks are registered
import { createMatchesForTournament } from "../tournamentMatchEngine";
import { prisma } from "@/lib/prisma";

// ─── isSupportedTournamentFormat ──────────────────────────────────────────────

describe("isSupportedTournamentFormat", () => {
  it("returns true for single_elimination", () => {
    expect(isSupportedTournamentFormat("single_elimination")).toBe(true);
  });

  it("returns false for double_elimination", () => {
    expect(isSupportedTournamentFormat("double_elimination")).toBe(false);
  });

  it("returns false for round_robin", () => {
    expect(isSupportedTournamentFormat("round_robin")).toBe(false);
  });

  it("returns false for swiss", () => {
    expect(isSupportedTournamentFormat("swiss")).toBe(false);
  });

  it("returns false for group_stage", () => {
    expect(isSupportedTournamentFormat("group_stage")).toBe(false);
  });

  it("returns false for an arbitrary unknown format", () => {
    expect(isSupportedTournamentFormat("freeform")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isSupportedTournamentFormat("")).toBe(false);
  });

  it("SUPPORTED_FORMATS contains exactly single_elimination", () => {
    expect(SUPPORTED_FORMATS).toEqual(["single_elimination"]);
  });
});

// ─── createMatchesForTournament — format guard ────────────────────────────────

describe("createMatchesForTournament — format guard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("fails with a clear message when format is double_elimination", async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      id: "t1",
      bestOf: 1,
      format: "double_elimination",
    } as never);

    const result = await createMatchesForTournament("t1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not supported/i);
      expect(result.error).toMatch(/single elimination/i);
    }
  });

  it("fails with a clear message when format is round_robin", async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      id: "t2",
      bestOf: 1,
      format: "round_robin",
    } as never);

    const result = await createMatchesForTournament("t2");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not supported/i);
    }
  });

  it("fails with a clear message when format is swiss", async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      id: "t3",
      bestOf: 1,
      format: "swiss",
    } as never);

    const result = await createMatchesForTournament("t3");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not supported/i);
    }
  });

  it("does not reject single_elimination at the format guard", async () => {
    // After passing the format guard, the function continues to the match-count
    // check.  We mock that to return 0 existing matches, then registration count
    // returns fewer than 2 teams — that causes the next guard to fire, but the
    // format guard must NOT fire.
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      id: "t4",
      bestOf: 1,
      format: "single_elimination",
    } as never);

    vi.mocked(prisma.tournamentMatch.count).mockResolvedValue(0);
    vi.mocked(prisma.tournamentRegistration.findMany).mockResolvedValue([]);

    const result = await createMatchesForTournament("t4");

    // Must have passed the format guard; the next error is about approved teams
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toMatch(/not supported/i);
      expect(result.error).toMatch(/approved teams/i);
    }
  });

  it("returns tournament-not-found error before reaching the format guard", async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(null);

    const result = await createMatchesForTournament("nonexistent");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not found/i);
    }
  });
});
