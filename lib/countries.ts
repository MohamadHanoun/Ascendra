import type { Locale } from "@/lib/i18n";

export type Country = {
  /** ISO 3166-1 alpha-2 code, uppercase. */
  code: string;
  /** Flag emoji. */
  flag: string;
  /** English name. */
  nameEn: string;
  /** Arabic name. */
  nameAr: string;
};

// Fixed allowlist of supported countries. ISO 3166-1 alpha-2 codes only.
export const COUNTRIES: Country[] = [
  { code: "SE", flag: "🇸🇪", nameEn: "Sweden", nameAr: "السويد" },
  { code: "SA", flag: "🇸🇦", nameEn: "Saudi Arabia", nameAr: "السعودية" },
  { code: "SY", flag: "🇸🇾", nameEn: "Syria", nameAr: "سوريا" },
  { code: "LB", flag: "🇱🇧", nameEn: "Lebanon", nameAr: "لبنان" },
  { code: "DE", flag: "🇩🇪", nameEn: "Germany", nameAr: "ألمانيا" },
  { code: "DK", flag: "🇩🇰", nameEn: "Denmark", nameAr: "الدنمارك" },
  { code: "NO", flag: "🇳🇴", nameEn: "Norway", nameAr: "النرويج" },
  { code: "FI", flag: "🇫🇮", nameEn: "Finland", nameAr: "فنلندا" },
  { code: "NL", flag: "🇳🇱", nameEn: "Netherlands", nameAr: "هولندا" },
  { code: "FR", flag: "🇫🇷", nameEn: "France", nameAr: "فرنسا" },
  { code: "GB", flag: "🇬🇧", nameEn: "United Kingdom", nameAr: "المملكة المتحدة" },
  { code: "US", flag: "🇺🇸", nameEn: "United States", nameAr: "الولايات المتحدة" },
  { code: "TR", flag: "🇹🇷", nameEn: "Turkey", nameAr: "تركيا" },
  { code: "IQ", flag: "🇮🇶", nameEn: "Iraq", nameAr: "العراق" },
  { code: "JO", flag: "🇯🇴", nameEn: "Jordan", nameAr: "الأردن" },
  { code: "EG", flag: "🇪🇬", nameEn: "Egypt", nameAr: "مصر" },
  { code: "AE", flag: "🇦🇪", nameEn: "United Arab Emirates", nameAr: "الإمارات العربية المتحدة" },
];

const COUNTRY_BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]));

/**
 * Normalizes a raw input to a valid uppercase country code, or null if it is
 * empty or not in the allowlist.
 */
export function normalizeCountryCode(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  const code = raw.trim().toUpperCase();
  return COUNTRY_BY_CODE.has(code) ? code : null;
}

export function isValidCountryCode(raw: string | null | undefined): boolean {
  return normalizeCountryCode(raw) !== null;
}

export function getCountry(code: string | null | undefined): Country | null {
  const normalized = normalizeCountryCode(code);
  return normalized ? COUNTRY_BY_CODE.get(normalized) ?? null : null;
}

export function getCountryName(country: Country, locale: Locale): string {
  return locale === "ar" ? country.nameAr : country.nameEn;
}

/** Returns "🇸🇪 Sweden" / "🇸🇦 السعودية", or null when the code is unknown. */
export function formatCountryLabel(
  code: string | null | undefined,
  locale: Locale,
): string | null {
  const country = getCountry(code);
  if (!country) {
    return null;
  }
  return `${country.flag} ${getCountryName(country, locale)}`;
}

/** Options for a select control, localized and sorted by display name. */
export function getCountryOptions(locale: Locale): Array<{ value: string; label: string }> {
  return COUNTRIES.map((country) => ({
    value: country.code,
    label: `${country.flag} ${getCountryName(country, locale)}`,
  })).sort((a, b) => a.label.localeCompare(b.label, locale === "ar" ? "ar" : "en"));
}
