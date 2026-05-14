export type LeaderboardUser = {
  id: number;
  username: string;
  role: string;
  level: number;
  xp: number;
  rank: number;
};

export const leaderboardUsers: LeaderboardUser[] = [
  {
    id: 1,
    username: "Mohamad",
    role: "Owner",
    level: 25,
    xp: 12450,
    rank: 1,
  },
  {
    id: 2,
    username: "PlayerOne",
    role: "Tournament Player",
    level: 18,
    xp: 8900,
    rank: 2,
  },
  {
    id: 3,
    username: "NightFox",
    role: "Member",
    level: 14,
    xp: 6700,
    rank: 3,
  },
  {
    id: 4,
    username: "Shadow",
    role: "Member",
    level: 9,
    xp: 4200,
    rank: 4,
  },
];