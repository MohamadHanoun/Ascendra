// Server-only: reads env vars, queries DB, calls engine.
// Pure mapping helpers are exported for unit tests.

import { prisma } from "@/lib/prisma";
import { applyFaceitAutoResult } from "@/lib/tournamentMatchEngine";
import type { ParsedFaceitCs2MatchResult } from "@/lib/faceitCs2Parser";

// ─── Env flags ────────────────────────────────────────────────────────────────

export function isFaceitAutoConfirmEnabled(): boolean {
  return process.env.FACEIT_AUTO_CONFIRM_ENABLED === "true";
}

export function allowFaceitFactionOrderFallback(): boolean {
  return process.env.FACEIT_AUTO_CONFIRM_ALLOW_FACTION_ORDER === "true";
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function isFaceitMatchFinished(parsed: ParsedFaceitCs2MatchResult): boolean {
  return parsed.status === "FINISHED";
}

export function hasFaceitScore(parsed: ParsedFaceitCs2MatchResult): boolean {
  const { faction1, faction2 } = parsed.score ?? {};
  return (
    faction1 !== undefined &&
    faction2 !== undefined &&
    Number.isFinite(faction1) &&
    Number.isFinite(faction2)
  );
}

// ─── Pure mapping helpers (exported for tests) ────────────────────────────────

type FaceitTeamSlim = {
  faceitTeamId: string;
  players: { faceitPlayerId: string }[];
};

type MappingResult = {
  winnerTeamId: string;
  teamAScore: number;
  teamBScore: number;
};

/**
 * Resolves Ascendra team → FACEIT team mapping using player ID overlap.
 * Returns null if overlap is ambiguous or zero.
 */
export function resolveStrictMapping(
  teams: FaceitTeamSlim[],
  score: { faction1: number; faction2: number },
  winnerFaceitTeamId: string | undefined,
  teamAFaceitIds: ReadonlySet<string>,
  teamBFaceitIds: ReadonlySet<string>,
  teamAId: string,
  teamBId: string,
): MappingResult | null {
  if (teams.length < 2) return null;

  const t0Players = new Set(teams[0].players.map((p) => p.faceitPlayerId));
  const t1Players = new Set(teams[1].players.map((p) => p.faceitPlayerId));

  const t0vA = countIntersection(t0Players, teamAFaceitIds);
  const t0vB = countIntersection(t0Players, teamBFaceitIds);
  const t1vA = countIntersection(t1Players, teamAFaceitIds);
  const t1vB = countIntersection(t1Players, teamBFaceitIds);

  const naturalScore = t0vA + t1vB;   // team0 → teamA, team1 → teamB
  const reversedScore = t0vB + t1vA;  // team0 → teamB, team1 → teamA

  if (naturalScore === 0 && reversedScore === 0) return null;
  if (naturalScore === reversedScore) return null; // ambiguous

  const team0MapsToA = naturalScore > reversedScore;
  const isTeam0Winner = winnerFaceitTeamId === teams[0].faceitTeamId;

  if (team0MapsToA) {
    return {
      winnerTeamId: isTeam0Winner ? teamAId : teamBId,
      teamAScore: score.faction1,
      teamBScore: score.faction2,
    };
  }

  return {
    winnerTeamId: isTeam0Winner ? teamBId : teamAId,
    teamAScore: score.faction2,
    teamBScore: score.faction1,
  };
}

/**
 * Faction-order fallback: FACEIT teams[0] → Ascendra teamA, teams[1] → teamB.
 */
export function resolveFactionOrderMapping(
  teams: FaceitTeamSlim[],
  score: { faction1: number; faction2: number },
  winnerFaceitTeamId: string | undefined,
  teamAId: string,
  teamBId: string,
): MappingResult | null {
  if (teams.length < 2) return null;
  const isTeam0Winner = winnerFaceitTeamId === teams[0].faceitTeamId;
  return {
    winnerTeamId: isTeam0Winner ? teamAId : teamBId,
    teamAScore: score.faction1,
    teamBScore: score.faction2,
  };
}

function countIntersection(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  let n = 0;
  for (const x of a) {
    if (b.has(x)) n++;
  }
  return n;
}

// ─── DB helper: load team FACEIT player IDs ───────────────────────────────────

async function getTeamFaceitPlayerIds(teamId: string): Promise<Set<string>> {
  const [members, team] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId },
      select: { user: { select: { faceitPlayerId: true } } },
    }),
    prisma.team.findUnique({
      where: { id: teamId },
      select: { leader: { select: { faceitPlayerId: true } } },
    }),
  ]);

  const ids = new Set<string>();
  for (const m of members) {
    if (m.user.faceitPlayerId) ids.add(m.user.faceitPlayerId);
  }
  if (team?.leader?.faceitPlayerId) ids.add(team.leader.faceitPlayerId);
  return ids;
}

// ─── Auto-confirm result type ─────────────────────────────────────────────────

export type FaceitAutoConfirmResult =
  | { applied: true; mappingMethod: "strict" | "faction_order" }
  | {
      applied: false;
      reason:
        | "disabled"
        | "not_finished"
        | "missing_score"
        | "already_terminal"
        | "mapping_failed"
        | "engine_error";
    };

// ─── Main entry point ─────────────────────────────────────────────────────────

const TERMINAL_STATUSES = new Set([
  "completed",
  "confirmed",
  "cancelled",
  "forfeit",
  "bye",
]);

export async function attemptFaceitAutoConfirm(
  matchId: string,
  parsed: ParsedFaceitCs2MatchResult,
): Promise<FaceitAutoConfirmResult> {
  if (!isFaceitAutoConfirmEnabled()) {
    return { applied: false, reason: "disabled" };
  }

  if (!isFaceitMatchFinished(parsed)) {
    return { applied: false, reason: "not_finished" };
  }

  if (!hasFaceitScore(parsed)) {
    return { applied: false, reason: "missing_score" };
  }

  const score = parsed.score as { faction1: number; faction2: number };

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { id: true, status: true, teamAId: true, teamBId: true },
  });

  if (!match || !match.teamAId || !match.teamBId) {
    return { applied: false, reason: "engine_error" };
  }

  if (TERMINAL_STATUSES.has(match.status)) {
    return { applied: false, reason: "already_terminal" };
  }

  // Attempt strict player-ID mapping.
  const [teamAIds, teamBIds] = await Promise.all([
    getTeamFaceitPlayerIds(match.teamAId),
    getTeamFaceitPlayerIds(match.teamBId),
  ]);

  const strict = resolveStrictMapping(
    parsed.teams,
    score,
    parsed.winnerFaceitTeamId,
    teamAIds,
    teamBIds,
    match.teamAId,
    match.teamBId,
  );

  const mapping =
    strict ??
    (allowFaceitFactionOrderFallback()
      ? resolveFactionOrderMapping(
          parsed.teams,
          score,
          parsed.winnerFaceitTeamId,
          match.teamAId,
          match.teamBId,
        )
      : null);

  if (!mapping) {
    return { applied: false, reason: "mapping_failed" };
  }

  const mappingMethod: "strict" | "faction_order" = strict ? "strict" : "faction_order";

  const result = await applyFaceitAutoResult({
    matchId,
    winnerTeamId: mapping.winnerTeamId,
    teamAScore: mapping.teamAScore,
    teamBScore: mapping.teamBScore,
    mappingMethod,
  });

  if (!result.ok) {
    return { applied: false, reason: "engine_error" };
  }

  return { applied: true, mappingMethod };
}
