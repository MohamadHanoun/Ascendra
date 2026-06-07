import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  confirmMatchInline,
  createMatchRoomInline,
  overrideMatchInline,
  resetMatchInline,
} from "@/actions/adminMatchInlineActions";
import { auth } from "@/auth";
import AdminShell from "@/components/AdminShell";
import InlineAdminTournamentForm from "@/components/InlineAdminTournamentForm";
import MatchCommunicationAdminForm from "@/components/MatchCommunicationAdminForm";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tournament Matches | Admin | Ascendra",
  description: "Manage schedules, instructions, rooms, and results for a tournament's matches.",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

// ─── Operation relevance gates (mirror existing match admin controls) ────────

const CONFIRMABLE = new Set([
  "scheduled",
  "ready",
  "room_created",
  "in_progress",
  "result_pending",
  "disputed",
]);

const NON_OVERRIDABLE = new Set(["completed", "cancelled", "bye"]);

// resetMatchInline accepts only these (others are rejected server-side).
const RESETTABLE = new Set([
  "result_pending",
  "disputed",
  "confirmed",
  "completed",
  "forfeit",
]);

const MATCH_SETUP_STATUSES = new Set([
  "scheduled",
  "ready",
  "room_created",
  "in_progress",
]);

// ─── Styling helpers ─────────────────────────────────────────────────────────

const inputStyle: CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

function inputClass() {
  return "border px-3 py-2 text-sm outline-none transition";
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span
      className="text-[10px] font-black uppercase tracking-[0.12em]"
      style={{ color: "var(--asc-fg-3)" }}
    >
      {children}
    </span>
  );
}

type StatusTone = "blue" | "green" | "live" | "amber" | "accent" | "gray";

function statusInfo(status: string): { label: string; tone: StatusTone } {
  const map: Record<string, { label: string; tone: StatusTone }> = {
    scheduled: { label: "Scheduled", tone: "blue" },
    ready: { label: "Ready", tone: "green" },
    room_created: { label: "Room Created", tone: "blue" },
    in_progress: { label: "Live", tone: "live" },
    result_pending: { label: "Result Pending", tone: "amber" },
    disputed: { label: "Disputed", tone: "live" },
    confirmed: { label: "Confirmed", tone: "green" },
    completed: { label: "Completed", tone: "accent" },
    cancelled: { label: "Cancelled", tone: "gray" },
    forfeit: { label: "Forfeit", tone: "live" },
    bye: { label: "Bye", tone: "gray" },
  };
  return map[status] ?? { label: status, tone: "gray" };
}

function toneStyle(tone: StatusTone): CSSProperties {
  const styles: Record<StatusTone, CSSProperties> = {
    blue: { color: "var(--asc-blue)", borderColor: "var(--asc-blue-border)", background: "var(--asc-blue-bg)" },
    green: { color: "var(--asc-green)", borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)" },
    live: { color: "var(--asc-live)", borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)" },
    amber: { color: "var(--asc-amber)", borderColor: "var(--asc-amber-border)", background: "var(--asc-amber-bg)" },
    accent: { color: "var(--asc-accent)", borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)" },
    gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
  };
  return styles[tone];
}

function StatusBadge({ status }: { status: string }) {
  const info = statusInfo(status);
  return (
    <span
      className="inline-flex border px-2.5 py-0.5 text-xs font-black"
      style={toneStyle(info.tone)}
    >
      {info.label}
    </span>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      className="border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
    >
      {children}
    </span>
  );
}

type SetupBadgeInfo = { label: string; tone: StatusTone };

function SetupBadge({ badge }: { badge: SetupBadgeInfo }) {
  return (
    <span
      className="inline-flex border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] whitespace-nowrap"
      style={toneStyle(badge.tone)}
    >
      {badge.label}
    </span>
  );
}

