import { describe, expect, it } from "vitest";

import {
  calculateCompetitionRanks,
  getTierFromPoints,
} from "@/lib/ranking/rankingUtils";

describe("getTierFromPoints", () => {
  it.each([
    [0, "Unranked"],
    [1, "Initiate"],
    [100, "Initiate"],
    [101, "Ember"],
    [500, "Ember"],
    [501, "Riftborn"],
    [1200, "Riftborn"],
    [1201, "Obsidian"],
    [2200, "Obsidian"],
    [2201, "Aether"],
    [3600, "Aether"],
    [3601, "Celestial"],
    [5500, "Celestial"],
    [5501, "Paragon"],
    [8000, "Paragon"],
    [8001, "Apex"],
    [12000, "Apex"],
    [12001, "Eternal"],
  ])("maps %i points to %s", (points, expectedTier) => {
    expect(getTierFromPoints(points).name).toBe(expectedTier);
  });

  it("treats negative points as unranked", () => {
    expect(getTierFromPoints(-50).name).toBe("Unranked");
  });
});

describe("calculateCompetitionRanks", () => {
  it("sorts by points and assigns competition ranks", () => {
    const ranked = calculateCompetitionRanks([
      { id: "c", totalPoints: 50 },
      { id: "a", totalPoints: 100 },
      { id: "b", totalPoints: 75 },
      { id: "d", totalPoints: 75 },
    ]);

    expect(ranked).toEqual([
      { id: "a", totalPoints: 100, rank: 1 },
      { id: "b", totalPoints: 75, rank: 2 },
      { id: "d", totalPoints: 75, rank: 2 },
      { id: "c", totalPoints: 50, rank: 4 },
    ]);
  });
});
