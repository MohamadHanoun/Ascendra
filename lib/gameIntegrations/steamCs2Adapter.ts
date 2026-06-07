/**
 * CS2 (Counter-Strike 2) match support adapter.
 *
 * CS2 has NO official tournament lobby creation API. Two modes are defined:
 *
 *   manual           — Admin creates a private lobby, adds a GameRoom with
 *                      server details, players join manually, and results are
 *                      submitted via the standard manual report form with
 *                      screenshot evidence.  This is the only production-ready
 *                      path today.
 *
 *   dedicated_server — A self-hosted CS2 Dedicated Server (SRCDS) with RCON
 *                      and log forwarding.  The interface is defined here for
 *                      future implementation.  No provisioning or log parsing
 *                      is active; the structure documents what a future
 *                      integration would consume.
 *
 * GameRoom.metadata shape for CS2 rooms:
 * {
 *   mode:              "manual" | "dedicated_server"
 *   serverIp:          string          // e.g. "192.0.2.10"
 *   serverPort:        string | number // default 27015
 *   password:          string          // connect password
 *   gotvUrl:           string          // GOTV spectator address
 *   logSource:         string          // future: log relay URL or identifier
 *   rconPassword:      string          // future: RCON access (server-side only, never exposed to players)
 *   createdByAdminId:  string
 * }
 */

import { GameProvider } from "@prisma/client";

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

export type Cs2Mode = "manual" | "dedicated_server";

export function getCs2Mode(): Cs2Mode {
  const raw = process.env.CS2_MODE?.trim().toLowerCase();
  return raw === "dedicated_server" ? "dedicated_server" : "manual";
}

// ─── GameRoom metadata shape ──────────────────────────────────────────────────

export type Cs2RoomMetadata = {
  mode: Cs2Mode;
  serverIp?: string;
  serverPort?: string | number;
  password?: string;
  gotvUrl?: string;
  logSource?: string;
  createdByAdminId?: string;
};

export function parseCs2Metadata(raw: unknown): Cs2RoomMetadata {
  if (!raw || typeof raw !== "object") return { mode: "manual" };
  const m = raw as Record<string, unknown>;
  return {
    mode: m.mode === "dedicated_server" ? "dedicated_server" : "manual",
    serverIp: typeof m.serverIp === "string" ? m.serverIp : undefined,
    serverPort:
      typeof m.serverPort === "string" || typeof m.serverPort === "number"
        ? m.serverPort
        : undefined,
    password: typeof m.password === "string" ? m.password : undefined,
    gotvUrl: typeof m.gotvUrl === "string" ? m.gotvUrl : undefined,
    logSource: typeof m.logSource === "string" ? m.logSource : undefined,
    createdByAdminId:
      typeof m.createdByAdminId === "string" ? m.createdByAdminId : undefined,
  };
}

// ─── Future dedicated-server types (interface only, not implemented) ──────────

/**
 * The shape of a CS2 SRCDS match-end log event that a future log-relay
 * service would POST to Ascendra.  Defined here so the data contract is
 * agreed before implementation begins.
 */
export type Cs2MatchEndEvent = {
  matchId: string;
  map: string;
  teamCt: {
    name: string;
    score: number;
    players: Array<{ steamId64: string; kills: number; deaths: number; assists: number }>;
  };
  teamT: {
    name: string;
    score: number;
    players: Array<{ steamId64: string; kills: number; deaths: number; assists: number }>;
  };
  winner: "ct" | "t";
  durationSeconds: number;
  endedAt: string; // ISO-8601
};

/**
 * What the dedicated-server log ingestion endpoint would receive.
 * Not implemented — placeholder for the route that will live at
 * /api/integrations/cs2/log-event when dedicated-server mode is built out.
 */
export type Cs2LogIngestPayload = {
  logSource: string;
  secret: string;
  event: "match_end" | "round_end" | "player_connect" | "player_disconnect";
  data: Cs2MatchEndEvent | Record<string, unknown>;
};

