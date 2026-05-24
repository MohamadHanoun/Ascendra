import crypto from "node:crypto";

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

// ─── Environment & mode ──────────────────────────────────────────────────────

export type RiotMode = "stub" | "production";

function getRiotMode(): RiotMode {
  const raw = (process.env.RIOT_TOURNAMENT_MODE || "stub").toLowerCase();
  return raw === "production" ? "production" : "stub";
}

function getRiotApiKey(): string | null {
  return process.env.RIOT_API_KEY?.trim() || null;
}

function getRoutingRegion(): string {
  // Tournament-V5 uses the regional routing values: americas | europe | asia | esports
  const region = (process.env.RIOT_LOL_REGION || "americas").toLowerCase();
  if (["americas", "europe", "asia", "esports"].includes(region)) {
    return region;
  }
  return "americas";
}

function getProviderRegion(): string {
  // For createProvider, Riot expects platform region: NA, EUW, KR, etc.
  // Defaults to a sane value tied to routing region.
  const explicit = process.env.RIOT_LOL_PROVIDER_REGION?.trim().toUpperCase();
  if (explicit) return explicit;
  const routing = getRoutingRegion();
  if (routing === "europe") return "EUW";
  if (routing === "asia") return "KR";
  return "NA";
}

function getCallbackUrl(): string {
  const explicit = process.env.RIOT_LOL_CALLBACK_URL?.trim();
  if (explicit) return explicit;
  const base = process.env.APP_BASE_URL?.trim() || "http://localhost:3000";
  return `${base.replace(/\/+$/, "")}/api/integrations/riot/lol/callback`;
}

function getCallbackSecret(): string | null {
  return process.env.RIOT_LOL_CALLBACK_SECRET?.trim() || null;
}

function getEnvProviderId(): number | null {
  const raw = process.env.RIOT_LOL_PROVIDER_ID?.trim();
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

// ─── URL resolver (stub vs production) ───────────────────────────────────────

function tournamentSegment(): string {
  return getRiotMode() === "production" ? "tournament" : "tournament-stub";
}

function baseUrl(): string {
  const routing = getRoutingRegion();
  return `https://${routing}.api.riotgames.com/lol/${tournamentSegment()}/v5`;
}

// ─── Audit helper ────────────────────────────────────────────────────────────

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
        provider: GameProvider.riot_lol,
        action: input.action,
        request: input.request,
        response: input.response,
        status: input.status,
        error: input.error ?? null,
      },
    });
  } catch (error) {
    console.error("[riotLol] failed to write audit log:", error);
  }
}

// ─── HTTP layer with rate-limit / backoff ────────────────────────────────────

type RiotRequest = {
  action: string;
  method: "GET" | "POST" | "PUT";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  maxAttempts?: number;
};

type RiotResponse<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; error: string; raw?: unknown };

function buildQuery(query?: Record<string, string | number | boolean | undefined>) {
  if (!query) return "";
  const params: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return params.length > 0 ? `?${params.join("&")}` : "";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function riotFetch<T>(req: RiotRequest): Promise<RiotResponse<T>> {
  const apiKey = getRiotApiKey();
  if (!apiKey) {
    await writeAudit({
      action: req.action,
      request: { path: req.path, mode: getRiotMode() },
      status: AuditStatus.failure,
      error: "missing_api_key",
    });
    return {
      ok: false,
      status: 0,
      error: "RIOT_API_KEY is not configured.",
    };
  }

  const url = `${baseUrl()}${req.path}${buildQuery(req.query)}`;
  const maxAttempts = req.maxAttempts ?? 4;
  let lastError = "";
  let lastStatus = 0;
  let lastBody: unknown = undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Riot-Token": apiKey,
        },
        body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
        cache: "no-store",
      });
    } catch (error) {
      lastError = error instanceof Error ? error.message : "network_error";
      lastStatus = 0;
      if (attempt < maxAttempts) {
        await sleep(500 * attempt);
        continue;
      }
      break;
    }

    lastStatus = response.status;
    const text = await response.text();
    let parsed: unknown = undefined;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    lastBody = parsed;

    if (response.ok) {
      await writeAudit({
        action: req.action,
        request: {
          path: req.path,
          method: req.method,
          mode: getRiotMode(),
          query: req.query as Prisma.InputJsonValue | undefined,
          body: (req.body as Prisma.InputJsonValue | undefined) ?? null,
        } as Prisma.InputJsonValue,
        response: (parsed as Prisma.InputJsonValue) ?? null,
        status: AuditStatus.success,
      });
      return { ok: true, data: parsed as T, status: response.status };
    }

    const retryAfterHeader = response.headers.get("retry-after");
    const retryAfterSec = retryAfterHeader
      ? Math.max(1, parseInt(retryAfterHeader, 10) || 1)
      : null;

    const shouldRetry =
      response.status === 429 ||
      response.status === 503 ||
      response.status === 504 ||
      response.status === 502;

    if (shouldRetry && attempt < maxAttempts) {
      const waitMs = retryAfterSec
        ? retryAfterSec * 1000
        : 500 * Math.pow(2, attempt - 1);
      await writeAudit({
        action: req.action,
        request: {
          path: req.path,
          method: req.method,
          mode: getRiotMode(),
          attempt,
        },
        response: (parsed as Prisma.InputJsonValue) ?? null,
        status: AuditStatus.retrying,
        error: `http_${response.status}`,
      });
      await sleep(waitMs);
      continue;
    }

    lastError = `http_${response.status}`;
    break;
  }

  await writeAudit({
    action: req.action,
    request: { path: req.path, method: req.method, mode: getRiotMode() },
    response: (lastBody as Prisma.InputJsonValue) ?? null,
    status: AuditStatus.failure,
    error: lastError || `http_${lastStatus}`,
  });

  return {
    ok: false,
    status: lastStatus,
    error: lastError || `Riot request failed with status ${lastStatus}`,
    raw: lastBody,
  };
}

