"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  normalizePublicTheme,
  PUBLIC_THEME_STORAGE_KEY,
  type PublicTheme,
} from "@/lib/theme";

type PublicThemeContextValue = {
  theme: PublicTheme;
  setTheme: (theme: PublicTheme) => void;
  toggleTheme: () => void;
  isReady: boolean;
};

const PublicThemeContext = createContext<PublicThemeContextValue | null>(null);

function applyTheme(theme: PublicTheme) {
  document.documentElement.dataset.ascTheme = theme;
}

export function PublicThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<PublicTheme>("dark");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let initialTheme: PublicTheme = "dark";

    try {
      initialTheme = normalizePublicTheme(
        window.localStorage.getItem(PUBLIC_THEME_STORAGE_KEY),
      );
    } catch {
      initialTheme = normalizePublicTheme(
        document.documentElement.dataset.ascTheme ?? null,
      );
    }

    applyTheme(initialTheme);
    queueMicrotask(() => {
      setThemeState(initialTheme);
      setIsReady(true);
    });
  }, []);

  const setTheme = useCallback((nextTheme: PublicTheme) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);

    try {
      window.localStorage.setItem(PUBLIC_THEME_STORAGE_KEY, nextTheme);
    } catch {
      // localStorage can be unavailable in restricted browser contexts.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, isReady }),
    [isReady, setTheme, theme, toggleTheme],
  );

  return (
    <PublicThemeContext.Provider value={value}>
      {children}
    </PublicThemeContext.Provider>
  );
}

export function usePublicTheme() {
  const value = useContext(PublicThemeContext);

  if (!value) {
    throw new Error("usePublicTheme must be used within PublicThemeProvider");
  }

  return value;
}
