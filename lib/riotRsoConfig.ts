/**
 * Riot RSO (OAuth 2.0) configuration helper.
 *
 * All three variables are required before Riot account linking can be used.
 * RIOT_RSO_CLIENT_SECRET must never fall back to a literal string because it
 * is used as an HMAC key for state-token signing; an empty or well-known
 * fallback would make the CSRF protection trivially bypassable.
 */

export type RiotRsoConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

/**
 * Returns the Riot RSO config if all three required env vars are present and
 * non-empty, otherwise returns `null`.
 *
 * Use this in both the /start and /callback routes so that missing config is
 * caught before any cryptographic operations are attempted.
 */
export function getRiotRsoConfig(): RiotRsoConfig | null {
  const clientId = process.env.RIOT_RSO_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.RIOT_RSO_CLIENT_SECRET?.trim() ?? "";
  const redirectUri = process.env.RIOT_RSO_REDIRECT_URI?.trim() ?? "";

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return { clientId, clientSecret, redirectUri };
}
