"use client";

import { useActionState } from "react";

import {
  updateTournamentMatchCommunication,
  type MatchActionResult,
} from "@/actions/matchActions";

type Props = {
  matchId: string;
  currentScheduledAt: string | null;
  currentInstructions: string | null;
};

const INITIAL: MatchActionResult = { ok: false, message: "" };

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
    textTransform: "uppercase" as const,
    color: "var(--asc-fg-3)",
    marginBottom: "0.35rem",
  };
}

export default function MatchCommunicationAdminForm({
  matchId,
  currentScheduledAt,
  currentInstructions,
}: Props) {
  const [state, formAction, pending] = useActionState(
    updateTournamentMatchCommunication,
    INITIAL,
  );

  return (
    <div className="grid gap-3">
      <p
        className="text-[10px] font-black uppercase tracking-[0.14em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        Match schedule &amp; instructions
      </p>

      {state.message && (
        <div
          className="p-3 text-sm"
          style={
            state.ok
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
          {state.message}
        </div>
      )}

      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="matchId" value={matchId} />

        <div>
          <label style={labelStyle()}>Match start time (UTC)</label>
          <input
            type="datetime-local"
            name="scheduledAt"
            defaultValue={currentScheduledAt ?? ""}
            style={inputStyle()}
          />
          <p
            className="mt-1 text-[10px]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            UTC · Leave blank to clear
          </p>
        </div>

        <div>
          <label style={labelStyle()}>Player instructions</label>
          <textarea
            name="playerInstructions"
            rows={3}
            maxLength={500}
            defaultValue={currentInstructions ?? ""}
            placeholder="e.g. Join the FACEIT room at 20:00 UTC. Check in before joining."
            style={{ ...inputStyle(), resize: "vertical" }}
          />
          <p
            className="mt-1 text-[10px]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            Max 500 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="border px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            borderColor: "oklch(0.50 0.20 285 / 0.45)",
            color: "var(--asc-accent)",
            background: "var(--asc-accent-dim)",
            clipPath:
              "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)",
          }}
        >
          {pending ? "Saving…" : "Save communication"}
        </button>
      </form>
    </div>
  );
}
