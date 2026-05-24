/**
 * VALORANT semi-automatic result verification adapter.
 *
 * IMPORTANT: Riot does NOT provide a VALORANT Tournament API (no custom-lobby
 * creation, no tournament codes). This adapter performs POST-GAME verification
 * only — it fetches a submitted match ID from the VALORANT Match API and
 * applies a set of confidence checks. Manual reporting remains the final
 * fallback when verification cannot be completed.
 */

import { AuditStatus, GameProvider, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  CreateRoomInput,
  CreateRoomResult,
  GameIntegrationAdapter,
  ParseWinnerInput,
  ParseWinnerResult,
  SyncMatchResultInput,
  SyncMatchResultResult,
  VerifyPlayersInput,
  VerifyPlayersResult,
} from "./types";

// ─── Configuration ────────────────────────────────────────────────────────────

function getApiKey(): string | null {
  return process.env.RIOT_API_KEY?.trim() || null;
}

function getRegion(): string {
  // VALORANT match API uses platform routing: na | eu | ap | kr
  const raw = (process.env.RIOT_VAL_REGION || "na").toLowerCase();
  return ["na", "eu", "ap", "kr"].includes(raw) ? raw : "na";
}

function getTimeWindowMs(): number {
  const hours = parseFloat(process.env.RIOT_VAL_TIME_WINDOW_HOURS || "4");
  return (Number.isFinite(hours) ? Math.max(1, hours) : 4) * 60 * 60 * 1000;
}

// Minimum fraction of team members that must appear in the match (0–1).
const MIN_TEAM_COVERAGE = 0.4;

// ─── Riot API base ────────────────────────────────────────────────────────────

function matchApiBase(): string {
  return `https://${getRegion()}.api.riotgames.com`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Audit ────────────────────────────────────────────────────────────────────

async function writeAudit(input: {
  action: string;
  request?: Prisma.InputJsonValue;
  response?: Prisma.InputJsonValue;
  status: AuditStatus;
  error?: string | null;
}) {
  try {
    await prisma.gameApiAuditLog.create({
      data: {
        provider: GameProvider.riot_valorant,
        action: input.action,
        request: input.request,
        response: input.response,
        status: input.status,
        error: input.error ?? null,
      },
    });
  } catch (e) {
    console.error("[riotValorant] audit write failed:", e);
  }
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

type ValResponse<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; error: string; raw?: unknown };

async function valFetch<T>(opts: {
  action: string;
  path: string;
  maxAttempts?: number;
}): Promise<ValResponse<T>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { ok: false, status: 0, error: "RIOT_API_KEY is not configured." };
  }

  const url = `${matchApiBase()}${opts.path}`;
  const maxAttempts = opts.maxAttempts ?? 4;
  let lastError = "";
  let lastStatus = 0;
  let lastBody: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          "X-Riot-Token": apiKey,
          Accept: "application/json",
        },
        cache: "no-store",
      });
    } catch (e) {
      lastError = e instanceof Error ? e.message : "network_error";
      if (attempt < maxAttempts) {
        await sleep(500 * attempt);
        continue;
      }
      break;
    }

    lastStatus = res.status;
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    lastBody = parsed;

    if (res.ok) {
      await writeAudit({
        action: opts.action,
        request: { path: opts.path } as Prisma.InputJsonValue,
        response: parsed as Prisma.InputJsonValue,
        status: AuditStatus.success,
      });
      return { ok: true, data: parsed as T, status: res.status };
    }

    const retryAfter = res.headers.get("retry-after");
    const waitMs = retryAfter
      ? Math.max(1, parseInt(retryAfter, 10)) * 1000
      : 500 * Math.pow(2, attempt - 1);

    const shouldRetry = [429, 502, 503, 504].includes(res.status);
    if (shouldRetry && attempt < maxAttempts) {
      await writeAudit({
        action: opts.action,
        request: { path: opts.path, attempt },
        response: parsed as Prisma.InputJsonValue,
        status: AuditStatus.retrying,
        error: `http_${res.status}`,
      });
      await sleep(waitMs);
      continue;
    }

    lastError = `http_${res.status}`;
    break;
  }

  await writeAudit({
    action: opts.action,
    request: { path: opts.path } as Prisma.InputJsonValue,
    response: lastBody as Prisma.InputJsonValue,
    status: AuditStatus.failure,
    error: lastError || `http_${lastStatus}`,
  });
  return { ok: false, status: lastStatus, error: lastError, raw: lastBody };
}

