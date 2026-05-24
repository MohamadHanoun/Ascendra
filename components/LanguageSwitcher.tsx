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
      className={compact ? "flex w-full items-center justify-center border px-4 py-3 text-sm font-black transition hover:opacity-90" : "inline-flex h-10 min-w-12 items-center justify-center border px-3 text-xs font-black uppercase tracking-[0.12em] transition hover:opacity-90"}
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
    >
      {compact ? buttonLabel : shortLabel}
    </button>
  );
}
