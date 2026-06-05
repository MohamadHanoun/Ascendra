import { Skeleton } from "@/components/ui/Skeleton";

const NOTCH_14 =
  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";

function StatBlockSkeleton() {
  return (
    <div className="grid gap-2">
      <Skeleton width={70} height={10} />
      <Skeleton width={50} height={28} />
    </div>
  );
}

function GameRowSkeleton() {
  return (
    <div
      className="relative min-h-[180px] overflow-hidden border"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath: NOTCH_14,
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />
      <div className="grid min-h-[180px] lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Image panel */}
        <Skeleton
          height="100%"
          className="min-h-[210px] lg:min-h-[180px]"
          style={{ display: "block" }}
        />

        {/* Content */}
        <div className="flex flex-col gap-6 p-6">
          <div className="grid gap-3">
            <Skeleton width={90} height={10} />
            <Skeleton width="45%" height={30} />
            <Skeleton width="80%" height={12} />
          </div>

          <div className="mt-auto grid grid-cols-2 gap-5 sm:grid-cols-4">
            <StatBlockSkeleton />
            <StatBlockSkeleton />
            <StatBlockSkeleton />
            <StatBlockSkeleton />
          </div>

          <div className="flex flex-wrap gap-2">
            <Skeleton width={110} height={24} notch />
            <Skeleton width={96} height={24} notch />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading placeholder for /games. Mirrors the hero, the section header with
 * 3 stat blocks, and the vertical list of wide game rows (image panel +
 * content). Server component, CSS-only shimmer.
 */
export default function GamesSkeleton() {
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
          <div className="relative z-10 mx-auto w-full max-w-[1680px] px-6 pb-9 pt-24 lg:px-10 2xl:px-14">
            <Skeleton width={200} height={12} />
            <Skeleton className="mt-[18px]" width="50%" height={64} />
            <div className="mt-[18px] grid max-w-[580px] gap-2">
              <Skeleton width="90%" height={14} />
              <Skeleton width="65%" height={14} />
            </div>
          </div>
        </section>

        {/* Section header + game rows */}
        <section className="mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 pt-10 lg:px-10 2xl:px-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid gap-2">
              <Skeleton width={130} height={10} />
              <Skeleton width={200} height={26} />
            </div>
            <div className="flex flex-wrap gap-6">
              <StatBlockSkeleton />
              <StatBlockSkeleton />
              <StatBlockSkeleton />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <GameRowSkeleton key={index} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