// ─── VALORANT match API types ─────────────────────────────────────────────────

type ValMatchInfo = {
  matchId: string;
  mapId: string;
  gameLengthMillis: number;
  gameStartMillis: number;
  isCompleted: boolean;
  queueId: string;
  gameMode: string;
  seasonId: string;
};

type ValPlayer = {
  puuid: string;
  teamId: string; // "Blue" | "Red"
  characterId?: string;
  stats?: { score?: number; kills?: number; deaths?: number; assists?: number };
  competitiveTier?: number;
  playerCard?: string;
  playerTitle?: string;
  partyId?: string;
};

type ValTeam = {
  teamId: string; // "Blue" | "Red"
  won: boolean;
  roundsPlayed: number;
  roundsWon: number;
};

export type ValMatch = {
  matchInfo: ValMatchInfo;
  players: ValPlayer[];
  teams: ValTeam[];
};

// ─── Match fetcher ────────────────────────────────────────────────────────────

export async function fetchValMatch(
  valorantMatchId: string,
): Promise<ValResponse<ValMatch>> {
  return valFetch<ValMatch>({
    action: "valorant.match.fetch",
    path: `/val/match/v1/matches/${encodeURIComponent(valorantMatchId)}`,
  });
}

// ─── Matchlist fetcher ────────────────────────────────────────────────────────

type ValMatchlistEntry = {
  matchId: string;
  gameStartTimeMillis: number;
  queueId: string;
};

type ValMatchlist = {
  puuid: string;
  history: ValMatchlistEntry[];
};

export async function fetchValMatchlist(
  puuid: string,
): Promise<ValResponse<ValMatchlist>> {
  return valFetch<ValMatchlist>({
    action: "valorant.matchlist.fetch",
    path: `/val/match/v1/matchlists/by-puuid/${encodeURIComponent(puuid)}`,
  });
}

// ─── Verification types ───────────────────────────────────────────────────────

export type VerificationChecks = {
  uniqueMatchId: boolean;
  customGame: boolean;
  timeWindow: boolean | null; // null = no scheduled time to compare
  teamACoverage: number; // 0..1
  teamBCoverage: number; // 0..1
  winnerMapped: boolean;
};

export type Confidence = "high" | "medium" | "rejected";

export type ValorantVerificationResult = {
  confidence: Confidence;
  winnerTeamId: string | null;
  winningValSide: string | null; // "Blue" or "Red"
  teamAScore: number; // rounds won
  teamBScore: number;
  reason: string;
  checks: VerificationChecks;
  raw: ValMatch;
};

// ─── Core verification ────────────────────────────────────────────────────────

export async function verifyValorantMatch(opts: {
  valorantMatchId: string;
  tournamentId: string;
  matchId: string;
  teamAId: string;
  teamBId: string;
  scheduledAt: Date | null;
}): Promise<
  | { ok: true; result: ValorantVerificationResult }
  | { ok: false; error: string }
