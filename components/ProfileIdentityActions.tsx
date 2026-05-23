"use client";

import { useEffect, useState } from "react";

type ProfileIdentityActionsProps = {
  discordId: string;
};

type Locale = "en" | "ar";

const profileIdentityMessages: Record<
  Locale,
  {
    hidden: string;
    show: string;
    hide: string;
    copy: string;
    copied: string;
  }
> = {
  en: {
    hidden: "Hidden",
    show: "Show",
    hide: "Hide",
    copy: "Copy",
    copied: "Copied",
  },
  ar: {
    hidden: "مخفي",
    show: "إظهار",
    hide: "إخفاء",
    copy: "نسخ",
    copied: "تم النسخ",
  },
};

function getCookieValue(name: string) {
  const cookies = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean);

  const targetCookie = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (!targetCookie) {
    return "";
  }

  return decodeURIComponent(targetCookie.split("=").slice(1).join("="));
}

function getCurrentLocale(): Locale {
  if (typeof document === "undefined") {
    return "en";
  }

  return getCookieValue("ascendra_locale") === "ar" ? "ar" : "en";
}

export default function ProfileIdentityActions({
  discordId,
}: ProfileIdentityActionsProps) {
  const [locale, setLocale] = useState<Locale>("en");
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLocale(getCurrentLocale());
  }, []);

  const messages = profileIdentityMessages[locale];

  const hiddenDiscordId =
    discordId.length > 8
      ? `${discordId.slice(0, 5)}******${discordId.slice(-3)}`
      : messages.hidden;

  async function copyDiscordId() {
    try {
      await navigator.clipboard.writeText(discordId);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded border border-white/10 bg-black/25 px-3 py-2 text-sm font-bold text-white">
        {visible ? discordId : hiddenDiscordId}
      </code>

      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="rounded border border-white/10 px-3 py-2 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
      >
        {visible ? messages.hide : messages.show}
      </button>

      <button
        type="button"
        onClick={copyDiscordId}
        className="rounded border border-violet-500/30 px-3 py-2 text-sm font-bold text-violet-300 transition hover:bg-violet-500/10"
      >
        {copied ? messages.copied : messages.copy}
      </button>
    </div>
  );
}
