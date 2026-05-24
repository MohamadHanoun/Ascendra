/**
 * Safety / hardening tests for tournamentMatchEngine.
 *
 * Coverage:
 *   1. confirmMatchResult rejects non-admin callers (defense-in-depth even
 *      when the action layer forgets the check)
 *   2. adminOverrideMatchResult rejects non-admin callers
 *   3. completeMatchGame is idempotent — already-completed games are NOT
 *      re-completed and the recorded winner is preserved
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { MatchGameStatus, MatchStatus } from "@prisma/client";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => {
  const tournamentMatch = {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    findMany: vi.fn(),
  };
  const tournamentMatchGame = {
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  };
  const gameApiAuditLog = { create: vi.fn().mockResolvedValue({}) };
  const user = { findUnique: vi.fn() };
  const matchReport = {
    findMany: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  };

  return {
    prisma: {
      tournamentMatch,
      tournamentMatchGame,
      gameApiAuditLog,
      user,
      matchReport,
      $transaction: vi.fn().mockImplementation(
        async (fn: (tx: unknown) => unknown) =>
          fn({ tournamentMatch, tournamentMatchGame, gameApiAuditLog, matchReport }),
      ),
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

import {
  adminOverrideMatchResult,
  completeMatchGame,
  confirmMatchResult,
} from "../tournamentMatchEngine";
import { prisma } from "@/lib/prisma";

beforeEach(() => {
  vi.clearAllMocks();
  // Ensure tests run as NODE_ENV=test so the test-admin override helper is enabled.
  process.env.NODE_ENV = "test";
  // Default: clear admin allowlist so non-admin tests don't accidentally pass.
  process.env.ADMIN_DISCORD_IDS = "";
});

// ─── 1. confirmMatchResult admin enforcement ─────────────────────────────────

describe("confirmMatchResult — admin defense-in-depth", () => {
  it("rejects when the userId is not in ADMIN_DISCORD_IDS", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      discordId: "999-not-admin",
    });

    const result = await confirmMatchResult("m1", "regular-user");

    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/admin/i);
    // No DB writes attempted beyond the user lookup
    expect(prisma.tournamentMatch.update).not.toHaveBeenCalled();
  });

  it("rejects when the user record is missing entirely", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const result = await confirmMatchResult("m1", "ghost-user");

    expect(result.ok).toBe(false);
    expect(prisma.tournamentMatch.update).not.toHaveBeenCalled();
  });
});

// ─── 2. adminOverrideMatchResult admin enforcement ───────────────────────────

describe("adminOverrideMatchResult — admin defense-in-depth", () => {
  it("rejects a non-admin caller before touching match state", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      discordId: "999-not-admin",
    });

    const result = await adminOverrideMatchResult({
      matchId: "m1",
      adminUserId: "regular-user",
      winnerTeamId: "team-a",
      teamAScore: 2,
      teamBScore: 1,
      note: "tampering attempt",
    });

    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/admin/i);
    expect(prisma.tournamentMatch.findUnique).not.toHaveBeenCalled();
    expect(prisma.matchReport.create).not.toHaveBeenCalled();
  });
});

// ─── 3. completeMatchGame idempotency ─────────────────────────────────────────

describe("completeMatchGame — idempotency for completed games", () => {
  it("preserves the recorded winner when a completed game is re-completed", async () => {
    // Game is already completed with team A as the winner.
    (prisma.tournamentMatchGame.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "g1",
      matchId: "m1",
      status: MatchGameStatus.completed,
      winnerTeamId: "team-a",
      match: {
        id: "m1",
        teamAId: "team-a",
        teamBId: "team-b",
        bestOf: 1,
        status: MatchStatus.confirmed,
        winnerTeamId: "team-a",
        tournamentId: "tourn1",
      },
    });
    // findMany for series tally returns the single completed game.
    (prisma.tournamentMatchGame.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { winnerTeamId: "team-a" },
    ]);

    // Attempt to re-complete with the OPPOSITE team winning. This must NOT
    // overwrite the recorded winner.
    const result = await completeMatchGame("g1", "team-b", null);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // For BO1, one completed game = seriesComplete=true (requiredWins=1)
      expect(result.data.seriesComplete).toBe(true);
    }

    // No update was issued — the recorded result is untouched.
    expect(prisma.tournamentMatchGame.update).not.toHaveBeenCalled();
    expect(prisma.tournamentMatch.update).not.toHaveBeenCalled();
  });

  it("validates winner belongs to one of the teams even for completed games", async () => {
    (prisma.tournamentMatchGame.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "g1",
      matchId: "m1",
      status: MatchGameStatus.completed,
      winnerTeamId: "team-a",
      match: {
        id: "m1",
        teamAId: "team-a",
        teamBId: "team-b",
        bestOf: 1,
        status: MatchStatus.confirmed,
        winnerTeamId: "team-a",
        tournamentId: "tourn1",
      },
    });

    const result = await completeMatchGame("g1", "team-stranger", null);

    expect(result.ok).toBe(false);
    expect(prisma.tournamentMatchGame.update).not.toHaveBeenCalled();
  });
});
