"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import type { DotaVerifyResult, FindRecentDotaResult } from "@/actions/matchActions";
import {
  findRecentDotaMatch,
  submitDotaMatchId,
} from "@/actions/matchActions";
import type { Locale } from "@/lib/i18n";

const INITIAL_VERIFY: DotaVerifyResult = { ok: false, message: "" };
const INITIAL_FIND: FindRecentDotaResult = { ok: false, message: "" };

type DotaMatchIdFormMessages = {
  confidence: {
    high: string;
    medium: string;
    rejected: string;
  };
  checks: {
    na: string;
    pass: string;
    fail: string;
    uniqueMatchId: string;
    lobbyType: string;
    timeWindow: string;
    teamALinked: string;
    teamBLinked: string;
    winnerMapped: string;
  };
  instructionLead: string;
  instructionMatchId: string;
  instructionRest: string;
  currentMatchId: string;
  searchPending: string;
  searchRecent: string;
  minutesAgo: string;
  coverageSummary: string;
  matchIdLabel: string;
  submitPending: string;
  submit: string;
};

const dotaMatchIdFormMessages: Record<Locale, DotaMatchIdFormMessages> = {
  en: {
    confidence: {
      high: "High confidence",
      medium: "Medium — admin review",
      rejected: "Rejected",
    },
    checks: {
      na: "N/A",
      pass: "✓ Pass",
      fail: "✕ Fail",
      uniqueMatchId: "Unique match ID in tournament",
      lobbyType: "Valid lobby type (private / tournament / team)",
      timeWindow: "Match within time window",
      teamALinked: "Team A linked players ({percent}%)",
      teamBLinked: "Team B linked players ({percent}%)",
      winnerMapped: "Winner identified",
    },
    instructionLead: "After your Dota 2 lobby ends, paste the",
    instructionMatchId: "Match ID",
    instructionRest:
      "from the post-game screen or from dotabuff.com. The lobby must be a private, tournament, or team match — public matchmaking is rejected. Results are verified against linked Steam accounts.",
    currentMatchId: "Current match ID:",
    searchPending: "Searching...",
    searchRecent: "↺ Find Recent Dota 2 Match",
    minutesAgo: "{minutes}m ago",
    coverageSummary: "A:{teamA}% B:{teamB}%",
    matchIdLabel: "Dota 2 Match ID",
    submitPending: "Verifying...",
    submit: "Verify & Submit",
  },
  ar: {
    confidence: {
      high: "ثقة عالية",
      medium: "ثقة متوسطة - مراجعة المشرف",
      rejected: "مرفوض",
    },
    checks: {
      na: "غير متاح",
      pass: "✓ ناجح",
      fail: "✕ فشل",
      uniqueMatchId: "معرّف مباراة فريد في البطولة",
      lobbyType: "نوع صالة صالح (خاصة / بطولة / فريق)",
      timeWindow: "المباراة ضمن الإطار الزمني",
      teamALinked: "لاعبو الفريق A المرتبطون ({percent}%)",
      teamBLinked: "لاعبو الفريق B المرتبطون ({percent}%)",
      winnerMapped: "تم تحديد الفائز",
    },
    instructionLead: "بعد انتهاء صالة Dota 2، الصق",
    instructionMatchId: "معرّف المباراة",
    instructionRest:
      "من شاشة ما بعد المباراة أو من dotabuff.com. يجب أن تكون الصالة خاصة أو بطولة أو مباراة فريق، وسيتم رفض المباريات العامة. يتم التحقق من النتائج عبر حسابات Steam المرتبطة.",
    currentMatchId: "معرّف المباراة الحالي:",
    searchPending: "جارٍ البحث...",
    searchRecent: "↺ البحث عن مباراة Dota 2 حديثة",
    minutesAgo: "قبل {minutes} د",
    coverageSummary: "أ:{teamA}% ب:{teamB}%",
    matchIdLabel: "معرّف مباراة Dota 2",
    submitPending: "جارٍ التحقق...",
    submit: "تحقق وأرسل",
  },
};

function ConfidenceBadge({
  confidence,
  labels,
}: {
  confidence?: string;
  labels: DotaMatchIdFormMessages["confidence"];
}) {
  if (!confidence) return null;
  const styles: Record<
    string,
    { label: string; color: string; border: string; bg: string }
  > = {
    high: {
      label: labels.high,
      color: "var(--asc-green)",
      border: "var(--asc-green-border)",
      bg: "var(--asc-green-bg)",
    },
    medium: {
      label: labels.medium,
      color: "var(--asc-amber)",
      border: "var(--asc-amber-border)",
      bg: "var(--asc-amber-bg)",
    },
    rejected: {
      label: labels.rejected,
      color: "var(--asc-live)",
      border: "var(--asc-live-border)",
      bg: "var(--asc-live-bg)",
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
  labels,
}: {
  label: string;
  pass: boolean;
  na?: boolean;
  labels: DotaMatchIdFormMessages["checks"];
}) {
  if (na) {
    return (
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "var(--asc-fg-3)" }}>{label}</span>
        <span style={{ color: "var(--asc-fg-3)" }}>{labels.na}</span>
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
        {pass ? labels.pass : labels.fail}
      </span>
    </div>
  );
}

