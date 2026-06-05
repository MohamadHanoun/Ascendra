import { Skeleton } from "@/components/ui/Skeleton";

const NOTCH_10 =
  "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)";
const NOTCH_14 =
  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";
const ROW_COLS =
  "md:grid-cols-[64px_minmax(0,1fr)_130px_110px_120px_120px]";

function PodiumColumnSkeleton({ height }: { height: number }) {
  return (
    <div
      className="relative flex flex-col items-center gap-4 border p-6"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        minHeight: height,
        clipPath: NOTCH_14,
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />
      <Skeleton width={56} height={56} circle />
      <Skeleton width="60%" height={16} />
      <Skeleton width="40%" height={11} />
      <Skeleton className="mt-auto" width="50%" height={28} />
    </div>
  );
}

function RankRowSkeleton() {
  return (
    <div
      className={`flex items-center gap-4 px-[18px] py-3 md:grid ${ROW_COLS} md:items-center`}
      style={{ borderTop: "1px solid var(--asc-line-soft)" }}
    >
      <Skeleton width={28} height={16} />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Skeleton width={32} height={32} notch />
        <Skeleton width="50%" height={14} />
      </div>
      <Skeleton width={64} height={12} className="hidden md:block" />
      <Skeleton width={52} height={12} className="hidden md:block" />
      <Skeleton width={56} height={12} className="hidden md:block" />
      <Skeleton width={56} height={12} className="hidden md:block" />
      <Skeleton width={48} height={14} className="md:hidden" />
    </div>
  );
}

/**
 * Loading placeholder for /leaderboard. Mirrors the hero + filter bar, the
 * top-3 podium (middle column taller), and the ranking table (header +
 * rows). Server component, CSS-only shimmer.
 */
export default function LeaderboardSkeleton() {
  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
      aria-busy="true"
    >
      <div className="relative z-10">
        {/* Hero */}
        <section
          className="asc-image-hero relative flex min-h-[360px] items-end overflow-hidden"
          style={{ background: "var(--asc-bg-1)" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-40"
            style={{
              background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))",
            }}
          />
          <div className="relative z-10 mx-auto w-full max-w-[1480px] px-6 pb-7 pt-24 lg:px-8">
            <Skeleton width={170} height={12} />
            <Skeleton className="mt-4" width="45%" height={48} />
            <div className="mt-4 grid max-w-xl gap-2">
              <Skeleton width="90%" height={13} />
              <Skeleton width="65%" height={13} />
            </div>

            {/* Filter bar */}
            <div
              className="mt-[22px] flex flex-wrap items-center gap-2 border p-3"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-card)",
                clipPath: NOTCH_10,
              }}
            >
              <Skeleton width={70} height={14} />
              <Skeleton width={120} height={36} notch />
              <Skeleton width={120} height={36} notch />
              <div
                className="mx-1 h-6 w-px"
                style={{ background: "var(--asc-line-soft)" }}
              />
              <Skeleton width={110} height={36} notch />
              <Skeleton width={90} height={36} notch />
              <div
                className="mx-1 h-6 w-px"
                style={{ background: "var(--asc-line-soft)" }}
              />
              <Skeleton width={140} height={36} notch />
            </div>
          </div>
        </section>

        <div className="relative z-20 mx-auto -mt-5 max-w-[1480px] px-6 pb-24 lg:px-8">
          {/* Disclaimer */}
          <Skeleton width="100%" height={36} notch className="block" />

          {/* Podium */}
          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end">
            <PodiumColumnSkeleton height={180} />
            <PodiumColumnSkeleton height={220} />
            <PodiumColumnSkeleton height={180} />
          </div>

          {/* Ranking table */}
          <div
            className="mt-6 overflow-hidden border"
            style={{
              borderColor: "var(--asc-line-soft)",
              background: "var(--asc-bg-1)",
            }}
          >
            <div
              className={`hidden px-[18px] py-[10px] md:grid ${ROW_COLS}`}
              style={{
                borderBottom: "1px solid var(--asc-line-soft)",
                background: "var(--asc-table-head-bg)",
              }}
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} width="55%" height={10} />
              ))}
            </div>

            {Array.from({ length: 9 }).map((_, index) => (
              <RankRowSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
