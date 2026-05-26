export function isCs2Game(
  slug: string | null | undefined,
  name?: string | null,
): boolean {
  if (slug && /\bcs2\b/i.test(slug)) return true;
  if (name && /counter[-\s]?strike[-\s]?2/i.test(name)) return true;
  return false;
}
