import type { ReactNode } from "react";

import ProfileHeroSkeleton from "@/components/skeletons/ProfileHeroSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

const NOTCH_14 =
  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";
const HISTORY_COLS = "md:grid-cols-[minmax(0,1fr)_130px_80px_80px_110px]";
// NOTE: keep the full `md:grid-cols-[…]` token contiguous so Tailwind detects it.

function SectionCardSkeleton({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative overflow-hidden border"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath: NOTCH_14,
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />
      <div
        className="grid gap-2 p-5"
        style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
      >
        <Skeleton width={120} height={10} />
        <Skeleton width={200} height={22} />
      </div>
      {children}
    </div>
  );
}

function HistoryRowSkeleton() {
  return (
    <div
      className={`grid gap-2 px-5 py-4 ${HISTORY_COLS} md:items-center`}
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <div className="grid min-w-0 gap-1.5">
        <Skeleton width="65%" height={14} />
        <Skeleton width="35%" height={10} />
      </div>
      <Skeleton width="60%" height={12} className="hidden md:block" />
      <Skeleton width={48} height={20} notch className="hidden md:block" />
      <Skeleton width={56} height={20} notch className="hidden md:block" />
      <Skeleton width={64} height={12} className="hidden md:block" />
    </div>
  );
}

/**
 * Loading placeholder for /players/[id] (public profile). Mirrors the hero
 * identity card (4 stats) and the Progress / History / Teams sections.
 * Server component, CSS-only. Only placeholder shapes — no private data.
 */
export default function PlayerProfileSkeleton() {
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
            <ProfileHeroSkeleton statCount={4} />
          </div>
        </section>

        {/* Content */}
        <section className="relative z-20 -mt-16 mx-auto max-w-[1440px] px-6 pb-20 lg:px-10">
          <div className="grid gap-10">
            {/* Progress */}
            <SectionCardSkeleton>
              <div className="p-5">
                <Skeleton height={180} style={{ display: "block" }} />
              </div>
            </SectionCardSkeleton>

            {/* History */}
            <SectionCardSkeleton>
              <div
                className={`hidden px-5 py-3 md:grid ${HISTORY_COLS}`}
                style={{
                  borderBottom: "1px solid var(--asc-line-soft)",
                  background: "var(--asc-bg-2)",
                }}
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} width="55%" height={10} />
                ))}
              </div>
              {Array.from({ length: 5 }).map((_, index) => (
                <HistoryRowSkeleton key={index} />
              ))}
            </SectionCardSkeleton>

            {/* Teams */}
            <SectionCardSkeleton>
              <div className="grid md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="border-b p-5 md:odd:border-r"
                    style={{ borderColor: "var(--asc-line-soft)" }}
                  >
                    <Skeleton width="55%" height={18} />
                    <Skeleton className="mt-2" width="40%" height={11} />
                  </div>
                ))}
              </div>
            </SectionCardSkeleton>
          </div>
        </section>
      </div>
    </main>
  );
}
