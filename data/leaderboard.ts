export type LeaderboardUser = {
  id: number | string;
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
    role: "Founder",
    level: 25,
    xp: 12450,
    rank: 1,
  },
  {
    id: 2,
    username: "RTN_Player",
    role: "Member",
    level: 18,
    xp: 8900,
    rank: 2,
  },
  {
    id: 3,
    username: "TempleRunner",
    role: "Tournament Player",
    level: 14,
    xp: 6700,
    rank: 3,
  },
  {
    id: 4,
    username: "RiftHunter",
    role: "Member",
    level: 9,
    xp: 4200,
    rank: 4,
  },
];