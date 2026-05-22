"use client";

import { useRouter } from "next/navigation";
import type { Locale, NavigationMessages } from "@/lib/i18n";
import { localeCookieName } from "@/lib/i18n";

type LanguageSwitcherProps = {
  locale: Locale;
  labels: NavigationMessages["language"];
  compact?: boolean;
};

export default function LanguageSwitcher({
  locale,
  labels,
  compact = false,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const nextLocale: Locale = locale === "ar" ? "en" : "ar";
  const buttonLabel = locale === "ar" ? labels.english : labels.arabic;
  const ariaLabel =
    locale === "ar" ? labels.switchToEnglish : labels.switchToArabic;

  function switchLanguage() {
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextLocale === "ar" ? "rtl" : "ltr";

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={switchLanguage}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`rounded-xl border border-white/10 bg-white/[0.04] font-black text-gray-300 transition hover:bg-white/10 hover:text-white ${
        compact ? "px-4 py-3 text-sm" : "px-4 py-2 text-sm"
      }`}
    >
      {buttonLabel}
    </button>
  );
}
