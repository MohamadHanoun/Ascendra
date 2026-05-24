"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { AdminMatchActionResult } from "@/actions/adminMatchActions";
import {
  confirmMatchResult,
  createMatch,
  deleteMatch,
  updateMatchScore,
  updateMatchStatus,
} from "@/actions/adminMatchActions";

type MatchTeam = { id: string; name: string };

type MatchRow = {
  id: string;
  round: number;
  matchNumber: number;
  teamAId: string | null;
  teamBId: string | null;
  teamA: MatchTeam | null;
  teamB: MatchTeam | null;
  scheduledAt: string | null;
  status: string;
  bestOf: number;
  scoreA: number;
  scoreB: number;
  winnerTeamId: string | null;
  confirmedByAdmin: boolean;
  notes: string | null;
};

type RegisteredTeam = { id: string; name: string };

type AdminMatchPanelProps = {
  tournamentId: string;
  matches: MatchRow[];
  registeredTeams: RegisteredTeam[];
};

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

const pillStyleMap: Record<string, React.CSSProperties> = {
  green: { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
  yellow: { color: "var(--asc-amber)", borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)" },
  red: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
  blue: { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" },
  gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
  violet: { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
};

function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "blue" | "gray" | "violet";
}) {
  return (
    <span className="inline-flex w-fit border px-2.5 py-0.5 text-xs font-black capitalize" style={pillStyleMap[tone]}>
      {children}
    </span>
  );
}

function Notice({ result }: { result: AdminMatchActionResult | null }) {
  if (!result) return null;

  return (
    <div
      className="border px-3 py-2 text-sm font-bold"
      style={
        result.ok
          ? { borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" }
          : { borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" }
      }
    >
      {result.message}
    </div>
  );
}

function matchStatusTone(status: string): "green" | "yellow" | "red" | "blue" | "gray" | "violet" {
  const map: Record<string, "green" | "yellow" | "red" | "blue" | "gray" | "violet"> = {
    live: "green",
    scheduled: "yellow",
    completed: "violet",
    cancelled: "gray",
    disputed: "red",
    pending: "gray",
  };
  return map[status] ?? "gray";
}

function formatScheduled(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
}

function AddMatchForm({
  tournamentId,
  registeredTeams,
}: {
  tournamentId: string;
  registeredTeams: RegisteredTeam[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<AdminMatchActionResult | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);

    startTransition(async () => {
      const result = await createMatch(formData);
      setNotice(result);

      if (result.ok) {
        formRef.current?.reset();
        window.setTimeout(() => router.refresh(), 450);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 p-4">
      <input type="hidden" name="tournamentId" value={tournamentId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Round</span>
          <input name="round" type="number" min="1" required placeholder="1" className="border px-4 py-3 text-sm text-white outline-none transition" style={inputStyle} />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Match #</span>
          <input name="matchNumber" type="number" min="1" required placeholder="1" className="border px-4 py-3 text-sm text-white outline-none transition" style={inputStyle} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Team A</span>
          <select name="teamAId" className="border px-4 py-3 text-sm text-white outline-none transition" style={inputStyle}>
            <option value="">— BYE / TBD —</option>
            {registeredTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Team B</span>
          <select name="teamBId" className="border px-4 py-3 text-sm text-white outline-none transition" style={inputStyle}>
            <option value="">— BYE / TBD —</option>
            {registeredTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Scheduled at</span>
          <input name="scheduledAt" type="datetime-local" className="border px-4 py-3 text-sm text-white outline-none transition" style={inputStyle} />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Best of</span>
          <select name="bestOf" defaultValue="1" className="border px-4 py-3 text-sm text-white outline-none transition" style={inputStyle}>
            {[1, 3, 5, 7].map((n) => (
              <option key={n} value={n}>BO{n}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Notes (optional)</span>
        <input name="notes" placeholder="Optional match notes" className="border px-4 py-3 text-sm text-white outline-none transition" style={inputStyle} />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "var(--asc-accent-2)" }}
        >
          {pending ? "Adding..." : "Add match"}
        </button>
      </div>

      <Notice result={notice} />
    </form>
  );
}

function MatchCard({
  match,
  registeredTeams,
}: {
  match: MatchRow;
  registeredTeams: RegisteredTeam[];
}) {
  const router = useRouter();
  const scoreFormRef = useRef<HTMLFormElement>(null);
  const statusFormRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [scoreNotice, setScoreNotice] = useState<AdminMatchActionResult | null>(null);
  const [statusNotice, setStatusNotice] = useState<AdminMatchActionResult | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<AdminMatchActionResult | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  function runScore() {
    if (!scoreFormRef.current) return;
    const formData = new FormData(scoreFormRef.current);

    startTransition(async () => {
      const result = await updateMatchScore(formData);
      setScoreNotice(result);
      if (result.ok) window.setTimeout(() => router.refresh(), 450);
    });
  }

  function runStatus() {
    if (!statusFormRef.current) return;
    const formData = new FormData(statusFormRef.current);

    startTransition(async () => {
      const result = await updateMatchStatus(formData);
      setStatusNotice(result);
      if (result.ok) window.setTimeout(() => router.refresh(), 450);
    });
  }

  function runConfirm() {
    const formData = new FormData();
    formData.set("matchId", match.id);

    startTransition(async () => {
      const result = await confirmMatchResult(formData);
      setScoreNotice(result);
      if (result.ok) window.setTimeout(() => router.refresh(), 450);
    });
  }

  function runDelete() {
    const formData = new FormData();
    formData.set("matchId", match.id);

    startTransition(async () => {
      const result = await deleteMatch(formData);
      setDeleteNotice(result);
      setConfirmDeleteOpen(false);
      if (result.ok) window.setTimeout(() => router.refresh(), 450);
    });
  }

  const teamAName = match.teamA?.name ?? "TBD";
  const teamBName = match.teamB?.name ?? "TBD";
  const scheduledStr = formatScheduled(match.scheduledAt);
  const scoreLabel = `${match.scoreA}–${match.scoreB}`;

  const winnerOptions = [
    ...(match.teamA && match.teamAId ? [{ id: match.teamAId, name: match.teamA.name }] : []),
    ...(match.teamB && match.teamBId ? [{ id: match.teamBId, name: match.teamB.name }] : []),
  ];

  return (
    <>
      <details className="group overflow-hidden border" style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.08 0.02 287)" }}>
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition hover:bg-white/[0.035]">
          <span className="w-10 shrink-0 text-center text-xs font-black uppercase tracking-[0.1em]" style={{ color: "var(--asc-fg-3)" }}>
            M{match.matchNumber}
          </span>

          <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
            <span className="truncate text-right font-black" style={{ color: "var(--asc-fg-0)" }}>{teamAName}</span>
            <span className="shrink-0 text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
              {match.status === "completed" ? scoreLabel : "vs"}
            </span>
            <span className="truncate font-black" style={{ color: "var(--asc-fg-0)" }}>{teamBName}</span>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Pill tone={matchStatusTone(match.status)}>{match.status}</Pill>
            {match.confirmedByAdmin && <Pill tone="green">Confirmed</Pill>}
            {scheduledStr && (
              <span className="hidden text-xs xl:block" style={{ color: "var(--asc-fg-3)" }}>{scheduledStr}</span>
            )}
          </div>

          <span
            className="grid h-7 w-7 shrink-0 place-items-center text-sm font-black transition group-open:rotate-45"
            style={{ border: "1px solid var(--asc-line-soft)", background: "oklch(0.09 0.02 287)", color: "var(--asc-fg-3)" }}
          >
            +
          </span>
        </summary>

        <div className="p-4" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
          <div className="grid gap-6">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                Score · BO{match.bestOf}
              </p>

              <form
                ref={scoreFormRef}
                onSubmit={(e) => { e.preventDefault(); runScore(); }}
                className="grid gap-3"
              >
                <input type="hidden" name="matchId" value={match.id} />

                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>{teamAName}</span>
                    <input name="scoreA" type="number" min="0" defaultValue={match.scoreA} className="border px-4 py-3 text-sm text-white outline-none transition" style={inputStyle} />
                  </label>

                  <span className="pb-3 text-center text-sm font-bold" style={{ color: "var(--asc-fg-3)" }}>vs</span>

                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>{teamBName}</span>
                    <input name="scoreB" type="number" min="0" defaultValue={match.scoreB} className="border px-4 py-3 text-sm text-white outline-none transition" style={inputStyle} />
                  </label>
                </div>

                {winnerOptions.length > 0 && (
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>Winner</span>
                    <select name="winnerTeamId" defaultValue={match.winnerTeamId ?? ""} className="border px-4 py-3 text-sm text-white outline-none transition" style={inputStyle}>
                      <option value="">No winner set</option>
                      {winnerOptions.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className="px-4 py-2 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: "var(--asc-accent-2)" }}
                  >
                    {pending ? "Saving..." : "Update score"}
                  </button>

                  {match.status === "completed" && !match.confirmedByAdmin && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={runConfirm}
                      className="border px-4 py-2 text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ borderColor: "oklch(0.55 0.14 150 / 0.5)", color: "var(--asc-green)", background: "transparent" }}
                    >
                      Confirm result
                    </button>
                  )}
                </div>

                <Notice result={scoreNotice} />
              </form>
            </div>

            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>Status</p>

              <form
                ref={statusFormRef}
                onSubmit={(e) => { e.preventDefault(); runStatus(); }}
                className="flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="matchId" value={match.id} />

                <select name="status" defaultValue={match.status} className="w-auto border px-4 py-3 text-sm text-white outline-none transition" style={inputStyle}>
                  {["pending", "scheduled", "live", "completed", "cancelled"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={pending}
                  className="border px-4 py-2 text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-3)", background: "transparent" }}
                >
                  {pending ? "..." : "Set status"}
                </button>

                <Notice result={statusNotice} />
              </form>
            </div>

            <div className="pt-4" style={{ borderTop: "1px solid oklch(0.50 0.20 25 / 0.2)" }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={pending}
                className="border px-4 py-2 text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", color: "var(--asc-live)", background: "transparent" }}
              >
                Delete match
              </button>

              <Notice result={deleteNotice} />
            </div>
          </div>
        </div>
      </details>

      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden border shadow-2xl shadow-black/40" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
            <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
              <p className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-live)" }}>Danger</p>
              <h2 className="mt-2 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>Delete match?</h2>
              <p className="mt-2 leading-7" style={{ color: "var(--asc-fg-3)" }}>
                Delete R{match.round}·M{match.matchNumber} ({teamAName} vs {teamBName})? This cannot be undone.
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-3 p-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="border px-5 py-3 text-sm font-black transition"
                style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-3)", background: "transparent" }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={runDelete}
                disabled={pending}
                className="px-5 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "oklch(0.50 0.20 25)" }}
              >
                {pending ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminMatchPanel({
  tournamentId,
  matches,
  registeredTeams,
}: AdminMatchPanelProps) {
  const matchesByRound = matches.reduce<Record<number, MatchRow[]>>((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {});

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

  return (
    <div className="grid gap-5">
      <details className="group overflow-hidden border" style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.08 0.02 287)" }}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/[0.035]">
          <p className="text-sm font-black" style={{ color: "var(--asc-fg-3)" }}>Add match</p>
          <span
            className="grid h-7 w-7 place-items-center text-sm font-black transition group-open:rotate-45"
            style={{ border: "1px solid var(--asc-line-soft)", background: "oklch(0.09 0.02 287)", color: "var(--asc-fg-3)" }}
          >
            +
          </span>
        </summary>

        <div style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
          <AddMatchForm tournamentId={tournamentId} registeredTeams={registeredTeams} />
        </div>
      </details>

      {matches.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>No matches yet.</p>
      ) : (
        <div className="grid gap-6">
          {rounds.map((round) => (
            <div key={round}>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                Round {round}
              </p>

              <div className="grid gap-2">
                {matchesByRound[round].map((match) => (
                  <MatchCard key={match.id} match={match} registeredTeams={registeredTeams} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
