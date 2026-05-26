import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

type MatchCenterMessages = {
  metaTitle: string;
  metaDescription: string;
  matchCenterEyebrow: string;
  bracket: string;
  tournamentOverview: string;
  totalMatches: string;
  completed: string;
  pending: string;
  disputed: string;
  bracketEyebrow: string;
  noMatchesTitle: string;
  noMatchesDesc: string;
  grandFinal: string;
  roundPrefix: string;
  matchSingular: string;
  matchPlural: string;
  autoAdvance: string;
  reportPending: string;
  disputeOpen: string;
  statuses: {
    scheduled: string;
    ready: string;
    room_created: string;
    in_progress: string;
    result_pending: string;
    disputed: string;
    confirmed: string;
    completed: string;
    cancelled: string;
    forfeit: string;
    bye: string;
  };
};

const matchCenterMessages: Record<Locale, MatchCenterMessages> = {
  en: {
    metaTitle: "· Match Center",
    metaDescription: "Tournament bracket and match schedule.",
    matchCenterEyebrow: "Match Center",
    bracket: "Bracket",
    tournamentOverview: "← Tournament Overview",
    totalMatches: "Total Matches",
    completed: "Completed",
    pending: "Pending",
    disputed: "Disputed",
    bracketEyebrow: "▲ Bracket",
    noMatchesTitle: "No matches generated yet",
    noMatchesDesc:
      "The tournament bracket will appear here once an admin generates it.",
    grandFinal: "Grand Final",
    roundPrefix: "Round",
    matchSingular: "match",
    matchPlural: "matches",
    autoAdvance: "Auto-advance",
    reportPending: "● Report pending",
    disputeOpen: "⚠ Dispute open",
    statuses: {
      scheduled: "Scheduled",
      ready: "Ready",
      room_created: "Room Created",
      in_progress: "Live",
      result_pending: "Awaiting Result",
      disputed: "Disputed",
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
      forfeit: "Forfeit",
      bye: "Bye",
    },
  },
  ar: {
    metaTitle: "· مركز المباريات",
    metaDescription: "القوس التنافسي وجدول المباريات للبطولة.",
    matchCenterEyebrow: "مركز المباريات",
    bracket: "القوس",
    tournamentOverview: "→ نظرة عامة على البطولة",
    totalMatches: "إجمالي المباريات",
    completed: "منتهية",
    pending: "قيد الانتظار",
    disputed: "متنازع عليها",
    bracketEyebrow: "▲ القوس",
    noMatchesTitle: "لم يتم إنشاء مباريات بعد",
    noMatchesDesc: "سيظهر قوس البطولة هنا بمجرد إنشائه من قِبل المشرف.",
    grandFinal: "النهائي الكبير",
    roundPrefix: "الجولة",
    matchSingular: "مباراة",
    matchPlural: "مباريات",
    autoAdvance: "تأهل تلقائي",
    reportPending: "● في انتظار التقرير",
    disputeOpen: "⚠ اعتراض مفتوح",
    statuses: {
      scheduled: "مجدولة",
      ready: "جاهزة",
      room_created: "الغرفة مُنشأة",
      in_progress: "مباشرة",
      result_pending: "في انتظار النتيجة",
      disputed: "متنازع عليها",
      confirmed: "مؤكدة",
      completed: "منتهية",
      cancelled: "ملغاة",
      forfeit: "خسارة بالتنازل",
      bye: "تأهل تلقائي",
    },
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const [{ id }, locale] = await Promise.all([params, getLocale()]);
  const msgs = matchCenterMessages[locale];
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: tournament
      ? `${tournament.title} ${msgs.metaTitle}`
      : msgs.matchCenterEyebrow,
    description: msgs.metaDescription,
  };
}

type MatchStatusTone =
  | "blue"
  | "green"
  | "live"
  | "amber"
  | "red"
  | "violet"
  | "gray";

function getMatchStatusInfo(
  status: string,
  statuses: MatchCenterMessages["statuses"],
): { label: string; tone: MatchStatusTone } {
  const map: Record<string, { label: string; tone: MatchStatusTone }> = {
    scheduled: { label: statuses.scheduled, tone: "blue" },
    ready: { label: statuses.ready, tone: "green" },
    room_created: { label: statuses.room_created, tone: "blue" },
    in_progress: { label: statuses.in_progress, tone: "live" },
    result_pending: { label: statuses.result_pending, tone: "amber" },
    disputed: { label: statuses.disputed, tone: "red" },
    confirmed: { label: statuses.confirmed, tone: "green" },
    completed: { label: statuses.completed, tone: "violet" },
    cancelled: { label: statuses.cancelled, tone: "red" },
    forfeit: { label: statuses.forfeit, tone: "red" },
    bye: { label: statuses.bye, tone: "gray" },
  };
  return map[status] ?? { label: status, tone: "gray" };
}

