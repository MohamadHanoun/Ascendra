import Link from "next/link";

import { buildChartData } from "@/components/profile/chartData";
import { PointHistoryChart } from "@/components/profile/PointHistoryChart";
import { Card, Pill } from "@/components/profile/shared";
import type {
  PointEvent,
  ProfileHeroLabels,
  ProfileLabels,
  ProfileSectionLabels,
  TournamentResult,
} from "@/components/profile/types";

export function OverviewPanel({
  tournamentResults,
  teamsCount,
  invitationCount,
  pointEvents,
  rankingPoints,
  bestPlacement,
  labels,
  sectionLabels,
  heroLabels,
}: {
  tournamentResults: TournamentResult[];
  teamsCount: number;
  invitationCount: number;
  pointEvents: PointEvent[];
  rankingPoints: number;
  bestPlacement: number | null;
  labels: ProfileLabels;
  sectionLabels: ProfileSectionLabels;
  heroLabels: ProfileHeroLabels;
}) {
  const stats: Array<{ label: string; value: string; accent?: boolean }> = [
    { label: sectionLabels.tableColPts, value: rankingPoints.toLocaleString(), accent: true },
    { label: labels.results, value: String(tournamentResults.length) },
    { label: labels.best, value: bestPlacement ? `#${bestPlacement}` : "—" },
    { label: heroLabels.teams, value: String(teamsCount) },
  ];

  const chartData = buildChartData(pointEvents);

  return (
    <div className="grid gap-7">
      {invitationCount > 0 && (
        <div
          className="asc-profile-alert flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5"
        >
          <p className="font-black" style={{ color: "var(--asc-accent)" }}>
            {invitationCount} {sectionLabels.teamInvitations}
          </p>
          <Link
            href="/profile/teams"
            className="asc-profile-action shrink-0 px-4 py-2 text-xs tracking-[0.10em]"
          >
            {sectionLabels.invitations} →
          </Link>
        </div>
      )}

      <div className="asc-profile-stat-rail asc-profile-stat-rail--4">
        {stats.map(({ label, value, accent }) => (
          <div
            key={label}
            className="asc-profile-stat"
          >
            <p className="asc-profile-stat__label">
              {label}
            </p>
            <p
              className={`asc-profile-stat__value tabular-nums${accent ? " asc-profile-stat__value--accent" : ""}`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart — shown whenever point events exist, regardless of tournament results */}
      {chartData.length > 0 && (
        <Card>
          <div className="asc-profile-card-header">
            <p className="asc-profile-eyebrow">
              {sectionLabels.performanceEyebrow}
            </p>
            <h3
              className="asc-profile-section-title"
            >
              {sectionLabels.pointHistoryTitle}
            </h3>
          </div>
          <div className="p-5 md:p-6">
            <PointHistoryChart data={chartData} ptsLabel={sectionLabels.tableColPts} height={160} />
          </div>
        </Card>
      )}

      {/* Recent tournament results, or empty state */}
      {tournamentResults.length > 0 ? (
        <Card>
          <div className="asc-profile-card-header">
            <p className="asc-profile-eyebrow">
              {sectionLabels.recentMatchesEyebrow}
            </p>
          </div>
          {tournamentResults.slice(0, 3).map((r) => {
            const date = new Date(r.awardedAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "2-digit",
            });
            return (
              <Link
                key={r.id}
                href={`/tournaments/${r.tournament.id}`}
                className="asc-profile-row flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
              >
                <div className="min-w-0">
                  <p className="truncate font-black text-sm" style={{ color: "var(--asc-fg-0)" }}>
                    {r.tournament.title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>{date}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Pill label={`#${r.placement}`} tone="bronze" />
                  <Pill label={`${r.points} ${labels.pts}`} tone="green" />
                </div>
              </Link>
            );
          })}
          {tournamentResults.length > 3 && (
            <Link
              href="/profile/history"
              className="asc-profile-row block w-full px-5 py-4 text-left text-xs font-black uppercase tracking-[0.12em] rtl:text-right"
              style={{ color: "var(--asc-fg-3)", borderTop: "1px solid var(--asc-line-soft)" }}
            >
              {sectionLabels.tournamentHistoryTitle} · {tournamentResults.length} {labels.results} →
            </Link>
          )}
        </Card>
      ) : (
        <div className="asc-profile-empty">
          <span className="asc-profile-empty__mark" aria-hidden="true">
            00
          </span>
          <p className="asc-profile-empty__title">
            {sectionLabels.noTournamentResults}
          </p>
          <p className="asc-profile-empty__text">
            {sectionLabels.noActivityDesc}
          </p>
          <Link
            href="/tournaments"
            className="asc-profile-action mt-6 px-5 py-2.5 text-sm tracking-[0.10em]"
          >
            {sectionLabels.browseTournaments} →
          </Link>
        </div>
      )}
    </div>
  );
}
