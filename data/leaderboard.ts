export type LeaderboardUser = {
  id: number | string;
  username: string;
  role: string;
  tournamentPoints: number;
  approvedRegistrations: number;
  rank: number;
};

export const leaderboardUsers: LeaderboardUser[] = [];
