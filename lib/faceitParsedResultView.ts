export type FaceitParsedResultViewPlayer = {
  faceitPlayerId: string | null;
  nickname: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  adr?: number;
  headshotsPercent?: number;
  mvps?: number;
  kdRatio?: number;
};

export type FaceitParsedResultViewTeam = {
  faceitTeamId: string | null;
  name: string | null;
  finalScore?: number;
  won?: boolean;
  players: FaceitParsedResultViewPlayer[];
};

export type FaceitParsedResultView = {
  teams: FaceitParsedResultViewTeam[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberOrUndefined(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function booleanOrUndefined(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function normalizeFaceitParsedResultView(
  value: unknown,
): FaceitParsedResultView {
  if (!isRecord(value) || !Array.isArray(value.teams)) {
    return { teams: [] };
  }

  const teams: FaceitParsedResultViewTeam[] = value.teams
    .filter(isRecord)
    .map((team) => {
      const players = Array.isArray(team.players)
        ? team.players.filter(isRecord).map((player) => {
            const faceitPlayerId = stringOrNull(player.faceitPlayerId);
            const nickname =
              stringOrNull(player.nickname) ?? faceitPlayerId ?? "Unknown";

            return {
              faceitPlayerId,
              nickname,
              kills: numberOrUndefined(player.kills),
              deaths: numberOrUndefined(player.deaths),
              assists: numberOrUndefined(player.assists),
              adr: numberOrUndefined(player.adr),
              headshotsPercent: numberOrUndefined(player.headshotsPercent),
              mvps: numberOrUndefined(player.mvps),
              kdRatio: numberOrUndefined(player.kdRatio),
            };
          })
        : [];

      return {
        faceitTeamId: stringOrNull(team.faceitTeamId),
        name: stringOrNull(team.name),
        finalScore: numberOrUndefined(team.finalScore),
        won: booleanOrUndefined(team.won),
        players,
      };
    });

  return { teams };
}

export function hasFaceitPlayerRows(
  view: FaceitParsedResultView,
): boolean {
  return view.teams.some((team) => team.players.length > 0);
}
