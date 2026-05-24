import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import Footer from "@/components/Footer";
import MatchAdminControls from "@/components/MatchAdminControls";
import { DisputeForm, MatchReportForm } from "@/components/MatchReportForm";
import ValorantMatchIdForm from "@/components/ValorantMatchIdForm";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string; matchId: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { matchId } = await params;
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { roundNumber: true, matchNumber: true },
  });
  return {
    title: match
      ? `Round ${match.roundNumber} · Match ${match.matchNumber}`
      : "Match Detail",
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Tone = "blue" | "green" | "live" | "amber" | "red" | "violet" | "gray";

function matchStatusInfo(status: string): { label: string; tone: Tone } {
  const map: Record<string, { label: string; tone: Tone }> = {
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

function tonedStyle(tone: Tone): CSSProperties {
  const styles: Record<Tone, CSSProperties> = {
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

function reportStatusInfo(status: string): { label: string; tone: Tone } {
  const map: Record<string, { label: string; tone: Tone }> = {
    submitted: { label: "Pending review", tone: "amber" },
    confirmed: { label: "Confirmed", tone: "green" },
    rejected: { label: "Rejected", tone: "red" },
    superseded: { label: "Superseded", tone: "gray" },
  };
  return map[status] ?? { label: status, tone: "gray" };
}

// Panel card wrapper
function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden border"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
      >
        <p
          className="text-[10px] font-black uppercase tracking-[0.16em]"
          style={{ color: "var(--asc-accent)" }}
        >
          ▲ {eyebrow}
        </p>
        <h2 className="mt-1 text-xl" style={{ color: "var(--asc-fg-0)" }}>
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MatchDetailPage({
  params,
}: PageProps) {
  const { id: tournamentId, matchId } = await params;

  const [session, tournament, match] = await Promise.all([
    auth(),
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, title: true, game: { select: { name: true, slug: true } } },
    }),
    prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      include: {
        games: { orderBy: { gameNumber: "asc" } },
        reports: {
          include: { submittedBy: { select: { id: true, username: true } } },
          orderBy: { createdAt: "desc" },
        },
        room: true,
      },
    }),
  ]);

  if (!tournament || !match || match.tournamentId !== tournamentId) notFound();

  // Load team names
  const teamIds = [match.teamAId, match.teamBId, match.winnerTeamId].filter(
    (x): x is string => Boolean(x),
  );
  const teamRows =
    teamIds.length > 0
      ? await prisma.team.findMany({
          where: { id: { in: teamIds } },
          select: { id: true, name: true },
        })
      : [];
  const teamName = new Map(teamRows.map((t) => [t.id, t.name]));

  const teamA = match.teamAId
    ? { id: match.teamAId, name: teamName.get(match.teamAId) ?? "TBD" }
    : null;
  const teamB = match.teamBId
    ? { id: match.teamBId, name: teamName.get(match.teamBId) ?? "TBD" }
    : null;
  const winnerName = match.winnerTeamId
    ? (teamName.get(match.winnerTeamId) ?? null)
    : null;

  // Current user context
  const sessionUser = session?.user as
    | { databaseId?: string; isAdmin?: boolean }
    | undefined;
  const isAdmin = Boolean(sessionUser?.isAdmin);
  const currentUserId = sessionUser?.databaseId ?? null;

  // Determine if user belongs to a match team
  let userTeamId: string | null = null;
  if (currentUserId && (match.teamAId || match.teamBId)) {
    const matchTeamIds = [match.teamAId, match.teamBId].filter(
      (x): x is string => Boolean(x),
    );

    const membership = await prisma.teamMember.findFirst({
      where: { userId: currentUserId, teamId: { in: matchTeamIds } },
      select: { teamId: true },
    });

    if (membership) {
      userTeamId = membership.teamId;
    } else {
      const leaderTeam = await prisma.team.findFirst({
        where: { leaderId: currentUserId, id: { in: matchTeamIds } },
        select: { id: true },
      });
      if (leaderTeam) userTeamId = leaderTeam.id;
    }
  }

  const isValorant =
    tournament.game?.slug?.toLowerCase().includes("valorant") ||
    tournament.game?.name?.toLowerCase().includes("valorant");

  const { label: statusLabel, tone: statusTone } = matchStatusInfo(match.status);
  const isTerminal = ["completed", "confirmed", "forfeit", "bye", "cancelled"].includes(match.status);
  const canSubmitReport =
    !isTerminal &&
    match.status !== "disputed" &&
    userTeamId !== null &&
    match.teamAId !== null &&
    match.teamBId !== null;

  const canDispute =
    ["in_progress", "result_pending"].includes(match.status) &&
    userTeamId !== null;

  const userHasReport = match.reports.some(
    (r) =>
      r.teamId === userTeamId &&
      r.status === "submitted",
  );

  const roundLabel =
    match.roundNumber === 1 && match.matchNumber === 1 ? null : null;
  void roundLabel;

  return (
    <main
      className="asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        {/* Page header / breadcrumb */}
        <header className="mx-auto max-w-[1680px] px-6 pb-6 pt-10 lg:px-10 2xl:px-14">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em]">
            <Link
              href="/tournaments"
              className="transition hover:opacity-75"
              style={{ color: "var(--asc-fg-3)" }}
            >
              Tournaments
            </Link>
            <span style={{ color: "var(--asc-fg-3)" }}>·</span>
            <Link
              href={`/tournaments/${tournamentId}`}
              className="transition hover:opacity-75"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {tournament.title}
            </Link>
            <span style={{ color: "var(--asc-fg-3)" }}>·</span>
            <Link
              href={`/tournaments/${tournamentId}/matches`}
              className="transition hover:opacity-75"
              style={{ color: "var(--asc-fg-3)" }}
            >
              Match Center
            </Link>
            <span style={{ color: "var(--asc-fg-3)" }}>·</span>
            <span style={{ color: "var(--asc-fg-1)" }}>
              R{match.roundNumber}·M{match.matchNumber}
            </span>
          </div>
        </header>

        {/* Match VS hero card */}
        <section className="mx-auto max-w-[1680px] px-6 pb-6 lg:px-10 2xl:px-14">
          <div
            className="relative overflow-hidden border"
            style={{
              borderColor: "var(--asc-line-soft)",
              background: "var(--asc-bg-1)",
            }}
          >
            <div aria-hidden className="asc-corner-mark" />

            {/* Match meta bar */}
            <div
              className="flex flex-wrap items-center gap-3 px-5 py-3"
              style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
            >
              <p
                className="text-[10px] font-black uppercase tracking-[0.16em]"
                style={{ color: "var(--asc-accent)" }}
              >
                ▲ {tournament.game?.name ?? "Match"} · R{match.roundNumber} ·
                M{match.matchNumber} · BO{match.bestOf}
              </p>

              <span
                className="inline-flex items-center gap-1.5 border px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.10em]"
                style={tonedStyle(statusTone)}
              >
                {statusTone === "live" && <span className="asc-live-dot" />}
                {statusLabel}
              </span>

              {isAdmin && (
                <span
                  className="ml-auto inline-flex border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.10em]"
                  style={tonedStyle("amber")}
                >
                  Admin View
                </span>
              )}
            </div>

            {/* VS layout */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 px-6 py-8 md:gap-10 md:px-10">
              {/* Team A */}
              <div className="text-center md:text-right">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.14em]"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  Team A
                </p>
                <p
                  className="mt-2 text-2xl font-black md:text-4xl"
                  style={{
                    fontFamily: "var(--font-display)",
                    color:
                      isTerminal && match.winnerTeamId === match.teamAId
                        ? "var(--asc-green)"
                        : "var(--asc-fg-0)",
                  }}
                >
                  {teamA?.name ?? "TBD"}
                </p>
                {isTerminal && match.winnerTeamId === match.teamAId && (
                  <p
                    className="mt-1 text-xs font-black uppercase tracking-widest"
                    style={{ color: "var(--asc-green)" }}
                  >
                    ✓ Winner
                  </p>
                )}
              </div>

              {/* Centre VS / score */}
              <div className="flex flex-col items-center gap-2">
                {winnerName ? (
                  <p
                    className="text-xs font-black uppercase tracking-[0.14em]"
                    style={{ color: "var(--asc-fg-3)" }}
                  >
                    Winner
                  </p>
                ) : (
                  <p
                    className="text-xl font-black uppercase tracking-[0.2em]"
                    style={{ color: "var(--asc-fg-3)" }}
                  >
                    vs
                  </p>
                )}
                {winnerName && (
                  <p
                    className="text-sm font-black"
                    style={{
                      color: "var(--asc-green)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {winnerName}
                  </p>
                )}
              </div>

              {/* Team B */}
              <div className="text-center md:text-left">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.14em]"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  Team B
                </p>
                <p
                  className="mt-2 text-2xl font-black md:text-4xl"
                  style={{
                    fontFamily: "var(--font-display)",
                    color:
                      isTerminal && match.winnerTeamId === match.teamBId
                        ? "var(--asc-green)"
                        : "var(--asc-fg-0)",
                  }}
                >
                  {teamB?.name ?? "TBD"}
                </p>
                {isTerminal && match.winnerTeamId === match.teamBId && (
                  <p
                    className="mt-1 text-xs font-black uppercase tracking-widest"
                    style={{ color: "var(--asc-green)" }}
                  >
                    ✓ Winner
                  </p>
                )}
              </div>
            </div>

            {/* Schedule info footer */}
            {match.scheduledAt && (
              <div
                className="flex flex-wrap items-center gap-4 px-5 py-3 text-xs"
                style={{
                  borderTop: "1px solid var(--asc-line-soft)",
                  color: "var(--asc-fg-3)",
                }}
              >
                <span className="font-bold">Scheduled</span>
                <span>
                  {match.scheduledAt.toLocaleString("en", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Content grid */}
        <div className="mx-auto grid max-w-[1680px] gap-6 px-6 pb-20 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-10 2xl:px-14">
          {/* Left column */}
          <div className="grid gap-6">
            {/* Game room */}
            {match.room && (
              <Panel eyebrow="Game Room" title="Room Details">
                <div className="grid gap-4 sm:grid-cols-2">
                  {match.room.roomCode && (
                    <div>
                      <p
                        className="text-[10px] font-black uppercase tracking-[0.14em]"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        Room Code
                      </p>
                      <p
                        className="mt-1 font-mono text-xl font-black"
                        style={{ color: "var(--asc-accent)" }}
                      >
                        {match.room.roomCode}
                      </p>
                    </div>
                  )}
                  {match.room.password && (
                    <div>
                      <p
                        className="text-[10px] font-black uppercase tracking-[0.14em]"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        Password
                      </p>
                      <p
                        className="mt-1 font-mono text-base font-black"
                        style={{ color: "var(--asc-fg-0)" }}
                      >
                        {match.room.password}
                      </p>
                    </div>
                  )}
                  {match.room.joinUrl && (
                    <div className="sm:col-span-2">
                      <p
                        className="text-[10px] font-black uppercase tracking-[0.14em]"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        Join URL
                      </p>
                      <a
                        href={match.room.joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block break-all text-sm font-bold transition hover:opacity-75"
                        style={{ color: "var(--asc-blue)" }}
                      >
                        {match.room.joinUrl}
                      </a>
                    </div>
                  )}
                </div>
              </Panel>
            )}

            {/* League of Legends tournament codes (per-game) */}
            {match.room?.provider === "riot_lol" &&
              match.games.some((g) => g.externalRoomId) && (
                <Panel
                  eyebrow="League of Legends"
                  title="Tournament Codes"
                >
                  <p
                    className="mb-3 text-xs"
                    style={{ color: "var(--asc-fg-3)" }}
                  >
                    Paste the code in the League client → Play → Tournament. The
                    result is reported automatically when the game ends.
                  </p>
                  <div className="grid gap-2">
                    {match.games
                      .filter((g) => g.externalRoomId)
                      .map((g) => (
                        <div
                          key={g.id}
                          className="flex flex-wrap items-center justify-between gap-3 border px-4 py-3"
                          style={{
                            borderColor: "var(--asc-line-soft)",
                            background: "var(--asc-bg-2)",
                          }}
                        >
                          <span
                            className="text-[10px] font-black uppercase tracking-widest"
                            style={{ color: "var(--asc-fg-3)" }}
                          >
                            Game {g.gameNumber}
                          </span>
                          <span
                            className="font-mono text-base font-black"
                            style={{ color: "var(--asc-accent)" }}
                          >
                            {g.externalRoomId}
                          </span>
                          <span
                            className="text-[10px] font-black uppercase tracking-widest"
                            style={{
                              color:
                                g.status === "completed"
                                  ? "var(--asc-green)"
                                  : "var(--asc-fg-3)",
                            }}
                          >
                            {g.status}
                          </span>
                        </div>
                      ))}
                  </div>
                </Panel>
              )}

            {/* Per-game breakdown */}
            {match.games.length > 0 && (
              <Panel
                eyebrow={`Games · ${match.games.length} played`}
                title="Game-by-Game"
              >
                <div className="grid gap-2">
                  {match.games.map((game) => {
                    const gameWinnerName = game.winnerTeamId
                      ? (teamName.get(game.winnerTeamId) ?? "Unknown")
                      : null;

                    return (
                      <div
                        key={game.id}
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-3 border px-4 py-3"
                        style={{
                          borderColor: "var(--asc-line-soft)",
                          background: "var(--asc-bg-2)",
                        }}
                      >
                        <span
                          className="text-[10px] font-black uppercase tracking-widest"
                          style={{ color: "var(--asc-fg-3)" }}
                        >
                          G{game.gameNumber}
                        </span>
                        <span
                          className="text-right font-black"
                          style={{
                            color:
                              game.winnerTeamId === match.teamAId
                                ? "var(--asc-green)"
                                : "var(--asc-fg-0)",
                          }}
                        >
                          {teamA?.name ?? "TBD"}
                        </span>
                        <span
                          className="text-center font-mono font-black tabular-nums"
                          style={{ color: "var(--asc-fg-0)" }}
                        >
                          {game.teamAScore} — {game.teamBScore}
                        </span>
                        <span
                          className="font-black"
                          style={{
                            color:
                              game.winnerTeamId === match.teamBId
                                ? "var(--asc-green)"
                                : "var(--asc-fg-0)",
                          }}
                        >
                          {teamB?.name ?? "TBD"}
                        </span>
                        <span
                          className="text-[10px] font-black uppercase tracking-widest"
                          style={{
                            color:
                              game.status === "completed"
                                ? "var(--asc-green)"
                                : "var(--asc-fg-3)",
                          }}
                        >
                          {gameWinnerName ? "✓" : game.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* Reports */}
            {match.reports.length > 0 && (
              <Panel
                eyebrow={`Reports · ${match.reports.length}`}
                title="Submitted Reports"
              >
                <div className="grid gap-3">
                  {match.reports.map((report) => {
                    const { label: rLabel, tone: rTone } = reportStatusInfo(
                      report.status,
                    );
                    const reportTeamName =
                      teamName.get(report.teamId) ?? "Unknown team";
                    const reportWinnerName =
                      teamName.get(report.winnerTeamId) ?? "Unknown";

                    return (
                      <div
                        key={report.id}
                        className="border p-4"
                        style={{
                          borderColor: "var(--asc-line-soft)",
                          background: "var(--asc-bg-2)",
                        }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="text-xs font-black"
                              style={{ color: "var(--asc-fg-1)" }}
                            >
                              {reportTeamName}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: "var(--asc-fg-3)" }}
                            >
                              · {report.submittedBy.username}
                            </span>
                          </div>
                          <span
                            className="inline-flex border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.10em]"
                            style={tonedStyle(rTone)}
                          >
                            {rLabel}
                          </span>
                        </div>

                        <div
                          className="mt-3 grid gap-1 text-sm"
                          style={{ color: "var(--asc-fg-2)" }}
                        >
                          <p>
                            <span
                              className="text-[10px] font-black uppercase tracking-widest"
                              style={{ color: "var(--asc-fg-3)" }}
                            >
                              Declared winner
                            </span>{" "}
                            <span
                              className="font-black"
                              style={{ color: "var(--asc-fg-0)" }}
                            >
                              {reportWinnerName}
                            </span>
                          </p>
                          <p>
                            <span
                              className="text-[10px] font-black uppercase tracking-widest"
                              style={{ color: "var(--asc-fg-3)" }}
                            >
                              Score
                            </span>{" "}
                            <span
                              className="font-mono font-black"
                              style={{ color: "var(--asc-fg-0)" }}
                            >
                              {report.teamAScore} — {report.teamBScore}
                            </span>
                          </p>
                          {report.note && (
                            <p
                              className="mt-1 text-xs leading-5"
                              style={{ color: "var(--asc-fg-3)" }}
                            >
                              {report.note}
                            </p>
                          )}
                          {report.evidenceUrl && (
                            <a
                              href={report.evidenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-block text-xs font-bold transition hover:opacity-75"
                              style={{ color: "var(--asc-blue)" }}
                            >
                              View evidence →
                            </a>
                          )}
                        </div>

                        <p
                          className="mt-3 text-[10px]"
                          style={{ color: "var(--asc-fg-3)" }}
                        >
                          {new Date(report.createdAt).toLocaleString("en", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}
          </div>

          {/* Right column: actions */}
          <div className="grid gap-6" style={{ alignContent: "start" }}>
            {/* Submit result — only for match participants */}
            {canSubmitReport && teamA && teamB && userTeamId && (
              <Panel eyebrow="Match Report" title="Submit Result">
                <MatchReportForm
                  matchId={match.id}
                  userTeamId={userTeamId}
                  teamA={teamA}
                  teamB={teamB}
                  hasExistingReport={userHasReport}
                />
              </Panel>
            )}

            {/* VALORANT match ID — shown for VALORANT games on active matches */}
            {isValorant && !isTerminal && teamA && teamB && (
              <Panel eyebrow="VALORANT" title="Submit Match ID">
                <ValorantMatchIdForm
                  matchId={match.id}
                  gameNumber={
                    match.games.length > 0
                      ? match.games[match.games.length - 1].gameNumber + 1
                      : 1
                  }
                  isAdmin={isAdmin}
                  isParticipant={userTeamId !== null}
                  currentExternalMatchId={
                    match.games.find((g) => g.externalMatchId)
                      ?.externalMatchId ?? null
                  }
                />
              </Panel>
            )}

            {/* VALORANT game-by-game verification status — shown for terminated matches too */}
            {isValorant && match.games.length > 0 && (
              <Panel eyebrow="VALORANT Verification" title="Game Status">
                <div className="grid gap-2">
                  {match.games.map((g) => {
                    const hasId = Boolean(g.externalMatchId);
                    return (
                      <div
                        key={g.id}
                        className="flex flex-wrap items-center justify-between gap-2 border px-3 py-2 text-xs"
                        style={{
                          borderColor: "var(--asc-line-soft)",
                          background: "var(--asc-bg-2)",
                        }}
                      >
                        <span
                          className="font-black uppercase tracking-widest"
                          style={{ color: "var(--asc-fg-3)" }}
                        >
                          Game {g.gameNumber}
                        </span>
                        {hasId ? (
                          <span
                            className="font-mono"
                            style={{ color: "var(--asc-fg-2)" }}
                          >
                            {g.externalMatchId}
                          </span>
                        ) : (
                          <span style={{ color: "var(--asc-fg-3)" }}>
                            No match ID submitted
                          </span>
                        )}
                        <span
                          className="font-black uppercase tracking-widest"
                          style={{
                            color:
                              g.status === "completed"
                                ? "var(--asc-green)"
                                : g.status === "cancelled"
                                  ? "var(--asc-live)"
                                  : "var(--asc-fg-3)",
                          }}
                        >
                          {g.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* Dispute — only when result is pending */}
            {canDispute && (
              <Panel eyebrow="Dispute" title="Open a Dispute">
                <p
                  className="mb-4 text-sm leading-6"
                  style={{ color: "var(--asc-fg-2)" }}
                >
                  If there is a problem with the submitted result, describe it
                  below. Admins will review both reports and resolve the match.
                </p>
                <DisputeForm matchId={match.id} />
              </Panel>
            )}

            {/* Login prompt */}
            {!currentUserId && !isTerminal && (
              <div
                className="relative border p-5"
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
                  Participate
                </p>
                <p
                  className="mt-2 text-sm leading-6"
                  style={{ color: "var(--asc-fg-2)" }}
                >
                  Sign in to submit your team&apos;s match result or open a
                  dispute.
                </p>
                <Link
                  href="/login"
                  className="mt-4 inline-flex px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:opacity-90"
                  style={{
                    background: "var(--asc-accent-2)",
                    clipPath:
                      "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)",
                  }}
                >
                  Sign In ›
                </Link>
              </div>
            )}

            {/* Admin controls */}
            {isAdmin && teamA && teamB && (
              <div
                className="relative overflow-hidden border"
                style={{
                  borderColor: "oklch(0.65 0.14 75 / 0.3)",
                  background: "oklch(0.25 0.12 75 / 0.06)",
                }}
              >
                <div
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: "1px solid oklch(0.65 0.14 75 / 0.2)" }}
                >
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.16em]"
                    style={{ color: "var(--asc-amber)" }}
                  >
                    ▲ Admin Controls
                  </p>
                  <span
                    className="border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]"
                    style={tonedStyle("amber")}
                  >
                    Staff Only
                  </span>
                </div>
                <div className="p-5">
                  <MatchAdminControls
                    matchId={match.id}
                    teamA={teamA}
                    teamB={teamB}
                    status={match.status}
                  />
                </div>
              </div>
            )}

            {/* Match metadata */}
            <div
              className="relative border"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
              }}
            >
              <div aria-hidden className="asc-corner-mark" />
              <div
                className="px-5 py-3"
                style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
              >
                <p
                  className="text-[10px] font-black uppercase tracking-[0.16em]"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  Match Info
                </p>
              </div>
              <div className="grid gap-3 p-5">
                {[
                  { label: "Round", value: `Round ${match.roundNumber}` },
                  { label: "Match", value: `#${match.matchNumber}` },
                  { label: "Format", value: `Best of ${match.bestOf}` },
                  {
                    label: "Status",
                    value: statusLabel,
                    style: tonedStyle(statusTone),
                  },
                  match.isBye
                    ? { label: "Type", value: "Bye (Auto-advance)" }
                    : null,
                  match.completedAt
                    ? {
                        label: "Completed",
                        value: new Date(match.completedAt).toLocaleDateString(
                          "en",
                          { dateStyle: "medium" },
                        ),
                      }
                    : null,
                ]
                  .filter(Boolean)
                  .map((item) => (
                    <div key={item!.label}>
                      <p
                        className="text-[10px] font-black uppercase tracking-[0.14em]"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        {item!.label}
                      </p>
                      <p
                        className="mt-0.5 text-sm font-bold"
                        style={item!.style ?? { color: "var(--asc-fg-1)" }}
                      >
                        {item!.value}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Back navigation */}
            <Link
              href={`/tournaments/${tournamentId}/matches`}
              className="inline-flex items-center justify-center border px-5 py-3 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-75"
              style={{
                borderColor: "var(--asc-line-soft)",
                color: "var(--asc-fg-2)",
                clipPath:
                  "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)",
              }}
            >
              ← All Matches
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    </main>
  );
}
