export const PUBLIC_THEME_STORAGE_KEY = "ascendra-public-theme";

export type PublicTheme = "dark" | "light";

export function normalizePublicTheme(value: string | null): PublicTheme {
  return value === "light" ? "light" : "dark";
}