> {
  // 1. Fetch match from Riot.
  const fetchResult = await fetchValMatch(opts.valorantMatchId);
  if (!fetchResult.ok) {
    return {
      ok: false,
      error:
        fetchResult.status === 404
          ? "Match not found. Check that the Match ID is correct."
          : `Riot API error: ${fetchResult.error}`,
    };
  }
  const raw = fetchResult.data;

  // 2. Unique match ID within tournament.
  const existingUse = await prisma.tournamentMatchGame.findFirst({
    where: {
      externalMatchId: opts.valorantMatchId,
      match: { tournamentId: opts.tournamentId },
      matchId: { not: opts.matchId },
    },
    select: { id: true },
  });
  const uniqueMatchId = existingUse === null;

  // 3. Custom game check.
  const customGame = raw.matchInfo.queueId === "custom";

  // 4. Time window check.
  let timeWindow: boolean | null = null;
  if (opts.scheduledAt) {
    const scheduledMs = opts.scheduledAt.getTime();
    const gameStartMs = raw.matchInfo.gameStartMillis;
    timeWindow =
      Math.abs(gameStartMs - scheduledMs) <= getTimeWindowMs();
  }

  // 5. Participant mapping.
  const teamAMembers = await prisma.teamMember.findMany({
    where: { teamId: opts.teamAId },
    select: { userId: true },
  });
  const teamALeader = await prisma.team.findUnique({
    where: { id: opts.teamAId },
    select: { leaderId: true },
  });
  const teamAUserIds = [
    ...new Set([
      ...teamAMembers.map((m) => m.userId),
      ...(teamALeader ? [teamALeader.leaderId] : []),
    ]),
  ];

  const teamBMembers = await prisma.teamMember.findMany({
    where: { teamId: opts.teamBId },
    select: { userId: true },
  });
  const teamBLeader = await prisma.team.findUnique({
    where: { id: opts.teamBId },
    select: { leaderId: true },
  });
  const teamBUserIds = [
    ...new Set([
      ...teamBMembers.map((m) => m.userId),
      ...(teamBLeader ? [teamBLeader.leaderId] : []),
    ]),
  ];

  const allUserIds = [...new Set([...teamAUserIds, ...teamBUserIds])];
  const linkedAccounts = await prisma.playerGameAccount.findMany({
    where: {
      userId: { in: allUserIds },
      provider: GameProvider.riot_valorant,
    },
    select: { userId: true, externalId: true },
  });

  // Also accept riot_lol PUUIDs — same PUUID works for VALORANT.
  const linkedLolAccounts = await prisma.playerGameAccount.findMany({
    where: {
      userId: { in: allUserIds },
      provider: GameProvider.riot_lol,
    },
    select: { userId: true, externalId: true },
  });

  const puuidToUserId = new Map<string, string>();
  for (const acc of [...linkedAccounts, ...linkedLolAccounts]) {
    puuidToUserId.set(acc.externalId, acc.userId);
  }

  const matchPuuids = new Set(raw.players.map((p) => p.puuid));

  // Map Riot side ("Blue"/"Red") to player PUUIDs.
  const bluePuuids = new Set(
    raw.players.filter((p) => p.teamId === "Blue").map((p) => p.puuid),
  );
  const redPuuids = new Set(
    raw.players.filter((p) => p.teamId === "Red").map((p) => p.puuid),
  );

  // Count how many linked users from each Ascendra team appear in each side.
  const teamALinkedPuuids = [...puuidToUserId.entries()]
    .filter(([, uid]) => teamAUserIds.includes(uid))
    .map(([puuid]) => puuid)
    .filter((p) => matchPuuids.has(p));

  const teamBLinkedPuuids = [...puuidToUserId.entries()]
    .filter(([, uid]) => teamBUserIds.includes(uid))
    .map(([puuid]) => puuid)
    .filter((p) => matchPuuids.has(p));

  const teamATotal = Math.max(teamAUserIds.length, 1);
  const teamBTotal = Math.max(teamBUserIds.length, 1);
  const teamACoverage = teamALinkedPuuids.length / teamATotal;
  const teamBCoverage = teamBLinkedPuuids.length / teamBTotal;

  // Determine which Val side each Ascendra team maps to.
  const teamABlueHits = teamALinkedPuuids.filter((p) => bluePuuids.has(p)).length;
  const teamARedHits = teamALinkedPuuids.filter((p) => redPuuids.has(p)).length;
  const teamBBlueHits = teamBLinkedPuuids.filter((p) => bluePuuids.has(p)).length;
  const teamBRedHits = teamBLinkedPuuids.filter((p) => redPuuids.has(p)).length;

  // Team A side: whichever side has more hits. Same for B.
  const teamAValSide =
    teamABlueHits >= teamARedHits ? "Blue" : "Red";
  const teamBValSide = teamAValSide === "Blue" ? "Red" : "Blue";

  // 6. Winner mapping.
  const winningValTeam = raw.teams.find((t) => t.won);
  const winnerMapped =
    winningValTeam !== undefined &&
    (teamALinkedPuuids.length > 0 || teamBLinkedPuuids.length > 0);

  let winnerTeamId: string | null = null;
  let winningValSide: string | null = null;
  let teamAScore = 0;
  let teamBScore = 0;

  if (winningValTeam) {
    winningValSide = winningValTeam.teamId;
    const valTeamA = raw.teams.find((t) => t.teamId === teamAValSide);
    const valTeamB = raw.teams.find((t) => t.teamId === teamBValSide);
    teamAScore = valTeamA?.roundsWon ?? 0;
    teamBScore = valTeamB?.roundsWon ?? 0;

    if (teamALinkedPuuids.length > 0 || teamBLinkedPuuids.length > 0) {
      winnerTeamId =
        winningValTeam.teamId === teamAValSide
          ? opts.teamAId
          : opts.teamBId;
    }
  }

  // 7. Confidence scoring.
  const checks: VerificationChecks = {
    uniqueMatchId,
    customGame,
    timeWindow,
    teamACoverage,
    teamBCoverage,
    winnerMapped,
  };

  // Hard rejects.
  if (!uniqueMatchId) {
    return {
      ok: true,
      result: {
        confidence: "rejected",
        winnerTeamId: null,
        winningValSide: null,
        teamAScore: 0,
        teamBScore: 0,
        reason:
          "This match ID has already been used by another game in this tournament.",
        checks,
        raw,
      },
    };
  }

  if (!customGame) {
    return {
      ok: true,
      result: {
        confidence: "rejected",
        winnerTeamId: null,
        winningValSide: null,
        teamAScore: 0,
        teamBScore: 0,
        reason: `Match queue "${raw.matchInfo.queueId}" is not a custom game. Only custom lobbies are valid for tournament results.`,
        checks,
        raw,
      },
    };
  }

  if (timeWindow === false) {
    return {
      ok: true,
      result: {
        confidence: "rejected",
        winnerTeamId: null,
        winningValSide: null,
        teamAScore: 0,
        teamBScore: 0,
        reason: `Match played outside the allowed time window (±${getTimeWindowMs() / 3600000}h of scheduled start).`,
        checks,
        raw,
      },
    };
  }

  if (!winnerMapped || !winnerTeamId) {
    return {
      ok: true,
      result: {
        confidence: "rejected",
        winnerTeamId: null,
        winningValSide,
        teamAScore,
        teamBScore,
        reason:
          "Could not map the winning side to an Ascendra team. Ensure players have linked their Riot accounts.",
        checks,
        raw,
      },
    };
  }

  // High confidence: both teams have enough verified players.
  const highConfidence =
    teamACoverage >= MIN_TEAM_COVERAGE &&
    teamBCoverage >= MIN_TEAM_COVERAGE &&
    winnerTeamId !== null;

  return {
    ok: true,
    result: {
      confidence: highConfidence ? "high" : "medium",
      winnerTeamId,
      winningValSide,
      teamAScore,
      teamBScore,
      reason: highConfidence
        ? "All verification checks passed."
        : `Low participant coverage (team A: ${Math.round(teamACoverage * 100)}%, team B: ${Math.round(teamBCoverage * 100)}%). Result flagged for admin review.`,
      checks,
      raw,
    },
  };
}

