// Server-only: reads FACEIT environment flags and returns booleans only.

type EnvSource = Readonly<Record<string, string | undefined>>;

export type FaceitIntegrationStatus = {
  apiKeyConfigured: boolean;
  webhookSecretConfigured: boolean;
  autoConfirmEnabled: boolean;
  factionOrderFallbackEnabled: boolean;
};

export function isConfiguredEnvValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function isEnabledEnvFlag(value: string | undefined): boolean {
  return value === "true";
}

export function getFaceitIntegrationStatus(
  env: EnvSource = process.env,
): FaceitIntegrationStatus {
  return {
    apiKeyConfigured: isConfiguredEnvValue(env.FACEIT_API_KEY),
    webhookSecretConfigured: isConfiguredEnvValue(env.FACEIT_WEBHOOK_SECRET),
    autoConfirmEnabled: isEnabledEnvFlag(env.FACEIT_AUTO_CONFIRM_ENABLED),
    factionOrderFallbackEnabled: isEnabledEnvFlag(
      env.FACEIT_AUTO_CONFIRM_ALLOW_FACTION_ORDER,
    ),
  };
}