// ─── GameIntegrationAdapter implementation ────────────────────────────────────

export const steamCs2Adapter: GameIntegrationAdapter = {
  provider: GameProvider.steam_cs2,

  async createRoom(_input: CreateRoomInput): Promise<CreateRoomResult> {
    const mode = getCs2Mode();

    if (mode === "dedicated_server") {
      // Future: provision a server via a hosting provider API.
      return {
        ok: false,
        provider: GameProvider.steam_cs2,
        error:
          "CS2 dedicated-server provisioning is not yet implemented. " +
          "Use the admin panel to create a manual CS2 room with server details.",
      };
    }

    // Manual mode: rooms are created by an admin from the admin match
    // operations page (createMatchRoomInline).
    return {
      ok: false,
      provider: GameProvider.steam_cs2,
      error:
        "CS2 rooms must be created by an admin using the admin match panel. " +
        "Provide the server IP, port, and password there.",
    };
  },

  async syncMatchResult(
    input: SyncMatchResultInput,
  ): Promise<SyncMatchResultResult> {
    const mode = getCs2Mode();

    if (mode === "dedicated_server" && input.externalMatchId) {
      // Future: look up a persisted Cs2MatchEndEvent for this externalMatchId.
      return {
        ok: false,
        provider: GameProvider.steam_cs2,
        error:
          "Dedicated-server log ingestion is not yet active. " +
          "Players must submit the result manually.",
      };
    }

    // Manual mode: result must come through the standard match-report form.
    return {
      ok: false,
      provider: GameProvider.steam_cs2,
      error:
        "CS2 results must be submitted via the Match Report form with screenshot evidence. " +
        "Automated result sync is not available.",
    };
  },

  async verifyPlayers(input: VerifyPlayersInput): Promise<VerifyPlayersResult> {
    if (!input.teamAId || !input.teamBId) {
      return {
        ok: false,
        provider: GameProvider.steam_cs2,
        error: "Both teams must be assigned.",
      };
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId: { in: [input.teamAId, input.teamBId] } },
      select: { userId: true },
    });

    const userIds = [...new Set(members.map((m) => m.userId))];
    if (userIds.length === 0) {
      return { ok: true, provider: GameProvider.steam_cs2, missingUserIds: [] };
    }

    const linked = await prisma.playerGameAccount.findMany({
      where: { userId: { in: userIds }, provider: GameProvider.steam },
      select: { userId: true },
    });

    const linkedSet = new Set(linked.map((l) => l.userId));
    return {
      ok: true,
      provider: GameProvider.steam_cs2,
      missingUserIds: userIds.filter((u) => !linkedSet.has(u)),
    };
  },

  async parseWinner(input: ParseWinnerInput): Promise<ParseWinnerResult> {
    if (!input.rawResult) {
      return {
        ok: false,
        provider: GameProvider.steam_cs2,
        error: "No raw result available. Submit the result manually.",
      };
    }

    // Future: parse a persisted Cs2MatchEndEvent.
    const raw = input.rawResult as Partial<Cs2MatchEndEvent>;
    if (!raw.winner || !raw.teamCt || !raw.teamT) {
      return {
        ok: false,
        provider: GameProvider.steam_cs2,
        error:
          "Raw result does not contain a valid CS2 match-end event. " +
          "Submit the result manually.",
      };
    }

    if (!input.teamAId || !input.teamBId) {
      return {
        ok: false,
        provider: GameProvider.steam_cs2,
        error: "Both team IDs are required to map the winner.",
      };
    }

    // The side assignment (CT/T per team) would be determined by comparing
    // player SteamID64s in teamCt.players / teamT.players against linked
    // Steam accounts.  Not implemented — return an informative error.
    return {
      ok: false,
      provider: GameProvider.steam_cs2,
      error:
        "Automatic winner mapping from CS2 match events is not yet implemented. " +
        "Use admin override to record the result.",
    };
  },
};
