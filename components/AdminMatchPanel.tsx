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

// ─── Shared helpers ───────────────────────────────────────────────────────────

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400";
}

function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "blue" | "gray" | "violet";
}) {
  const styles = {
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    yellow: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    red: "border-red-400/25 bg-red-500/10 text-red-300",
    blue: "border-blue-400/25 bg-blue-500/10 text-blue-300",
    gray: "border-white/10 bg-white/5 text-gray-300",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-xs font-black capitalize ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function Notice({ result }: { result: AdminMatchActionResult | null }) {
  if (!result) return null;

  return (
    <div
      className={`rounded-xl border px-3 py-2 text-sm font-bold ${
        result.ok
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
          : "border-red-400/25 bg-red-500/10 text-red-300"
      }`}
    >
      {result.message}
    </div>
  );
}

function matchStatusTone(
  status: string,
): "green" | "yellow" | "red" | "blue" | "gray" | "violet" {
  const map: Record<
    string,
    "green" | "yellow" | "red" | "blue" | "gray" | "violet"
  > = {
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

  return new Date(iso).toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ─── Add Match Form ───────────────────────────────────────────────────────────

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
          <span className="text-xs font-bold text-gray-400">Round</span>

          <input
            name="round"
            type="number"
            min="1"
            required
            placeholder="1"
            className={inputClass()}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-bold text-gray-400">Match #</span>

          <input
            name="matchNumber"
            type="number"
            min="1"
            required
            placeholder="1"
            className={inputClass()}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs font-bold text-gray-400">Team A</span>

          <select name="teamAId" className={inputClass()}>
            <option value="">— BYE / TBD —</option>

            {registeredTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-bold text-gray-400">Team B</span>

          <select name="teamBId" className={inputClass()}>
            <option value="">— BYE / TBD —</option>

            {registeredTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs font-bold text-gray-400">Scheduled at</span>

          <input
            name="scheduledAt"
            type="datetime-local"
            className={inputClass()}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-bold text-gray-400">Best of</span>

          <select name="bestOf" defaultValue="1" className={inputClass()}>
            {[1, 3, 5, 7].map((n) => (
              <option key={n} value={n}>
                BO{n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className="text-xs font-bold text-gray-400">
          Notes (optional)
        </span>

        <input
          name="notes"
          placeholder="Optional match notes"
          className={inputClass()}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add match"}
        </button>
      </div>

      <Notice result={notice} />
    </form>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────

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
  const [scoreNotice, setScoreNotice] = useState<AdminMatchActionResult | null>(
    null,
  );
  const [statusNotice, setStatusNotice] =
    useState<AdminMatchActionResult | null>(null);
  const [deleteNotice, setDeleteNotice] =
    useState<AdminMatchActionResult | null>(null);
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
    ...(match.teamA && match.teamAId
      ? [{ id: match.teamAId, name: match.teamA.name }]
      : []),
    ...(match.teamB && match.teamBId
      ? [{ id: match.teamBId, name: match.teamB.name }]
      : []),
  ];

  return (
    <>
      <details className="group overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition hover:bg-white/[0.035]">
          <span className="w-10 shrink-0 text-center text-xs font-black uppercase tracking-[0.1em] text-gray-500">
            M{match.matchNumber}
          </span>

          <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
            <span className="truncate text-right font-black text-white">
              {teamAName}
            </span>

            <span className="shrink-0 text-xs font-bold text-gray-500">
              {match.status === "completed" ? scoreLabel : "vs"}
            </span>

            <span className="truncate font-black text-white">{teamBName}</span>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Pill tone={matchStatusTone(match.status)}>{match.status}</Pill>

            {match.confirmedByAdmin && <Pill tone="green">Confirmed</Pill>}

            {scheduledStr && (
              <span className="hidden text-xs text-gray-500 xl:block">
                {scheduledStr}
              </span>
            )}
          </div>

          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/25 text-sm font-black text-gray-400 transition group-open:rotate-45">
            +
          </span>
        </summary>

        <div className="border-t border-white/10 p-4">
          <div className="grid gap-6">
            {/* Score */}
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                Score · BO{match.bestOf}
              </p>

              <form
                ref={scoreFormRef}
                onSubmit={(e) => {
                  e.preventDefault();
                  runScore();
                }}
                className="grid gap-3"
              >
                <input type="hidden" name="matchId" value={match.id} />

                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold text-gray-400">
                      {teamAName}
                    </span>

                    <input
                      name="scoreA"
                      type="number"
                      min="0"
                      defaultValue={match.scoreA}
                      className={inputClass()}
                    />
                  </label>

                  <span className="pb-3 text-center text-sm font-bold text-gray-600">
                    vs
                  </span>

                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold text-gray-400">
                      {teamBName}
                    </span>

                    <input
                      name="scoreB"
                      type="number"
                      min="0"
                      defaultValue={match.scoreB}
                      className={inputClass()}
                    />
                  </label>
                </div>

                {winnerOptions.length > 0 && (
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold text-gray-400">
                      Winner
                    </span>

                    <select
                      name="winnerTeamId"
                      defaultValue={match.winnerTeamId ?? ""}
                      className={inputClass()}
                    >
                      <option value="">No winner set</option>

                      {winnerOptions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pending ? "Saving..." : "Update score"}
                  </button>

                  {match.status === "completed" && !match.confirmedByAdmin && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={runConfirm}
                      className="rounded-xl border border-emerald-400/25 px-4 py-2 text-sm font-black text-emerald-300 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Confirm result
                    </button>
                  )}
                </div>

                <Notice result={scoreNotice} />
              </form>
            </div>

            {/* Status */}
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                Status
              </p>

              <form
                ref={statusFormRef}
                onSubmit={(e) => {
                  e.preventDefault();
                  runStatus();
                }}
                className="flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="matchId" value={match.id} />

                <select
                  name="status"
                  defaultValue={match.status}
                  className={`${inputClass()} w-auto`}
                >
                  {["pending", "scheduled", "live", "completed", "cancelled"].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ),
                  )}
                </select>

                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? "..." : "Set status"}
                </button>

                <Notice result={statusNotice} />
              </form>
            </div>

            {/* Delete */}
            <div className="border-t border-red-500/15 pt-4">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={pending}
                className="rounded-xl border border-red-500/25 px-4 py-2 text-sm font-black text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete match
              </button>

              <Notice result={deleteNotice} />
            </div>
          </div>
        </div>
      </details>

      {/* Delete confirmation modal */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#11121d] shadow-2xl shadow-black/40">
            <div className="border-b border-white/10 px-6 py-5">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-red-300">
                Danger
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Delete match?
              </h2>

              <p className="mt-2 leading-7 text-gray-300">
                Delete R{match.round}·M{match.matchNumber} ({teamAName} vs{" "}
                {teamBName})? This cannot be undone.
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-3 p-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={runDelete}
                disabled={pending}
                className="rounded-xl bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
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

// ─── Admin Match Panel ────────────────────────────────────────────────────────

export default function AdminMatchPanel({
  tournamentId,
  matches,
  registeredTeams,
}: AdminMatchPanelProps) {
  const matchesByRound = matches.reduce<Record<number, MatchRow[]>>(
    (acc, match) => {
      if (!acc[match.round]) acc[match.round] = [];
      acc[match.round].push(match);
      return acc;
    },
    {},
  );

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="grid gap-5">
      {/* Add match */}
      <details className="group overflow-hidden rounded-2xl border border-white/10 bg-black/10">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/[0.035]">
          <p className="text-sm font-black text-gray-300">Add match</p>

          <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-black/25 text-sm font-black text-gray-400 transition group-open:rotate-45">
            +
          </span>
        </summary>

        <div className="border-t border-white/10">
          <AddMatchForm
            tournamentId={tournamentId}
            registeredTeams={registeredTeams}
          />
        </div>
      </details>

      {/* Match list */}
      {matches.length === 0 ? (
        <p className="text-sm text-gray-500">No matches yet.</p>
      ) : (
        <div className="grid gap-6">
          {rounds.map((round) => (
            <div key={round}>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                Round {round}
              </p>

              <div className="grid gap-2">
                {matchesByRound[round].map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    registeredTeams={registeredTeams}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
