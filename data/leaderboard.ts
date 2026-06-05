export type LeaderboardUser = {
  id: number | string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  role: string;
  tournamentPoints: number;
  tournamentResults: number;
  bestPlacement: number | null;
  rank: number;
  tier: string;
};

export type LeaderboardTeam = {
  id: number | string;
  name: string;
  game: string | null;
  leaderName: string | null;
  membersCount: number;
  tournamentPoints: number;
  tournamentResults: number;
  bestPlacement: number | null;
  rank: number;
  tier: string;
};
