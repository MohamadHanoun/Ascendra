import { Skeleton } from "@/components/ui/Skeleton";

const NOTCH_14 =
  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";
const NOTCH_18 =
  "polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)";

function MemberRowSkeleton() {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4"
      style={{ borderTop: "1px solid var(--asc-line-soft)" }}
    >
      <Skeleton width={40} height={40} notch />
      <div className="min-w-0 flex-1">
        <Skeleton width="45%" height={14} />
      </div>
      <Skeleton width={72} height={20} notch />
    </div>
  );
}

/**
 * Loading placeholder for /profile/teams/[id]. Mirrors the hero card (team
 * name + badges), a roster list, and one generic side panel. Private
 * management forms are intentionally not represented. Server component,
 * CSS-only. Only placeholder shapes — no private data is exposed.
 */
export default function TeamDetailSkeleton() {
  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
      aria-busy="true"
    >
      <div className="relative z-10">
        {/* Hero */}
        <section
          className="relative min-h-[540px] overflow-hidden"
          style={{ background: "var(--asc-bg-1)" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-52"
            style={{
              background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))",
            }}
          />
          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-32 pt-20 lg:px-10">
            <Skeleton width={150} height={12} />

            <section
              className="relative mt-8 overflow-hidden border p-6 shadow-2xl shadow-black/30 md:p-8"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-card)",
                clipPath: NOTCH_18,
              }}
            >
              <div aria-hidden="true" className="asc-corner-mark" />

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                <div className="min-w-0">
                  <Skeleton width={140} height={12} />
                  <Skeleton className="mt-3" width="55%" height={52} />
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Skeleton width={84} height={22} notch />
                    <Skeleton width={72} height={22} notch />
                    <Skeleton width={96} height={22} notch />
                    <Skeleton width={88} height={22} notch />
                  </div>
                </div>

                <div className="grid gap-3 lg:justify-items-end">
                  <Skeleton width={120} height={10} />
                  <Skeleton width="100%" height={44} notch />
                  <Skeleton width="100%" height={44} notch />
                </div>
              </div>
            </section>
          </div>
        </section>

        {/* Roster + side panel */}
        <section className="relative z-20 -mt-16 mx-auto max-w-[1440px] px-6 pb-20 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* Roster */}
            <div
              className="relative overflow-hidden border"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
                clipPath: NOTCH_14,
              }}
            >
              <div aria-hidden="true" className="asc-corner-mark" />
              <div className="grid gap-2 p-5">
                <Skeleton width={120} height={10} />
                <Skeleton width={180} height={22} />
              </div>
              {Array.from({ length: 5 }).map((_, index) => (
                <MemberRowSkeleton key={index} />
              ))}
            </div>

            {/* Generic side panel */}
            <div
              className="relative border p-6"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
                clipPath: NOTCH_14,
              }}
            >
              <div aria-hidden="true" className="asc-corner-mark" />
              <Skeleton width="50%" height={12} />
              <Skeleton className="mt-4" width="70%" height={20} />
              <div className="mt-5 grid gap-3">
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} notch />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
