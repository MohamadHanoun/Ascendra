"use client";

import { useActionState } from "react";

import {
  disputeMatchResult,
  submitMatchReport,
  type MatchActionResult,
} from "@/actions/matchActions";

type Team = { id: string; name: string };

type MatchReportFormProps = {
  matchId: string;
  userTeamId: string;
  teamA: Team;
  teamB: Team;
  hasExistingReport: boolean;
};

const initialState: MatchActionResult = { ok: false, message: "" };

function inputStyle(): React.CSSProperties {
  return {
    background: "var(--asc-bg-2)",
    border: "1px solid var(--asc-line-soft)",
    color: "var(--asc-fg-0)",
    padding: "0.5rem 0.75rem",
    fontFamily: "var(--font-body)",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
  };
}

function labelStyle(): React.CSSProperties {
  return {
    display: "block",
    fontSize: "0.625rem",
    fontWeight: 900,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--asc-fg-3)",
    marginBottom: "0.35rem",
  };
}

function ActionFeedback({ result }: { result: MatchActionResult }) {
  if (!result.message) return null;

  return (
    <div
      className="p-4"
      style={
        result.ok
          ? {
              background: "oklch(0.74 0.16 150 / 0.10)",
              border: "1px solid oklch(0.74 0.16 150 / 0.25)",
              color: "oklch(0.88 0.10 150)",
            }
          : {
              background: "oklch(0.65 0.22 25 / 0.10)",
              border: "1px solid oklch(0.65 0.22 25 / 0.25)",
              color: "oklch(0.88 0.10 25)",
            }
      }
    >
      <p className="text-sm leading-6">{result.message}</p>
    </div>
  );
}

export function MatchReportForm({
  matchId,
  userTeamId,
  teamA,
  teamB,
  hasExistingReport,
}: MatchReportFormProps) {
  const [reportState, reportAction, reportPending] = useActionState(
    submitMatchReport,
    initialState,
  );

  return (
    <div className="grid gap-5">
      {hasExistingReport && (
        <div
          className="px-4 py-3 text-xs font-bold"
          style={{
            background: "oklch(0.82 0.16 75 / 0.08)",
            border: "1px solid oklch(0.65 0.14 75 / 0.3)",
            color: "var(--asc-amber)",
          }}
        >
          You already submitted a report. Submitting again will replace your
          previous one.
        </div>
      )}

      <ActionFeedback result={reportState} />

      {!reportState.ok && (
        <form action={reportAction} className="grid gap-5">
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="teamId" value={userTeamId} />

          <div>
            <label style={labelStyle()}>Declare Winner</label>
            <select name="winnerTeamId" required style={inputStyle()}>
              <option value="">— Select winner —</option>
              <option value={teamA.id}>{teamA.name}</option>
              <option value={teamB.id}>{teamB.name}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle()}>{teamA.name} score</label>
              <input
                type="number"
                name="teamAScore"
                min="0"
                max="99"
                defaultValue="0"
                required
                style={inputStyle()}
              />
            </div>
            <div>
              <label style={labelStyle()}>{teamB.name} score</label>
              <input
                type="number"
                name="teamBScore"
                min="0"
                max="99"
                defaultValue="0"
                required
                style={inputStyle()}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle()}>Evidence URL (screenshot / VOD)</label>
            <input
              type="url"
              name="evidenceUrl"
              placeholder="https://…"
              style={inputStyle()}
            />
          </div>

          <div>
            <label style={labelStyle()}>Note (optional)</label>
            <textarea
              name="note"
              rows={2}
              maxLength={500}
              placeholder="Any extra context for the admin…"
              style={{ ...inputStyle(), resize: "vertical" }}
            />
          </div>

          <button
            type="submit"
            disabled={reportPending}
            className="px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: "var(--asc-accent-2)",
              boxShadow: "0 0 20px var(--asc-accent-glow)",
              clipPath:
                "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)",
            }}
          >
            {reportPending ? "Submitting…" : "Submit Result ›"}
          </button>
        </form>
      )}
    </div>
  );
}

type DisputeFormProps = {
  matchId: string;
};

export function DisputeForm({ matchId }: DisputeFormProps) {
  const [state, formAction, pending] = useActionState(
    disputeMatchResult,
    initialState,
  );

  return (
    <div className="grid gap-4">
      <ActionFeedback result={state} />

      {!state.ok && (
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="matchId" value={matchId} />

          <div>
            <label style={labelStyle()}>Reason for dispute</label>
            <textarea
              name="reason"
              rows={3}
              maxLength={500}
              required
              placeholder="Describe the problem clearly. Admins will review both sides."
              style={{ ...inputStyle(), resize: "vertical" }}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="border px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: "oklch(0.50 0.20 25 / 0.5)",
              color: "var(--asc-live)",
              background: "transparent",
            }}
          >
            {pending ? "Filing dispute…" : "File Dispute"}
          </button>
        </form>
      )}
    </div>
  );
}
