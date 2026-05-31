"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import ConfirmDialogPortal from "@/components/ConfirmDialogPortal";
import { generateBracketInline } from "@/actions/adminMatchInlineActions";

export type TournamentMatchRow = {
  id: string;
  roundNumber: number;
  matchNumber: number;
  status: string;
  bestOf: number;
  isBye: boolean;
  teamAId: string | null;
  teamBId: string | null;
  winnerTeamId: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  teamAName: string | null;
  teamBName: string | null;
  winnerName: string | null;
  pendingReportCount: number;
};

type Props = {
  tournamentId: string;
  tournamentTitle: string;
  tournamentMatches: TournamentMatchRow[];
  approvedTeamCount: number;
};

type StatusInfo = { label: string; style: React.CSSProperties };

function getStatusInfo(status: string): StatusInfo {
  const map: Record<string, StatusInfo> = {
    scheduled: {
      label: "Scheduled",
      style: { color: "var(--asc-blue)", borderColor: "var(--asc-blue-border)", background: "var(--asc-blue-bg)" },
    },
    ready: {
      label: "Ready",
      style: { color: "var(--asc-green)", borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)" },
    },
    room_created: {
      label: "Room Created",
      style: { color: "var(--asc-blue)", borderColor: "var(--asc-blue-border)", background: "var(--asc-blue-bg)" },
    },
    in_progress: {
      label: "Live",
      style: { color: "var(--asc-live)", borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)" },
    },
    result_pending: {
      label: "Result Pending",
      style: { color: "var(--asc-amber)", borderColor: "var(--asc-amber-border)", background: "var(--asc-amber-bg)" },
    },
    disputed: {
      label: "Disputed",
      style: { color: "var(--asc-live)", borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)" },
    },
    confirmed: {
      label: "Confirmed",
      style: { color: "var(--asc-green)", borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)" },
    },
    completed: {
      label: "Completed",
      style: { color: "var(--asc-accent)", borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)" },
    },
    cancelled: {
      label: "Cancelled",
      style: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
    },
    forfeit: {
      label: "Forfeit",
      style: { color: "var(--asc-live)", borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)" },
    },
    bye: {
      label: "Bye",
      style: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
    },
  };
  return (
    map[status] ?? {
      label: status,
      style: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
    }
  );
}

function StatusBadge({ status }: { status: string }) {
  const info = getStatusInfo(status);
  return (
    <span className="inline-flex border px-2.5 py-0.5 text-xs font-black" style={info.style}>
      {info.label}
    </span>
  );
}

function Notice({ result }: { result: { ok: boolean; message: string } | null }) {
  if (!result) return null;
  return (
    <div
      className="border px-3 py-2 text-sm font-bold"
      style={
        result.ok
          ? { borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }
          : { borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)", color: "var(--asc-live)" }
      }
    >
      {result.message}
    </div>
  );
}

function MatchRow({
  match,
  tournamentId,
}: {
  match: TournamentMatchRow;
  tournamentId: string;
}) {
  const teamAName = match.teamAName ?? "TBD";
  const teamBName = match.isBye ? "BYE" : (match.teamBName ?? "TBD");
  const winnerName = match.winnerName;

  const teamAWon = Boolean(winnerName && winnerName === match.teamAName);
  const teamBWon = Boolean(winnerName && winnerName === match.teamBName);

  return (
    <div
      className="grid items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.025] md:grid-cols-[72px_minmax(0,1fr)_130px_52px_110px]"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      {/* Round + match labels */}
      <div className="flex flex-wrap gap-1">
        <span
          className="border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
        >
          R{match.roundNumber}
        </span>
        <span
          className="border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
        >
          M{match.matchNumber}
        </span>
      </div>

      {/* Teams + winner + reports */}
      <div>
        <p className="font-black leading-tight" style={{ color: "var(--asc-fg-0)" }}>
          <span style={{ color: teamAWon ? "var(--asc-green)" : undefined }}>{teamAName}</span>
          {" "}
          <span style={{ color: "var(--asc-fg-3)" }}>vs</span>
          {" "}
          <span style={{ color: teamBWon ? "var(--asc-green)" : undefined }}>{teamBName}</span>
        </p>
        {winnerName && (
          <p className="mt-0.5 text-xs font-bold" style={{ color: "var(--asc-green)" }}>
            ✓ {winnerName}
          </p>
        )}
        {match.pendingReportCount > 0 && (
          <p className="mt-0.5 text-xs font-bold" style={{ color: "var(--asc-amber)" }}>
            {match.pendingReportCount} report{match.pendingReportCount > 1 ? "s" : ""} pending
          </p>
        )}
      </div>

      {/* Status */}
      <StatusBadge status={match.status} />

      {/* Best of */}
      <span className="text-xs font-black tabular-nums" style={{ color: "var(--asc-fg-3)" }}>
        BO{match.bestOf}
      </span>

      {/* Match Center link */}
      <Link
        href={`/tournaments/${tournamentId}/matches/${match.id}`}
        className="inline-flex items-center justify-center border px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-90"
        style={{
          borderColor: "var(--asc-accent-border)",
          color: "var(--asc-accent)",
          background: "var(--asc-accent-dim)",
        }}
      >
        Open →
      </Link>
    </div>
  );
}