// ─── "Find recent match" discovery ────────────────────────────────────────────

export type RecentMatchCandidate = {
  valorantMatchId: string;
  gameStartMillis: number;
  minutesAgo: number;
  teamACoverage: number;
  teamBCoverage: number;
};

export async function findRecentCustomMatches(opts: {
  teamAId: string;
  teamBId: string;
  scheduledAt: Date | null;
  lookbackHours?: number;
}): Promise<{ ok: true; candidates: RecentMatchCandidate[] } | { ok: false; error: string }> {
  const lookbackMs =
    (opts.lookbackHours ?? 24) * 60 * 60 * 1000;
  const cutoffMs = Date.now() - lookbackMs;

  const allTeamIds = [opts.teamAId, opts.teamBId];
  const members = await prisma.teamMember.findMany({
    where: { teamId: { in: allTeamIds } },
    select: { teamId: true, userId: true },
  });
  const leaders = await prisma.team.findMany({
    where: { id: { in: allTeamIds } },
    select: { id: true, leaderId: true },
  });

  const teamAUserIds = [
    ...new Set([
      ...members.filter((m) => m.teamId === opts.teamAId).map((m) => m.userId),
      ...(leaders.find((l) => l.id === opts.teamAId)
        ? [leaders.find((l) => l.id === opts.teamAId)!.leaderId]
        : []),
    ]),
  ];
  const teamBUserIds = [
    ...new Set([
      ...members.filter((m) => m.teamId === opts.teamBId).map((m) => m.userId),
      ...(leaders.find((l) => l.id === opts.teamBId)
        ? [leaders.find((l) => l.id === opts.teamBId)!.leaderId]
        : []),
    ]),
  ];

  const allUserIds = [...new Set([...teamAUserIds, ...teamBUserIds])];
  const allAccounts = await prisma.playerGameAccount.findMany({
    where: {
      userId: { in: allUserIds },
      provider: {
        in: [GameProvider.riot_valorant, GameProvider.riot_lol],
      },
    },
    select: { userId: true, externalId: true },
  });

  if (allAccounts.length === 0) {
    return {
      ok: false,
      error:
        "No linked Riot accounts found for these teams. Players must link their accounts first.",
    };
  }

  const userIdToPuuid = new Map<string, string>(
    allAccounts.map((a) => [a.userId, a.externalId]),
  );

  // Pick one player per team to query matchlist.
  const samplePuuidA = teamAUserIds
    .map((uid) => userIdToPuuid.get(uid))
    .find((p) => p !== undefined);
  const samplePuuidB = teamBUserIds
    .map((uid) => userIdToPuuid.get(uid))
    .find((p) => p !== undefined);

  if (!samplePuuidA && !samplePuuidB) {
    return {
      ok: false,
      error: "No linked Riot accounts found for either team.",
    };
  }

  // Collect recent custom match IDs from matchlists.
  const candidateIds = new Set<string>();

  for (const puuid of [samplePuuidA, samplePuuidB].filter(
    (p): p is string => Boolean(p),
  )) {
    const listRes = await fetchValMatchlist(puuid);
    if (!listRes.ok) continue;
    for (const entry of listRes.data.history) {
      if (
        entry.queueId === "custom" &&
        entry.gameStartTimeMillis >= cutoffMs
      ) {
        candidateIds.add(entry.matchId);
      }
    }
  }

  if (candidateIds.size === 0) {
    return {
      ok: true,
      candidates: [],
    };
  }

  // Build team A and team B PUUID sets.
  const teamAPuuids = new Set(
    teamAUserIds
      .map((uid) => userIdToPuuid.get(uid))
      .filter((p): p is string => Boolean(p)),
  );
  const teamBPuuids = new Set(
    teamBUserIds
      .map((uid) => userIdToPuuid.get(uid))
      .filter((p): p is string => Boolean(p)),
  );

  const candidates: RecentMatchCandidate[] = [];

  for (const matchId of [...candidateIds].slice(0, 10)) {
    const matchRes = await fetchValMatch(matchId);
    if (!matchRes.ok) continue;
    const m = matchRes.data;
    if (!m.matchInfo.isCompleted) continue;

    const matchPuuids = new Set(m.players.map((p) => p.puuid));
    const aHits = [...teamAPuuids].filter((p) => matchPuuids.has(p)).length;
    const bHits = [...teamBPuuids].filter((p) => matchPuuids.has(p)).length;

    if (aHits === 0 && bHits === 0) continue;

    candidates.push({
      valorantMatchId: matchId,
      gameStartMillis: m.matchInfo.gameStartMillis,
      minutesAgo: Math.floor(
        (Date.now() - m.matchInfo.gameStartMillis) / 60000,
      ),
      teamACoverage: aHits / Math.max(teamAPuuids.size, 1),
      teamBCoverage: bHits / Math.max(teamBPuuids.size, 1),
    });
  }

  candidates.sort((a, b) => b.gameStartMillis - a.gameStartMillis);
  return { ok: true, candidates };
}

