export function isLeagueOfLegendsGame(
  slug: string | null | undefined,
  name?: string | null,
): boolean {
  if (slug && (/\blol\b/i.test(slug) || /league[-_\s]?of[-_\s]?legends/i.test(slug) || /\bleague\b/i.test(slug))) return true;
  if (name && (/league\s+of\s+legends/i.test(name) || /\blol\b/i.test(name))) return true;
  return false;
}

export function isValorantGame(
  slug: string | null | undefined,
  name?: string | null,
): boolean {
  if (slug && /\bvalorant\b/i.test(slug)) return true;
  if (name && /\bvalorant\b/i.test(name)) return true;
  return false;
}

export function isRiotGame(
  slug: string | null | undefined,
  name?: string | null,
): boolean {
  return isLeagueOfLegendsGame(slug, name) || isValorantGame(slug, name);
}
