"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import type { DotaVerifyResult, FindRecentDotaResult } from "@/actions/matchActions";
import {
  findRecentDotaMatch,
  submitDotaMatchId,
} from "@/actions/matchActions";

const INITIAL_VERIFY: DotaVerifyResult = { ok: false, message: "" };
const INITIAL_FIND: FindRecentDotaResult = { ok: false, message: "" };

function ConfidenceBadge({ confidence }: { confidence?: string }) {
  if (!confidence) return null;
  const styles: Record<
    string,
    { label: string; color: string; border: string; bg: string }
  > = {
    high: {
      label: "High confidence",
      color: "var(--asc-green)",
      border: "oklch(0.55 0.14 150 / 0.5)",
      bg: "oklch(0.25 0.12 150 / 0.18)",
    },
    medium: {
      label: "Medium — admin review",
      color: "var(--asc-amber)",
      border: "oklch(0.65 0.14 75 / 0.5)",
      bg: "oklch(0.25 0.12 75 / 0.18)",
    },
    rejected: {
      label: "Rejected",
      color: "var(--asc-live)",
      border: "oklch(0.50 0.20 25 / 0.5)",
      bg: "oklch(0.25 0.18 25 / 0.18)",
    },
  };
  const s = styles[confidence];
  if (!s) return null;
  return (
    <span
      className="border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.10em]"
      style={{ color: s.color, borderColor: s.border, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

function CheckRow({
  label,
  pass,
  na,
}: {
  label: string;
  pass: boolean;
  na?: boolean;
}) {
  if (na) {
    return (
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "var(--asc-fg-3)" }}>{label}</span>
        <span style={{ color: "var(--asc-fg-3)" }}>N/A</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between text-xs">
      <span style={{ color: "var(--asc-fg-2)" }}>{label}</span>
      <span
        className="font-black"
        style={{ color: pass ? "var(--asc-green)" : "var(--asc-live)" }}
      >
        {pass ? "✓ Pass" : "✗ Fail"}
      </span>
    </div>
  );
}

type Props = {
  matchId: string;
  gameNumber: number;
  isAdmin: boolean;
  isParticipant: boolean;
  currentExternalMatchId?: string | null;
};

export default function DotaMatchIdForm({
  matchId,
  gameNumber,
  isAdmin,
  isParticipant,
  currentExternalMatchId,
}: Props) {
  const [verifyState, verifyAction, verifyPending] = useActionState(
    submitDotaMatchId,
    INITIAL_VERIFY,
  );
  const [findState, findAction, findPending] = useActionState(
    findRecentDotaMatch,
    INITIAL_FIND,
  );

  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!selectedCandidate) return;
    const input = formRef.current?.querySelector<HTMLInputElement>(
      'input[name="dotaMatchId"]',
    );
    if (input) input.value = selectedCandidate;
  }, [selectedCandidate]);

  const canSubmit = isParticipant || isAdmin;

  return (
    <div className="grid gap-4">
      <p className="text-xs leading-5" style={{ color: "var(--asc-fg-3)" }}>
        After your Dota 2 lobby ends, paste the{" "}
        <strong style={{ color: "var(--asc-fg-2)" }}>Match ID</strong> from the
        post-game screen or from dotabuff.com. The lobby must be a private,
        tournament, or team match — public matchmaking is rejected. Results are
        verified against linked Steam accounts.
      </p>

      {currentExternalMatchId && (
        <div
          className="border px-3 py-2 text-xs"
          style={{
            borderColor: "var(--asc-line-soft)",
            background: "var(--asc-bg-2)",
          }}
        >
          <span style={{ color: "var(--asc-fg-3)" }}>Current match ID: </span>
          <span className="font-mono font-black" style={{ color: "var(--asc-fg-1)" }}>
            {currentExternalMatchId}
          </span>
        </div>
      )}

      {/* Admin: find recent matches */}
      {isAdmin && (
        <form action={findAction}>
          <input type="hidden" name="matchId" value={matchId} />
          <button
            type="submit"
            disabled={findPending}
            className="border px-4 py-2 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-80 disabled:opacity-40"
            style={{
              borderColor: "var(--asc-line-soft)",
              background: "transparent",
              color: "var(--asc-fg-2)",
            }}
          >
            {findPending ? "Searching…" : "↺ Find Recent Dota 2 Match"}
          </button>
        </form>
      )}

      {/* Find results */}
      {findState.message && (
        <div
          className="border px-3 py-2 text-xs"
          style={{
            borderColor: findState.ok
              ? "oklch(0.55 0.14 150 / 0.4)"
              : "oklch(0.50 0.20 25 / 0.4)",
            background: findState.ok
              ? "oklch(0.25 0.12 150 / 0.12)"
              : "oklch(0.25 0.18 25 / 0.12)",
          }}
        >
          <p
            className="font-black"
            style={{
              color: findState.ok ? "var(--asc-green)" : "var(--asc-live)",
            }}
          >
            {findState.message}
          </p>
          {findState.candidates && findState.candidates.length > 0 && (
            <div className="mt-2 grid gap-1">
              {findState.candidates.map((c) => (
                <button
                  key={c.dotaMatchId}
                  type="button"
                  onClick={() => setSelectedCandidate(c.dotaMatchId)}
                  className="flex w-full items-center justify-between border px-3 py-2 text-left transition hover:opacity-80"
                  style={{
                    borderColor:
                      selectedCandidate === c.dotaMatchId
                        ? "oklch(0.50 0.20 285 / 0.5)"
                        : "var(--asc-line-soft)",
                    background:
                      selectedCandidate === c.dotaMatchId
                        ? "var(--asc-accent-dim)"
                        : "var(--asc-bg-1)",
                  }}
                >
                  <span
                    className="font-mono text-[10px] font-black"
                    style={{ color: "var(--asc-accent)" }}
                  >
                    {c.dotaMatchId}
                  </span>
                  <span style={{ color: "var(--asc-fg-3)" }}>
                    {c.minutesAgo}m ago · A:{c.teamACoverage}% B:{c.teamBCoverage}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit form */}
      {canSubmit && (
        <form ref={formRef} action={verifyAction} className="grid gap-3">
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="gameNumber" value={gameNumber} />

          <div>
            <label
              htmlFor={`dota-match-id-${matchId}-${gameNumber}`}
              className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              Dota 2 Match ID
            </label>
            <input
              id={`dota-match-id-${matchId}-${gameNumber}`}
              name="dotaMatchId"
              type="text"
              placeholder="e.g. 8012345678"
              defaultValue={selectedCandidate || currentExternalMatchId || ""}
              className="w-full border bg-transparent px-3 py-2 font-mono text-sm"
              style={{
                borderColor: "var(--asc-line-soft)",
                color: "var(--asc-fg-0)",
                outline: "none",
              }}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <button
            type="submit"
            disabled={verifyPending}
            className="border px-5 py-2.5 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-80 disabled:opacity-40"
            style={{
              borderColor: "oklch(0.50 0.20 285 / 0.4)",
              background: "var(--asc-accent-dim)",
              color: "var(--asc-accent)",
            }}
          >
            {verifyPending ? "Verifying…" : "Verify & Submit"}
          </button>
        </form>
      )}

      {/* Verification result */}
      {verifyState.message && (
        <div
          className="border p-3"
          style={{
            borderColor:
              verifyState.confidence === "rejected" || !verifyState.ok
                ? "oklch(0.50 0.20 25 / 0.4)"
                : verifyState.confidence === "medium"
                  ? "oklch(0.65 0.14 75 / 0.4)"
                  : "oklch(0.55 0.14 150 / 0.4)",
            background:
              verifyState.confidence === "rejected" || !verifyState.ok
                ? "oklch(0.25 0.18 25 / 0.10)"
                : verifyState.confidence === "medium"
                  ? "oklch(0.25 0.12 75 / 0.10)"
                  : "oklch(0.25 0.12 150 / 0.10)",
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="text-xs font-black"
              style={{
                color:
                  verifyState.confidence === "rejected" || !verifyState.ok
                    ? "var(--asc-live)"
                    : verifyState.confidence === "medium"
                      ? "var(--asc-amber)"
                      : "var(--asc-green)",
              }}
            >
              {verifyState.message}
            </p>
            <ConfidenceBadge confidence={verifyState.confidence} />
          </div>

          {verifyState.checks && (
            <div className="mt-3 grid gap-1.5">
              <CheckRow
                label="Unique match ID in tournament"
                pass={Boolean(verifyState.checks.uniqueMatchId)}
              />
              <CheckRow
                label="Valid lobby type (private / tournament / team)"
                pass={Boolean(verifyState.checks.lobbyType)}
              />
              <CheckRow
                label="Match within time window"
                pass={Boolean(verifyState.checks.timeWindow)}
                na={verifyState.checks.timeWindow === null}
              />
              <CheckRow
                label={`Team A linked players (${verifyState.checks.teamACoverage}%)`}
                pass={Number(verifyState.checks.teamACoverage) >= 40}
              />
              <CheckRow
                label={`Team B linked players (${verifyState.checks.teamBCoverage}%)`}
                pass={Number(verifyState.checks.teamBCoverage) >= 40}
              />
              <CheckRow
                label="Winner identified"
                pass={Boolean(verifyState.checks.winnerMapped)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
