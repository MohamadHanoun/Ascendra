import type { ReactNode } from "react";

import {
  confirmMatchInline,
  createMatchRoomInline,
  overrideMatchInline,
  resetMatchInline,
  type AdminMatchInlineResult,
} from "@/actions/adminMatchInlineActions";
import InlineAdminActionForm from "@/components/InlineAdminActionForm";
import { prisma } from "@/lib/prisma";
import type { AdminTeamActionResult } from "@/actions/adminTeamInlineActions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tone = "green" | "yellow" | "red" | "gray" | "violet" | "amber";

// ─── Shared style helpers ─────────────────────────────────────────────────────

const toneStyle: Record<string, React.CSSProperties> = {
  green: { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
  yellow: { color: "var(--asc-amber)", borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)" },
  amber: { color: "var(--asc-amber)", borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)" },
  red: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
  gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
  violet: { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
};

function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-xs font-black"
      style={toneStyle[tone]}
    >
      {children}
    </span>
  );
}

function matchStatusTone(status: string): Tone {
  const map: Record<string, Tone> = {
    scheduled: "gray",
    ready: "green",
    room_created: "violet",
    in_progress: "yellow",
    result_pending: "amber",
    disputed: "red",
    confirmed: "green",
    completed: "violet",
    cancelled: "gray",
    forfeit: "red",
    bye: "gray",
  };
  return map[status] ?? "gray";
}

function matchStatusLabel(status: string): string {
  const map: Record<string, string> = {
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
  };
  return map[status] ?? status;
}

function reportStatusTone(status: string): Tone {
  const map: Record<string, Tone> = {
    submitted: "amber",
    confirmed: "green",
    rejected: "red",
    superseded: "gray",
  };
  return map[status] ?? "gray";
}

function auditStatusTone(status: string): Tone {
  if (status === "success") return "green";
  if (status === "failure") return "red";
  return "amber";
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
          {eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>
          {title}
        </h2>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-black"
        style={{ color: warn && value > 0 ? "var(--asc-live)" : "var(--asc-fg-0)" }}
      >
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
      {label}:{" "}
      <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>
        {value}
      </span>
    </p>
  );
}

function fmt(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
}

// ─── Helpers to bridge AdminMatchInlineResult → AdminTeamActionResult ─────────
// TypeScript structural typing: both have {ok, message, redirectTo?} — compatible.
function asTeamResult(
  fn: (fd: FormData) => Promise<AdminMatchInlineResult>,
): (fd: FormData) => Promise<AdminTeamActionResult> {
  return fn as (fd: FormData) => Promise<AdminTeamActionResult>;
}

// ─── Confirm form ─────────────────────────────────────────────────────────────

function ConfirmForm({ matchId }: { matchId: string }) {
  return (
    <InlineAdminActionForm
      action={asTeamResult(confirmMatchInline)}
      buttonLabel="✓ Confirm"
      pendingLabel="Confirming…"
      variant="success"
      confirmTitle="Confirm match result"
      confirmDescription="This will confirm the reported result and advance the bracket. This cannot be undone without a manual reset."
      confirmLabel="Confirm result"
    >
      <input type="hidden" name="matchId" value={matchId} />
    </InlineAdminActionForm>
  );
}

// ─── Override form ────────────────────────────────────────────────────────────

