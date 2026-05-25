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
    [101, "Challenger"],
    [500, "Challenger"],
    [501, "Vanguard"],
    [1200, "Vanguard"],
    [1201, "Elite"],
    [2200, "Elite"],
    [2201, "Master"],
    [3600, "Master"],
    [3601, "Ascendant"],
    [5500, "Ascendant"],
    [5501, "Mythic"],
    [8000, "Mythic"],
    [8001, "Legend"],
    [12000, "Legend"],
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
