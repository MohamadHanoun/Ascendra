import type { CSSProperties } from "react";

type SkeletonProps = {
  /** Width — number (px) or any CSS length. Defaults to 100%. */
  width?: number | string;
  /** Height — number (px) or any CSS length. Defaults to 1rem. */
  height?: number | string;
  /** Render with the angular notched corner used across Ascendra surfaces. */
  notch?: boolean;
  /** Fully rounded (e.g. avatars). */
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
};

function toLength(value: number | string | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  return typeof value === "number" ? `${value}px` : value;
}

/**
 * Base skeleton block. CSS-only metallic shimmer (gold in dark mode,
 * silver in light mode) driven by `.asc-skeleton` in globals.css.
 * Server component — no client JS. Shimmer freezes under reduced motion.
 */
export function Skeleton({
  width,
  height,
  notch = false,
  circle = false,
  className = "",
  style,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`asc-skeleton block${notch ? " asc-skeleton--notch" : ""}${
        className ? ` ${className}` : ""
      }`}
      style={{
        width: toLength(width, "100%"),
        height: toLength(height, "1rem"),
        borderRadius: circle ? "9999px" : undefined,
        ...style,
      }}
    />
  );
}

type SkeletonTextProps = {
  /** Number of lines. */
  lines?: number;
  /** Width of the final (short) line. */
  lastLineWidth?: number | string;
  className?: string;
};

/** Multi-line text placeholder; the last line is shortened for realism. */
export function SkeletonText({
  lines = 3,
  lastLineWidth = "60%",
  className = "",
}: SkeletonTextProps) {
  return (
    <span className={`grid gap-2${className ? ` ${className}` : ""}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={12}
          width={index === lines - 1 ? lastLineWidth : "100%"}
        />
      ))}
    </span>
  );
}

/**
 * Notched card placeholder matching `.asc-card` proportions
 * (tournament tiles, game tiles, panels).
 */
export function SkeletonCard({
  height = 240,
  className = "",
}: {
  height?: number | string;
  className?: string;
}) {
  return (
    <div
      className={`relative border p-5${className ? ` ${className}` : ""}`}
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        minHeight: toLength(height, "240px"),
        clipPath:
          "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />
      <div className="flex h-full flex-col gap-4">
        <Skeleton width={84} height={22} notch />
        <div className="mt-auto grid gap-3">
          <Skeleton width="70%" height={24} />
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
}

/**
 * Stat-card placeholder matching the notched stat cards used across
 * the tournaments list and detail hero (small label bar + big number).
 */
export function SkeletonStat({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`relative border p-5${className ? ` ${className}` : ""}`}
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath:
          "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />
      <Skeleton width="55%" height={10} />
      <Skeleton className="mt-3" width="42%" height={30} />
    </div>
  );
}

/** Leaderboard / list row placeholder: rank + avatar + name + score. */
export function SkeletonRow({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-4${className ? ` ${className}` : ""}`}
      style={{ borderTop: "1px solid var(--asc-line-soft)" }}
    >
      <Skeleton width={20} height={16} />
      <Skeleton width={36} height={36} notch />
      <div className="min-w-0 flex-1">
        <Skeleton width="44%" height={14} />
      </div>
      <Skeleton width={56} height={18} />
    </div>
  );
}
