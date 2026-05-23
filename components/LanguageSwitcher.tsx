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
  const shortLabel = locale === "ar" ? "EN" : "AR";
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
      className={
        compact
          ? "flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-gray-300 transition hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-white"
          : "inline-flex h-10 min-w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-black uppercase tracking-[0.12em] text-gray-300 transition hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-white"
      }
    >
      {compact ? buttonLabel : shortLabel}
    </button>
  );
}
