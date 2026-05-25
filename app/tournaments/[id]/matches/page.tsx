import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: tournament ? `${tournament.title} · Match Center` : "Match Center",
    description: "Tournament bracket and match schedule.",
  };
}

type MatchStatusTone = "blue" | "green" | "live" | "amber" | "red" | "violet" | "gray";

function matchStatusInfo(status: string): { label: string; tone: MatchStatusTone } {
  const map: Record<string, { label: string; tone: MatchStatusTone }> = {
    scheduled: { label: "Scheduled", tone: "blue" },
    ready: { label: "Ready", tone: "green" },
    room_created: { label: "Room Created", tone: "blue" },
    in_progress: { label: "Live", tone: "live" },
    result_pending: { label: "Awaiting Result", tone: "amber" },
    disputed: { label: "Disputed", tone: "red" },
    confirmed: { label: "Confirmed", tone: "green" },
    completed: { label: "Completed", tone: "violet" },
    cancelled: { label: "Cancelled", tone: "red" },
    forfeit: { label: "Forfeit", tone: "red" },
    bye: { label: "Bye", tone: "gray" },
  };
  return map[status] ?? { label: status, tone: "gray" };
}

function tonedStyle(tone: MatchStatusTone): CSSProperties {
  const styles: Record<MatchStatusTone, CSSProperties> = {
    blue: { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" },
    green: { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
    live: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
    amber: { color: "var(--asc-amber)", borderColor: "oklch(0.65 0.14 75 / 0.5)", background: "oklch(0.25 0.12 75 / 0.18)" },
    red: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
    violet: { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
    gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
  };
  return styles[tone];
}

export default async function TournamentMatchesPage({ params }: PageProps) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { id: true, title: true, game: { select: { name: true } } },
  });

  if (!tournament) notFound();

  const rawMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: id },
    orderBy: [{ roundNumber: "asc" }, { matchNumber: "asc" }],
    select: {
      id: true,
      roundNumber: true,
      matchNumber: true,
      status: true,
      teamAId: true,
      teamBId: true,
      winnerTeamId: true,
      bestOf: true,
      scheduledAt: true,
      completedAt: true,
      isBye: true,
      reports: { select: { id: true, status: true } },
    },
  });

  // Bulk-load team names (teamAId/teamBId are plain string FKs, not Prisma relations)
  const teamIdSet = new Set(
    rawMatches.flatMap((m) =>
      [m.teamAId, m.teamBId, m.winnerTeamId].filter((x): x is string =>
        Boolean(x),
      ),
    ),
  );
  const teamIds = [...teamIdSet];
  const teamRows =
    teamIds.length > 0
      ? await prisma.team.findMany({
          where: { id: { in: teamIds } },
          select: { id: true, name: true },
        })
      : [];
  const teamName = new Map(teamRows.map((t) => [t.id, t.name]));

  type MatchRow = (typeof rawMatches)[number] & {
    teamAName: string;
    teamBName: string;
  };

  const matches: MatchRow[] = rawMatches.map((m) => ({
    ...m,
    teamAName: m.teamAId ? (teamName.get(m.teamAId) ?? "TBD") : "TBD",
    teamBName: m.teamBId ? (teamName.get(m.teamBId) ?? "TBD") : "TBD",
  }));

  const rounds = matches.reduce<Record<number, MatchRow[]>>((acc, m) => {
    (acc[m.roundNumber] ??= []).push(m);
    return acc;
  }, {});
  const roundNumbers = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  const totalCount = matches.length;
  const completedCount = matches.filter((m) =>
    ["completed", "confirmed", "forfeit", "bye"].includes(m.status),
  ).length;
  const pendingCount = totalCount - completedCount;
  const disputedCount = matches.filter((m) => m.status === "disputed").length;

  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        {/* Page header */}
        <header className="mx-auto max-w-[1680px] px-6 pb-8 pt-10 lg:px-10 2xl:px-14">
          <Link
            href={`/tournaments/${id}`}
            className="mb-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] transition hover:opacity-75"
            style={{ color: "var(--asc-fg-2)" }}
          >
            ← {tournament.title}
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                className="text-[10px] font-black uppercase tracking-[0.16em]"
                style={{ color: "var(--asc-accent)" }}
              >
                ▲ {tournament.game?.name ? `${tournament.game.name} · ` : ""}
                Match Center
              </p>
              <h1
                className="mt-2 text-4xl md:text-5xl"
                style={{ color: "var(--asc-fg-0)" }}
              >
                Bracket
              </h1>
            </div>

            <Link
              href={`/tournaments/${id}`}
              className="inline-flex items-center gap-2 border px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-75"
              style={{
                borderColor: "var(--asc-line-soft)",
                color: "var(--asc-fg-2)",
                clipPath:
                  "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)",
              }}
            >
              ← Tournament Overview
            </Link>
          </div>

          {/* Summary stats */}
          {totalCount > 0 && (
            <div className="mt-6 flex flex-wrap gap-4">
              {[
                { label: "Total Matches", value: totalCount, tone: "none" },
                { label: "Completed", value: completedCount, tone: "accent" },
                { label: "Pending", value: pendingCount, tone: "none" },
                {
                  label: "Disputed",
                  value: disputedCount,
                  tone: disputedCount > 0 ? "live" : "none",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="relative border px-4 py-3"
                  style={{
                    borderColor: "var(--asc-line-soft)",
                    background: "var(--asc-bg-1)",
                  }}
                >
                  <div aria-hidden className="asc-corner-mark" />
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.16em]"
                    style={{ color: "var(--asc-fg-3)" }}
                  >
                    {stat.label}
                  </p>
                  <p
                    className="mt-1 text-2xl font-black tabular-nums"
                    style={{
                      fontFamily: "var(--font-display)",
                      color:
                        stat.tone === "live"
                          ? "var(--asc-live)"
                          : stat.tone === "accent"
                            ? "var(--asc-accent)"
                            : "var(--asc-fg-0)",
                    }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </header>

        {/* Matches body */}
        <section className="mx-auto max-w-[1680px] px-6 pb-20 lg:px-10 2xl:px-14">
          {totalCount === 0 ? (
            <div
              className="relative border px-6 py-16 text-center"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
              }}
            >
              <div aria-hidden className="asc-corner-mark" />
              <p
                className="text-[10px] font-black uppercase tracking-[0.16em]"
                style={{ color: "var(--asc-accent)" }}
              >
                ▲ Bracket
              </p>
              <p
                className="mt-3 text-xl font-black"
                style={{ color: "var(--asc-fg-0)" }}
              >
                No matches generated yet
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                The tournament bracket will appear here once an admin generates
                it.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {roundNumbers.map((round) => {
                const roundMatches = rounds[round];
                const roundLabel =
                  roundMatches.length === 1 && round === roundNumbers[roundNumbers.length - 1]
                    ? "Grand Final"
                    : `Round ${round}`;

                return (
                  <div
                    key={round}
                    className="overflow-hidden border"
                    style={{
                      borderColor: "var(--asc-line-soft)",
                      background: "var(--asc-bg-1)",
                    }}
                  >
                    {/* Round header */}
                    <div
                      className="px-5 py-3"
                      style={{
                        background: "var(--asc-table-head-bg)",
                        borderBottom: "1px solid var(--asc-line-soft)",
                      }}
                    >
                      <p
                        className="text-[11px] font-black uppercase tracking-[0.14em]"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        {roundLabel}
                        <span className="ml-2 opacity-50">
                          · {roundMatches.length}{" "}
                          {roundMatches.length === 1 ? "match" : "matches"}
                        </span>
                      </p>
                    </div>

                    {/* Match rows */}
                    <div>
                      {roundMatches.map((match, index) => {
                        const { label, tone } = matchStatusInfo(match.status);
                        const isTerminal = ["completed", "confirmed", "forfeit", "bye"].includes(match.status);
                        const teamAWon = isTerminal && match.winnerTeamId === match.teamAId;
                        const teamBWon = isTerminal && match.winnerTeamId === match.teamBId;
                        const hasPendingReports =
                          match.reports.filter((r) => r.status === "submitted")
                            .length > 0;

                        return (
                          <Link
                            key={match.id}
                            href={`/tournaments/${id}/matches/${match.id}`}
                            className="group block transition-colors hover:bg-white/[0.025]"
                            style={
                              index < roundMatches.length - 1
                                ? { borderBottom: "1px solid var(--asc-line-soft)" }
                                : {}
                            }
                          >
                            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-x-4 px-5 py-4">
                              {/* Team A */}
                              <div className="text-right">
                                <p
                                  className="truncate font-black leading-tight"
                                  style={{
                                    color: teamAWon
                                      ? "var(--asc-green)"
                                      : "var(--asc-fg-0)",
                                  }}
                                >
                                  {teamAWon && (
                                    <span
                                      className="mr-1 text-xs"
                                      style={{ color: "var(--asc-green)" }}
                                    >
                                      ✓
                                    </span>
                                  )}
                                  {match.teamAName}
                                </p>
                              </div>

                              {/* Centre */}
                              <div className="min-w-[60px] text-center">
                                <p
                                  className="text-xs font-black uppercase tracking-[0.14em]"
                                  style={{ color: "var(--asc-fg-3)" }}
                                >
                                  {isTerminal ? `BO${match.bestOf}` : "vs"}
                                </p>
                              </div>

                              {/* Team B */}
                              <div>
                                <p
                                  className="truncate font-black leading-tight"
                                  style={{
                                    color: teamBWon
                                      ? "var(--asc-green)"
                                      : "var(--asc-fg-0)",
                                  }}
                                >
                                  {match.teamBName}
                                  {teamBWon && (
                                    <span
                                      className="ml-1 text-xs"
                                      style={{ color: "var(--asc-green)" }}
                                    >
                                      ✓
                                    </span>
                                  )}
                                </p>
                              </div>

                              {/* Status + arrow */}
                              <div className="flex shrink-0 items-center gap-3">
                                <span
                                  className="hidden items-center gap-1.5 border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.10em] sm:inline-flex"
                                  style={tonedStyle(tone)}
                                >
                                  {tone === "live" && (
                                    <span className="asc-live-dot" />
                                  )}
                                  {label}
                                </span>
                                <span
                                  className="text-xs font-black opacity-40 transition-opacity group-hover:opacity-100"
                                  style={{ color: "var(--asc-fg-2)" }}
                                >
                                  →
                                </span>
                              </div>
                            </div>

                            {/* Sub-row: meta */}
                            <div
                              className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 pb-3 text-xs"
                              style={{ color: "var(--asc-fg-3)" }}
                            >
                              <span className="font-bold">
                                M{match.matchNumber} · BO{match.bestOf}
                              </span>
                              {match.scheduledAt && (
                                <span>
                                  {match.scheduledAt.toLocaleString("en", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                </span>
                              )}
                              {match.isBye && (
                                <span
                                  className="text-[10px] font-black uppercase tracking-widest"
                                  style={{ color: "var(--asc-fg-3)" }}
                                >
                                  Auto-advance
                                </span>
                              )}
                              {hasPendingReports && (
                                <span
                                  className="text-[10px] font-black uppercase tracking-widest"
                                  style={{ color: "var(--asc-amber)" }}
                                >
                                  ● Report pending
                                </span>
                              )}
                              {match.status === "disputed" && (
                                <span
                                  className="text-[10px] font-black uppercase tracking-widest"
                                  style={{ color: "var(--asc-live)" }}
                                >
                                  ⚠ Dispute open
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}