// ─── Provider / Tournament management ────────────────────────────────────────

export type CreateProviderResult =
  | { ok: true; providerId: number }
  | { ok: false; error: string };

export async function createTournamentProvider(): Promise<CreateProviderResult> {
  const envProvider = getEnvProviderId();
  if (envProvider) return { ok: true, providerId: envProvider };

  const result = await riotFetch<number>({
    action: "riot.lol.provider.create",
    method: "POST",
    path: "/providers",
    body: {
      region: getProviderRegion(),
      url: getCallbackUrl(),
    },
  });

  if (!result.ok) return { ok: false, error: result.error };

  const providerId = typeof result.data === "number" ? result.data : NaN;
  if (!Number.isFinite(providerId)) {
    return { ok: false, error: "Riot returned invalid provider id." };
  }
  return { ok: true, providerId };
}

export type CreateRiotTournamentResult =
  | { ok: true; tournamentId: number }
  | { ok: false; error: string };

export async function createRiotTournament(
  name: string,
  providerId?: number,
): Promise<CreateRiotTournamentResult> {
  let resolvedProvider = providerId ?? getEnvProviderId();
  if (!resolvedProvider) {
    const providerResult = await createTournamentProvider();
    if (!providerResult.ok) return { ok: false, error: providerResult.error };
    resolvedProvider = providerResult.providerId;
  }

  const trimmedName = name.slice(0, 100) || "Ascendra Tournament";

  const result = await riotFetch<number>({
    action: "riot.lol.tournament.create",
    method: "POST",
    path: "/tournaments",
    body: {
      name: trimmedName,
      providerId: resolvedProvider,
    },
  });

  if (!result.ok) return { ok: false, error: result.error };

  const tournamentId = typeof result.data === "number" ? result.data : NaN;
  if (!Number.isFinite(tournamentId)) {
    return { ok: false, error: "Riot returned invalid tournament id." };
  }
  return { ok: true, tournamentId };
}

// ─── Tournament codes ────────────────────────────────────────────────────────

export type TournamentCodeOptions = {
  teamSize?: number;
  spectatorType?: "NONE" | "LOBBYONLY" | "ALL";
  pickType?:
    | "BLIND_PICK"
    | "DRAFT_MODE"
    | "ALL_RANDOM"
    | "TOURNAMENT_DRAFT";
  mapType?: "SUMMONERS_RIFT" | "HOWLING_ABYSS";
  allowedSummonerIds?: string[];
  enoughPlayers?: boolean;
};

type RiotCodeRequestBody = {
  teamSize: number;
  spectatorType: string;
  pickType: string;
  mapType: string;
  metadata: string;
  enoughPlayers?: boolean;
  allowedSummonerIds?: string[];
};

export type CreateTournamentCodeResult =
  | { ok: true; codes: string[]; metadata: string }
  | { ok: false; error: string };

