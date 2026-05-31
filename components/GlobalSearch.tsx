"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { NavigationMessages } from "@/lib/i18n";

type SearchResultType =
  | "tournament"
  | "announcement"
  | "rule"
  | "role"
  | "staff"
  | "team"
  | "player";

type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  href: string;
};

type GlobalSearchProps = {
  labels: NavigationMessages["search"];
};

const CUT8 =
  "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

function getTypeLabel(
  type: SearchResultType,
  labels: NavigationMessages["search"],
) {
  return labels.types[type];
}

export default function GlobalSearch({ labels }: GlobalSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const cleanQuery = query.trim();
  const hasSearchText = cleanQuery.length >= 2;

  function openSearch() {
    setIsOpen(true);
  }

  function closeSearch() {
    setIsOpen(false);
    setSelectedIndex(0);
  }

  function goToSelectedResult() {
    const result = results[selectedIndex];

    if (!result) {
      return;
    }

    closeSearch();
    router.push(result.href);
  }

  useEffect(() => {
    closeSearch();
  }, [pathname]);

    useEffect(() => {
      function handleKeyboardShortcut(event: KeyboardEvent) {
        const key = typeof event.key === "string" ? event.key : "";

        if (!key) {
          return;
        }

        const isSearchShortcut =
          key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);

        if (isSearchShortcut) {
          event.preventDefault();
          openSearch();
        }

        if (key === "Escape") {
          closeSearch();
        }
      }

      document.addEventListener("keydown", handleKeyboardShortcut);

      return () => {
        document.removeEventListener("keydown", handleKeyboardShortcut);
      };
    }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !hasSearchText) {
      setResults([]);
      setIsLoading(false);
      setHasError(false);
      setSelectedIndex(0);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(cleanQuery)}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = (await response.json()) as SearchResult[];
        setResults(Array.isArray(data) ? data : []);
        setSelectedIndex(0);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setResults([]);
        setHasError(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [cleanQuery, hasSearchText, isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className="hidden items-center gap-2 lg:flex"
        style={{
          width: 260,
          background: "var(--asc-bg-1)",
          border: "1px solid var(--asc-line-soft)",
          padding: "6px 10px",
          clipPath: CUT8,
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: 11,
          color: "var(--asc-fg-3)",
          letterSpacing: "0.06em",
          cursor: "pointer",
          flexShrink: 0,
        }}
        aria-label={labels.label}
      >
        <svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span
          style={{
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "start",
          }}
        >
          {labels.placeholder}
        </span>
        <kbd
          style={{
            fontFamily: "inherit",
            fontSize: 10,
            padding: "2px 5px",
            background: "var(--asc-bg-2)",
            border: "1px solid var(--asc-line-soft)",
            color: "var(--asc-fg-3)",
            flexShrink: 0,
          }}
        >
          Ctrl K
        </kbd>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 px-4 pt-24 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSearch();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={labels.label}
            className="relative w-full max-w-2xl overflow-hidden border shadow-2xl"
            style={{
              borderColor: "var(--asc-line)",
              background: "var(--asc-bg-1)",
              boxShadow: "0 24px 70px rgb(0 0 0 / 0.55)",
              clipPath:
                "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)",
            }}
          >
            <div aria-hidden="true" className="asc-corner-mark" />

            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--asc-accent)", flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedIndex((current) =>
                      results.length === 0
                        ? 0
                        : Math.min(current + 1, results.length - 1),
                    );
                  }

                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedIndex((current) => Math.max(current - 1, 0));
                  }

                  if (event.key === "Enter") {
                    event.preventDefault();
                    goToSelectedResult();
                  }

                  if (event.key === "Escape") {
                    closeSearch();
                  }
                }}
                aria-label={labels.label}
                placeholder={labels.placeholder}
                autoComplete="off"
                className="min-w-0 flex-1"
                style={{
                  border: 0,
                  outline: "none",
                  background: "transparent",
                  color: "var(--asc-fg-0)",
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              />
              <button
                type="button"
                onClick={closeSearch}
                className="grid h-8 w-8 place-items-center border text-xs font-black transition hover:opacity-80"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  color: "var(--asc-fg-3)",
                  background: "transparent",
                  clipPath: CUT8,
                }}
                aria-label="Close search"
              >
                ESC
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto py-2">
              {isLoading ? (
                <p
                  className="px-5 py-5 text-sm font-bold"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  {labels.loading}
                </p>
              ) : hasError ? (
                <p
                  className="px-5 py-5 text-sm font-bold"
                  style={{ color: "var(--asc-live)" }}
                >
                  {labels.error}
                </p>
              ) : hasSearchText && results.length === 0 ? (
                <p
                  className="px-5 py-5 text-sm font-bold"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  {labels.noResults}
                </p>
              ) : !hasSearchText ? (
                <p
                  className="px-5 py-5 text-sm font-bold"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  {labels.placeholder}
                </p>
              ) : (
                <div role="listbox" aria-label={labels.label}>
                  {results.map((result, index) => {
                    const isSelected = selectedIndex === index;

                    return (
                      <Link
                        key={`${result.type}-${result.id}`}
                        href={result.href}
                        onClick={closeSearch}
                        role="option"
                        aria-selected={isSelected}
                        className="block px-5 py-4 transition"
                        style={{
                          borderBottom: "1px solid var(--asc-line-soft)",
                          background: isSelected
                            ? "var(--asc-hover-soft)"
                            : "transparent",
                          textDecoration: "none",
                        }}
                      >
                        <span
                          className="text-[10px] font-black uppercase tracking-[0.16em]"
                          style={{ color: "var(--asc-accent)" }}
                        >
                          {getTypeLabel(result.type, labels)}
                        </span>
                        <span
                          className="mt-1 block truncate text-base font-black"
                          style={{ color: "var(--asc-fg-0)" }}
                        >
                          {result.title}
                        </span>
                        {result.description && (
                          <span
                            className="mt-1 line-clamp-2 block text-sm leading-6"
                            style={{ color: "var(--asc-fg-3)" }}
                          >
                            {result.description}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
