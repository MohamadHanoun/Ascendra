import { describe, expect, it } from "vitest";

import {
  countTeamPlayers,
  hasTournamentCapacity,
  meetsTeamSize,
} from "@/lib/tournamentRegistrationHelpers";

// ─── countTeamPlayers ─────────────────────────────────────────────────────────

describe("countTeamPlayers", () => {
  it("counts leader alone when members is empty", () => {
    expect(countTeamPlayers({ leaderId: "leader-1", members: [] })).toBe(1);
  });

  it("counts leader + members", () => {
    expect(
      countTeamPlayers({
        leaderId: "leader-1",
        members: [{ userId: "p2" }, { userId: "p3" }],
      }),
    ).toBe(3);
  });

  it("deduplicates if leader also appears in members (edge case)", () => {
    expect(
      countTeamPlayers({
        leaderId: "leader-1",
        members: [{ userId: "leader-1" }, { userId: "p2" }],
      }),
    ).toBe(2); // leader counted once
  });

  it("counts all unique members when no duplicates", () => {
    expect(
      countTeamPlayers({
        leaderId: "l",
        members: [
          { userId: "a" },
          { userId: "b" },
          { userId: "c" },
          { userId: "d" },
        ],
      }),
    ).toBe(5);
  });
});

// ─── meetsTeamSize ────────────────────────────────────────────────────────────

describe("meetsTeamSize", () => {
  it("accepts a team with exactly the required number of players", () => {
    expect(meetsTeamSize(5, 5)).toBe(true);
  });

  it("accepts a team larger than the required size", () => {
    expect(meetsTeamSize(6, 5)).toBe(true);
  });

  it("rejects a team below required size", () => {
    expect(meetsTeamSize(4, 5)).toBe(false);
  });

  it("rejects a team with 0 players against any positive requirement", () => {
    expect(meetsTeamSize(0, 1)).toBe(false);
  });

  it("accepts a single-player team when requirement is 1", () => {
    expect(meetsTeamSize(1, 1)).toBe(true);
  });
});

// ─── teamSize with leader included (bug-fix scenario) ─────────────────────────

describe("teamSize validation with leader included (bug fix)", () => {
  it("accepts a 5v5 team: leader + 4 members = 5 total", () => {
    const team = {
      leaderId: "leader",
      members: [
        { userId: "p2" },
        { userId: "p3" },
        { userId: "p4" },
        { userId: "p5" },
      ],
    };
    const total = countTeamPlayers(team);
    expect(total).toBe(5);
    expect(meetsTeamSize(total, 5)).toBe(true);
  });

  it("rejects a 5v5 team with only leader + 3 members = 4 total", () => {
    const team = {
      leaderId: "leader",
      members: [{ userId: "p2" }, { userId: "p3" }, { userId: "p4" }],
    };
    const total = countTeamPlayers(team);
    expect(total).toBe(4);
    expect(meetsTeamSize(total, 5)).toBe(false);
  });

  it("accepts a 1v1 team that is just the leader with no members", () => {
    const team = { leaderId: "leader", members: [] };
    const total = countTeamPlayers(team);
    expect(total).toBe(1);
    expect(meetsTeamSize(total, 1)).toBe(true);
  });
});

// ─── hasTournamentCapacity ────────────────────────────────────────────────────

describe("hasTournamentCapacity", () => {
  it("allows registration when no teams have registered yet", () => {
    expect(hasTournamentCapacity(0, 16)).toBe(true);
  });

  it("allows registration when one slot remains", () => {
    expect(hasTournamentCapacity(15, 16)).toBe(true);
  });

  it("blocks registration when tournament is exactly full", () => {
    expect(hasTournamentCapacity(16, 16)).toBe(false);
  });

  it("blocks registration when tournament has overflowed (safety net)", () => {
    expect(hasTournamentCapacity(17, 16)).toBe(false);
  });

  it("blocks a single-slot tournament that is already taken", () => {
    expect(hasTournamentCapacity(1, 1)).toBe(false);
  });

  it("allows the first registration in a single-slot tournament", () => {
    expect(hasTournamentCapacity(0, 1)).toBe(true);
  });
});

// ─── capacity race-condition logic ────────────────────────────────────────────
//
// True concurrency cannot be reproduced in a unit test, but we can verify that
// the check-then-write logic is correct for boundary values — confirming that
// the transactional re-check will behave correctly at the DB level.

describe("capacity check at boundary (race-condition logic)", () => {
  it("the 16th team is allowed when maxTeams is 16", () => {
    // 15 active registrations → one slot left
    expect(hasTournamentCapacity(15, 16)).toBe(true);
  });

  it("the 17th team is blocked even if the pre-check passed (simulates race)", () => {
    // Imagine two requests both passed the outer check at count=15.
    // The inner (transactional) re-check at count=16 must block the second.
    expect(hasTournamentCapacity(16, 16)).toBe(false);
  });
});
