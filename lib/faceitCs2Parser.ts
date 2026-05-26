// CS2 match result parser for FACEIT Data API v4 responses.
//
// Rules:
// - All stats access uses string keys with spaces (FACEIT convention).
// - Missing or malformed fields silently become undefined — never throws.
// - Does not touch any database or external service.

import type {
  FaceitMatchDetails,
  FaceitMatchStatsResponse,
} from "@/lib/faceitTypes";

export type ParsedFaceitCs2Player = {
  faceitPlayerId: string;
  nickname: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  adr?: number;
  headshotsPercent?: number;
  mvps?: number;
  kdRatio?: number;
};

export type ParsedFaceitCs2Team = {
  faceitTeamId: string;
  name?: string;
  finalScore?: number;
  won?: boolean;
  players: ParsedFaceitCs2Player[];
};

export type ParsedFaceitCs2MatchResult = {
  matchId: string;
  status: string;
  faceitUrl?: string;
  demoUrls: string[];
  map?: string;
  score?: {
    raw?: string;
    faction1?: number;
    faction2?: number;
  };
  winnerFaceitTeamId?: string;
  teams: ParsedFaceitCs2Team[];
};

function safeStatFloat(
  stats: Record<string, string>,
  key: string,
): number | undefined {
  const raw = stats[key];
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : undefined;
}

function safeStatInt(
  stats: Record<string, string>,
  key: string,
): number | undefined {
  const raw = stats[key];
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : undefined;
}

// Parses FACEIT score strings like "13 / 10".
function parseScoreString(raw: string): { faction1?: number; faction2?: number } {
  const parts = raw.split("/").map((p) => p.trim());
  if (parts.length !== 2) return {};
  const f1 = parseInt(parts[0], 10);
  const f2 = parseInt(parts[1], 10);
  return {
    faction1: Number.isFinite(f1) ? f1 : undefined,
    faction2: Number.isFinite(f2) ? f2 : undefined,
  };
}

function extractDemoUrls(details: FaceitMatchDetails): string[] {
  if (!Array.isArray(details.demo_url)) return [];
  return details.demo_url.filter((u): u is string => typeof u === "string" && u.length > 0);
}

export function parseFaceitCs2MatchResult(input: {
  matchId: string;
  details: FaceitMatchDetails;
  stats: FaceitMatchStatsResponse;
}): ParsedFaceitCs2MatchResult {
  const { matchId, details, stats } = input;

  const demoUrls = extractDemoUrls(details);
  const firstRound = stats.rounds?.[0];
  const roundStats = firstRound?.round_stats ?? {};

  const rawScore = roundStats["Score"];
  const score = rawScore
    ? { raw: rawScore, ...parseScoreString(rawScore) }
    : undefined;

  const map = roundStats["Map"] ?? undefined;
  const winnerFaceitTeamId = roundStats["Winner"] ?? undefined;

  const teams: ParsedFaceitCs2Team[] = (firstRound?.teams ?? []).map((team) => {
    const teamStats = team.team_stats ?? {};
    const finalScore = safeStatInt(teamStats, "Final Score");
    const won = teamStats["Team Win"] === "1";
    const name = teamStats["Team"] ?? undefined;

    const players: ParsedFaceitCs2Player[] = (team.players ?? []).map((p) => {
      const ps = p.player_stats ?? {};
      return {
        faceitPlayerId: p.player_id,
        nickname: p.nickname,
        kills: safeStatInt(ps, "Kills"),
        deaths: safeStatInt(ps, "Deaths"),
        assists: safeStatInt(ps, "Assists"),
        adr: safeStatFloat(ps, "ADR"),
        headshotsPercent: safeStatFloat(ps, "Headshots %"),
        mvps: safeStatInt(ps, "MVPs"),
        kdRatio: safeStatFloat(ps, "K/D Ratio"),
      };
    });

    return {
      faceitTeamId: team.team_id,
      name,
      finalScore,
      won,
      players,
    };
  });

  return {
    matchId,
    status: typeof details.status === "string" ? details.status : "unknown",
    faceitUrl: typeof details.faceit_url === "string" ? details.faceit_url : undefined,
    demoUrls,
    map,
    score,
    winnerFaceitTeamId,
    teams,
  };
}
