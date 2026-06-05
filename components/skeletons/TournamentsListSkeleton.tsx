import { Skeleton, SkeletonStat } from "@/components/ui/Skeleton";

const NOTCH_12 =
  "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)";
const NOTCH_18 =
  "polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)";
const DIRECTORY_COLS =
  "grid-cols-[2fr_1fr_0.8fr_0.8fr_0.9fr_0.9fr_1fr_0.4fr]";

function SectionHeaderSkeleton() {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-2">
        <Skeleton width={150} height={11} />
        <Skeleton width={260} height={32} />
      </div>
      <Skeleton width={120} height={36} notch />
    </div>
  );
}

function DesktopRowSkeleton() {
  return (
    <div
      className={`hidden ${DIRECTORY_COLS} items-center gap-4 px-5 py-4 lg:grid`}
      style={{ borderTop: "1px solid var(--asc-line-soft)" }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Skeleton width={48} height={48} notch />
        <div className="grid min-w-0 flex-1 gap-2">
          <Skeleton width="70%" height={14} />
          <Skeleton width="40%" height={10} />
        </div>
      </div>
      <Skeleton width="70%" height={12} />
      <Skeleton width="50%" height={12} />
      <Skeleton width="55%" height={14} />
      <Skeleton width="60%" height={14} />
      <Skeleton width="50%" height={12} />
      <Skeleton width={64} height={20} notch />
      <Skeleton width={14} height={14} className="ml-auto" />
    </div>
  );
}

function MobileCardSkeleton() {
  return (
    <div
      className="overflow-hidden border lg:hidden"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath: NOTCH_12,
      }}
    >
      <Skeleton height={160} style={{ display: "block" }} />
      <div className="grid gap-4 p-5">
        <div className="flex flex-wrap gap-2">
          <Skeleton width={72} height={20} notch />
          <Skeleton width={92} height={20} notch />
        </div>
        <div className="grid gap-2">
          <Skeleton width={120} height={11} />
          <Skeleton width="80%" height={26} />
          <Skeleton width="55%" height={12} />
        </div>
        <Skeleton height={6} />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton height={32} />
          <Skeleton height={32} />
          <Skeleton height={32} />
        </div>
        <Skeleton height={44} notch />
      </div>
    </div>
  );
}

/**
 * Loading placeholder for /tournaments. Mirrors the real layout — hero band,
 * 4 stat cards, a featured image block, and the directory (desktop table /
 * mobile cards) — to avoid layout shift. Server component, CSS-only shimmer.
 */
export default function TournamentsListSkeleton() {
  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
      aria-busy="true"
    >
      <div className="relative z-10">
        {/* Hero */}
        <section
          className="asc-image-hero relative min-h-[360px] overflow-hidden"
          style={{ background: "var(--asc-bg-1)" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-40"
            style={{
              background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))",
            }}
          />
          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-24 pt-20 lg:px-10 2xl:px-14">
            <Skeleton width={220} height={12} />
            <Skeleton className="mt-5" width="55%" height={56} />
            <div className="mt-6 grid max-w-2xl gap-2">
              <Skeleton width="90%" height={14} />
              <Skeleton width="70%" height={14} />
            </div>
          </div>
        </section>

        <section className="relative -mt-12 mx-auto grid max-w-[1680px] gap-10 px-6 pb-16 lg:px-10 2xl:px-14">
          {/* Stats */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </section>

          {/* Featured */}
          <section>
            <SectionHeaderSkeleton />
            <div
              className="relative min-h-[260px] border"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
                clipPath: NOTCH_18,
              }}
            >
              <div aria-hidden="true" className="asc-corner-mark" />
              <div className="grid min-h-[260px] gap-8 p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] lg:items-end">
                <div className="grid content-end gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Skeleton width={72} height={20} notch />
                    <Skeleton width={96} height={20} notch />
                  </div>
                  <Skeleton width="70%" height={48} />
                  <Skeleton width="50%" height={14} />
                  <Skeleton width={150} height={44} notch />
                </div>
                <div className="grid gap-5">
                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton height={48} />
                    <Skeleton height={48} />
                    <Skeleton height={48} />
                  </div>
                  <Skeleton height={6} />
                </div>
              </div>
            </div>
          </section>

          {/* Directory */}
          <section>
            <SectionHeaderSkeleton />

            {/* Desktop table */}
            <div
              className="hidden overflow-hidden border lg:block"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
              }}
            >
              <div
                className={`grid ${DIRECTORY_COLS} gap-4 px-5 py-3`}
                style={{
                  borderBottom: "1px solid var(--asc-line-soft)",
                  background: "var(--asc-table-head-bg)",
                }}
              >
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} width="60%" height={10} />
                ))}
              </div>
              {Array.from({ length: 6 }).map((_, index) => (
                <DesktopRowSkeleton key={index} />
              ))}
            </div>

            {/* Mobile cards */}
            <div className="grid gap-4 lg:hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <MobileCardSkeleton key={index} />
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
