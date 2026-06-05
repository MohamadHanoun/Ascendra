"use client";

import { useState } from "react";

export function CopyLinkButton({
  label,
  copiedLabel,
  path,
}: {
  label: string;
  copiedLabel: string;
  path?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = path ? `${window.location.origin}${path}` : window.location.href;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="border px-4 py-2 text-xs font-black uppercase tracking-[0.10em] transition hover:opacity-80 motion-reduce:transition-none"
      style={{
        borderColor: copied
          ? "var(--asc-green-border)"
          : "var(--asc-line-soft)",
        color: copied ? "var(--asc-green)" : "var(--asc-fg-2)",
        background: "transparent",
      }}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
