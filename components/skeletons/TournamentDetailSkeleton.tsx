import { Skeleton } from "@/components/ui/Skeleton";

const NOTCH_14 =
  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";

function StatBlockSkeleton() {
  return (
    <div className="grid gap-2">
      <Skeleton width="50%" height={10} />
      <Skeleton width="70%" height={34} />
    </div>
  );
}

function PanelSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div
      className="relative border p-6"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath: NOTCH_14,
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />
      <Skeleton width="40%" height={12} />
      <Skeleton className="mt-4" width="65%" height={22} />
      <div className="mt-5 grid gap-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lines - 1 ? "55%" : "100%"}
            height={12}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Loading placeholder for /tournaments/[id]. Covers the above-the-fold hero,
 * tab strip, and 2-column overview only (schedule/bracket/prizes/rules are
 * intentionally not skeletoned). Server component, CSS-only shimmer.
 */
export default function TournamentDetailSkeleton() {
  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
      aria-busy="true"
    >
      <div className="relative z-10">
        {/* Hero */}
        <section
          className="asc-image-card relative min-h-[620px] overflow-hidden"
          style={{ background: "var(--asc-bg-1)" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-56"
            style={{
              background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))",
            }}
          />
          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <Skeleton width={150} height={12} />

            <div className="mt-8 flex flex-wrap gap-2">
              <Skeleton width={84} height={22} notch />
              <Skeleton width={110} height={22} notch />
              <Skeleton width={70} height={22} notch />
              <Skeleton width={60} height={22} notch />
            </div>

            <div className="mt-8 grid max-w-5xl gap-3">
              <Skeleton width="80%" height={64} />
              <Skeleton width="55%" height={64} />
            </div>

            <div className="mt-6 grid max-w-3xl gap-2">
              <Skeleton width="85%" height={14} />
              <Skeleton width="60%" height={14} />
            </div>

            <div className="mt-10 grid max-w-3xl gap-6 sm:grid-cols-3">
              <StatBlockSkeleton />
              <StatBlockSkeleton />
              <StatBlockSkeleton />
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Skeleton width={170} height={48} notch />
              <Skeleton width={150} height={48} notch />
            </div>
          </div>
        </section>

        <section className="relative mx-auto grid max-w-[1680px] gap-10 px-6 py-10 lg:px-10 2xl:px-14">
          {/* Tab strip */}
          <div
            className="flex flex-wrap gap-2 border-b pb-1"
            style={{ borderColor: "var(--asc-line-soft)" }}
          >
            {[96, 110, 88, 84, 80].map((width, index) => (
              <Skeleton key={index} width={width} height={40} />
            ))}
          </div>

          {/* Overview */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <PanelSkeleton lines={3} />
                <PanelSkeleton lines={3} />
              </div>
              <PanelSkeleton lines={5} />
            </div>

            <PanelSkeleton lines={6} />
          </div>
        </section>
      </div>
    </main>
  );
}
