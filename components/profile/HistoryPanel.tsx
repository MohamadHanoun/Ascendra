import Link from "next/link";

import { Card, Pill, getCount } from "@/components/profile/shared";
import { PointHistoryChart, buildChartData } from "@/components/profile/PointHistoryChart";
import type {
  PointEvent,
  ProfileLabels,
  ProfileSectionLabels,
  TournamentResult,
} from "@/components/profile/types";

export function HistoryPanel({
  tournamentResults,
  pointEvents,
  labels,
  sectionLabels,
}: {
  tournamentResults: TournamentResult[];
  pointEvents: PointEvent[];
  labels: ProfileLabels;
  sectionLabels: ProfileSectionLabels;
}) {
  const chartData = buildChartData(pointEvents);

  return (
    <div className="grid gap-6">
      <Card>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
            ▲ {sectionLabels.performanceEyebrow}
          </p>
          <h3
            className="mt-1 text-xl font-black uppercase"
            style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {sectionLabels.pointHistoryTitle}
          </h3>
        </div>
        <div className="p-5">
          {chartData.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--asc-fg-3)" }}>
              {sectionLabels.noTournamentData}
            </p>
          ) : (
            <PointHistoryChart data={chartData} ptsLabel={sectionLabels.tableColPts} height={200} />
          )}
        </div>
      </Card>

      <Card>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
            ▲ {sectionLabels.fullRecordEyebrow}
          </p>
          <h3
            className="mt-1 text-xl font-black uppercase"
            style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {sectionLabels.tournamentHistoryTitle} · {tournamentResults.length}{" "}
            {getCount(tournamentResults.length, labels.result, labels.results)}
          </h3>
        </div>
        {tournamentResults.length === 0 ? (
          <p className="p-5 text-sm" style={{ color: "var(--asc-fg-3)" }}>{sectionLabels.noTournamentResults}</p>
        ) : (
          <>
            <div
              className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] md:grid md:grid-cols-[minmax(0,1fr)_130px_80px_80px_110px]"
              style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
            >
              <span>{sectionLabels.tableColTournament}</span>
              <span>{sectionLabels.tableColTeam}</span>
              <span>{sectionLabels.tableColPlace}</span>
              <span>{sectionLabels.tableColPts}</span>
              <span>{sectionLabels.tableColDate}</span>
            </div>
            {tournamentResults.map((r) => {
              const teamName = r.snapshotTeamName ?? r.team.name;
              const gameName = r.snapshotTeamGame ?? r.team.game?.name ?? "—";
              const date = new Date(r.awardedAt).toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "2-digit",
              });
              return (
                <Link
                  key={r.id}
                  href={`/tournaments/${r.tournament.id}`}
                  className="grid gap-2 px-5 py-4 transition hover:bg-white/[0.02] md:grid-cols-[minmax(0,1fr)_130px_80px_80px_110px] md:items-center"
                  style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-sm" style={{ color: "var(--asc-fg-0)" }}>{r.tournament.title}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--asc-fg-3)" }}>{gameName}</p>
                  </div>
                  <p className="truncate text-sm" style={{ color: "var(--asc-fg-2)" }}>{teamName}</p>
                  <Pill label={`#${r.placement}`} tone="blue" />
                  <Pill label={`${r.points} ${labels.pts}`} tone="green" />
                  <p className="text-xs tabular-nums" style={{ color: "var(--asc-fg-3)" }}>{date}</p>
                </Link>
              );
            })}
          </>
        )}
      </Card>
    </div>
  );
}