function OverrideForm({
  matchId,
  teamAId,
  teamBId,
  teamAName,
  teamBName,
}: {
  matchId: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
}) {
  const inputStyle: React.CSSProperties = {
    background: "var(--asc-bg-2)",
    border: "1px solid var(--asc-line-soft)",
    color: "var(--asc-fg-0)",
    padding: "0.4rem 0.65rem",
    fontSize: "0.8125rem",
    outline: "none",
    width: "100%",
  };

  return (
    <InlineAdminActionForm
      action={asTeamResult(overrideMatchInline)}
      buttonLabel="⚠ Override"
      pendingLabel="Overriding…"
      variant="danger"
      confirmTitle="Override match result"
      confirmDescription="This will force-set the winner and scores, bypassing all submitted reports. The action is logged."
      confirmLabel="Force override"
    >
      <input type="hidden" name="matchId" value={matchId} />

      <div className="grid gap-2">
        <label
          className="text-[10px] font-black uppercase tracking-[0.12em]"
          style={{ color: "var(--asc-fg-3)" }}
        >
          Winner
        </label>
        <select name="winnerTeamId" required style={inputStyle}>
          <option value="">— Select —</option>
          <option value={teamAId}>{teamAName}</option>
          <option value={teamBId}>{teamBName}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <label
            className="text-[10px] font-black uppercase tracking-[0.12em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {teamAName} score
          </label>
          <input type="number" name="teamAScore" min="0" max="99" defaultValue="0" required style={inputStyle} />
        </div>
        <div className="grid gap-1">
          <label
            className="text-[10px] font-black uppercase tracking-[0.12em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {teamBName} score
          </label>
          <input type="number" name="teamBScore" min="0" max="99" defaultValue="0" required style={inputStyle} />
        </div>
      </div>

      <div className="grid gap-1">
        <label
          className="text-[10px] font-black uppercase tracking-[0.12em]"
          style={{ color: "var(--asc-fg-3)" }}
        >
          Override note
        </label>
        <input
          type="text"
          name="note"
          maxLength={300}
          placeholder="Reason for override…"
          style={inputStyle}
        />
      </div>
    </InlineAdminActionForm>
  );
}

// ─── Reset form ───────────────────────────────────────────────────────────────

function ResetForm({ matchId }: { matchId: string }) {
  return (
    <InlineAdminActionForm
      action={asTeamResult(resetMatchInline)}
      buttonLabel="↺ Reset"
      pendingLabel="Resetting…"
      variant="secondary"
      confirmTitle="Reset match result"
      confirmDescription="This clears the winner and all confirmed reports, returning the match to 'awaiting result'. Both teams will need to resubmit."
      confirmLabel="Reset result"
    >
      <input type="hidden" name="matchId" value={matchId} />
    </InlineAdminActionForm>
  );
}

// ─── Room form ────────────────────────────────────────────────────────────────