function getSetupBadges(input: {
  status: string;
  scheduledAt: Date | null;
  hasRoom: boolean;
  bothTeams: boolean;
  submittedReportTeamCount: number;
}): SetupBadgeInfo[] {
  const badges: SetupBadgeInfo[] = [];

  if (input.status === "disputed") {
    badges.push({ label: "Admin review required", tone: "live" });
    return badges;
  } else if (
    input.status === "result_pending" &&
    input.submittedReportTeamCount >= 2
  ) {
    badges.push({ label: "Reports ready", tone: "amber" });
    return badges;
  } else if (
    input.status === "result_pending" &&
    input.submittedReportTeamCount === 1
  ) {
    badges.push({ label: "Waiting for opponent report", tone: "amber" });
    return badges;
  } else if (input.status === "result_pending") {
    badges.push({ label: "Waiting for player reports", tone: "amber" });
    return badges;
  }

  if (!input.bothTeams) return badges;

  const activeSetupStatus = MATCH_SETUP_STATUSES.has(input.status);

  if (input.scheduledAt) {
    badges.push({ label: "Scheduled", tone: "green" });
  } else if (activeSetupStatus) {
    badges.push({ label: "Missing schedule", tone: "amber" });
  }

  if (input.hasRoom) {
    badges.push({ label: "Room ready", tone: "green" });
  } else if (activeSetupStatus && input.scheduledAt) {
    badges.push({ label: "Missing room", tone: "amber" });
  }

  return badges;
}

// Read-only review-state label derived from match status + live report spread.
type ReviewState = { label: string; tone: StatusTone };

function getMatchReviewState(
  status: string,
  reports: Array<{ status: string; teamId: string }>,
): ReviewState | null {
  if (status === "disputed") {
    return { label: "Admin review required", tone: "live" };
  }
  if (status === "result_pending") {
    const reportedTeams = new Set(
      reports.filter((r) => r.status === "submitted").map((r) => r.teamId),
    );
    if (reportedTeams.size >= 2) {
      return { label: "Reports ready", tone: "amber" };
    }
    if (reportedTeams.size === 1) {
      return { label: "Waiting for opponent report", tone: "amber" };
    }
    return { label: "Waiting for player reports", tone: "amber" };
  }
  if (
    status === "confirmed" ||
    status === "completed" ||
    status === "forfeit" ||
    status === "bye"
  ) {
    return { label: "Resolved", tone: "green" };
  }
  return null;
}

function OpSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="border p-4"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
    >
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-accent)" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

const utcFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function fmtUtc(date: Date | null): string {
  return date ? `${utcFormatter.format(date)} UTC` : "—";
}

