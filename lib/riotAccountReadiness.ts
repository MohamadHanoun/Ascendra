import { isRiotGame } from "@/lib/isRiotGame";

export type RiotAccountReadiness = {
  isRiotTournament: boolean;
  riotConnected: boolean;
  ready: boolean;
  missing: string[];
};

export function computeRiotAccountReadiness(params: {
  gameSlug: string | null | undefined;
  gameName?: string | null;
  riotExternalId: string | null | undefined;
}): RiotAccountReadiness {
  const isRiotTournament = isRiotGame(params.gameSlug, params.gameName);
  const riotConnected = Boolean(params.riotExternalId?.trim());
  const missing: string[] = [];

  if (isRiotTournament && !riotConnected) {
    missing.push("riot_account");
  }

  return {
    isRiotTournament,
    riotConnected,
    ready: !isRiotTournament || riotConnected,
    missing,
  };
}
