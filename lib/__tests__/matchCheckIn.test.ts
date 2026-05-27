import { describe, expect, it } from "vitest";

import {
  determineUserMatchTeam,
  summarizeMatchCheckIns,
} from "@/lib/matchCheckIn";

const teams = [
  {
    teamId: "team-a",
    name: "Team Alpha",
    leaderUserId: "leader-a",
    memberUserIds: ["player-a-1", "player-a-2"],
  },
  {
    teamId: "team-b",
    name: "Team Beta",
    leaderUserId: "leader-b",
    memberUserIds: ["player-b-1"],
  },
];

describe("determineUserMatchTeam", () => {
  it("detects a user in team 1", () => {
    expect(determineUserMatchTeam({ userId: "player-a-1", teams })).toBe(
      "team-a",
    );
  });

  it("detects a user in team 2", () => {
    expect(determineUserMatchTeam({ userId: "player-b-1", teams })).toBe(
      "team-b",
    );
  });

  it("detects a team leader", () => {
    expect(determineUserMatchTeam({ userId: "leader-a", teams })).toBe(
      "team-a",
    );
  });

  it("returns null for a user outside the match", () => {
    expect(determineUserMatchTeam({ userId: "spectator", teams })).toBeNull();
  });

  it("handles missing team data", () => {
    expect(
      determineUserMatchTeam({
        userId: "player-a-1",
        teams: [{ teamId: null, name: "TBD" }],
      }),
    ).toBeNull();
  });
});

describe("summarizeMatchCheckIns", () => {
  it("groups check-ins by team and counts participants", () => {
    const summary = summarizeMatchCheckIns({
      teams,
      checkIns: [
        {
          userId: "leader-a",
          teamId: "team-a",
          username: "leader",
          createdAt: "2026-05-27T00:00:00.000Z",
        },
        {
          userId: "player-b-1",
          teamId: "team-b",
          username: "beta",
          createdAt: "2026-05-27T00:01:00.000Z",
        },
      ],
    });

    expect(summary).toEqual([
      {
        teamId: "team-a",
        name: "Team Alpha",
        totalMembers: 3,
        checkedInCount: 1,
        checkIns: [
          {
            userId: "leader-a",
            teamId: "team-a",
            username: "leader",
            createdAt: "2026-05-27T00:00:00.000Z",
          },
        ],
      },
      {
        teamId: "team-b",
        name: "Team Beta",
        totalMembers: 2,
        checkedInCount: 1,
        checkIns: [
          {
            userId: "player-b-1",
            teamId: "team-b",
            username: "beta",
            createdAt: "2026-05-27T00:01:00.000Z",
          },
        ],
      },
    ]);
  });

  it("uses unknown totals when no participants are available", () => {
    const summary = summarizeMatchCheckIns({
      teams: [{ teamId: "team-a", name: "Team Alpha" }],
      checkIns: [],
    });

    expect(summary[0]).toMatchObject({
      totalMembers: null,
      checkedInCount: 0,
    });
  });
});
