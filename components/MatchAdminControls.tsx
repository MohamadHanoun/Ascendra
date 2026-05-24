"use client";

import { useActionState } from "react";

import {
  adminOverrideMatchResult,
  confirmMatchResult,
  type MatchActionResult,
} from "@/actions/matchActions";

type Team = { id: string; name: string };

type MatchAdminControlsProps = {
  matchId: string;
  teamA: Team;
  teamB: Team;
  status: string;
};

const initial: MatchActionResult = { ok: false, message: "" };

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

function Feedback({ result }: { result: MatchActionResult }) {
  if (!result.message) return null;

  return (
    <div
      className="p-3 text-sm"
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
      {result.message}
    </div>
  );
}

const confirmableStatuses = new Set([
  "scheduled",
  "ready",
  "room_created",
  "in_progress",
  "result_pending",
  "disputed",
]);

export default function MatchAdminControls({
  matchId,
  teamA,
  teamB,
  status,
}: MatchAdminControlsProps) {
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmMatchResult,
    initial,
  );
  const [overrideState, overrideAction, overridePending] = useActionState(
    adminOverrideMatchResult,
    initial,
  );

  const canConfirm = confirmableStatuses.has(status);
  const canOverride = status !== "completed" && status !== "cancelled" && status !== "bye";

  return (
    <div className="grid gap-6">
      {/* Confirm */}
      {canConfirm && (
        <div className="grid gap-3">
          <p
            className="text-[10px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            Confirm reported result
          </p>
          <Feedback result={confirmState} />
          {!confirmState.ok && (
            <form action={confirmAction}>
              <input type="hidden" name="matchId" value={matchId} />
              <button
                type="submit"
                disabled={confirmPending}
                className="px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: "var(--asc-accent-2)",
                  boxShadow: "0 0 16px var(--asc-accent-glow)",
                  clipPath:
                    "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)",
                }}
              >
                {confirmPending ? "Confirming…" : "✓ Confirm Result"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Override */}
      {canOverride && (
        <div className="grid gap-3">
          <p
            className="text-[10px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            Override result
          </p>

          <Feedback result={overrideState} />

          {!overrideState.ok && (
            <form action={overrideAction} className="grid gap-4">
              <input type="hidden" name="matchId" value={matchId} />

              <div>
                <label style={labelStyle()}>Declare winner</label>
                <select name="winnerTeamId" required style={inputStyle()}>
                  <option value="">— Select winner —</option>
                  <option value={teamA.id}>{teamA.name}</option>
                  <option value={teamB.id}>{teamB.name}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <label style={labelStyle()}>Override note</label>
                <textarea
                  name="note"
                  rows={2}
                  maxLength={300}
                  placeholder="Reason for admin override…"
                  style={{ ...inputStyle(), resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                disabled={overridePending}
                className="border px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "oklch(0.65 0.14 75 / 0.5)",
                  color: "var(--asc-amber)",
                  background: "oklch(0.25 0.12 75 / 0.10)",
                }}
              >
                {overridePending ? "Overriding…" : "⚠ Force Override"}
              </button>
            </form>
          )}
        </div>
      )}

      {!canConfirm && !canOverride && (
        <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
          This match is in a terminal state — no admin actions are available.
        </p>
      )}
    </div>
  );
}
