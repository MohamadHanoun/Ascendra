import { beforeEach, describe, expect, it, vi } from "vitest";
import { MatchGameStatus, MatchStatus } from "@prisma/client";

// ─── Mocks must be defined before the module under test is imported ───────────

vi.mock("@/lib/prisma", () => {
  const tournamentMatch = {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
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
    count: vi.fn(),
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

vi.mock("@/lib/tournamentResults", () => ({
  awardTournamentResultsAndPoints: vi.fn().mockResolvedValue({
    ok: true,
    skipped: false,
    tournamentId: "tourn1",
    placements: [],
    teamPointEvents: 0,
    playerPointEvents: 0,
  }),
}));

// Import AFTER mocks are registered
import { advanceBracketAfterMatch, completeMatchGame } from "../tournamentMatchEngine";
import { prisma } from "@/lib/prisma";
import { awardTournamentResultsAndPoints } from "@/lib/tournamentResults";

// ─── Shared test data ─────────────────────────────────────────────────────────

const T = { A: "team-a", B: "team-b", C: "team-c", D: "team-d" } as const;

function baseMatch(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "m1",
    status: MatchStatus.confirmed,
    winnerTeamId: T.A,
    nextMatchId: "m3",
    nextMatchSlot: "A",
    tournamentId: "tourn1",
    completedAt: null,
    version: 1,
    teamAId: T.A,
    teamBId: T.B,
    isBye: false,
    bestOf: 1,
    ...overrides,
  };
}

function baseNext(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "m3",
    version: 2,
    teamAId: null,
    teamBId: null,
    ...overrides,
  };
}

// ─── advanceBracketAfterMatch ─────────────────────────────────────────────────

describe("advanceBracketAfterMatch", () => {
  const m = prisma.tournamentMatch as ReturnType<typeof vi.fn> & {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.gameApiAuditLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  // ─── Normal advancement ──────────────────────────────────────────────────

  describe("normal advancement", () => {
    it("places winner into empty slot A of next match", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(baseMatch())
        .mockResolvedValueOnce(baseNext());
      (m.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
      (m.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await advanceBracketAfterMatch("m1");

      expect(result).toEqual({ ok: true, data: { advanced: true, nextMatchId: "m3" } });
      expect(m.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "m3", version: 2 },
          data: expect.objectContaining({ teamAId: T.A }),
        }),
      );
    });

    it("places winner into empty slot B of next match", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(baseMatch({ nextMatchSlot: "B" }))
        .mockResolvedValueOnce(baseNext());
      (m.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
      (m.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await advanceBracketAfterMatch("m1");

      expect(result).toEqual({ ok: true, data: { advanced: true, nextMatchId: "m3" } });
      expect(m.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ teamBId: T.A }),
        }),
      );
    });

    it("marks current match as completed after advancing", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(baseMatch())
        .mockResolvedValueOnce(baseNext());
      (m.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
      (m.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await advanceBracketAfterMatch("m1");

      expect(m.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "m1" },
          data: expect.objectContaining({ status: MatchStatus.completed }),
        }),
      );
    });

    it("marks final match as completed without advancing when no nextMatchId", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        baseMatch({ nextMatchId: null, nextMatchSlot: null }),
      );
      (m.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await advanceBracketAfterMatch("m1");

      expect(result).toEqual({ ok: true, data: { advanced: false } });
      expect(m.updateMany).not.toHaveBeenCalled();
      expect(m.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: MatchStatus.completed }) }),
      );
      expect(awardTournamentResultsAndPoints).toHaveBeenCalledWith("tourn1");
    });
  });

  // ─── Idempotency ──────────────────────────────────────────────────────────

  describe("idempotency", () => {
    it("returns advanced=false when slot A already has the same winner", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(baseMatch())
        .mockResolvedValueOnce(baseNext({ teamAId: T.A }));

      const result = await advanceBracketAfterMatch("m1");

      expect(result).toEqual({ ok: true, data: { advanced: false } });
      expect(m.updateMany).not.toHaveBeenCalled();
    });

    it("returns advanced=false when slot B already has the same winner", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(baseMatch({ nextMatchSlot: "B", winnerTeamId: T.B }))
        .mockResolvedValueOnce(baseNext({ teamBId: T.B }));

      const result = await advanceBracketAfterMatch("m1");

      expect(result).toEqual({ ok: true, data: { advanced: false } });
      expect(m.updateMany).not.toHaveBeenCalled();
    });
  });

  // ─── Slot protection ──────────────────────────────────────────────────────

  describe("slot protection", () => {
    it("returns error when slot has a different team and no admin override", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(baseMatch({ winnerTeamId: T.C }))
        .mockResolvedValueOnce(baseNext({ teamAId: T.D }));

      const result = await advanceBracketAfterMatch("m1");

      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: string }).error).toMatch(/occupied/i);
      expect(m.updateMany).not.toHaveBeenCalled();
    });

    it("overwrites slot with adminOverride=true when different team occupies it", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(baseMatch({ winnerTeamId: T.C }))
        .mockResolvedValueOnce(baseNext({ teamAId: T.D }));
      (m.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
      (m.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await advanceBracketAfterMatch("m1", { adminOverride: true });

      expect(result).toEqual({ ok: true, data: { advanced: true, nextMatchId: "m3" } });
      expect(m.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ teamAId: T.C }),
        }),
      );
    });
  });

  // ─── BYE handling ─────────────────────────────────────────────────────────

  describe("BYE handling", () => {
    it("advances a BYE match winner to the next round", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(
          baseMatch({ status: MatchStatus.bye, isBye: true, teamBId: null }),
        )
        .mockResolvedValueOnce(baseNext());
      (m.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
      (m.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await advanceBracketAfterMatch("m1");

      expect(result).toEqual({ ok: true, data: { advanced: true, nextMatchId: "m3" } });
    });
  });

  // ─── Non-advanceable states ───────────────────────────────────────────────

  describe("non-advanceable states", () => {
    it("returns advanced=false for scheduled status", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        baseMatch({ status: MatchStatus.scheduled }),
      );

      const result = await advanceBracketAfterMatch("m1");

      expect(result).toEqual({ ok: true, data: { advanced: false } });
    });

    it("returns advanced=false when no winnerTeamId", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        baseMatch({ winnerTeamId: null }),
      );

      const result = await advanceBracketAfterMatch("m1");

      expect(result).toEqual({ ok: true, data: { advanced: false } });
    });

    it("fails when match does not exist", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const result = await advanceBracketAfterMatch("unknown");

      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: string }).error).toMatch(/not found/i);
    });
  });

  // ─── Optimistic locking ───────────────────────────────────────────────────

  describe("optimistic locking", () => {
    it("fails on version conflict and instructs retry", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(baseMatch())
        .mockResolvedValueOnce(baseNext());
      (m.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });

      const result = await advanceBracketAfterMatch("m1");

      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: string }).error).toMatch(/retry/i);
    });
  });

  // ─── 4-team bracket ───────────────────────────────────────────────────────

  describe("4-team bracket (2 rounds, 3 matches)", () => {
    it("advances R1-M1 winner into slot A of the final", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(
          baseMatch({ id: "r1m1", winnerTeamId: T.A, nextMatchId: "final", nextMatchSlot: "A" }),
        )
        .mockResolvedValueOnce(baseNext({ id: "final" }));
      (m.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
      (m.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await advanceBracketAfterMatch("r1m1");

      expect(result).toEqual({ ok: true, data: { advanced: true, nextMatchId: "final" } });
    });

    it("advances R1-M2 winner into slot B of the final (slot A already filled)", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(
          baseMatch({ id: "r1m2", winnerTeamId: T.B, nextMatchId: "final", nextMatchSlot: "B" }),
        )
        .mockResolvedValueOnce(baseNext({ id: "final", teamAId: T.A }));
      (m.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
      (m.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await advanceBracketAfterMatch("r1m2");

      expect(result).toEqual({ ok: true, data: { advanced: true, nextMatchId: "final" } });
      expect(m.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ teamBId: T.B }) }),
      );
    });
  });

  // ─── 6-team bracket with BYEs ─────────────────────────────────────────────

  describe("6-team bracket with BYEs (8-slot, 2 BYEs in round 1)", () => {
    it("auto-advances T5 from R1-M3 BYE into slot A of R2-M2", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(
          baseMatch({
            id: "r1m3",
            status: MatchStatus.bye,
            isBye: true,
            winnerTeamId: "team-5",
            teamAId: "team-5",
            teamBId: null,
            nextMatchId: "r2m2",
            nextMatchSlot: "A",
          }),
        )
        .mockResolvedValueOnce(baseNext({ id: "r2m2" }));
      (m.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
      (m.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await advanceBracketAfterMatch("r1m3");

      expect(result).toEqual({ ok: true, data: { advanced: true, nextMatchId: "r2m2" } });
      expect(m.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ teamAId: "team-5" }) }),
      );
    });

    it("auto-advances T6 from R1-M4 BYE into slot B of R2-M2", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(
          baseMatch({
            id: "r1m4",
            status: MatchStatus.bye,
            isBye: true,
            winnerTeamId: "team-6",
            teamAId: "team-6",
            teamBId: null,
            nextMatchId: "r2m2",
            nextMatchSlot: "B",
          }),
        )
        .mockResolvedValueOnce(baseNext({ id: "r2m2", teamAId: "team-5" }));
      (m.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
      (m.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await advanceBracketAfterMatch("r1m4");

      expect(result).toEqual({ ok: true, data: { advanced: true, nextMatchId: "r2m2" } });
      expect(m.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ teamBId: "team-6" }) }),
      );
    });
  });

  // ─── 8-team bracket ───────────────────────────────────────────────────────

  describe("8-team bracket (3 rounds, 7 matches)", () => {
    it("advances R1-M1 winner into slot A of R2-M1", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(
          baseMatch({ id: "r1m1", nextMatchId: "r2m1", nextMatchSlot: "A" }),
        )
        .mockResolvedValueOnce(baseNext({ id: "r2m1" }));
      (m.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
      (m.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await advanceBracketAfterMatch("r1m1");

      expect(result).toEqual({ ok: true, data: { advanced: true, nextMatchId: "r2m1" } });
    });

    it("advances R2-M1 winner into slot A of the semis/final", async () => {
      (m.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(
          baseMatch({ id: "r2m1", nextMatchId: "r3m1", nextMatchSlot: "A" }),
        )
        .mockResolvedValueOnce(baseNext({ id: "r3m1" }));
      (m.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
      (m.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await advanceBracketAfterMatch("r2m1");

      expect(result).toEqual({ ok: true, data: { advanced: true, nextMatchId: "r3m1" } });
    });
  });
});

// ─── completeMatchGame – BO3 series tracking ─────────────────────────────────

describe("completeMatchGame – BO3 series tracking", () => {
  const mg = prisma.tournamentMatchGame as ReturnType<typeof vi.fn> & {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  const m = prisma.tournamentMatch as ReturnType<typeof vi.fn> & {
    update: ReturnType<typeof vi.fn>;
  };

  const bo3Match = {
    id: "m1",
    teamAId: T.A,
    teamBId: T.B,
    bestOf: 3,
    status: MatchStatus.in_progress,
    winnerTeamId: null,
    tournamentId: "tourn1",
    version: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.gameApiAuditLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (m.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mg.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it("does not complete series after game 1 win in BO3 (1 win, need 2)", async () => {
    (mg.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "g1",
      matchId: "m1",
      match: { ...bo3Match, status: MatchStatus.scheduled },
    });
    // After game 1, only 1 completed game returned
    (mg.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { winnerTeamId: T.A },
    ]);

    const result = await completeMatchGame("g1", T.A, null);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.seriesComplete).toBe(false);
    }
    expect(m.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ winnerTeamId: null }),
      }),
    );
  });

  it("does not complete series after game 2 (1-1 tie in BO3)", async () => {
    (mg.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "g2",
      matchId: "m1",
      match: bo3Match,
    });
    (mg.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { winnerTeamId: T.A },
      { winnerTeamId: T.B },
    ]);

    const result = await completeMatchGame("g2", T.B, null);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.seriesComplete).toBe(false);
    }
  });

  it("completes series after game 3 with Team A winning 2-1 in BO3", async () => {
    (mg.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "g3",
      matchId: "m1",
      match: bo3Match,
    });
    (mg.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { winnerTeamId: T.A },
      { winnerTeamId: T.B },
      { winnerTeamId: T.A },
    ]);

    const result = await completeMatchGame("g3", T.A, null);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.seriesComplete).toBe(true);
    }
    expect(m.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          winnerTeamId: T.A,
          status: MatchStatus.result_pending,
        }),
      }),
    );
  });

  it("completes BO1 series immediately after game 1", async () => {
    (mg.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "g1",
      matchId: "m1",
      match: { ...bo3Match, bestOf: 1, status: MatchStatus.scheduled },
    });
    (mg.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { winnerTeamId: T.B },
    ]);

    const result = await completeMatchGame("g1", T.B, null);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.seriesComplete).toBe(true);
    }
    expect(m.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ winnerTeamId: T.B }),
      }),
    );
  });

  // ─── Admin override advancement ──────────────────────────────────────────

  describe("admin override slot replacement", () => {
    const tm = prisma.tournamentMatch as ReturnType<typeof vi.fn> & {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      vi.clearAllMocks();
      (prisma.gameApiAuditLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
    });

    it("replaces an existing slot occupant when adminOverride=true", async () => {
      // Simulate: match was already advanced with Team D in slot A,
      // but admin override changes winner to Team C
      (tm.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(
          baseMatch({ winnerTeamId: T.C, teamAId: T.C, teamBId: T.D }),
        )
        .mockResolvedValueOnce(baseNext({ teamAId: T.D }));
      (tm.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
      (tm.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await advanceBracketAfterMatch("m1", { adminOverride: true });

      expect(result).toEqual({ ok: true, data: { advanced: true, nextMatchId: "m3" } });
      expect(tm.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ teamAId: T.C }),
        }),
      );
    });

    it("rejects slot replacement without adminOverride flag", async () => {
      (tm.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(
          baseMatch({ winnerTeamId: T.C, teamAId: T.C, teamBId: T.D }),
        )
        .mockResolvedValueOnce(baseNext({ teamAId: T.D }));

      const result = await advanceBracketAfterMatch("m1");

      expect(result.ok).toBe(false);
      expect(tm.updateMany).not.toHaveBeenCalled();
    });
  });
});
