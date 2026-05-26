// Validates and extracts a FACEIT match ID from either a bare ID or a room URL.
// Returns null for any string that does not match the expected patterns.

const FACEIT_ID_RE =
  /^1-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FACEIT_ROOM_URL_RE =
  /\/room\/(1-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export function extractFaceitMatchId(input: string): string | null {
  // Strip query string / hash before testing
  const trimmed = input.trim().split("?")[0].split("#")[0];
  if (FACEIT_ID_RE.test(trimmed)) return trimmed.toLowerCase();
  const m = trimmed.match(FACEIT_ROOM_URL_RE);
  return m ? m[1].toLowerCase() : null;
}
