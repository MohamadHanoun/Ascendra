export type Cs2Readiness = {
  steamConnected: boolean;
  faceitConnected: boolean;
  faceitMatchesSteam: boolean;
  isReady: boolean;
};

export function computeCs2Readiness(params: {
  steamId64: string | null | undefined;
  faceitPlayerId: string | null | undefined;
  faceitSteamId64: string | null | undefined;
}): Cs2Readiness {
  const steamConnected = Boolean(params.steamId64);
  const faceitConnected = Boolean(params.faceitPlayerId);
  const faceitMatchesSteam =
    steamConnected &&
    faceitConnected &&
    params.faceitSteamId64 != null &&
    params.faceitSteamId64 === params.steamId64;
  return {
    steamConnected,
    faceitConnected,
    faceitMatchesSteam,
    isReady: steamConnected && faceitConnected && faceitMatchesSteam,
  };
}
