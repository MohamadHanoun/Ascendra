"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createTournamentInline } from "@/actions/adminTournamentInlineActions";
import AdminTournamentImageFields from "@/components/AdminTournamentImageFields";

type GameOption = {
  slug: string;
  name: string;
  defaultTeamSize: number;
  defaultSubstitutes: number;
};

// Fields that can be pre-filled from a duplicate source.
// Dates and status are intentionally excluded — the admin always sets those fresh.
export type TournamentDefaultValues = {
  title: string;
  gameSlug: string;
  imageUrl: string;
  description: string;
  prize: string;
  format: string;
  bestOf: number;
  maxTeams: number;
  minTeams: number;
  teamSize: number;
  substitutesAllowed: number;
  region: string;
  platform: string;
  visibility: string;
};

type AdminTournamentWizardProps = {
  games: GameOption[];
  defaultValues?: TournamentDefaultValues;
};

type ReviewSnapshot = {
  title: string;
  game: string;
  prize: string;
  format: string;
  maxTeams: string;
  minTeams: string;
  teamSize: string;
  substitutes: string;
  status: string;
  registrationStatus: string;
};

const tournamentStatuses = [
  { value: "upcoming", label: "Upcoming" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

const registrationStatuses = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const tournamentFormats = [
  { value: "single_elimination", label: "Single Elimination", supported: true },
  { value: "double_elimination", label: "Double Elimination (Coming Soon)", supported: false },
  { value: "round_robin", label: "Round Robin (Coming Soon)", supported: false },
  { value: "swiss", label: "Swiss (Coming Soon)", supported: false },
  { value: "group_stage", label: "Group Stage (Coming Soon)", supported: false },
];

const platforms = ["PC", "Console", "Mobile", "Cross-platform"];

const STEPS = [
  { number: 1, label: "Basics" },
  { number: 2, label: "Competitive setup" },
  { number: 3, label: "Review & publish" },
];

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

const btnClipPath =
  "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-xs font-black uppercase tracking-[0.12em]"
      style={{ color: "var(--asc-fg-3)" }}
    >
      {children}
    </span>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className="flex items-baseline justify-between gap-4 py-2"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <span
        className="shrink-0 text-xs font-black uppercase tracking-[0.12em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {label}
      </span>
      <span
        className="text-right text-sm font-bold"
        style={{ color: value ? "var(--asc-fg-0)" : "var(--asc-fg-3)" }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

export default function AdminTournamentWizard({
  games,
  defaultValues,
}: AdminTournamentWizardProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const isDuplicate = Boolean(defaultValues);

  // Controlled fields: initialize from defaultValues when duplicating
  const [step, setStep] = useState(1);
  const [justAdvanced, setJustAdvanced] = useState(false);
  const [teamSize, setTeamSize] = useState(defaultValues?.teamSize ?? 5);
  const [substitutes, setSubstitutes] = useState(
    defaultValues?.substitutesAllowed ?? 0,
  );
  const [review, setReview] = useState<ReviewSnapshot | null>(null);

  function handleGameChange(game: GameOption | undefined) {
    if (game) {
      setTeamSize(game.defaultTeamSize);
      setSubstitutes(game.defaultSubstitutes);
    }
  }

  function captureReview() {
    const form = formRef.current;
    if (!form) return;

    const data = new FormData(form);
    const gameSlug = String(data.get("gameSlug") || "");
    const formatValue = String(data.get("format") || "single_elimination");
    const statusValue = String(data.get("status") || "upcoming");
    const regStatusValue = String(
      data.get("registrationStatus") || "closed",
    );

    setReview({
      title: String(data.get("title") || ""),
      game: games.find((g) => g.slug === gameSlug)?.name || gameSlug || "—",
      prize: String(data.get("prize") || ""),
      format:
        tournamentFormats.find((f) => f.value === formatValue)?.label ||
        formatValue,
      maxTeams: String(data.get("maxTeams") || ""),
      minTeams: String(data.get("minTeams") || "2"),
      teamSize: String(teamSize),
      substitutes: String(substitutes),
      status:
        tournamentStatuses.find((s) => s.value === statusValue)?.label ||
        statusValue,
      registrationStatus:
        registrationStatuses.find((s) => s.value === regStatusValue)?.label ||
        regStatusValue,
    });
  }

  function goNext() {
    if (step === 2) {
      captureReview();
      setJustAdvanced(true);
      window.setTimeout(() => setJustAdvanced(false), 300);
    }

    setStep((s) => s + 1);
  }

  function goBack() {
    setNotice(null);
    setStep((s) => s - 1);
  }

  function runCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createTournamentInline(formData);
      setNotice(result);

      if (result.ok) {
        formRef.current?.reset();
        setStep(1);
        // On reset, restore controlled fields to the defaults for this session
        setTeamSize(defaultValues?.teamSize ?? 5);
        setSubstitutes(defaultValues?.substitutesAllowed ?? 0);
        setReview(null);

        window.setTimeout(() => {
          router.refresh();
        }, 450);
      }
    });
  }

  function handleCreateClick() {
    if (step !== 3) return;
    if (pending) return;
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    runCreate(formData);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    return;
  }

  return (
    <details
      open={isDuplicate}
      className="group overflow-hidden border shadow-xl shadow-black/15"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
      }}
    >
      {/* ── Header ── */}
      <summary
        className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 transition hover:bg-white/[0.025] md:flex-row md:items-center md:justify-between"
        style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
          <p
            className="text-xs font-black uppercase tracking-[0.16em]"
            style={{ color: "var(--asc-accent)" }}
          >
            Tournament setup
          </p>

          {isDuplicate && (
            <span
              className="border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]"
              style={{
                borderColor: "var(--asc-amber-border)",
                background: "var(--asc-amber-bg)",
                color: "var(--asc-amber)",
              }}
            >
              Duplicate
            </span>
          )}
          </div>

        <h2
          className="mt-1 text-lg font-black"
          style={{ color: "var(--asc-fg-0)" }}
        >
          {isDuplicate ? "Duplicate tournament" : "Create tournament"}
        </h2>

        {isDuplicate && (
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--asc-fg-3)" }}
          >
            Pre-filled from an existing tournament — add dates before
            publishing.
          </p>
        )}
        {!isDuplicate && (
          <p
            className="mt-1 max-w-2xl text-sm leading-6"
            style={{ color: "var(--asc-fg-3)" }}
          >
            Open this panel only when you need to create a new tournament.
          </p>
        )}
        </div>

        <span
          className="inline-flex w-fit items-center border px-4 py-2 text-xs font-black uppercase tracking-[0.1em]"
          style={{
            borderColor: "var(--asc-accent-border)",
            background: "var(--asc-accent-dim)",
            color: "var(--asc-accent)",
          }}
        >
          <span className="group-open:hidden">Open form</span>
          <span className="hidden group-open:inline">Hide form</span>
        </span>
      </summary>

      {/* ── Step progress bar ── */}
      <div
        className="flex"
        style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
      >
        {STEPS.map((s, idx) => {
          const done = step > s.number;
          const active = step === s.number;

          return (
            <div
              key={s.number}
              className="flex flex-1 items-center gap-2.5 px-5 py-3"
              style={{
                borderRight:
                  idx < STEPS.length - 1
                    ? "1px solid var(--asc-line-soft)"
                    : undefined,
                borderBottom: active
                  ? "2px solid var(--asc-accent)"
                  : "2px solid transparent",
              }}
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center text-xs font-black"
                style={{
                  border: `1.5px solid ${done || active ? "var(--asc-accent)" : "var(--asc-line-soft)"}`,
                  background: done
                    ? "var(--asc-accent-2)"
                    : active
                      ? "var(--asc-accent-dim)"
                      : "transparent",
                  color:
                    done || active ? "var(--asc-accent)" : "var(--asc-fg-3)",
                }}
              >
                {done ? "✓" : s.number}
              </span>

              <span
                className="text-xs font-black uppercase tracking-[0.1em]"
                style={{
                  color: active
                    ? "var(--asc-fg-0)"
                    : done
                      ? "var(--asc-fg-2)"
                      : "var(--asc-fg-3)",
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Form ── */}
      <form ref={formRef} onSubmit={handleSubmit} className="p-5">
        {/* ────────────────────────────────────────────────
            Step 1 — Basics
            Fields are kept in the DOM on other steps so
            FormData captures them on final submit.
        ──────────────────────────────────────────────── */}
        <div
          className="grid gap-5"
          style={{ display: step === 1 ? undefined : "none" }}
        >
          <label className="grid gap-2">
            <FieldLabel>Title</FieldLabel>
            <input
              name="title"
              required
              defaultValue={defaultValues?.title ?? ""}
              placeholder="Example: Ascendra Valorant Cup"
              className="border px-4 py-3 outline-none transition"
              style={inputStyle}
            />
          </label>

          <AdminTournamentImageFields
            games={games}
            defaultGameSlug={defaultValues?.gameSlug}
            defaultImageUrl={defaultValues?.imageUrl}
            onGameChange={handleGameChange}
          />

          <label className="grid gap-2">
            <FieldLabel>Description</FieldLabel>
            <textarea
              name="description"
              required
              defaultValue={defaultValues?.description ?? ""}
              placeholder="Write a clear tournament description..."
              className="min-h-24 resize-y border px-4 py-3 text-sm leading-6 outline-none transition"
              style={inputStyle}
            />
          </label>

          <label className="grid gap-2">
            <FieldLabel>Prize</FieldLabel>
            <input
              name="prize"
              defaultValue={defaultValues?.prize ?? ""}
              placeholder="Example: $1,250"
              className="border px-4 py-3 outline-none transition"
              style={inputStyle}
            />
          </label>
        </div>

        {/* ────────────────────────────────────────────────
            Step 2 — Competitive setup
        ──────────────────────────────────────────────── */}
        <div
          className="grid gap-5"
          style={{ display: step === 2 ? undefined : "none" }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel>Format</FieldLabel>
              <select
                name="format"
                defaultValue={defaultValues?.format ?? "single_elimination"}
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              >
                {tournamentFormats.map((f) => (
                  <option key={f.value} value={f.value} disabled={!f.supported}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <FieldLabel>Best of</FieldLabel>
              <select
                name="bestOf"
                defaultValue={String(defaultValues?.bestOf ?? 1)}
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              >
                {[1, 3, 5, 7].map((n) => (
                  <option key={n} value={n}>
                    BO{n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel>Max teams</FieldLabel>
              <input
                name="maxTeams"
                type="number"
                min="1"
                required
                defaultValue={
                  defaultValues?.maxTeams
                    ? String(defaultValues.maxTeams)
                    : undefined
                }
                placeholder="16"
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Min teams</FieldLabel>
              <input
                name="minTeams"
                type="number"
                min="1"
                defaultValue={String(defaultValues?.minTeams ?? 2)}
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel>Team size</FieldLabel>
              <input
                name="teamSize"
                type="number"
                min="1"
                required
                value={teamSize}
                onChange={(e) =>
                  setTeamSize(Math.max(1, Number(e.target.value) || 1))
                }
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Substitutes per team</FieldLabel>
              <input
                name="substitutesAllowed"
                type="number"
                min="0"
                value={substitutes}
                onChange={(e) =>
                  setSubstitutes(Math.max(0, Number(e.target.value) || 0))
                }
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2">
              <FieldLabel>Region</FieldLabel>
              <input
                name="region"
                defaultValue={defaultValues?.region ?? ""}
                placeholder="e.g. MENA, EU, NA"
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Platform</FieldLabel>
              <select
                name="platform"
                defaultValue={defaultValues?.platform ?? ""}
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              >
                <option value="">No platform</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <FieldLabel>Visibility</FieldLabel>
              <select
                name="visibility"
                defaultValue={defaultValues?.visibility ?? "public"}
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel>Tournament status</FieldLabel>
              <select
                name="status"
                required
                defaultValue="upcoming"
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              >
                {tournamentStatuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <FieldLabel>Registration status</FieldLabel>
              <select
                name="registrationStatus"
                required
                defaultValue="closed"
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              >
                {registrationStatuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* ────────────────────────────────────────────────
            Step 3 — Review & publish
        ──────────────────────────────────────────────── */}
        <div
          className="grid gap-5"
          style={{ display: step === 3 ? undefined : "none" }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel>Start date</FieldLabel>
              <input
                name="startsAt"
                type="datetime-local"
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>End date</FieldLabel>
              <input
                name="endsAt"
                type="datetime-local"
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel>Registration opens</FieldLabel>
              <input
                name="registrationOpensAt"
                type="datetime-local"
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Registration closes</FieldLabel>
              <input
                name="registrationClosesAt"
                type="datetime-local"
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              />
            </label>
          </div>

          {/* Review summary card */}
          {review && (
            <div
              className="border p-4"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-table-head-bg)",
              }}
            >
              <p
                className="mb-3 text-xs font-black uppercase tracking-[0.16em]"
                style={{ color: "var(--asc-accent)" }}
              >
                Summary
              </p>

              <ReviewRow label="Title" value={review.title} />
              <ReviewRow label="Game" value={review.game} />
              <ReviewRow label="Prize" value={review.prize} />
              <ReviewRow label="Format" value={review.format} />
              <ReviewRow
                label="Slots"
                value={
                  review.maxTeams
                    ? `${review.minTeams} – ${review.maxTeams} teams`
                    : null
                }
              />
              <ReviewRow
                label="Roster"
                value={`${review.teamSize} players + ${review.substitutes} subs`}
              />
              <ReviewRow label="Status" value={review.status} />
              <ReviewRow
                label="Registration"
                value={review.registrationStatus}
              />
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                disabled={pending}
                className="border px-4 py-2 text-sm font-black transition hover:opacity-90 disabled:opacity-50"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  color: "var(--asc-fg-3)",
                  background: "transparent",
                  clipPath: btnClipPath,
                }}
              >
                ← Back
              </button>
            )}
          </div>

          <div>
            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="px-4 py-2 text-sm font-black transition hover:opacity-90"
                style={{
                  background: "var(--asc-accent-2)",
                  color: "var(--asc-on-accent)",
                  boxShadow: "0 0 20px var(--asc-accent-glow)",
                  clipPath: btnClipPath,
                }}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreateClick}
                disabled={pending || justAdvanced}
                className="px-4 py-2 text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: "var(--asc-accent-2)",
                  color: "var(--asc-on-accent)",
                  boxShadow: "0 0 20px var(--asc-accent-glow)",
                  clipPath: btnClipPath,
                }}
              >
                {pending
                  ? isDuplicate
                    ? "Duplicating..."
                    : "Creating..."
                  : isDuplicate
                    ? "Create duplicate"
                    : "Create tournament"}
              </button>
            )}
          </div>
        </div>

        {/* Submit result notice */}
        {notice && (
          <div
            className="mt-4 border px-4 py-3 text-sm font-bold"
            style={
              notice.ok
                ? {
                    borderColor: "var(--asc-green-border)",
                    background: "var(--asc-green-bg)",
                    color: "var(--asc-green)",
                  }
                : {
                    borderColor: "var(--asc-live-border)",
                    background: "var(--asc-live-bg)",
                    color: "var(--asc-live)",
                  }
            }
          >
            {notice.message}
          </div>
        )}
      </form>
    </details>
  );
}
