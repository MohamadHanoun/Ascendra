import type { GameProvider } from "@prisma/client";

export type AdapterContext = {
  matchId: string;
  tournamentId: string;
  bestOf: number;
};

export type CreateRoomInput = {
  context: AdapterContext;
  teamAId: string | null;
  teamBId: string | null;
  config?: Record<string, unknown>;
};

export type CreateRoomResult = {
  ok: boolean;
  provider: GameProvider;
  roomCode?: string | null;
  joinUrl?: string | null;
  password?: string | null;
  metadata?: Record<string, unknown>;
  error?: string;
};

export type SyncMatchResultInput = {
  context: AdapterContext;
  externalMatchId?: string | null;
};

export type SyncMatchResultResult = {
  ok: boolean;
  provider: GameProvider;
  winnerTeamId?: string | null;
  teamAScore?: number;
  teamBScore?: number;
  raw?: Record<string, unknown> | null;
  error?: string;
};

export type VerifyPlayersInput = {
  context: AdapterContext;
  teamAId: string | null;
  teamBId: string | null;
};

export type VerifyPlayersResult = {
  ok: boolean;
  provider: GameProvider;
  missingUserIds?: string[];
  error?: string;
};

export type ParseWinnerInput = {
  context: AdapterContext;
  rawResult: Record<string, unknown> | null;
  teamAId: string | null;
  teamBId: string | null;
};

export type ParseWinnerResult = {
  ok: boolean;
  provider: GameProvider;
  winnerTeamId?: string | null;
  teamAScore?: number;
  teamBScore?: number;
  error?: string;
};

export interface GameIntegrationAdapter {
  readonly provider: GameProvider;

  createRoom(input: CreateRoomInput): Promise<CreateRoomResult>;
  syncMatchResult(input: SyncMatchResultInput): Promise<SyncMatchResultResult>;
  verifyPlayers(input: VerifyPlayersInput): Promise<VerifyPlayersResult>;
  parseWinner(input: ParseWinnerInput): Promise<ParseWinnerResult>;
}