function buildCodeMetadata(opts: {
  matchId: string;
  matchGameId?: string;
  gameNumber?: number;
}): string {
  const secret = getCallbackSecret();
  const payload: Record<string, unknown> = {
    matchId: opts.matchId,
  };
  if (opts.matchGameId) payload.matchGameId = opts.matchGameId;
  if (opts.gameNumber !== undefined) payload.gameNumber = opts.gameNumber;
  if (secret) {
    const base = `${opts.matchId}|${opts.matchGameId ?? ""}|${opts.gameNumber ?? ""}`;
    payload.sig = crypto
      .createHmac("sha256", secret)
      .update(base)
      .digest("hex");
  }
  return JSON.stringify(payload);
}

export function verifyCodeMetadata(
  parsedMetadata: Record<string, unknown> | null,
): { ok: boolean; matchId?: string; matchGameId?: string; gameNumber?: number; error?: string } {
  if (!parsedMetadata) return { ok: false, error: "missing_metadata" };
  const matchId =
    typeof parsedMetadata.matchId === "string" ? parsedMetadata.matchId : "";
  if (!matchId) return { ok: false, error: "missing_match_id" };

  const matchGameId =
    typeof parsedMetadata.matchGameId === "string"
      ? parsedMetadata.matchGameId
      : undefined;
  const gameNumber =
    typeof parsedMetadata.gameNumber === "number"
      ? parsedMetadata.gameNumber
      : undefined;

  const secret = getCallbackSecret();
  if (secret) {
    const provided =
      typeof parsedMetadata.sig === "string" ? parsedMetadata.sig : "";
    if (!provided) return { ok: false, error: "missing_signature" };
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${matchId}|${matchGameId ?? ""}|${gameNumber ?? ""}`)
      .digest("hex");
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(provided, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { ok: false, error: "invalid_signature" };
    }
  }

  return { ok: true, matchId, matchGameId, gameNumber };
}

export async function createTournamentCodeForMatch(opts: {
  riotTournamentId: number;
  matchId: string;
  matchGameId?: string;
  gameNumber?: number;
  count?: number;
  options?: TournamentCodeOptions;
}): Promise<CreateTournamentCodeResult> {
  const metadata = buildCodeMetadata({
    matchId: opts.matchId,
    matchGameId: opts.matchGameId,
    gameNumber: opts.gameNumber,
  });

  const body: RiotCodeRequestBody = {
    teamSize: opts.options?.teamSize ?? 5,
    spectatorType: opts.options?.spectatorType ?? "ALL",
    pickType: opts.options?.pickType ?? "TOURNAMENT_DRAFT",
    mapType: opts.options?.mapType ?? "SUMMONERS_RIFT",
    metadata,
    enoughPlayers: opts.options?.enoughPlayers ?? true,
  };
  if (opts.options?.allowedSummonerIds?.length) {
    body.allowedSummonerIds = opts.options.allowedSummonerIds;
  }

  const result = await riotFetch<string[]>({
    action: "riot.lol.code.create",
    method: "POST",
    path: "/codes",
    query: {
      count: opts.count ?? 1,
      tournamentId: opts.riotTournamentId,
    },
    body,
  });

  if (!result.ok) return { ok: false, error: result.error };
  if (!Array.isArray(result.data) || result.data.length === 0) {
    return { ok: false, error: "Riot returned no tournament codes." };
  }
  const codes = result.data.filter(
    (c): c is string => typeof c === "string" && c.length > 0,
  );
  if (codes.length === 0) {
    return { ok: false, error: "Riot returned no usable tournament codes." };
  }
  return { ok: true, codes, metadata };
}

// ─── Result polling (fallback) ───────────────────────────────────────────────

export type LolGameResultSummary = {
  shortCode: string;
  metaData: string;
  gameId: number | null;
  winningTeamPuuids: string[];
  losingTeamPuuids: string[];
  raw: Record<string, unknown>;
};

export type LolGameResult =
  | { ok: true; data: LolGameResultSummary | null }
  | { ok: false; error: string };

type LobbyEventsResponse = {
  eventList?: Array<{
    eventType?: string;
    timestamp?: string;
    summonerId?: string;
  }>;
};

export async function getTournamentCodeResult(
  shortCode: string,
): Promise<LolGameResult> {
  // tournament-stub v5 does not return real results. Production-only meaningful.
  if (getRiotMode() !== "production") {
    return { ok: true, data: null };
  }

  const lobby = await riotFetch<LobbyEventsResponse>({
    action: "riot.lol.code.lobby_events",
    method: "GET",
    path: `/lobby-events/by-code/${encodeURIComponent(shortCode)}`,
  });

  if (!lobby.ok) return { ok: false, error: lobby.error };

  // The lobby-events endpoint reports lobby join/leave/game start, but not the
  // winner. In production the winner is delivered through the callback.
  // We return null here to indicate "no decisive result yet from polling".
  return { ok: true, data: null };
}

// ─── Callback payload parser ─────────────────────────────────────────────────

export type ParsedCallback = {
  shortCode: string;
  metadata: Record<string, unknown> | null;
  metadataRaw: string;
  gameId: number | null;
  winningPuuids: string[];
  losingPuuids: string[];
};

export type ParsedCallbackResult =
  | { ok: true; data: ParsedCallback }
  | { ok: false; error: string };

function extractPuuidsFromTeam(team: unknown): string[] {
  if (!Array.isArray(team)) return [];
  const out: string[] = [];
  for (const entry of team) {
    if (typeof entry === "string") {
      out.push(entry);
      continue;
    }
    if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      const puuid =
        typeof obj.puuid === "string"
          ? obj.puuid
          : typeof obj.summonerId === "string"
            ? obj.summonerId
            : null;
      if (puuid) out.push(puuid);
    }
  }
  return out;
}

export function parseCallbackPayload(
  raw: unknown,
): ParsedCallbackResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "callback_payload_not_object" };
  }

  const payload = raw as Record<string, unknown>;
  const shortCode =
    typeof payload.shortCode === "string" ? payload.shortCode : "";
  if (!shortCode) return { ok: false, error: "missing_short_code" };

  const metadataRaw =
    typeof payload.metaData === "string"
      ? payload.metaData
      : typeof payload.metadata === "string"
        ? (payload.metadata as string)
        : "";
  let metadata: Record<string, unknown> | null = null;
  if (metadataRaw) {
    try {
      const parsed = JSON.parse(metadataRaw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        metadata = parsed as Record<string, unknown>;
      }
    } catch {
      metadata = null;
    }
  }

  const gameId =
    typeof payload.gameId === "number"
      ? payload.gameId
      : typeof payload.gameId === "string"
        ? Number(payload.gameId) || null
        : null;

  return {
    ok: true,
    data: {
      shortCode,
      metadata,
      metadataRaw,
      gameId,
      winningPuuids: extractPuuidsFromTeam(payload.winningTeam),
      losingPuuids: extractPuuidsFromTeam(payload.losingTeam),
    },
  };
}

// ─── Winner mapping (puuid → team) ───────────────────────────────────────────

export type WinnerResolution =
  | { ok: true; winnerTeamId: string }
  | { ok: false; error: string };

export async function resolveWinnerFromPuuids(opts: {
  matchTeamAId: string;
  matchTeamBId: string;
  winningPuuids: string[];
}): Promise<WinnerResolution> {
  if (opts.winningPuuids.length === 0) {
    return { ok: false, error: "no_winning_puuids" };
  }

  const accounts = await prisma.playerGameAccount.findMany({
    where: {
      provider: GameProvider.riot_lol,
      externalId: { in: opts.winningPuuids },
    },
    select: { userId: true },
  });

  if (accounts.length === 0) {
    return { ok: false, error: "no_linked_accounts" };
  }

  const userIds = [...new Set(accounts.map((a) => a.userId))];

  const memberships = await prisma.teamMember.findMany({
    where: {
      userId: { in: userIds },
      teamId: { in: [opts.matchTeamAId, opts.matchTeamBId] },
    },
    select: { teamId: true },
  });

  const leaders = await prisma.team.findMany({
    where: {
      id: { in: [opts.matchTeamAId, opts.matchTeamBId] },
      leaderId: { in: userIds },
    },
    select: { id: true },
  });

  let aHits = 0;
  let bHits = 0;
  for (const m of memberships) {
    if (m.teamId === opts.matchTeamAId) aHits += 1;
    else if (m.teamId === opts.matchTeamBId) bHits += 1;
  }
  for (const l of leaders) {
    if (l.id === opts.matchTeamAId) aHits += 1;
    else if (l.id === opts.matchTeamBId) bHits += 1;
  }

  if (aHits === 0 && bHits === 0) {
    return { ok: false, error: "winners_not_on_either_team" };
  }
  if (aHits > 0 && bHits > 0) {
    return { ok: false, error: "winners_split_across_teams" };
  }
  return { ok: true, winnerTeamId: aHits > 0 ? opts.matchTeamAId : opts.matchTeamBId };
}

// ─── Adapter implementation ──────────────────────────────────────────────────

export const riotLolAdapter: GameIntegrationAdapter = {
  provider: GameProvider.riot_lol,

  async createRoom(input: CreateRoomInput): Promise<CreateRoomResult> {
    if (!input.teamAId || !input.teamBId) {
      return {
        ok: false,
        provider: GameProvider.riot_lol,
        error: "Both teams must be assigned before creating a room.",
      };
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: input.context.tournamentId },
      select: { id: true, title: true },
    });
    if (!tournament) {
      return {
        ok: false,
        provider: GameProvider.riot_lol,
        error: "Ascendra tournament was not found.",
      };
    }

    const tournamentResult = await createRiotTournament(
      `Ascendra · ${tournament.title}`,
    );
    if (!tournamentResult.ok) {
      return {
        ok: false,
        provider: GameProvider.riot_lol,
        error: tournamentResult.error,
      };
    }

    const codeResult = await createTournamentCodeForMatch({
      riotTournamentId: tournamentResult.tournamentId,
      matchId: input.context.matchId,
      count: 1,
    });
    if (!codeResult.ok) {
      return {
        ok: false,
        provider: GameProvider.riot_lol,
        error: codeResult.error,
      };
    }

    return {
      ok: true,
      provider: GameProvider.riot_lol,
      roomCode: codeResult.codes[0],
      joinUrl: null,
      password: null,
      metadata: {
        mode: getRiotMode(),
        riotTournamentId: tournamentResult.tournamentId,
        codes: codeResult.codes,
      },
    };
  },

  async syncMatchResult(
    input: SyncMatchResultInput,
  ): Promise<SyncMatchResultResult> {
    if (!input.externalMatchId) {
      return {
        ok: false,
        provider: GameProvider.riot_lol,
        error: "externalMatchId (tournament short code) is required.",
      };
    }
    const result = await getTournamentCodeResult(input.externalMatchId);
    if (!result.ok) {
      return { ok: false, provider: GameProvider.riot_lol, error: result.error };
    }
    if (!result.data) {
      return {
        ok: false,
        provider: GameProvider.riot_lol,
        error:
          getRiotMode() === "stub"
            ? "Stub mode does not return real results. Use the callback or admin override."
            : "No decisive result yet — wait for the callback.",
      };
    }
    return {
      ok: true,
      provider: GameProvider.riot_lol,
      teamAScore: 0,
      teamBScore: 0,
      raw: result.data.raw,
    };
  },

  async verifyPlayers(
    input: VerifyPlayersInput,
  ): Promise<VerifyPlayersResult> {
    if (!input.teamAId || !input.teamBId) {
      return {
        ok: false,
        provider: GameProvider.riot_lol,
        error: "Both teams must be assigned before verification.",
      };
    }

    const memberships = await prisma.teamMember.findMany({
      where: { teamId: { in: [input.teamAId, input.teamBId] } },
      select: { userId: true },
    });
    const userIds = [...new Set(memberships.map((m) => m.userId))];
    if (userIds.length === 0) {
      return { ok: true, provider: GameProvider.riot_lol, missingUserIds: [] };
    }

    const linked = await prisma.playerGameAccount.findMany({
      where: {
        userId: { in: userIds },
        provider: GameProvider.riot_lol,
      },
      select: { userId: true },
    });
    const linkedSet = new Set(linked.map((l) => l.userId));
    const missing = userIds.filter((u) => !linkedSet.has(u));
    return {
      ok: true,
      provider: GameProvider.riot_lol,
      missingUserIds: missing,
    };
  },

  async parseWinner(input: ParseWinnerInput): Promise<ParseWinnerResult> {
    if (!input.teamAId || !input.teamBId) {
      return {
        ok: false,
        provider: GameProvider.riot_lol,
        error: "Match teams are required to parse a winner.",
      };
    }
    const callback = parseCallbackPayload(input.rawResult);
    if (!callback.ok) {
      return {
        ok: false,
        provider: GameProvider.riot_lol,
        error: callback.error,
      };
    }
    const winner = await resolveWinnerFromPuuids({
      matchTeamAId: input.teamAId,
      matchTeamBId: input.teamBId,
      winningPuuids: callback.data.winningPuuids,
    });
    if (!winner.ok) {
      return {
        ok: false,
        provider: GameProvider.riot_lol,
        error: winner.error,
      };
    }
    return {
      ok: true,
      provider: GameProvider.riot_lol,
      winnerTeamId: winner.winnerTeamId,
      teamAScore: winner.winnerTeamId === input.teamAId ? 1 : 0,
      teamBScore: winner.winnerTeamId === input.teamBId ? 1 : 0,
    };
  },
};

// ─── Public helpers for actions & routes ─────────────────────────────────────

export const riotLolInternals = {
  getRiotMode,
  baseUrl,
  getCallbackUrl,
  getProviderRegion,
};
