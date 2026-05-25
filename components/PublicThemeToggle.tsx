"use client";

import { usePublicTheme } from "@/components/PublicThemeProvider";

export default function PublicThemeToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { theme, toggleTheme, isReady } = usePublicTheme();
  const activeTheme = isReady ? theme : "dark";
  const nextTheme = activeTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="asc-theme-toggle"
      aria-label={`Switch to ${nextTheme} theme`}
      aria-pressed={activeTheme === "light"}
      data-theme={activeTheme}
      data-compact={compact ? "true" : "false"}
      onClick={toggleTheme}
    >
      <span aria-hidden="true" className="asc-theme-toggle__icon">
        {activeTheme === "light" ? "LT" : "DK"}
      </span>
      <span className="asc-theme-toggle__text">
        {activeTheme === "light" ? "Light" : "Dark"}
      </span>
    </button>
  );
}
