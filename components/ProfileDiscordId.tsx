"use client";

import { useState } from "react";

type ProfileDiscordIdProps = {
  discordId: string;
};

export default function ProfileDiscordId({ discordId }: ProfileDiscordIdProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const hiddenId = discordId.length > 6 ? `${discordId.slice(0, 6)}******` : "******";

  async function copyDiscordId() {
    await navigator.clipboard.writeText(discordId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-2 border p-4" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--asc-fg-3)" }}>
        Discord ID
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <code className="min-w-0 border px-3 py-2 text-sm" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-2)" }}>
          {isVisible ? discordId : hiddenId}
        </code>

        <button
          type="button"
          onClick={() => setIsVisible((value) => !value)}
          className="border px-3 py-2 text-sm font-bold transition hover:opacity-90"
          style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-2)", background: "transparent" }}
          title={isVisible ? "Hide Discord ID" : "Show Discord ID"}
        >
          {isVisible ? "Hide" : "Show"}
        </button>

        <button
          type="button"
          onClick={copyDiscordId}
          className="border px-3 py-2 text-sm font-bold transition hover:opacity-90"
          style={{ borderColor: "var(--asc-accent-border)", color: "var(--asc-accent)", background: "var(--asc-accent-dim)" }}
          title="Copy Discord ID"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
