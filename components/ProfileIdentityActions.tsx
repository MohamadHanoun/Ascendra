"use client";

import { useEffect, useState } from "react";

type ProfileIdentityActionsProps = {
  discordId: string;
};

type Locale = "en" | "ar";

const profileIdentityMessages: Record<Locale, { hidden: string; show: string; hide: string; copy: string; copied: string }> = {
  en: { hidden: "Hidden", show: "Show", hide: "Hide", copy: "Copy", copied: "Copied" },
  ar: { hidden: "مخفي", show: "إظهار", hide: "إخفاء", copy: "نسخ", copied: "تم النسخ" },
};

function getCookieValue(name: string) {
  const cookies = document.cookie.split(";").map((c) => c.trim()).filter(Boolean);
  const target = cookies.find((c) => c.startsWith(`${name}=`));
  if (!target) return "";
  return decodeURIComponent(target.split("=").slice(1).join("="));
}

function getCurrentLocale(): Locale {
  if (typeof document === "undefined") return "en";
  return getCookieValue("ascendra_locale") === "ar" ? "ar" : "en";
}

export default function ProfileIdentityActions({ discordId }: ProfileIdentityActionsProps) {
  const [locale, setLocale] = useState<Locale>("en");
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setLocale(getCurrentLocale()); }, []);

  const messages = profileIdentityMessages[locale];
  const hiddenDiscordId =
    discordId.length > 8
      ? `${discordId.slice(0, 5)}******${discordId.slice(-3)}`
      : messages.hidden;

  async function copyDiscordId() {
    try {
      await navigator.clipboard.writeText(discordId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code
        className="border px-3 py-2 text-sm font-bold"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-0)" }}
      >
        {visible ? discordId : hiddenDiscordId}
      </code>

      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="border px-3 py-2 text-sm font-bold transition hover:opacity-90"
        style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-2)", background: "transparent" }}
      >
        {visible ? messages.hide : messages.show}
      </button>

      <button
        type="button"
        onClick={copyDiscordId}
        className="border px-3 py-2 text-sm font-bold transition hover:opacity-90"
        style={{ borderColor: "var(--asc-accent-border)", color: "var(--asc-accent)", background: "var(--asc-accent-dim)" }}
      >
        {copied ? messages.copied : messages.copy}
      </button>
    </div>
  );
}
