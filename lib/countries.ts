import type { Locale } from "@/lib/i18n";

// Full ISO 3166-1 alpha-2 country code allowlist.
export const COUNTRY_CODES: string[] = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BV", "BW", "BY", "BZ",
  "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW",
  "CX", "CY", "CZ",
  "DE", "DJ", "DK", "DM", "DO", "DZ",
  "EC", "EE", "EG", "EH", "ER", "ES", "ET",
  "FI", "FJ", "FK", "FM", "FO", "FR",
  "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT",
  "GU", "GW", "GY",
  "HK", "HM", "HN", "HR", "HT", "HU",
  "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
  "JE", "JM", "JO", "JP",
  "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
  "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
  "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS",
  "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
  "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ",
  "OM",
  "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY",
  "QA",
  "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ",
  "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
  "UA", "UG", "UM", "US", "UY", "UZ",
  "VA", "VC", "VE", "VG", "VI", "VN", "VU",
  "WF", "WS",
  "YE", "YT",
  "ZA", "ZM", "ZW",
];

const COUNTRY_CODE_SET = new Set(COUNTRY_CODES);

/**
 * Normalizes a raw input to a valid uppercase country code, or null if it is
 * empty or not in the allowlist.
 */
export function normalizeCountryCode(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  const code = raw.trim().toUpperCase();
  return COUNTRY_CODE_SET.has(code) ? code : null;
}

export function isValidCountryCode(raw: string | null | undefined): boolean {
  return normalizeCountryCode(raw) !== null;
}

/**
 * Builds the flag emoji from a country code by mapping each ASCII letter to its
 * Regional Indicator Symbol. Returns "" for invalid codes.
 */
export function getCountryFlag(code: string | null | undefined): string {
  const normalized = normalizeCountryCode(code);
  if (!normalized) {
    return "";
  }
  const codePoints = [...normalized].map(
    (char) => 0x1f1e6 + (char.charCodeAt(0) - 65),
  );
  return String.fromCodePoint(...codePoints);
}

// Cache Intl.DisplayNames instances per locale (they are relatively expensive).
const displayNamesCache = new Map<string, Intl.DisplayNames>();

function getDisplayNames(locale: Locale): Intl.DisplayNames | null {
  const resolved = locale === "ar" ? "ar" : "en";
  const cached = displayNamesCache.get(resolved);
  if (cached) {
    return cached;
  }
  try {
    const instance = new Intl.DisplayNames([resolved], { type: "region" });
    displayNamesCache.set(resolved, instance);
    return instance;
  } catch {
    return null;
  }
}

/** Localized country name for a code, or null if the code is invalid. */
export function getCountryName(
  code: string | null | undefined,
  locale: Locale,
): string | null {
  const normalized = normalizeCountryCode(code);
  if (!normalized) {
    return null;
  }
  const displayNames = getDisplayNames(locale);
  try {
    return displayNames?.of(normalized) ?? normalized;
  } catch {
    return normalized;
  }
}

/** Returns "🇸🇪 Sweden" / "🇸🇦 السعودية", or null when the code is unknown. */
export function formatCountryLabel(
  code: string | null | undefined,
  locale: Locale,
): string | null {
  const name = getCountryName(code, locale);
  if (!name) {
    return null;
  }
  return `${getCountryFlag(code)} ${name}`;
}

// Cache the built+sorted option list per locale.
const optionsCache = new Map<string, Array<{ value: string; label: string }>>();

/** Options for a select control, localized and sorted by display name. */
export function getCountryOptions(locale: Locale): Array<{ value: string; label: string }> {
  const resolved = locale === "ar" ? "ar" : "en";
  const cached = optionsCache.get(resolved);
  if (cached) {
    return cached;
  }
  const options = COUNTRY_CODES.map((code) => ({
    value: code,
    label: `${getCountryFlag(code)} ${getCountryName(code, locale) ?? code}`,
    name: getCountryName(code, locale) ?? code,
  }))
    .sort((a, b) => a.name.localeCompare(b.name, resolved))
    .map(({ value, label }) => ({ value, label }));
  optionsCache.set(resolved, options);
  return options;
}
