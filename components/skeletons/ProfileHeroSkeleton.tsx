import { Skeleton } from "@/components/ui/Skeleton";

const NOTCH_18 =
  "polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)";

function HeroStatSkeleton() {
  return (
    <div className="grid gap-2">
      <Skeleton width="55%" height={10} />
      <Skeleton width="68%" height={32} />
    </div>
  );
}

/**
 * Shared hero identity card placeholder for /profile and /players/[id].
 * Glassy notched card: avatar + eyebrow + title + badges, a 360px side
 * block, and a row of stat blocks. `statCount` is 3 for the private
 * profile, 4 for the public player profile.
 *
 * Server component, CSS-only shimmer. No real text — no private data.
 */
export default function ProfileHeroSkeleton({
  statCount = 3,
}: {
  statCount?: 3 | 4;
}) {
  const statsClass =
    statCount === 4
      ? "mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4"
      : "mt-10 grid gap-6 sm:grid-cols-3";

  return (
    <section
      className="relative mt-4 overflow-hidden border p-6 shadow-2xl shadow-black/20 md:p-8"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-card)",
        clipPath: NOTCH_18,
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-center">
          <Skeleton width={96} height={96} notch />

          <div className="min-w-0 flex-1">
            <Skeleton width={140} height={12} />
            <Skeleton className="mt-3" width="60%" height={52} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Skeleton width={104} height={22} notch />
              <Skeleton width={84} height={22} notch />
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:justify-items-end">
          <Skeleton width={110} height={10} />
          <Skeleton width={180} height={36} notch />
        </div>
      </div>

      <div className={statsClass}>
        {Array.from({ length: statCount }).map((_, index) => (
          <HeroStatSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}
