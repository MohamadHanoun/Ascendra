export type LeaderboardUser = {
  id: number | string;
  username: string;
  role: string;
  tournamentPoints: number;
  tournamentResults: number;
  bestPlacement: number | null;
  rank: number;
};

export const leaderboardUsers: LeaderboardUser[] = [];
