import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rankingSeason: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    rankingPointEvent: {
      upsert: vi.fn(),
      groupBy: vi.fn(),
    },
    team: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  aggregatePlayerLeaderboard,
  aggregateTeamLeaderboard,
  createOrGetDefaultRankingSeason,
  createPointEvent,
} from "@/lib/ranking/rankingService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createPointEvent", () => {
  it("uses dedupeKey upsert for idempotent point events", async () => {
    const existingEvent = {
      id: "event-1",
      teamId: "team-1",
      points: 100,
      dedupeKey: "tournament:t1:team:team-1",
    };
    (prisma.rankingPointEvent.upsert as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      existingEvent,
    );

    const result = await createPointEvent({
      teamId: "team-1",
      tournamentId: "tournament-1",
      points: 100,
      type: "tournament.placement",
      dedupeKey: "tournament:t1:team:team-1",
    });

    expect(result).toBe(existingEvent);
    expect(prisma.rankingPointEvent.upsert).toHaveBeenCalledWith({
      where: { dedupeKey: "tournament:t1:team:team-1" },
      update: {},
      create: expect.objectContaining({
        teamId: "team-1",
        tournamentId: "tournament-1",
        points: 100,
        type: "tournament.placement",
        dedupeKey: "tournament:t1:team:team-1",
      }),
    });
  });
});

describe("createOrGetDefaultRankingSeason", () => {
  it("returns the active season when one exists", async () => {
    const season = { id: "season-1", slug: "season-1", isActive: true };
    (prisma.rankingSeason.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      season,
    );

    await expect(createOrGetDefaultRankingSeason()).resolves.toBe(season);
    expect(prisma.rankingSeason.upsert).not.toHaveBeenCalled();
  });

  it("creates the default season when no active season exists", async () => {
    const season = { id: "season-default", slug: "default", isActive: true };
    (prisma.rankingSeason.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      null,
    );
    (prisma.rankingSeason.upsert as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      season,
    );

    await expect(createOrGetDefaultRankingSeason()).resolves.toBe(season);
    expect(prisma.rankingSeason.upsert).toHaveBeenCalledWith({
      where: { slug: "default" },
      update: { isActive: true },
      create: expect.objectContaining({
        name: "Default Season",
        slug: "default",
        isActive: true,
      }),
    });
  });
});

describe("aggregateTeamLeaderboard", () => {
  it("aggregates team point events and ranks tied teams correctly", async () => {
    (prisma.rankingPointEvent.groupBy as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        teamId: "team-a",
        _sum: { points: 500 },
        _count: { _all: 3 },
      },
      {
        teamId: "team-b",
        _sum: { points: 250 },
        _count: { _all: 2 },
      },
      {
        teamId: "team-c",
        _sum: { points: 250 },
        _count: { _all: 1 },
      },
    ]);
    (prisma.team.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: "team-a",
        name: "Team A",
        gameId: "game-1",
        game: { id: "game-1", name: "Valorant", slug: "valorant" },
      },
      {
        id: "team-b",
        name: "Team B",
        gameId: "game-1",
        game: { id: "game-1", name: "Valorant", slug: "valorant" },
      },
      {
        id: "team-c",
        name: "Team C",
        gameId: "game-1",
        game: { id: "game-1", name: "Valorant", slug: "valorant" },
      },
    ]);

    const result = await aggregateTeamLeaderboard({
      seasonId: "season-1",
      gameId: "game-1",
    });

    expect(prisma.rankingPointEvent.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["teamId"],
        where: {
          seasonId: "season-1",
          gameId: "game-1",
          teamId: { not: null },
        },
      }),
    );
    expect(result.map((entry) => [entry.teamId, entry.totalPoints, entry.rank])).toEqual([
      ["team-a", 500, 1],
      ["team-b", 250, 2],
      ["team-c", 250, 2],
    ]);
    expect(result[0].tier.name).toBe("Challenger");
    expect(result[0].team?.name).toBe("Team A");
  });
});

describe("aggregatePlayerLeaderboard", () => {
  it("aggregates player point events and ignores events without users", async () => {
    (prisma.rankingPointEvent.groupBy as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        userId: "user-a",
        _sum: { points: 1201 },
        _count: { _all: 4 },
      },
    ]);
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: "user-a",
        username: "PlayerA",
        avatar: "avatar.png",
        discordId: "discord-a",
      },
    ]);

    const result = await aggregatePlayerLeaderboard();

    expect(prisma.rankingPointEvent.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["userId"],
        where: {
          userId: { not: null },
        },
      }),
    );
    expect(result).toEqual([
      expect.objectContaining({
        userId: "user-a",
        totalPoints: 1201,
        eventCount: 4,
        rank: 1,
        tier: expect.objectContaining({ name: "Elite" }),
        user: expect.objectContaining({ username: "PlayerA" }),
      }),
    ]);
  });
});
