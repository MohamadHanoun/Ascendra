// Minimal TypeScript types for FACEIT Data API v4 responses.
// Based on confirmed working endpoints tested against real data.
//
// IMPORTANT: FACEIT stats keys use strings with spaces ("Final Score", "Team Win",
// "Headshots %", etc.) — they are modelled as Record<string, string> intentionally.

export type FaceitPlayerGame = {
  name?: string;
  game_player_id?: string;
  game_player_name?: string;
  skill_level?: number;
  faceit_elo?: number;
  game_profile_id?: string;
  region?: string;
  [key: string]: unknown;
};

// GET /players?nickname=...&game=cs2
export type FaceitPlayer = {
  player_id: string;
  nickname: string;
  avatar?: string;
  country?: string;
  cover_image?: string;
  faceit_url?: string;
  games?: Record<string, FaceitPlayerGame>;
  steam_id_64?: string;
  steam_nickname?: string;
  [key: string]: unknown;
};

// GET /players/{id}/history?game=cs2
export type FaceitMatchHistoryItem = {
  match_id: string;
  game_id?: string;
  region?: string;
  match_type?: string;
  game_mode?: string;
  competition_id?: string;
  competition_name?: string;
  competition_type?: string;
  organizer_id?: string;
  status?: string;
  started_at?: number;
  finished_at?: number;
  results?: Record<string, unknown>;
  faceit_url?: string;
  [key: string]: unknown;
};

export type FaceitPlayerHistoryResponse = {
  start?: number;
  end?: number;
  items?: FaceitMatchHistoryItem[];
  [key: string]: unknown;
};

// GET /matches/{match_id}
export type FaceitMatchDetails = {
  match_id: string;
  version?: number;
  game?: string;
  region?: string;
  competition_id?: string;
  competition_type?: string;
  competition_name?: string;
  organizer_id?: string;
  teams?: Record<string, unknown>;
  calculate_elo?: boolean;
  configured_at?: number;
  started_at?: number;
  finished_at?: number;
  // FACEIT returns demo URLs as a string array
  demo_url?: string[];
  best_of?: number;
  results?: {
    winner?: string;
    score?: Record<string, number>;
    [key: string]: unknown;
  };
  status?: string;
  faceit_url?: string;
  [key: string]: unknown;
};

// GET /matches/{match_id}/stats
// Stats keys are dynamic strings with spaces — modelled as Record<string, string>
export type FaceitCs2PlayerStats = Record<string, string>;

export type FaceitCs2Team = {
  team_id: string;
  premade?: boolean;
  team_stats: Record<string, string>;
  players: Array<{
    player_id: string;
    nickname: string;
    player_stats: FaceitCs2PlayerStats;
  }>;
};

export type FaceitCs2Round = {
  best_of?: string;
  competition_id?: string;
  game_id?: string;
  game_mode?: string;
  match_id?: string;
  match_round?: string;
  played?: string;
  round_stats: Record<string, string>;
  teams: FaceitCs2Team[];
};

export type FaceitMatchStatsResponse = {
  rounds?: FaceitCs2Round[];
  [key: string]: unknown;
};

// Minimal shape for incoming FACEIT webhook events (Phase 1 skeleton)
export type FaceitWebhookPayload = {
  event?: string;
  event_id?: string;
  third_party_id?: string;
  app_id?: string;
  timestamp?: string;
  retry_count?: number;
  version?: number;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
};
