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
      <div className="asc-profile-card-header">
        <p className="asc-profile-eyebrow">
          {sectionLabels.achievementsEyebrow}
        </p>
        <h3
          className="asc-profile-section-title"
        >
          {sectionLabels.achievementsTitle}
        </h3>
      </div>
      <div className="asc-profile-empty asc-profile-empty--inline px-6 py-14">
        <span className="asc-profile-empty__mark" aria-hidden="true">
          00
        </span>
        <p className="asc-profile-empty__title">
          {sectionLabels.comingSoon}
        </p>
        <p className="asc-profile-empty__text">
          {sectionLabels.comingSoonDesc}
        </p>
        <Link
          href="/tournaments"
          className="asc-profile-action asc-profile-action--ghost mt-6 px-5 py-2.5 text-xs tracking-[0.10em]"
        >
          {sectionLabels.browseTournaments}
        </Link>
      </div>
    </Card>
  );
}
