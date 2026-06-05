import Link from "next/link";

import { buildChartData } from "@/components/profile/chartData";
import { PointHistoryChart } from "@/components/profile/PointHistoryChart";
import { Pill } from "@/components/profile/shared";
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
    <div className="grid gap-6">
      {invitationCount > 0 && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 border p-4"
          style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)" }}
        >
          <p className="font-black" style={{ color: "var(--asc-accent)" }}>
            {invitationCount} {sectionLabels.teamInvitations}
          </p>
          <Link
            href="/profile/teams"
            className="shrink-0 border px-4 py-2 text-xs font-black uppercase tracking-[0.10em] transition hover:opacity-80"
            style={{ borderColor: "var(--asc-accent-border)", color: "var(--asc-accent)", background: "transparent" }}
          >
            {sectionLabels.invitations} →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, accent }) => (
          <div
            key={label}
            className="border p-4"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
          >
            <p
              className="text-[10px] font-black uppercase tracking-[0.14em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {label}
            </p>
            <p
              className="mt-2 text-2xl font-black tabular-nums"
              style={{
                color: accent ? "var(--asc-accent)" : "var(--asc-fg-0)",
                fontFamily: "var(--font-display)",
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart — shown whenever point events exist, regardless of tournament results */}
      {chartData.length > 0 && (
        <div className="border" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
          <div className="border-b px-5 py-4" style={{ borderColor: "var(--asc-line-soft)" }}>
            <p
              className="text-[10px] font-black uppercase tracking-[0.16em]"
              style={{ color: "var(--asc-accent)" }}
            >
              ▲ {sectionLabels.performanceEyebrow}
            </p>
            <h3
              className="mt-1 text-base font-black uppercase"
              style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {sectionLabels.pointHistoryTitle}
            </h3>
          </div>
          <div className="p-5">
            <PointHistoryChart data={chartData} ptsLabel={sectionLabels.tableColPts} height={140} />
          </div>
        </div>
      )}

      {/* Recent tournament results, or empty state */}
      {tournamentResults.length > 0 ? (
        <div className="border" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
          <div className="border-b px-5 py-4" style={{ borderColor: "var(--asc-line-soft)" }}>
            <p
              className="text-[10px] font-black uppercase tracking-[0.16em]"
              style={{ color: "var(--asc-accent)" }}
            >
              ▲ {sectionLabels.recentMatchesEyebrow}
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
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-white/[0.02]"
                style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
              >
                <div className="min-w-0">
                  <p className="truncate font-black text-sm" style={{ color: "var(--asc-fg-0)" }}>
                    {r.tournament.title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>{date}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Pill label={`#${r.placement}`} tone="blue" />
                  <Pill label={`${r.points} ${labels.pts}`} tone="green" />
                </div>
              </Link>
            );
          })}
          {tournamentResults.length > 3 && (
            <Link
              href="/profile/history"
              className="block w-full px-5 py-4 text-left text-xs font-black uppercase tracking-[0.12em] transition hover:bg-white/[0.02]"
              style={{ color: "var(--asc-fg-3)", borderTop: "1px solid var(--asc-line-soft)" }}
            >
              {sectionLabels.tournamentHistoryTitle} · {tournamentResults.length} {labels.results} →
            </Link>
          )}
        </div>
      ) : (
        <div
          className="border p-10 text-center"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
        >
          <p
            className="text-sm font-black uppercase tracking-[0.12em]"
            style={{ color: "var(--asc-fg-3)", opacity: 0.6 }}
          >
            {sectionLabels.noTournamentResults}
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
            {sectionLabels.noActivityDesc}
          </p>
          <Link
            href="/tournaments"
            className="mt-6 inline-flex border px-5 py-2.5 text-sm font-black uppercase tracking-[0.10em] transition hover:opacity-80"
            style={{ borderColor: "var(--asc-accent-border)", color: "var(--asc-accent)", background: "var(--asc-accent-dim)" }}
          >
            {sectionLabels.browseTournaments} →
          </Link>
        </div>
      )}
    </div>
  );
}