function tonedStyle(tone: MatchStatusTone): CSSProperties {
  const styles: Record<MatchStatusTone, CSSProperties> = {
    blue: {
      color: "var(--asc-blue)",
      borderColor: "oklch(0.55 0.12 220 / 0.5)",
      background: "oklch(0.25 0.10 220 / 0.18)",
    },
    green: {
      color: "var(--asc-green)",
      borderColor: "oklch(0.55 0.14 150 / 0.5)",
      background: "oklch(0.25 0.12 150 / 0.18)",
    },
    live: {
      color: "var(--asc-live)",
      borderColor: "oklch(0.50 0.20 25 / 0.5)",
      background: "oklch(0.25 0.18 25 / 0.18)",
    },
    amber: {
      color: "var(--asc-amber)",
      borderColor: "oklch(0.65 0.14 75 / 0.5)",
      background: "oklch(0.25 0.12 75 / 0.18)",
    },
    red: {
      color: "var(--asc-live)",
      borderColor: "oklch(0.50 0.20 25 / 0.5)",
      background: "oklch(0.25 0.18 25 / 0.18)",
    },
    violet: {
      color: "var(--asc-accent)",
      borderColor: "oklch(0.50 0.20 285 / 0.4)",
      background: "var(--asc-accent-dim)",
    },
    gray: {
      color: "var(--asc-fg-3)",
      borderColor: "var(--asc-line-soft)",
      background: "transparent",
    },
  };
  return styles[tone];
}

export default async function TournamentMatchesPage({ params }: PageProps) {
  const [{ id }, locale] = await Promise.all([params, getLocale()]);
  const msgs = matchCenterMessages[locale];

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
            {locale === "ar" ? "→" : "←"} {tournament.title}
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                className="text-[10px] font-black uppercase tracking-[0.16em]"
                style={{ color: "var(--asc-accent)" }}
              >
                ▲{" "}
                {tournament.game?.name ? `${tournament.game.name} · ` : ""}
                {msgs.matchCenterEyebrow}
              </p>
              <h1
                className="mt-2 text-4xl md:text-5xl"
                style={{ color: "var(--asc-fg-0)" }}
              >
                {msgs.bracket}
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
              {msgs.tournamentOverview}
            </Link>
          </div>

          {/* Summary stats */}
          {totalCount > 0 && (
            <div className="mt-6 flex flex-wrap gap-4">
              {[
                { label: msgs.totalMatches, value: totalCount, tone: "none" },
                { label: msgs.completed, value: completedCount, tone: "accent" },
                { label: msgs.pending, value: pendingCount, tone: "none" },
                {
                  label: msgs.disputed,
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
                {msgs.bracketEyebrow}
              </p>
              <p
                className="mt-3 text-xl font-black"
                style={{ color: "var(--asc-fg-0)" }}
              >
                {msgs.noMatchesTitle}
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                {msgs.noMatchesDesc}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {roundNumbers.map((round) => {
                const roundMatches = rounds[round];
                const isLastRound =
                  round === roundNumbers[roundNumbers.length - 1];
                const roundLabel =
                  roundMatches.length === 1 && isLastRound
                    ? msgs.grandFinal
                    : `${msgs.roundPrefix} ${round}`;

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
                          {roundMatches.length === 1
                            ? msgs.matchSingular
                            : msgs.matchPlural}
                        </span>
                      </p>
                    </div>

                    {/* Match rows */}
                    <div>
                      {roundMatches.map((match, index) => {
                        const { label, tone } = getMatchStatusInfo(
                          match.status,
                          msgs.statuses,
                        );
                        const isTerminal = [
                          "completed",
                          "confirmed",
                          "forfeit",
                          "bye",
                        ].includes(match.status);
                        const teamAWon =
                          isTerminal &&
                          match.winnerTeamId === match.teamAId;
                        const teamBWon =
                          isTerminal &&
                          match.winnerTeamId === match.teamBId;
                        const hasPendingReports =
                          match.reports.filter(
                            (r) => r.status === "submitted",
                          ).length > 0;

                        return (
                          <Link
                            key={match.id}
                            href={`/tournaments/${id}/matches/${match.id}`}
                            className="group block transition-colors hover:bg-white/[0.025]"
                            style={
                              index < roundMatches.length - 1
                                ? {
                                    borderBottom:
                                      "1px solid var(--asc-line-soft)",
                                  }
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
                                  {match.scheduledAt.toLocaleString(
                                    locale === "ar" ? "ar" : "en",
                                    {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    },
                                  )}
                                </span>
                              )}
                              {match.isBye && (
                                <span
                                  className="text-[10px] font-black uppercase tracking-widest"
                                  style={{ color: "var(--asc-fg-3)" }}
                                >
                                  {msgs.autoAdvance}
                                </span>
                              )}
                              {hasPendingReports && (
                                <span
                                  className="text-[10px] font-black uppercase tracking-widest"
                                  style={{ color: "var(--asc-amber)" }}
                                >
                                  {msgs.reportPending}
                                </span>
                              )}
                              {match.status === "disputed" && (
                                <span
                                  className="text-[10px] font-black uppercase tracking-widest"
                                  style={{ color: "var(--asc-live)" }}
                                >
                                  {msgs.disputeOpen}
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