type Props = {
  matchId: string;
  gameNumber: number;
  isAdmin: boolean;
  isParticipant: boolean;
  locale: Locale;
  currentExternalMatchId?: string | null;
};

export default function DotaMatchIdForm({
  matchId,
  gameNumber,
  isAdmin,
  isParticipant,
  locale,
  currentExternalMatchId,
}: Props) {
  const messages = dotaMatchIdFormMessages[locale];
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
        {messages.instructionLead}{" "}
        <strong style={{ color: "var(--asc-fg-2)" }}>
          {messages.instructionMatchId}
        </strong>{" "}
        {messages.instructionRest}
      </p>

      {currentExternalMatchId && (
        <div
          className="border px-3 py-2 text-xs"
          style={{
            borderColor: "var(--asc-line-soft)",
            background: "var(--asc-bg-2)",
          }}
        >
          <span style={{ color: "var(--asc-fg-3)" }}>
            {messages.currentMatchId}{" "}
          </span>
          <span className="font-mono font-black" style={{ color: "var(--asc-fg-1)" }}>
            {currentExternalMatchId}
          </span>
        </div>
      )}

      {/* Admin: find recent matches */}
      {isAdmin && (
        <form action={findAction}>
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="locale" value={locale} />
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
            {findPending ? messages.searchPending : messages.searchRecent}
          </button>
        </form>
      )}

      {/* Find results */}
      {findState.message && (
        <div
          className="border px-3 py-2 text-xs"
          style={{
            borderColor: findState.ok
              ? "var(--asc-green-border)"
              : "var(--asc-live-border)",
            background: findState.ok
              ? "var(--asc-green-bg)"
              : "var(--asc-live-bg)",
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
                        ? "var(--asc-accent-border-strong)"
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
                    {messages.minutesAgo.replace(
                      "{minutes}",
                      String(c.minutesAgo),
                    )}{" "}
                    ·{" "}
                    {messages.coverageSummary
                      .replace("{teamA}", String(c.teamACoverage))
                      .replace("{teamB}", String(c.teamBCoverage))}
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
          <input type="hidden" name="locale" value={locale} />

          <div>
            <label
              htmlFor={`dota-match-id-${matchId}-${gameNumber}`}
              className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {messages.matchIdLabel}
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
              borderColor: "var(--asc-accent-border)",
              background: "var(--asc-accent-dim)",
              color: "var(--asc-accent)",
            }}
          >
            {verifyPending ? messages.submitPending : messages.submit}
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
                ? "var(--asc-live-border)"
                : verifyState.confidence === "medium"
                  ? "oklch(0.65 0.14 75 / 0.4)"
                  : "var(--asc-green-border)",
            background:
              verifyState.confidence === "rejected" || !verifyState.ok
                ? "oklch(0.25 0.18 25 / 0.10)"
                : verifyState.confidence === "medium"
                  ? "oklch(0.25 0.12 75 / 0.10)"
                  : "var(--asc-green-bg)",
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
            <ConfidenceBadge
              confidence={verifyState.confidence}
              labels={messages.confidence}
            />
          </div>

          {verifyState.checks && (
            <div className="mt-3 grid gap-1.5">
              <CheckRow
                label={messages.checks.uniqueMatchId}
                pass={Boolean(verifyState.checks.uniqueMatchId)}
                labels={messages.checks}
              />
              <CheckRow
                label={messages.checks.lobbyType}
                pass={Boolean(verifyState.checks.lobbyType)}
                labels={messages.checks}
              />
              <CheckRow
                label={messages.checks.timeWindow}
                pass={Boolean(verifyState.checks.timeWindow)}
                na={verifyState.checks.timeWindow === null}
                labels={messages.checks}
              />
              <CheckRow
                label={messages.checks.teamALinked.replace(
                  "{percent}",
                  String(verifyState.checks.teamACoverage),
                )}
                pass={Number(verifyState.checks.teamACoverage) >= 40}
                labels={messages.checks}
              />
              <CheckRow
                label={messages.checks.teamBLinked.replace(
                  "{percent}",
                  String(verifyState.checks.teamBCoverage),
                )}
                pass={Number(verifyState.checks.teamBCoverage) >= 40}
                labels={messages.checks}
              />
              <CheckRow
                label={messages.checks.winnerMapped}
                pass={Boolean(verifyState.checks.winnerMapped)}
                labels={messages.checks}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
