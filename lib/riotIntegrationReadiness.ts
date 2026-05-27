import "server-only";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiotIntegrationReadinessResult = {
  riotClientConfigured: boolean;
  riotSecretConfigured: boolean;
  riotCallbackConfigured: boolean;
  riotFeatureReady: boolean;
  missing: string[];
};

// ─── Pure helper ──────────────────────────────────────────────────────────────

// Audits whether the environment is configured for Riot RSO OAuth (player
// account linking). The three RSO credentials are required together:
//
// 1. RIOT_RSO_CLIENT_ID  — the OAuth client ID issued by Riot Developer Portal.
// 2. RIOT_RSO_CLIENT_SECRET — the client secret for the RSO OAuth flow.
// 3. RIOT_RSO_REDIRECT_URI  — the callback URI registered in the Developer Portal.
//
// `env` is injectable for testing without process.env side effects.
export function getRiotIntegrationReadiness(
  env: Readonly<Record<string, string | undefined>> = process.env,
): RiotIntegrationReadinessResult {
  const missing: string[] = [];

  const riotClientConfigured = Boolean(env.RIOT_RSO_CLIENT_ID?.trim());
  const riotSecretConfigured = Boolean(env.RIOT_RSO_CLIENT_SECRET?.trim());
  const riotCallbackConfigured = Boolean(env.RIOT_RSO_REDIRECT_URI?.trim());

  if (!riotClientConfigured) {
    missing.push("RIOT_RSO_CLIENT_ID — Riot RSO OAuth client ID");
  }
  if (!riotSecretConfigured) {
    missing.push("RIOT_RSO_CLIENT_SECRET — Riot RSO OAuth client secret");
  }
  if (!riotCallbackConfigured) {
    missing.push("RIOT_RSO_REDIRECT_URI — Riot RSO OAuth redirect URI");
  }

  return {
    riotClientConfigured,
    riotSecretConfigured,
    riotCallbackConfigured,
    riotFeatureReady: missing.length === 0,
    missing,
  };
}
