import "server-only";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FaceitLobbyReadinessResult = {
  canAttemptAutoLobby: boolean;
  missing: string[];
  warnings: string[];
};

// ─── Pure helper ──────────────────────────────────────────────────────────────

// Audits whether the environment is configured for automatic FACEIT match
// creation. FACEIT match creation requires:
//
// 1. A FACEIT Organizer API key — separate from the read-only Data API key
//    (FACEIT_API_KEY). Requires a FACEIT organizer account with write access.
//
// 2. A FACEIT Organizer ID — the organizer account identifier on FACEIT.
//
// 3. A Championship or Hub ID — FACEIT matches are created within a
//    championship (for single tournaments) or a hub (for ongoing leagues).
//    At least one must be configured.
//
// The existing FACEIT_API_KEY grants read-only access to match data, player
// profiles, and match statistics. It cannot create lobbies or matches.
//
// `env` is injectable for testing without process.env side effects.
export function getFaceitLobbyReadiness(
  env: Readonly<Record<string, string | undefined>> = process.env,
): FaceitLobbyReadinessResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!env.FACEIT_ORGANIZER_API_KEY?.trim()) {
    missing.push(
      "FACEIT_ORGANIZER_API_KEY — organizer write key (distinct from the read-only Data API key)",
    );
  }

  if (!env.FACEIT_ORGANIZER_ID?.trim()) {
    missing.push("FACEIT_ORGANIZER_ID — FACEIT organizer account identifier");
  }

  const hasChampionship = Boolean(env.FACEIT_CHAMPIONSHIP_ID?.trim());
  const hasHub = Boolean(env.FACEIT_HUB_ID?.trim());
  if (!hasChampionship && !hasHub) {
    missing.push(
      "FACEIT_CHAMPIONSHIP_ID or FACEIT_HUB_ID — the championship or hub under which matches are created",
    );
  }

  if (!env.FACEIT_API_KEY?.trim()) {
    warnings.push(
      "FACEIT_API_KEY is not configured — proof sync and match lookups will not work",
    );
  }

  return {
    canAttemptAutoLobby: missing.length === 0,
    missing,
    warnings,
  };
}