// datetime-local default value for the communication form (UTC).
function toDateTimeLocal(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 16) : null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminTournamentMatchesPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) redirect("/login");
  if (!session.user.isAdmin) redirect("/admin");

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      status: true,
      registrationStatus: true,
      game: { select: { name: true } },
    },
  });

  if (!tournament) notFound();

  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: id },
    select: {
      id: true,
      roundNumber: true,
      matchNumber: true,
      status: true,
      bestOf: true,
      isBye: true,
      teamAId: true,
      teamBId: true,
      winnerTeamId: true,
      scheduledAt: true,
      completedAt: true,
      playerInstructions: true,
      room: {
        select: { provider: true, roomCode: true, password: true, joinUrl: true },
      },
      games: {
        select: { gameNumber: true, teamAScore: true, teamBScore: true, winnerTeamId: true, status: true },
        orderBy: { gameNumber: "asc" },
      },
      reports: {
        select: {
          id: true,
          status: true,
          teamId: true,
          winnerTeamId: true,
          teamAScore: true,
          teamBScore: true,
          note: true,
          evidenceUrl: true,
          createdAt: true,
          submittedBy: { select: { username: true, displayName: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ roundNumber: "asc" }, { matchNumber: "asc" }],
  });

  // Batch-load all team names referenced anywhere in the matches.
  const teamIds = [
    ...new Set(
      matches
        .flatMap((m) => [
          m.teamAId,
          m.teamBId,
          m.winnerTeamId,
          ...m.reports.map((r) => r.teamId),
          ...m.reports.map((r) => r.winnerTeamId),
        ])
        .filter((x): x is string => Boolean(x)),
    ),
  ];
  const teamRows =
    teamIds.length > 0
      ? await prisma.team.findMany({
          where: { id: { in: teamIds } },
          select: { id: true, name: true },
        })
      : [];
  const teamName = new Map(teamRows.map((t) => [t.id, t.name]));

  // Dispute reasons are recorded in GameApiAuditLog (action "match.dispute",
  // request.reason). Read-only lookup for disputed matches — never mutated here.
  const disputedMatchIds = matches
    .filter((m) => m.status === "disputed")
    .map((m) => m.id);
  const disputeReasonMap = new Map<string, { reason: string | null; at: Date }>();
  if (disputedMatchIds.length > 0) {
    const disputeLogs = await Promise.all(
      disputedMatchIds.map((mid) =>
        prisma.gameApiAuditLog.findFirst({
          where: {
            action: "match.dispute",
            request: { path: ["matchId"], equals: mid },
          },
          orderBy: { createdAt: "desc" },
          select: { request: true, createdAt: true },
        }),
      ),
    );
    disputedMatchIds.forEach((mid, i) => {
      const log = disputeLogs[i];
      if (!log) return;
      const req = log.request as { reason?: unknown } | null;
      const reason =
        req && typeof req.reason === "string" && req.reason.trim()
          ? req.reason.trim()
          : null;
      disputeReasonMap.set(mid, { reason, at: log.createdAt });
    });
  }

  // Group by round.
  const byRound = new Map<number, typeof matches>();
  for (const m of matches) {
    const list = byRound.get(m.roundNumber) ?? [];
    list.push(m);
    byRound.set(m.roundNumber, list);
  }
  const rounds = [...byRound.keys()].sort((a, b) => a - b);

  const pendingReportTotal = matches.reduce(
    (sum, m) => sum + m.reports.filter((r) => r.status === "submitted").length,
    0,
  );
  const disputedCount = matches.filter((m) => m.status === "disputed").length;
  const scheduledCount = matches.filter((m) => m.scheduledAt).length;

  return (
    <AdminShell
      userName={session.user.name}
      eyebrow="Tournament matches"
      title={tournament.title}
      description="Set schedules and instructions, share manual room details, review reports, and resolve results."
      headerMeta={
        <>
          <StatusBadge status={tournament.status} />
          {tournament.game && (
            <span
              className="border px-3 py-1 font-bold"
              style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-2)" }}
            >
              {tournament.game.name}
            </span>
          )}
        </>
      }
    >
      <section className="mx-auto max-w-[1440px] px-6 pb-16 lg:px-10">
        {/* Back + overview */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/admin/tournaments/${tournament.id}`}
            className="inline-flex border px-4 py-2 text-sm font-black transition hover:opacity-90"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-2)" }}
          >
            ← Back to tournament
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-xs font-black">
            <Tag>{matches.length} match{matches.length === 1 ? "" : "es"}</Tag>
            <Tag>{rounds.length} round{rounds.length === 1 ? "" : "s"}</Tag>
            <Tag>{scheduledCount} scheduled</Tag>
            <Tag>{pendingReportTotal} report{pendingReportTotal === 1 ? "" : "s"} pending</Tag>
            {disputedCount > 0 && <Tag>{disputedCount} disputed</Tag>}
          </div>
        </div>

        {matches.length === 0 ? (
          <div
            className="border px-6 py-12 text-center"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <p className="text-sm font-black" style={{ color: "var(--asc-fg-3)" }}>
              No matches generated yet.
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
              Generate the bracket from the{" "}
              <Link
                href={`/admin/tournaments/${tournament.id}`}
                className="font-black underline transition hover:opacity-80"
                style={{ color: "var(--asc-accent)" }}
              >
                tournament page
              </Link>{" "}
              once registration is closed.
            </p>
          </div>
        ) : (
          <div className="grid gap-8">
            {rounds.map((round) => (
              <div key={round} className="grid gap-3">
                <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
                  Round {round}
                </p>

                <div className="grid gap-3">
                  {byRound.get(round)!.map((match) => {
                    const teamA = match.teamAId
                      ? { id: match.teamAId, name: teamName.get(match.teamAId) ?? "TBD" }
                      : null;
                    const teamB = match.teamBId
                      ? { id: match.teamBId, name: teamName.get(match.teamBId) ?? "TBD" }
                      : null;
                    const teamBLabel = match.isBye ? "BYE" : (teamB?.name ?? "TBD");
                    const winnerName = match.winnerTeamId
                      ? (teamName.get(match.winnerTeamId) ?? null)
                      : null;

                    const submittedReports = match.reports.filter((r) => r.status === "submitted");
                    const submittedReportTeamCount = new Set(
                      submittedReports.map((r) => r.teamId),
                    ).size;
                    const reviewState = getMatchReviewState(match.status, match.reports);

                    const bothTeams = Boolean(teamA && teamB) && !match.isBye;
                    const showConfirm = CONFIRMABLE.has(match.status);
                    const showOverride = !NON_OVERRIDABLE.has(match.status) && bothTeams;
                    const showReset = RESETTABLE.has(match.status);
                    const showRoom = bothTeams;
                    const existingRoom = match.room;
                    const setupBadges = getSetupBadges({
                      status: match.status,
                      scheduledAt: match.scheduledAt,
                      hasRoom: Boolean(existingRoom),
                      bothTeams,
                      submittedReportTeamCount,
                    });

                    return (
                      <details
                        key={match.id}
                        id={`match-${match.id}`}
                        className="group overflow-hidden border scroll-mt-24"
                        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
                      >
                        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3 transition">
                          <Tag>M{match.matchNumber}</Tag>
                          <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
                            <span style={{ color: winnerName && winnerName === teamA?.name ? "var(--asc-green)" : undefined }}>
                              {teamA?.name ?? "TBD"}
                            </span>{" "}
                            <span style={{ color: "var(--asc-fg-3)" }}>vs</span>{" "}
                            <span style={{ color: winnerName && winnerName === teamB?.name ? "var(--asc-green)" : undefined }}>
                              {teamBLabel}
                            </span>
                          </p>
                          <StatusBadge status={match.status} />
                          <Tag>BO{match.bestOf}</Tag>
                          {setupBadges.map((badge) => (
                            <SetupBadge key={badge.label} badge={badge} />
                          ))}
                          {submittedReports.length > 0 && (
                            <span className="text-xs font-bold" style={{ color: "var(--asc-amber)" }}>
                              {submittedReports.length} report{submittedReports.length > 1 ? "s" : ""} pending
                            </span>
                          )}
                          <span
                            className="ml-auto grid h-7 w-7 shrink-0 place-items-center border text-base font-black transition group-open:rotate-45"
                            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-2)" }}
                          >
                            +
                          </span>
                        </summary>

                        <div className="grid gap-5 p-4" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
                          {/* Review state (read-only) */}
                          {reviewState && (
                            <div className="flex flex-wrap items-center gap-2">
                              <FieldLabel>Review state</FieldLabel>
                              <span
                                className="inline-flex border px-2.5 py-0.5 text-xs font-black"
                                style={toneStyle(reviewState.tone)}
                              >
                                {reviewState.label}
                              </span>
                            </div>
                          )}

                          {/* Overview */}
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <FieldLabel>Scheduled (UTC)</FieldLabel>
                              <p className="mt-1 text-sm font-bold" style={{ color: match.scheduledAt ? "var(--asc-fg-0)" : "var(--asc-fg-3)" }}>
                                {fmtUtc(match.scheduledAt)}
                              </p>
                            </div>
                            <div>
                              <FieldLabel>Winner</FieldLabel>
                              <p className="mt-1 text-sm font-bold" style={{ color: winnerName ? "var(--asc-green)" : "var(--asc-fg-3)" }}>
                                {winnerName ?? "—"}
                              </p>
                            </div>
                            <div>
                              <FieldLabel>Room</FieldLabel>
                              <p className="mt-1 break-all text-sm font-bold" style={{ color: existingRoom ? "var(--asc-fg-0)" : "var(--asc-fg-3)" }}>
                                {existingRoom
                                  ? `${existingRoom.provider}${existingRoom.roomCode ? ` · ${existingRoom.roomCode}` : ""}`
                                  : "—"}
                              </p>
                            </div>
                            <div>
                              <FieldLabel>Instructions</FieldLabel>
                              <p className="mt-1 text-sm font-bold" style={{ color: match.playerInstructions ? "var(--asc-green)" : "var(--asc-fg-3)" }}>
                                {match.playerInstructions ? "Set" : "Not set"}
                              </p>
                            </div>
                          </div>

                          {/* Per-game scores */}
                          {match.games.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {match.games.map((g) => (
                                <span
                                  key={g.gameNumber}
                                  className="border px-2 py-1 text-xs font-bold tabular-nums"
                                  style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-2)" }}
                                >
                                  G{g.gameNumber}: {g.teamAScore}–{g.teamBScore}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Reports / disputes */}
                          {(match.reports.length > 0 || match.status === "disputed") && (
                            <div className="grid gap-2">
                              <FieldLabel>Reports &amp; disputes</FieldLabel>

                              {/* Read-only dispute reason from the audit log */}
                              {match.status === "disputed" && (
                                <div
                                  className="border px-3 py-2 text-xs"
                                  style={{ borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)" }}
                                >
                                  <p className="font-black uppercase tracking-[0.1em]" style={{ color: "var(--asc-live)" }}>
                                    Dispute reason
                                  </p>
                                  <p className="mt-1 break-words" style={{ color: "var(--asc-fg-1)" }}>
                                    {disputeReasonMap.get(match.id)?.reason ?? "No dispute reason was recorded."}
                                  </p>
                                  {disputeReasonMap.get(match.id)?.at && (
                                    <p className="mt-1" style={{ color: "var(--asc-fg-3)" }}>
                                      {fmtUtc(disputeReasonMap.get(match.id)!.at)}
                                    </p>
                                  )}
                                </div>
                              )}

                              {match.reports.map((r) => {
                                const submitter =
                                  r.submittedBy.displayName?.trim() || r.submittedBy.username;
                                return (
                                  <div
                                    key={r.id}
                                    className="flex flex-wrap items-center gap-x-3 gap-y-1 border px-3 py-2 text-xs"
                                    style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
                                  >
                                    <span className="font-black" style={{ color: "var(--asc-fg-1)" }}>
                                      {teamName.get(r.teamId) ?? "Unknown team"}
                                    </span>
                                    <span style={{ color: "var(--asc-fg-3)" }}>
                                      winner: <span style={{ color: "var(--asc-fg-1)" }}>{teamName.get(r.winnerTeamId) ?? "—"}</span>
                                    </span>
                                    <span className="font-mono font-black" style={{ color: "var(--asc-fg-0)" }}>
                                      {r.teamAScore}–{r.teamBScore}
                                    </span>
                                    <span className="font-black uppercase" style={{ color: r.status === "submitted" ? "var(--asc-amber)" : "var(--asc-fg-3)" }}>
                                      {r.status}
                                    </span>
                                    <span style={{ color: "var(--asc-fg-3)" }}>
                                      by <span style={{ color: "var(--asc-fg-2)" }}>{submitter}</span>
                                    </span>
                                    <span style={{ color: "var(--asc-fg-3)" }}>{fmtUtc(r.createdAt)}</span>
                                    {r.evidenceUrl && (
                                      <a
                                        href={r.evidenceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-black underline transition hover:opacity-80"
                                        style={{ color: "var(--asc-accent)" }}
                                      >
                                        View evidence →
                                      </a>
                                    )}
                                    {r.note && (
                                      <span className="basis-full" style={{ color: "var(--asc-fg-3)" }}>
                                        {r.note}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {match.isBye ? (
                            <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
                              Bye match — no operations available.
                            </p>
                          ) : (
                            <div className="grid gap-3 lg:grid-cols-2">
                              {/* Schedule & instructions */}
                              <OpSection title="Schedule & instructions">
                                <MatchCommunicationAdminForm
                                  matchId={match.id}
                                  currentScheduledAt={toDateTimeLocal(match.scheduledAt)}
                                  currentInstructions={match.playerInstructions ?? null}
                                />
                              </OpSection>

                              {/* Manual room */}
                              {showRoom && (
                                <OpSection title="Manual room link / code">
                                  <InlineAdminTournamentForm
                                    action={createMatchRoomInline}
                                    buttonLabel={existingRoom ? "Replace room" : "Create room"}
                                    pendingLabel="Saving..."
                                    variant="secondary"
                                    className="grid gap-3"
                                    confirmTitle={existingRoom ? "Replace match room?" : undefined}
                                    confirmDescription={
                                      existingRoom
                                        ? `This match already has a ${existingRoom.provider} room. Saving with force-recreate will delete it and create a new manual room.`
                                        : undefined
                                    }
                                    confirmLabel="Replace room"
                                  >
                                    <input type="hidden" name="matchId" value={match.id} />
                                    <label className="grid gap-1.5">
                                      <FieldLabel>Room code</FieldLabel>
                                      <input
                                        name="roomCode"
                                        defaultValue={existingRoom?.roomCode ?? ""}
                                        placeholder="Optional"
                                        className={inputClass()}
                                        style={inputStyle}
                                      />
                                    </label>
                                    <label className="grid gap-1.5">
                                      <FieldLabel>Password</FieldLabel>
                                      <input
                                        name="password"
                                        defaultValue={existingRoom?.password ?? ""}
                                        placeholder="Optional"
                                        className={inputClass()}
                                        style={inputStyle}
                                      />
                                    </label>
                                    <label className="grid gap-1.5">
                                      <FieldLabel>Join URL</FieldLabel>
                                      <input
                                        name="joinUrl"
                                        type="url"
                                        defaultValue={existingRoom?.joinUrl ?? ""}
                                        placeholder="https://..."
                                        className={inputClass()}
                                        style={inputStyle}
                                      />
                                    </label>
                                    {existingRoom && (
                                      <label className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--asc-fg-2)" }}>
                                        <input type="checkbox" name="forceRecreate" value="true" />
                                        Force-recreate (replace the existing {existingRoom.provider} room)
                                      </label>
                                    )}
                                  </InlineAdminTournamentForm>
                                </OpSection>
                              )}

                              {/* Confirm reported result */}
                              {showConfirm && (
                                <OpSection title="Confirm reported result">
                                  <InlineAdminTournamentForm
                                    action={confirmMatchInline}
                                    buttonLabel="Confirm result"
                                    pendingLabel="Confirming..."
                                    variant="success"
                                    className="grid gap-3"
                                    confirmTitle="Confirm match result?"
                                    confirmDescription={`Confirm the reported result for ${teamA?.name ?? "Team A"} vs ${teamB?.name ?? "Team B"}. This may advance the bracket.`}
                                    confirmLabel="Confirm result"
                                  >
                                    <input type="hidden" name="matchId" value={match.id} />
                                    <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
                                      Confirms the result currently reported by the teams.
                                    </p>
                                  </InlineAdminTournamentForm>
                                </OpSection>
                              )}

                              {/* Override result */}
                              {showOverride && teamA && teamB && (
                                <OpSection title="Override result">
                                  <InlineAdminTournamentForm
                                    action={overrideMatchInline}
                                    buttonLabel="Force override"
                                    pendingLabel="Overriding..."
                                    variant="danger"
                                    className="grid gap-3"
                                    confirmTitle="Force override result?"
                                    confirmDescription={`Override the official result for ${teamA.name} vs ${teamB.name}. Use this only after admin review.`}
                                    confirmLabel="Force override"
                                  >
                                    <input type="hidden" name="matchId" value={match.id} />
                                    <label className="grid gap-1.5">
                                      <FieldLabel>Declare winner</FieldLabel>
                                      <select name="winnerTeamId" required className={inputClass()} style={inputStyle}>
                                        <option value="">— Select winner —</option>
                                        <option value={teamA.id}>{teamA.name}</option>
                                        <option value={teamB.id}>{teamB.name}</option>
                                      </select>
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                      <label className="grid gap-1.5">
                                        <FieldLabel>{teamA.name} score</FieldLabel>
                                        <input name="teamAScore" type="number" min="0" max="99" defaultValue="0" required className={inputClass()} style={inputStyle} />
                                      </label>
                                      <label className="grid gap-1.5">
                                        <FieldLabel>{teamB.name} score</FieldLabel>
                                        <input name="teamBScore" type="number" min="0" max="99" defaultValue="0" required className={inputClass()} style={inputStyle} />
                                      </label>
                                    </div>
                                    <label className="grid gap-1.5">
                                      <FieldLabel>Override note</FieldLabel>
                                      <textarea name="note" rows={2} maxLength={300} placeholder="Reason for admin override…" className={`${inputClass()} resize-y`} style={inputStyle} />
                                    </label>
                                  </InlineAdminTournamentForm>
                                </OpSection>
                              )}

                              {/* Reset result */}
                              {showReset && (
                                <OpSection title="Reset result">
                                  <InlineAdminTournamentForm
                                    action={resetMatchInline}
                                    buttonLabel="Reset result"
                                    pendingLabel="Resetting..."
                                    variant="secondary"
                                    className="grid gap-3"
                                    confirmTitle="Reset match result?"
                                    confirmDescription={`Clear the recorded result for ${teamA?.name ?? "Team A"} vs ${teamB?.name ?? "Team B"}. Submitted/confirmed reports are superseded and the match returns to result-pending (or scheduled if no reports remain).`}
                                    confirmLabel="Reset result"
                                  >
                                    <input type="hidden" name="matchId" value={match.id} />
                                    <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
                                      Clears the winner and supersedes existing reports.
                                    </p>
                                  </InlineAdminTournamentForm>
                                </OpSection>
                              )}
                            </div>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
