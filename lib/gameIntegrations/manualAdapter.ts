import { GameProvider } from "@prisma/client";

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

export const manualAdapter: GameIntegrationAdapter = {
  provider: GameProvider.manual,

  async createRoom(_input: CreateRoomInput): Promise<CreateRoomResult> {
    return {
      ok: true,
      provider: GameProvider.manual,
      roomCode: null,
      joinUrl: null,
      password: null,
      metadata: {
        mode: "manual",
        note: "Players coordinate the lobby out-of-band. Captains submit results manually.",
      },
    };
  },

  async syncMatchResult(
    _input: SyncMatchResultInput,
  ): Promise<SyncMatchResultResult> {
    return {
      ok: false,
      provider: GameProvider.manual,
      error:
        "Manual provider has no external sync. Use submitManualMatchReport instead.",
    };
  },

  async verifyPlayers(input: VerifyPlayersInput): Promise<VerifyPlayersResult> {
    if (!input.teamAId || !input.teamBId) {
      return {
        ok: false,
        provider: GameProvider.manual,
        error: "Both teams must be assigned before verification.",
      };
    }

    return { ok: true, provider: GameProvider.manual, missingUserIds: [] };
  },

  async parseWinner(input: ParseWinnerInput): Promise<ParseWinnerResult> {
    const raw = input.rawResult;

    if (!raw) {
      return {
        ok: false,
        provider: GameProvider.manual,
        error: "No raw result payload to parse.",
      };
    }

    const winnerCandidate =
      typeof raw.winnerTeamId === "string" ? raw.winnerTeamId : null;
    const teamAScoreCandidate =
      typeof raw.teamAScore === "number" ? raw.teamAScore : 0;
    const teamBScoreCandidate =
      typeof raw.teamBScore === "number" ? raw.teamBScore : 0;

    if (
      winnerCandidate &&
      winnerCandidate !== input.teamAId &&
      winnerCandidate !== input.teamBId
    ) {
      return {
        ok: false,
        provider: GameProvider.manual,
        error: "Winner does not belong to either match team.",
      };
    }

    return {
      ok: true,
      provider: GameProvider.manual,
      winnerTeamId: winnerCandidate,
      teamAScore: teamAScoreCandidate,
      teamBScore: teamBScoreCandidate,
    };
  },
};
