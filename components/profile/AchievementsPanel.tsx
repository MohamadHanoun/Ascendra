import Link from "next/link";

import { Card } from "@/components/profile/shared";
import type { ProfileSectionLabels } from "@/components/profile/types";

export function AchievementsPanel({
  sectionLabels,
}: {
  sectionLabels: ProfileSectionLabels;
}) {
  return (
    <Card>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
        <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
          ▲ {sectionLabels.achievementsEyebrow}
        </p>
        <h3
          className="mt-1 text-xl font-black uppercase"
          style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {sectionLabels.achievementsTitle}
        </h3>
      </div>
      <div className="px-6 py-14 text-center">
        <p
          className="text-xs font-black uppercase tracking-[0.18em]"
          style={{ color: "var(--asc-fg-3)", opacity: 0.45 }}
        >
          {sectionLabels.comingSoon}
        </p>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
          {sectionLabels.comingSoonDesc}
        </p>
        <Link
          href="/tournaments"
          className="mt-6 inline-flex border px-5 py-2.5 text-xs font-black uppercase tracking-[0.10em] transition hover:opacity-80"
          style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-2)", background: "transparent" }}
        >
          {sectionLabels.browseTournaments}
        </Link>
      </div>
    </Card>
  );
}
