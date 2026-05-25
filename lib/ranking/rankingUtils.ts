export type RankingTierName =
  | "Unranked"
  | "Initiate"
  | "Challenger"
  | "Vanguard"
  | "Elite"
  | "Master"
  | "Ascendant"
  | "Mythic"
  | "Legend"
  | "Eternal";

export type RankingTier = {
  name: RankingTierName;
  minPoints: number;
  maxPoints: number | null;
};

export type RankableEntry = {
  totalPoints: number;
};

export type RankedEntry<T extends RankableEntry> = T & {
  rank: number;
};

export const rankingTiers: RankingTier[] = [
  { name: "Unranked", minPoints: 0, maxPoints: 0 },
  { name: "Initiate", minPoints: 1, maxPoints: 100 },
  { name: "Challenger", minPoints: 101, maxPoints: 500 },
  { name: "Vanguard", minPoints: 501, maxPoints: 1200 },
  { name: "Elite", minPoints: 1201, maxPoints: 2200 },
  { name: "Master", minPoints: 2201, maxPoints: 3600 },
  { name: "Ascendant", minPoints: 3601, maxPoints: 5500 },
  { name: "Mythic", minPoints: 5501, maxPoints: 8000 },
  { name: "Legend", minPoints: 8001, maxPoints: 12000 },
  { name: "Eternal", minPoints: 12001, maxPoints: null },
];

export function getTierFromPoints(points: number): RankingTier {
  const safePoints = Math.max(0, Math.floor(points));

  return (
    rankingTiers.find((tier) => {
      if (safePoints < tier.minPoints) {
        return false;
      }

      return tier.maxPoints === null || safePoints <= tier.maxPoints;
    }) ?? rankingTiers[0]
  );
}

export function calculateCompetitionRanks<T extends RankableEntry>(
  entries: T[],
): Array<RankedEntry<T>> {
  const sortedEntries = [...entries].sort((a, b) => b.totalPoints - a.totalPoints);
  let previousPoints: number | null = null;
  let currentRank = 0;

  return sortedEntries.map((entry, index) => {
    if (previousPoints !== entry.totalPoints) {
      currentRank = index + 1;
      previousPoints = entry.totalPoints;
    }

    return {
      ...entry,
      rank: currentRank,
    };
  });
}
