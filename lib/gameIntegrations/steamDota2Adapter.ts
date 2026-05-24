/**
 * Dota 2 match verification via Steam Web API.
 *
 * This adapter performs POST-GAME verification only.
 * Dota 2 does not have an official tournament lobby creation API accessible
 * without Valve partnership. Captains submit the Steam match ID; this adapter
 * fetches the details and applies confidence checks. Manual reporting remains
 * the permanent fallback when verification cannot be completed.
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
  return process.env.STEAM_WEB_API_KEY?.trim() || null;
}

function getTimeWindowMs(): number {
  const hours = parseFloat(process.env.DOTA_TIME_WINDOW_HOURS || "4");
  return (Number.isFinite(hours) ? Math.max(1, hours) : 4) * 60 * 60 * 1000;
}

const MIN_TEAM_COVERAGE = 0.4;

// Accepted Dota 2 lobby types (not open matchmaking).
// 1 = Practice/private, 2 = Tournament, 5 = Team match
const VALID_LOBBY_TYPES = new Set([1, 2, 5]);

const STEAM_API_BASE = "https://api.steampowered.com";

// SteamID64 base constant: 76561197960265728
const STEAM_ID64_BASE = BigInt("76561197960265728");

// ─── SteamID helpers ──────────────────────────────────────────────────────────

function accountIdToSteamId64(accountId: number): string {
  return (BigInt(accountId) + STEAM_ID64_BASE).toString();
}

function steamId64ToAccountId(steamId64: string): number | null {
  try {
    const n = BigInt(steamId64) - STEAM_ID64_BASE;
    if (n < BigInt(0) || n > BigInt(4294967295)) return null;
    return Number(n);
  } catch {
    return null;
  }
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
        provider: GameProvider.steam_dota2,
        action: input.action,
        request: input.request,
        response: input.response,
        status: input.status,
        error: input.error ?? null,
      },
    });
  } catch (e) {
    console.error("[steamDota2] audit write failed:", e);
  }
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type SteamResponse<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; error: string; raw?: unknown };

async function steamFetch<T>(opts: {
  action: string;
  path: string;
  params: Record<string, string>;
  maxAttempts?: number;
}): Promise<SteamResponse<T>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { ok: false, status: 0, error: "STEAM_WEB_API_KEY is not configured." };
  }

  const url = new URL(`${STEAM_API_BASE}${opts.path}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(opts.params)) {
    url.searchParams.set(k, v);
  }

  const maxAttempts = opts.maxAttempts ?? 4;
  let lastError = "";
  let lastStatus = 0;
  let lastBody: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res: Response;
    try {
      res = await fetch(url.toString(), { cache: "no-store" });
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
        request: { path: opts.path, params: { ...opts.params, key: "[redacted]" } } as Prisma.InputJsonValue,
        response: parsed as Prisma.InputJsonValue,
        status: AuditStatus.success,
      });
      return { ok: true, data: parsed as T, status: res.status };
    }

    const shouldRetry = [429, 503, 504].includes(res.status);
    if (shouldRetry && attempt < maxAttempts) {
      await writeAudit({
        action: opts.action,
        request: { path: opts.path, attempt } as Prisma.InputJsonValue,
        response: parsed as Prisma.InputJsonValue,
        status: AuditStatus.retrying,
        error: `http_${res.status}`,
      });
      const waitMs = 1000 * Math.pow(2, attempt - 1);
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

// ─── Dota 2 API types ─────────────────────────────────────────────────────────

export type DotaPlayer = {
  account_id: number; // SteamID32 (may be 4294967295 = anonymous)
  player_slot: number; // 0-4 radiant, 128-132 dire
  team_number: number; // 0 = radiant, 1 = dire
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
};

export type DotaMatch = {
  match_id: number;
  radiant_win: boolean;
  duration: number;
  start_time: number; // Unix timestamp
  lobby_type: number;
  game_mode: number;
  players: DotaPlayer[];
};

type DotaMatchResponse = {
  result: DotaMatch & { error?: string };
};

type DotaMatchHistoryEntry = {
  match_id: number;
  start_time: number;
  lobby_type: number;
  players: Array<{ account_id: number }>;
};

type DotaMatchHistoryResponse = {
  result: {
    status: number;
    matches?: DotaMatchHistoryEntry[];
    error?: string;
  };
};

// ─── Match fetcher ────────────────────────────────────────────────────────────

export async function fetchDotaMatchDetails(
  matchId: string,
): Promise<SteamResponse<DotaMatch>> {
  const res = await steamFetch<DotaMatchResponse>({
    action: "dota2.match.fetch",
    path: "/IDOTA2Match_570/GetMatchDetails/v1/",
    params: { match_id: matchId },
  });

  if (!res.ok) return res;

  const inner = res.data.result;
  if (inner.error) {
    return { ok: false, status: 200, error: inner.error };
  }

  return { ok: true, data: inner, status: res.status };
}

// ─── Match history fetcher ────────────────────────────────────────────────────

export async function fetchDotaMatchHistory(opts: {
  accountId: number;
  dateMin?: number;
  matchesRequested?: number;
}): Promise<SteamResponse<DotaMatchHistoryEntry[]>> {
  const params: Record<string, string> = {
    account_id: String(opts.accountId),
    matches_requested: String(opts.matchesRequested ?? 20),
  };
  if (opts.dateMin !== undefined) {
    params.date_min = String(opts.dateMin);
  }

  const res = await steamFetch<DotaMatchHistoryResponse>({
    action: "dota2.match_history.fetch",
    path: "/IDOTA2Match_570/GetMatchHistory/v1/",
    params,
  });

  if (!res.ok) return res;

  const inner = res.data.result;
  if (inner.status !== 1) {
    return {
      ok: false,
      status: 200,
      error: inner.error ?? `GetMatchHistory status ${inner.status}`,
    };
  }

  return { ok: true, data: inner.matches ?? [], status: res.status };
}

// ─── Verification types ───────────────────────────────────────────────────────

export type DotaVerificationChecks = {
  uniqueMatchId: boolean;
  lobbyType: boolean;
  timeWindow: boolean | null;
  teamACoverage: number;
  teamBCoverage: number;
  winnerMapped: boolean;
};

export type DotaConfidence = "high" | "medium" | "rejected";

export type DotaVerificationResult = {
  confidence: DotaConfidence;
  winnerTeamId: string | null;
  winningSide: "radiant" | "dire" | null;
  teamAScore: number; // kills (proxy — Dota has no rounds)
  teamBScore: number;
  reason: string;
  checks: DotaVerificationChecks;
  raw: DotaMatch;
};

// ─── Core verification ────────────────────────────────────────────────────────

export async function verifyDotaMatch(opts: {
  dotaMatchId: string;
  tournamentId: string;
  matchId: string;
  teamAId: string;
  teamBId: string;
  scheduledAt: Date | null;
}): Promise<
  | { ok: true; result: DotaVerificationResult }
  | { ok: false; error: string }
> {
  // 1. Fetch match from Steam.
  const fetchResult = await fetchDotaMatchDetails(opts.dotaMatchId);
  if (!fetchResult.ok) {
    return {
      ok: false,
      error:
        fetchResult.status === 0
          ? fetchResult.error
          : fetchResult.error === "Practice matches are not available via this API."
            ? "This appears to be a private lobby not accessible via the Steam API. Ensure the match is set to 'Tournament' lobby type."
            : `Steam API error: ${fetchResult.error}`,
    };
  }
  const raw = fetchResult.data;

  // 2. Unique match ID within tournament.
  const existingUse = await prisma.tournamentMatchGame.findFirst({
    where: {
      externalMatchId: opts.dotaMatchId,
      match: { tournamentId: opts.tournamentId },
      matchId: { not: opts.matchId },
    },
    select: { id: true },
  });
  const uniqueMatchId = existingUse === null;

  // 3. Lobby type check — reject public matchmaking.
  const lobbyType = VALID_LOBBY_TYPES.has(raw.lobby_type);

  // 4. Time window.
  let timeWindow: boolean | null = null;
  if (opts.scheduledAt) {
    const scheduledMs = opts.scheduledAt.getTime();
    const matchStartMs = raw.start_time * 1000;
    timeWindow = Math.abs(matchStartMs - scheduledMs) <= getTimeWindowMs();
  }

  // 5. Participant mapping — convert SteamID64 → SteamID32 for API comparison.
  const [teamAMembers, teamARow, teamBMembers, teamBRow] = await Promise.all([
    prisma.teamMember.findMany({ where: { teamId: opts.teamAId }, select: { userId: true } }),
    prisma.team.findUnique({ where: { id: opts.teamAId }, select: { leaderId: true } }),
    prisma.teamMember.findMany({ where: { teamId: opts.teamBId }, select: { userId: true } }),
    prisma.team.findUnique({ where: { id: opts.teamBId }, select: { leaderId: true } }),
  ]);

  const teamAUserIds = [
    ...new Set([
      ...teamAMembers.map((m) => m.userId),
      ...(teamARow ? [teamARow.leaderId] : []),
    ]),
  ];
  const teamBUserIds = [
    ...new Set([
      ...teamBMembers.map((m) => m.userId),
      ...(teamBRow ? [teamBRow.leaderId] : []),
    ]),
  ];

  const allUserIds = [...new Set([...teamAUserIds, ...teamBUserIds])];
  const linkedSteam = await prisma.playerGameAccount.findMany({
    where: { userId: { in: allUserIds }, provider: GameProvider.steam },
    select: { userId: true, externalId: true },
  });

  // Build a map: SteamID32 -> userId
  const accountIdToUserId = new Map<number, string>();
  for (const acc of linkedSteam) {
    const accountId = steamId64ToAccountId(acc.externalId);
    if (accountId !== null) {
      accountIdToUserId.set(accountId, acc.userId);
    }
  }

  // Anonymous accounts (account_id = 4294967295) are excluded.
  const ANONYMOUS_ID = 4294967295;
  const radiantAccountIds = new Set(
    raw.players
      .filter((p) => p.team_number === 0 && p.account_id !== ANONYMOUS_ID)
      .map((p) => p.account_id),
  );
  const direAccountIds = new Set(
    raw.players
      .filter((p) => p.team_number === 1 && p.account_id !== ANONYMOUS_ID)
      .map((p) => p.account_id),
  );
  const allMatchAccountIds = new Set([...radiantAccountIds, ...direAccountIds]);

  // Players from each Ascendra team found in the match.
  const teamAMatchedAccountIds = [...accountIdToUserId.entries()]
    .filter(([, uid]) => teamAUserIds.includes(uid))
    .map(([aid]) => aid)
    .filter((aid) => allMatchAccountIds.has(aid));

  const teamBMatchedAccountIds = [...accountIdToUserId.entries()]
    .filter(([, uid]) => teamBUserIds.includes(uid))
    .map(([aid]) => aid)
    .filter((aid) => allMatchAccountIds.has(aid));

  const teamATotal = Math.max(teamAUserIds.length, 1);
  const teamBTotal = Math.max(teamBUserIds.length, 1);
  const teamACoverage = teamAMatchedAccountIds.length / teamATotal;
  const teamBCoverage = teamBMatchedAccountIds.length / teamBTotal;

  // Map each Ascendra team to a Dota side (radiant/dire).
  const teamARadiantHits = teamAMatchedAccountIds.filter((a) => radiantAccountIds.has(a)).length;
  const teamADireHits = teamAMatchedAccountIds.filter((a) => direAccountIds.has(a)).length;

  // Team A goes to whichever side has more of their players.
  const teamASide: "radiant" | "dire" =
    teamARadiantHits >= teamADireHits ? "radiant" : "dire";
  const teamBSide: "radiant" | "dire" = teamASide === "radiant" ? "dire" : "radiant";

  // 6. Winner mapping.
  const hasAnyLinked =
    teamAMatchedAccountIds.length > 0 || teamBMatchedAccountIds.length > 0;
  const winnerMapped = hasAnyLinked;

  const winningSide: "radiant" | "dire" = raw.radiant_win ? "radiant" : "dire";
  let winnerTeamId: string | null = null;

  if (hasAnyLinked) {
    winnerTeamId = winningSide === teamASide ? opts.teamAId : opts.teamBId;
  }

  // Use total kills per side as the score proxy.
  const radiantKills = raw.players
    .filter((p) => p.team_number === 0)
    .reduce((sum, p) => sum + (p.kills ?? 0), 0);
  const direKills = raw.players
    .filter((p) => p.team_number === 1)
    .reduce((sum, p) => sum + (p.kills ?? 0), 0);

  const teamAScore = teamASide === "radiant" ? radiantKills : direKills;
  const teamBScore = teamBSide === "radiant" ? radiantKills : direKills;

  // 7. Assemble checks and confidence.
  const checks: DotaVerificationChecks = {
    uniqueMatchId,
    lobbyType,
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
        winningSide: null,
        teamAScore: 0,
        teamBScore: 0,
        reason: "This match ID has already been used by another game in this tournament.",
        checks,
        raw,
      },
    };
  }

  if (!lobbyType) {
    const typeNames: Record<number, string> = {
      0: "Public Matchmaking",
      6: "Solo Queue",
      7: "Ranked",
      8: "1v1 Mid",
    };
    const typeName = typeNames[raw.lobby_type] ?? `lobby type ${raw.lobby_type}`;
    return {
      ok: true,
      result: {
        confidence: "rejected",
        winnerTeamId: null,
        winningSide: null,
        teamAScore: 0,
        teamBScore: 0,
        reason: `Match is a "${typeName}" game. Only private lobbies, tournament lobbies, and team matches are accepted.`,
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
        winningSide: null,
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
        winningSide,
        teamAScore,
        teamBScore,
        reason:
          "Could not map winning side to an Ascendra team. Ensure players have linked their Steam accounts.",
        checks,
        raw,
      },
    };
  }

  const highConfidence =
    teamACoverage >= MIN_TEAM_COVERAGE &&
    teamBCoverage >= MIN_TEAM_COVERAGE &&
    winnerTeamId !== null;

  return {
    ok: true,
    result: {
      confidence: highConfidence ? "high" : "medium",
      winnerTeamId,
      winningSide,
      teamAScore,
      teamBScore,
      reason: highConfidence
        ? "All verification checks passed."
        : `Low participant coverage (team A: ${Math.round(teamACoverage * 100)}%, team B: ${Math.round(teamBCoverage * 100)}%). Flagged for admin review.`,
      checks,
      raw,
    },
  };
}

// ─── "Find recent match" discovery ────────────────────────────────────────────

export type RecentDotaCandidate = {
  dotaMatchId: string;
  startTime: number;
  minutesAgo: number;
  teamACoverage: number;
  teamBCoverage: number;
};

export async function findRecentDotaMatches(opts: {
  teamAId: string;
  teamBId: string;
  scheduledAt: Date | null;
  lookbackHours?: number;
}): Promise<{ ok: true; candidates: RecentDotaCandidate[] } | { ok: false; error: string }> {
  if (!getApiKey()) {
    return { ok: false, error: "STEAM_WEB_API_KEY is not configured." };
  }

  const lookbackSeconds = (opts.lookbackHours ?? 24) * 3600;
  const dateMin = Math.floor(Date.now() / 1000) - lookbackSeconds;

  const allTeamIds = [opts.teamAId, opts.teamBId];
  const [members, leaders] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId: { in: allTeamIds } },
      select: { teamId: true, userId: true },
    }),
    prisma.team.findMany({
      where: { id: { in: allTeamIds } },
      select: { id: true, leaderId: true },
    }),
  ]);

  const teamAUserIds = [
    ...new Set([
      ...members.filter((m) => m.teamId === opts.teamAId).map((m) => m.userId),
      ...(leaders.find((l) => l.id === opts.teamAId) ? [leaders.find((l) => l.id === opts.teamAId)!.leaderId] : []),
    ]),
  ];
  const teamBUserIds = [
    ...new Set([
      ...members.filter((m) => m.teamId === opts.teamBId).map((m) => m.userId),
      ...(leaders.find((l) => l.id === opts.teamBId) ? [leaders.find((l) => l.id === opts.teamBId)!.leaderId] : []),
    ]),
  ];

  const allUserIds = [...new Set([...teamAUserIds, ...teamBUserIds])];
  const linkedAccounts = await prisma.playerGameAccount.findMany({
    where: { userId: { in: allUserIds }, provider: GameProvider.steam },
    select: { userId: true, externalId: true },
  });

  if (linkedAccounts.length === 0) {
    return {
      ok: false,
      error: "No linked Steam accounts found for these teams. Players must link their accounts first.",
    };
  }

  const userIdToSteamId64 = new Map(linkedAccounts.map((a) => [a.userId, a.externalId]));

  const sampleAId64 = teamAUserIds.map((uid) => userIdToSteamId64.get(uid)).find(Boolean);
  const sampleBId64 = teamBUserIds.map((uid) => userIdToSteamId64.get(uid)).find(Boolean);

  const candidateIds = new Set<string>();

  for (const steamId64 of [sampleAId64, sampleBId64].filter(
    (s): s is string => Boolean(s),
  )) {
    const accountId = steamId64ToAccountId(steamId64);
    if (accountId === null) continue;

    const histRes = await fetchDotaMatchHistory({
      accountId,
      dateMin,
      matchesRequested: 20,
    });
    if (!histRes.ok) continue;

    for (const entry of histRes.data) {
      if (VALID_LOBBY_TYPES.has(entry.lobby_type)) {
        candidateIds.add(String(entry.match_id));
      }
    }
  }

  if (candidateIds.size === 0) {
    return { ok: true, candidates: [] };
  }

  // Build SteamID32 sets for each team.
  const teamAAccountIds = new Set(
    teamAUserIds
      .map((uid) => userIdToSteamId64.get(uid))
      .filter((s): s is string => Boolean(s))
      .map(steamId64ToAccountId)
      .filter((n): n is number => n !== null),
  );
  const teamBAccountIds = new Set(
    teamBUserIds
      .map((uid) => userIdToSteamId64.get(uid))
      .filter((s): s is string => Boolean(s))
      .map(steamId64ToAccountId)
      .filter((n): n is number => n !== null),
  );

  const candidates: RecentDotaCandidate[] = [];

  for (const matchId of [...candidateIds].slice(0, 10)) {
    const detailRes = await fetchDotaMatchDetails(matchId);
    if (!detailRes.ok) continue;

    const m = detailRes.data;
    const ANON = 4294967295;
    const matchAccountIds = new Set(
      m.players.filter((p) => p.account_id !== ANON).map((p) => p.account_id),
    );

    const aHits = [...teamAAccountIds].filter((a) => matchAccountIds.has(a)).length;
    const bHits = [...teamBAccountIds].filter((a) => matchAccountIds.has(a)).length;
    if (aHits === 0 && bHits === 0) continue;

    candidates.push({
      dotaMatchId: matchId,
      startTime: m.start_time,
      minutesAgo: Math.floor((Date.now() / 1000 - m.start_time) / 60),
      teamACoverage: aHits / Math.max(teamAAccountIds.size, 1),
      teamBCoverage: bHits / Math.max(teamBAccountIds.size, 1),
    });
  }

  candidates.sort((a, b) => b.startTime - a.startTime);
  return { ok: true, candidates };
}

// ─── GameIntegrationAdapter implementation ────────────────────────────────────

export const steamDota2Adapter: GameIntegrationAdapter = {
  provider: GameProvider.steam_dota2,

  async createRoom(_input: CreateRoomInput): Promise<CreateRoomResult> {
    return {
      ok: false,
      provider: GameProvider.steam_dota2,
      error:
        "Dota 2 lobby creation requires Valve partnership and is not supported. Players must create the lobby manually and submit the match ID after play.",
    };
  },

  async syncMatchResult(input: SyncMatchResultInput): Promise<SyncMatchResultResult> {
    if (!input.externalMatchId) {
      return {
        ok: false,
        provider: GameProvider.steam_dota2,
        error: "externalMatchId (Dota 2 match ID) is required.",
      };
    }

    const match = await prisma.tournamentMatch.findUnique({
      where: { id: input.context.matchId },
      select: { id: true, teamAId: true, teamBId: true, scheduledAt: true, tournamentId: true },
    });

    if (!match) {
      return { ok: false, provider: GameProvider.steam_dota2, error: "Match not found." };
    }

    if (!match.teamAId || !match.teamBId) {
      return {
        ok: false,
        provider: GameProvider.steam_dota2,
        error: "Both teams must be assigned before syncing a result.",
      };
    }

    const result = await verifyDotaMatch({
      dotaMatchId: input.externalMatchId,
      tournamentId: match.tournamentId,
      matchId: match.id,
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      scheduledAt: match.scheduledAt,
    });

    if (!result.ok) {
      return { ok: false, provider: GameProvider.steam_dota2, error: result.error };
    }

    if (result.result.confidence === "rejected") {
      return {
        ok: false,
        provider: GameProvider.steam_dota2,
        error: result.result.reason,
        raw: result.result.raw as unknown as Record<string, unknown>,
      };
    }

    return {
      ok: true,
      provider: GameProvider.steam_dota2,
      winnerTeamId: result.result.winnerTeamId,
      teamAScore: result.result.teamAScore,
      teamBScore: result.result.teamBScore,
      raw: result.result.raw as unknown as Record<string, unknown>,
    };
  },

  async verifyPlayers(input: VerifyPlayersInput): Promise<VerifyPlayersResult> {
    if (!input.teamAId || !input.teamBId) {
      return { ok: false, provider: GameProvider.steam_dota2, error: "Both teams must be assigned." };
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId: { in: [input.teamAId, input.teamBId] } },
      select: { userId: true },
    });

    const userIds = [...new Set(members.map((m) => m.userId))];
    if (userIds.length === 0) {
      return { ok: true, provider: GameProvider.steam_dota2, missingUserIds: [] };
    }

    const linked = await prisma.playerGameAccount.findMany({
      where: { userId: { in: userIds }, provider: GameProvider.steam },
      select: { userId: true },
    });

    const linkedSet = new Set(linked.map((l) => l.userId));
    return {
      ok: true,
      provider: GameProvider.steam_dota2,
      missingUserIds: userIds.filter((u) => !linkedSet.has(u)),
    };
  },

  async parseWinner(input: ParseWinnerInput): Promise<ParseWinnerResult> {
    if (!input.rawResult || !input.teamAId || !input.teamBId) {
      return {
        ok: false,
        provider: GameProvider.steam_dota2,
        error: "Raw result and team IDs are required.",
      };
    }

    const raw = input.rawResult as unknown as DotaMatch;
    if (typeof raw.match_id === "undefined" || typeof raw.radiant_win === "undefined") {
      return {
        ok: false,
        provider: GameProvider.steam_dota2,
        error: "Raw result is not a valid Dota 2 match object.",
      };
    }

    const result = await verifyDotaMatch({
      dotaMatchId: String(raw.match_id),
      tournamentId: input.context.tournamentId,
      matchId: input.context.matchId,
      teamAId: input.teamAId,
      teamBId: input.teamBId,
      scheduledAt: null,
    });

    if (!result.ok || result.result.confidence === "rejected") {
      return {
        ok: false,
        provider: GameProvider.steam_dota2,
        error: result.ok ? result.result.reason : result.error,
      };
    }

    return {
      ok: true,
      provider: GameProvider.steam_dota2,
      winnerTeamId: result.result.winnerTeamId,
      teamAScore: result.result.teamAScore,
      teamBScore: result.result.teamBScore,
    };
  },
};

// Re-export conversion helpers for use in actions
export { accountIdToSteamId64, steamId64ToAccountId };
