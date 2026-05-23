export type LeaderboardUser = {
  id: number | string;
  username: string;
  role: string;
  tournamentPoints: number;
  tournamentResults: number;
  bestPlacement: number | null;
  rank: number;
};

export type LeaderboardTeam = {
  id: number | string;
  name: string;
  game: string | null;
  leaderName: string;
  membersCount: number;
  tournamentPoints: number;
  tournamentResults: number;
  bestPlacement: number | null;
  rank: number;
};

export const leaderboardUsers: LeaderboardUser[] = [];
export const leaderboardTeams: LeaderboardTeam[] = [];
