import ProfileHeroSkeleton from "@/components/skeletons/ProfileHeroSkeleton";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

const NOTCH_14 =
  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";

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
      <Skeleton className="mt-4" width="60%" height={22} />
      <div className="mt-5">
        <SkeletonText lines={lines} />
      </div>
    </div>
  );
}

/**
 * Loading placeholder for /profile (private Player Hub). Mirrors the hero
 * identity card (3 stats), a tab strip, and overview content panels.
 * Server component, CSS-only. Renders only placeholder shapes — no private
 * data is exposed.
 */
export default function ProfileSkeleton() {
  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
      aria-busy="true"
    >
      <div className="relative z-10">
        {/* Hero */}
        <section
          className="asc-image-hero relative min-h-[520px] overflow-hidden"
          style={{ background: "var(--asc-bg-1)" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-48"
            style={{
              background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))",
            }}
          />
          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-32 pt-24 lg:px-10">
            <ProfileHeroSkeleton statCount={3} />
          </div>
        </section>

        {/* Tabs + content */}
        <section className="relative z-20 -mt-16 mx-auto max-w-[1440px] px-6 pb-20 lg:px-10">
          <div
            className="flex flex-wrap gap-2 border-b pb-1"
            style={{ borderColor: "var(--asc-line-soft)" }}
          >
            {[110, 96, 88, 84].map((width, index) => (
              <Skeleton key={index} width={width} height={40} />
            ))}
          </div>

          <div className="mt-8 grid gap-6">
            <PanelSkeleton lines={4} />
            <div className="grid gap-6 md:grid-cols-2">
              <PanelSkeleton lines={3} />
              <PanelSkeleton lines={3} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