// ─── GameIntegrationAdapter implementation ────────────────────────────────────

export const riotValorantAdapter: GameIntegrationAdapter = {
  provider: GameProvider.riot_valorant,

  async createRoom(_input: CreateRoomInput): Promise<CreateRoomResult> {
    // Riot does not provide a VALORANT Tournament API. Custom lobbies must be
    // created manually by the players.
    return {
      ok: false,
      provider: GameProvider.riot_valorant,
      error:
        "VALORANT does not support automated lobby creation. Players must set up the custom game lobby manually and submit the Match ID after play.",
    };
  },

  async syncMatchResult(
    input: SyncMatchResultInput,
  ): Promise<SyncMatchResultResult> {
    if (!input.externalMatchId) {
      return {
        ok: false,
        provider: GameProvider.riot_valorant,
        error: "externalMatchId (VALORANT match ID) is required.",
      };
    }

    const match = await prisma.tournamentMatch.findUnique({
      where: { id: input.context.matchId },
      select: {
        id: true,
        teamAId: true,
        teamBId: true,
        scheduledAt: true,
        tournamentId: true,
      },
    });

    if (!match) {
      return {
        ok: false,
        provider: GameProvider.riot_valorant,
        error: "Match not found.",
      };
    }

    if (!match.teamAId || !match.teamBId) {
      return {
        ok: false,
        provider: GameProvider.riot_valorant,
        error: "Both teams must be assigned before syncing a result.",
      };
    }

    const result = await verifyValorantMatch({
      valorantMatchId: input.externalMatchId,
      tournamentId: match.tournamentId,
      matchId: match.id,
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      scheduledAt: match.scheduledAt,
    });

    if (!result.ok) {
      return {
        ok: false,
        provider: GameProvider.riot_valorant,
        error: result.error,
      };
    }

    const v = result.result;

    if (v.confidence === "rejected") {
      return {
        ok: false,
        provider: GameProvider.riot_valorant,
        error: v.reason,
        raw: v.raw as unknown as Record<string, unknown>,
      };
    }

    return {
      ok: true,
      provider: GameProvider.riot_valorant,
      winnerTeamId: v.winnerTeamId,
      teamAScore: v.teamAScore,
      teamBScore: v.teamBScore,
      raw: v.raw as unknown as Record<string, unknown>,
    };
  },

  async verifyPlayers(
    input: VerifyPlayersInput,
  ): Promise<VerifyPlayersResult> {
    if (!input.teamAId || !input.teamBId) {
      return {
        ok: false,
        provider: GameProvider.riot_valorant,
        error: "Both teams must be assigned.",
      };
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId: { in: [input.teamAId, input.teamBId] } },
      select: { userId: true },
    });

    const userIds = [...new Set(members.map((m) => m.userId))];
    if (userIds.length === 0) {
      return {
        ok: true,
        provider: GameProvider.riot_valorant,
        missingUserIds: [],
      };
    }

    const linked = await prisma.playerGameAccount.findMany({
      where: {
        userId: { in: userIds },
        provider: {
          in: [GameProvider.riot_valorant, GameProvider.riot_lol],
        },
      },
      select: { userId: true },
    });

    const linkedSet = new Set(linked.map((l) => l.userId));
    return {
      ok: true,
      provider: GameProvider.riot_valorant,
      missingUserIds: userIds.filter((u) => !linkedSet.has(u)),
    };
  },

  async parseWinner(input: ParseWinnerInput): Promise<ParseWinnerResult> {
    if (!input.rawResult || !input.teamAId || !input.teamBId) {
      return {
        ok: false,
        provider: GameProvider.riot_valorant,
        error: "Raw result and team IDs are required.",
      };
    }

    const raw = input.rawResult as unknown as ValMatch;
    if (!raw.matchInfo || !Array.isArray(raw.teams)) {
      return {
        ok: false,
        provider: GameProvider.riot_valorant,
        error: "Raw result is not a valid VALORANT match object.",
      };
    }

    const result = await verifyValorantMatch({
      valorantMatchId: raw.matchInfo.matchId,
      tournamentId: input.context.tournamentId,
      matchId: input.context.matchId,
      teamAId: input.teamAId,
      teamBId: input.teamBId,
      scheduledAt: null,
    });

    if (!result.ok || result.result.confidence === "rejected") {
      return {
        ok: false,
        provider: GameProvider.riot_valorant,
        error: result.ok ? result.result.reason : result.error,
      };
    }

    return {
      ok: true,
      provider: GameProvider.riot_valorant,
      winnerTeamId: result.result.winnerTeamId,
      teamAScore: result.result.teamAScore,
      teamBScore: result.result.teamBScore,
    };
  },
};