function CreateRoomForm({
  matchId,
  existingRoom,
}: {
  matchId: string;
  existingRoom: { roomCode: string | null; status: string; joinUrl: string | null } | null;
}) {
  const inputStyle: React.CSSProperties = {
    background: "var(--asc-bg-2)",
    border: "1px solid var(--asc-line-soft)",
    color: "var(--asc-fg-0)",
    padding: "0.4rem 0.65rem",
    fontSize: "0.8125rem",
    outline: "none",
    width: "100%",
  };

  return (
    <InlineAdminActionForm
      action={asTeamResult(createMatchRoomInline)}
      buttonLabel={existingRoom ? "↺ Recreate Room" : "+ Create Room"}
      pendingLabel="Creating…"
      variant={existingRoom ? "secondary" : "primary"}
      confirmTitle={existingRoom ? "Recreate game room" : "Create game room"}
      confirmDescription={
        existingRoom
          ? "This will delete the existing room and create a new one."
          : "Create a manual game room with a code and optional password."
      }
      confirmLabel={existingRoom ? "Recreate" : "Create"}
    >
      <input type="hidden" name="matchId" value={matchId} />
      {existingRoom && (
        <input type="hidden" name="forceRecreate" value="true" />
      )}

      <div className="grid gap-2">
        <label
          className="text-[10px] font-black uppercase tracking-[0.12em]"
          style={{ color: "var(--asc-fg-3)" }}
        >
          Room code
        </label>
        <input
          type="text"
          name="roomCode"
          maxLength={64}
          placeholder="e.g. ASCMATCH123"
          defaultValue={existingRoom?.roomCode ?? ""}
          style={inputStyle}
        />
      </div>

      <div className="grid gap-2">
        <label
          className="text-[10px] font-black uppercase tracking-[0.12em]"
          style={{ color: "var(--asc-fg-3)" }}
        >
          Password (optional)
        </label>
        <input
          type="text"
          name="password"
          maxLength={64}
          placeholder="leave blank for none"
          style={inputStyle}
        />
      </div>

      <div className="grid gap-2">
        <label
          className="text-[10px] font-black uppercase tracking-[0.12em]"
          style={{ color: "var(--asc-fg-3)" }}
        >
          Join URL (optional)
        </label>
        <input
          type="url"
          name="joinUrl"
          placeholder="https://…"
          defaultValue={existingRoom?.joinUrl ?? ""}
          style={inputStyle}
        />
      </div>
    </InlineAdminActionForm>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default async function AdminMatchesPanel() {
  // Load all TournamentMatches that need attention first, then the rest
  const rawMatches = await prisma.tournamentMatch.findMany({
    orderBy: [
      // Sort order: disputed → result_pending → in_progress → others
      { status: "asc" },
      { roundNumber: "asc" },
      { matchNumber: "asc" },
    ],
    take: 200,
    select: {
      id: true,
      tournamentId: true,
      roundNumber: true,
      matchNumber: true,
      status: true,
      bestOf: true,
      teamAId: true,
      teamBId: true,
      winnerTeamId: true,
      scheduledAt: true,
      completedAt: true,
      isBye: true,
      reports: {
        orderBy: { createdAt: "desc" },
        include: {
          submittedBy: { select: { id: true, username: true } },
        },
      },
      room: {
        select: { id: true, roomCode: true, password: true, joinUrl: true, status: true, createdAt: true },
      },
    },
  });

  // Sort by urgency client-side for precise ordering
  const urgencyOrder: Record<string, number> = {
    disputed: 0,
    result_pending: 1,
    in_progress: 2,
    room_created: 3,
    ready: 4,
    scheduled: 5,
    confirmed: 6,
    completed: 7,
    forfeit: 8,
    bye: 9,
    cancelled: 10,
  };
  rawMatches.sort(
    (a, b) =>
      (urgencyOrder[a.status] ?? 99) - (urgencyOrder[b.status] ?? 99) ||
      a.roundNumber - b.roundNumber ||
      a.matchNumber - b.matchNumber,
  );

  // Bulk-load tournament titles
  const tournamentIds = [...new Set(rawMatches.map((m) => m.tournamentId))];
  const tournaments =
    tournamentIds.length > 0
      ? await prisma.tournament.findMany({
          where: { id: { in: tournamentIds } },
          select: { id: true, title: true },
        })
      : [];
  const tournamentTitle = new Map(tournaments.map((t) => [t.id, t.title]));

  // Bulk-load team names
  const teamIdSet = new Set<string>();
  for (const m of rawMatches) {
    if (m.teamAId) teamIdSet.add(m.teamAId);
    if (m.teamBId) teamIdSet.add(m.teamBId);
    if (m.winnerTeamId) teamIdSet.add(m.winnerTeamId);
    for (const r of m.reports) teamIdSet.add(r.teamId);
    for (const r of m.reports) teamIdSet.add(r.winnerTeamId);
  }
  const teamIds = [...teamIdSet];
  const teamRows =
    teamIds.length > 0
      ? await prisma.team.findMany({
          where: { id: { in: teamIds } },
          select: { id: true, name: true },
        })
      : [];
  const teamName = new Map(teamRows.map((t) => [t.id, t.name]));

  // Recent audit logs (global feed)
  const auditLogs = await prisma.gameApiAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      action: true,
      provider: true,
      status: true,
      error: true,
      request: true,
      createdAt: true,
    },
  });

  // Stats
  const disputedCount = rawMatches.filter((m) => m.status === "disputed").length;
  const pendingResultCount = rawMatches.filter((m) => m.status === "result_pending").length;
  const liveCount = rawMatches.filter((m) => m.status === "in_progress").length;
  const totalCount = rawMatches.length;

  return (
    <div className="grid gap-10">
      {/* ── Header ── */}
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <SectionHeader eyebrow="Match Engine" title="Match Management" />
        <div className="grid grid-cols-4 gap-5">
          <Stat label="Disputed" value={disputedCount} warn />
          <Stat label="Pending Result" value={pendingResultCount} warn={pendingResultCount > 0} />
          <Stat label="Live" value={liveCount} />
          <Stat label="Total" value={totalCount} />
        </div>
      </div>

      {/* ── Match list ── */}
      <section
        className="overflow-hidden border shadow-2xl"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
        >
          <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
            Disputed and pending matches appear first. Click into a tournament for bracket generation.
          </p>
        </div>

        {rawMatches.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
              No tournament matches found. Generate a bracket from a tournament admin page first.
            </p>
          </div>
        )}

        <div className="divide-y" style={{ borderColor: "var(--asc-line-soft)" }}>
          {rawMatches.map((match) => {
            const tName = tournamentTitle.get(match.tournamentId) ?? match.tournamentId;
            const aName = match.teamAId ? (teamName.get(match.teamAId) ?? "TBD") : "TBD";
            const bName = match.teamBId ? (teamName.get(match.teamBId) ?? "TBD") : "TBD";
            const wName = match.winnerTeamId ? (teamName.get(match.winnerTeamId) ?? null) : null;

            const isDisputed = match.status === "disputed";
            const isTerminal = ["completed", "confirmed", "cancelled", "bye", "forfeit"].includes(match.status);
            const canConfirm = ["result_pending", "disputed", "in_progress"].includes(match.status);
            const canOverride = !isTerminal;
            const canReset = ["result_pending", "disputed", "confirmed", "completed", "forfeit"].includes(match.status);
            const canRoom = !!(match.teamAId && match.teamBId);

            const liveBadgeStyle: React.CSSProperties = isDisputed
              ? { background: "oklch(0.65 0.22 25 / 0.06)", borderLeft: "2px solid var(--asc-live)" }
              : {};

            return (
              <div key={match.id} className="p-5" style={liveBadgeStyle}>
                {/* ── Match header row ── */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="grid gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={matchStatusTone(match.status)}>
                        {matchStatusLabel(match.status)}
                      </Pill>
                      <span
                        className="text-[10px] font-black uppercase tracking-[0.14em]"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        {tName} · R{match.roundNumber} · M{match.matchNumber} · BO{match.bestOf}
                      </span>
                    </div>

                    {/* Teams */}
                    <div className="flex items-center gap-3">
                      <span
                        className="text-base font-black"
                        style={{ color: wName === aName ? "var(--asc-green)" : "var(--asc-fg-0)" }}
                      >
                        {aName}
                        {wName === aName && (
                          <span className="ml-1 text-xs" style={{ color: "var(--asc-green)" }}>✓</span>
                        )}
                      </span>
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--asc-fg-3)" }}>
                        vs
                      </span>
                      <span
                        className="text-base font-black"
                        style={{ color: wName === bName ? "var(--asc-green)" : "var(--asc-fg-0)" }}
                      >
                        {bName}
                        {wName === bName && (
                          <span className="ml-1 text-xs" style={{ color: "var(--asc-green)" }}>✓</span>
                        )}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--asc-fg-3)" }}>
                      {match.scheduledAt && <span>Scheduled: {fmt(match.scheduledAt)}</span>}
                      {match.completedAt && <span>Completed: {fmt(match.completedAt)}</span>}
                      {match.isBye && <span className="font-black uppercase">Bye</span>}
                      <span className="font-mono opacity-50">{match.id}</span>
                    </div>
                  </div>

                  {/* Action buttons row */}
                  <div className="flex flex-wrap items-start gap-3">
                    {canConfirm && <ConfirmForm matchId={match.id} />}

                    {canOverride && match.teamAId && match.teamBId && (
                      <OverrideForm
                        matchId={match.id}
                        teamAId={match.teamAId}
                        teamBId={match.teamBId}
                        teamAName={aName}
                        teamBName={bName}
                      />
                    )}

                    {canReset && <ResetForm matchId={match.id} />}
                  </div>
                </div>

                {/* ── Reports ── */}
                {match.reports.length > 0 && (
                  <div className="mt-4">
                    <p
                      className="mb-2 text-[10px] font-black uppercase tracking-[0.14em]"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      Reports ({match.reports.length})
                    </p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {match.reports.map((report) => {
                        const reportTeam = teamName.get(report.teamId) ?? "Unknown";
                        const reportWinner = teamName.get(report.winnerTeamId) ?? "Unknown";
                        return (
                          <div
                            key={report.id}
                            className="border p-3"
                            style={{
                              borderColor: "var(--asc-line-soft)",
                              background: "var(--asc-bg-2)",
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black" style={{ color: "var(--asc-fg-1)" }}>
                                {reportTeam}
                              </span>
                              <Pill tone={reportStatusTone(report.status)}>
                                {report.status}
                              </Pill>
                            </div>
                            <div
                              className="mt-2 grid gap-1 text-xs"
                              style={{ color: "var(--asc-fg-3)" }}
                            >
                              <InfoRow
                                label="Declared winner"
                                value={<span style={{ color: "var(--asc-green)" }}>{reportWinner}</span>}
                              />
                              <InfoRow
                                label="Score"
                                value={`${report.teamAScore} — ${report.teamBScore}`}
                              />
                              <InfoRow label="By" value={report.submittedBy.username} />
                              {report.note && (
                                <p className="mt-1 leading-5 opacity-70">{report.note}</p>
                              )}
                              {report.evidenceUrl && (
                                <a
                                  href={report.evidenceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 inline-block font-bold hover:opacity-75"
                                  style={{ color: "var(--asc-blue)" }}
                                >
                                  Evidence →
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Game Room ── */}
                {canRoom && (
                  <div className="mt-4">
                    <p
                      className="mb-2 text-[10px] font-black uppercase tracking-[0.14em]"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      Game Room
                    </p>

                    {match.room ? (
                      <div
                        className="border p-3"
                        style={{
                          borderColor: "var(--asc-line-soft)",
                          background: "var(--asc-bg-2)",
                        }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="grid gap-1 text-xs" style={{ color: "var(--asc-fg-3)" }}>
                            {match.room.roomCode && (
                              <InfoRow
                                label="Code"
                                value={
                                  <span className="font-mono" style={{ color: "var(--asc-accent)" }}>
                                    {match.room.roomCode}
                                  </span>
                                }
                              />
                            )}
                            {match.room.password && (
                              <InfoRow label="Password" value={match.room.password} />
                            )}
                            {match.room.joinUrl && (
                              <InfoRow
                                label="URL"
                                value={
                                  <a
                                    href={match.room.joinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:opacity-75"
                                    style={{ color: "var(--asc-blue)" }}
                                  >
                                    {match.room.joinUrl}
                                  </a>
                                }
                              />
                            )}
                            <InfoRow label="Status" value={match.room.status} />
                            <InfoRow label="Created" value={fmt(match.room.createdAt)} />
                          </div>
                          <CreateRoomForm matchId={match.id} existingRoom={match.room} />
                        </div>
                      </div>
                    ) : (
                      <div className="w-64">
                        <CreateRoomForm matchId={match.id} existingRoom={null} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Audit Log ── */}
      <section className="grid gap-5">
        <SectionHeader eyebrow="Audit Trail" title="Recent Match Engine Logs" />

        <section
          className="overflow-hidden border shadow-2xl"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
        >
          <div
            className="px-5 py-3"
            style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
              Last 30 entries · all providers · sorted by newest first
            </p>
          </div>

          {auditLogs.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
                No audit log entries yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs">
                <thead>
                  <tr style={{ background: "oklch(0.10 0.03 287 / 0.5)" }}>
                    {["Time", "Action", "Provider", "Status", "Match / Error"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left font-black uppercase tracking-[0.14em]"
                        style={{ color: "var(--asc-fg-3)", borderBottom: "1px solid var(--asc-line-soft)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, i) => {
                    const reqMatchId =
                      log.request &&
                      typeof log.request === "object" &&
                      !Array.isArray(log.request) &&
                      "matchId" in log.request
                        ? String((log.request as Record<string, unknown>).matchId)
                        : null;

                    return (
                      <tr
                        key={log.id}
                        style={
                          i % 2 === 0
                            ? {}
                            : { background: "oklch(0.10 0.03 287 / 0.3)" }
                        }
                      >
                        <td className="px-4 py-2.5 tabular-nums" style={{ color: "var(--asc-fg-3)" }}>
                          {log.createdAt.toLocaleString("en", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-2.5 font-black" style={{ color: "var(--asc-fg-1)" }}>
                          {log.action}
                        </td>
                        <td className="px-4 py-2.5" style={{ color: "var(--asc-fg-3)" }}>
                          {log.provider}
                        </td>
                        <td className="px-4 py-2.5">
                          <Pill tone={auditStatusTone(log.status)}>
                            {log.status}
                          </Pill>
                        </td>
                        <td
                          className="max-w-[240px] truncate px-4 py-2.5 font-mono"
                          style={{ color: log.error ? "var(--asc-live)" : "var(--asc-fg-3)" }}
                        >
                          {log.error ?? reqMatchId ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