export default function AdminTournamentMatchPanel({
  tournamentId,
  tournamentTitle,
  tournamentMatches,
  approvedTeamCount,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function runGenerate() {
    const formData = new FormData();
    formData.set("tournamentId", tournamentId);

    startTransition(async () => {
      const result = await generateBracketInline(formData);
      setNotice(result);
      setConfirmOpen(false);
      if (result.ok) {
        window.setTimeout(() => router.refresh(), 450);
      }
    });
  }

  // Group by roundNumber
  const byRound: Record<number, TournamentMatchRow[]> = {};
  for (const m of tournamentMatches) {
    (byRound[m.roundNumber] ??= []).push(m);
  }
  const roundNumbers = Object.keys(byRound)
    .map(Number)
    .sort((a, b) => a - b);

  const hasMatches = tournamentMatches.length > 0;
  const canGenerate = approvedTeamCount >= 2;

  return (
    <div className="grid gap-4">
      {/* Generate bracket area (only when no matches exist) */}
      {!hasMatches && (
        <div
          className="border p-5"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-table-head-bg)" }}
        >
          <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
            No matches generated yet
          </p>

          {canGenerate ? (
            <div className="mt-4 grid gap-3">
              <p className="text-sm" style={{ color: "var(--asc-fg-2)" }}>
                {approvedTeamCount} approved team{approvedTeamCount === 1 ? "" : "s"} ready.
                Generates a single-elimination bracket.
              </p>

              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmOpen(true)}
                className="w-fit px-5 py-3 text-sm font-black uppercase tracking-[0.08em] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: "var(--asc-accent-2)",
                  color: "var(--asc-on-accent)",
                  clipPath:
                    "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
                }}
              >
                {pending ? "Generating..." : "Generate bracket ▲"}
              </button>

              <Notice result={notice} />
            </div>
          ) : (
            <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
              At least 2 approved teams are required. Currently{" "}
              {approvedTeamCount === 0 ? "none" : approvedTeamCount} approved.
            </p>
          )}
        </div>
      )}

      {/* Match list */}
      {hasMatches && (
        <div
          className="overflow-hidden border"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
        >
          {/* Column headers */}
          <div
            className="grid items-center gap-3 px-4 py-2.5 md:grid-cols-[72px_minmax(0,1fr)_130px_52px_110px]"
            style={{
              background: "var(--asc-card-muted)",
              borderBottom: "1px solid var(--asc-line-soft)",
            }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
              Slot
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
              Teams
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
              Status
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
              Format
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
              Actions
            </span>
          </div>

          {roundNumbers.map((round) => (
            <div key={round}>
              {/* Round divider */}
              <div
                className="px-4 py-2"
                style={{
                  background: "var(--asc-card-muted)",
                  borderBottom: "1px solid var(--asc-line-soft)",
                }}
              >
                <p
                  className="text-[11px] font-black uppercase tracking-[0.14em]"
                  style={{ color: "var(--asc-accent)" }}
                >
                  Round {round}
                </p>
              </div>

              {byRound[round].map((match) => (
                <MatchRow key={match.id} match={match} tournamentId={tournamentId} />
              ))}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialogPortal
        open={confirmOpen}
        eyebrow="Generate bracket"
        title="Generate bracket?"
        description={`Creates a single-elimination bracket for "${tournamentTitle}" with ${approvedTeamCount} approved teams. This cannot be undone — all existing matches must be deleted before regenerating.`}
        confirmLabel="Generate bracket"
        cancelLabel="Cancel"
        pendingLabel="Generating..."
        pending={pending}
        variant="primary"
        onConfirm={runGenerate}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
