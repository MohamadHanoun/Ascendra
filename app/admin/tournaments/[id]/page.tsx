import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  closeTournamentRegistrationInline,
  deleteTournamentInline,
  openTournamentRegistrationInline,
  setTournamentCancelledInline,
  setTournamentClosedInline,
  setTournamentEndedInline,
  setTournamentOpenInline,
  setTournamentUpcomingInline,
  updateTournamentInline,
} from "@/actions/adminTournamentInlineActions";
import { auth } from "@/auth";
import AdminShell from "@/components/AdminShell";
import AdminTournamentImageFields from "@/components/AdminTournamentImageFields";
import AdminTournamentMatchPanel from "@/components/AdminTournamentMatchPanel";
import AdminTournamentResultsPanel from "@/components/AdminTournamentResultsPanel";
import InlineAdminTournamentForm from "@/components/InlineAdminTournamentForm";
import TournamentLifecycleRefresh from "@/components/TournamentLifecycleRefresh";
import { syncTournamentLifecycleForTournament } from "@/lib/jobs/tournamentLifecycleJobs";
import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Tournament | Ascendra",
  description: "Manage Ascendra tournament details, registration, and results.",
};

type ManageTournamentPageProps = {
  params: Promise<{ id: string }>;
};

type TournamentAction = (formData: FormData) => Promise<{
  ok: boolean;
  message: string;
  redirectTo?: string;
}>;

type RegistrationWithTeam = Prisma.TournamentRegistrationGetPayload<{
  include: { team: true };
}>;

type ResultWithTeam = Prisma.TournamentResultGetPayload<{
  include: { team: true };
}>;

const tournamentFormats = [
  { value: "single_elimination", label: "Single Elimination" },
  { value: "double_elimination", label: "Double Elimination" },
  { value: "round_robin", label: "Round Robin" },
  { value: "swiss", label: "Swiss" },
  { value: "group_stage", label: "Group Stage" },
];

const platforms = ["PC", "Console", "Mobile", "Cross-platform"];

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

function inputClass() {
  return "border px-4 py-3 outline-none transition";
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>{children}</span>;
}

function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "green" | "yellow" | "red" | "blue" | "gray" | "violet";
}) {
  const styleMap: Record<string, React.CSSProperties> = {
    green: { color: "var(--asc-green)", borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)" },
    yellow: { color: "var(--asc-amber)", borderColor: "var(--asc-amber-border)", background: "var(--asc-amber-bg)" },
    red: { color: "var(--asc-live)", borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)" },
    blue: { color: "var(--asc-blue)", borderColor: "var(--asc-blue-border)", background: "var(--asc-blue-bg)" },
    gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
    violet: { color: "var(--asc-accent)", borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)" },
  };

  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black capitalize" style={styleMap[tone]}>
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const tone =
    normalizedStatus === "open" || normalizedStatus === "approved"
      ? "green"
      : normalizedStatus === "upcoming" ||
          normalizedStatus === "pending" ||
          normalizedStatus === "registered"
        ? "yellow"
        : normalizedStatus === "closed" || normalizedStatus === "rejected"
          ? "red"
          : normalizedStatus === "ended"
            ? "blue"
            : "gray";

  return <Pill tone={tone}>{status}</Pill>;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

function CollapsibleSection({
  label,
  title,
  meta,
  children,
}: {
  label: string;
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <details
      className="group overflow-hidden border shadow-2xl"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
            {label}
          </p>
          <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{title}</h2>
          {meta && <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>{meta}</p>}
        </div>

        <span
          className="grid h-10 w-10 shrink-0 place-items-center border text-lg font-black transition group-open:rotate-45"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-2)" }}
        >
          +
        </span>
      </summary>

      <div className="p-5" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>{children}</div>
    </details>
  );
}

function SmallAction({
  action,
  tournamentId,
  label,
  pendingLabel,
  variant = "secondary",
  confirmTitle,
  confirmDescription,
  confirmLabel,
}: {
  action: TournamentAction;
  tournamentId: string;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "success" | "danger" | "secondary";
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
}) {
  return (
    <InlineAdminTournamentForm
      action={action}
      buttonLabel={label}
      pendingLabel={pendingLabel}
      variant={variant}
      className="grid gap-2"
      confirmTitle={confirmTitle}
      confirmDescription={confirmDescription}
      confirmLabel={confirmLabel}
    >
      <input type="hidden" name="tournamentId" value={tournamentId} />
    </InlineAdminTournamentForm>
  );
}

function formatDate(date: Date) {
  return date.toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDateTimeLocal(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 16);
}

function ProgressBar({
  approvedSlots,
  maxSlots,
}: {
  approvedSlots: number;
  maxSlots: number;
}) {
  const progress =
    maxSlots > 0 ? Math.min((approvedSlots / maxSlots) * 100, 100) : 0;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-4 text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
        <span>{approvedSlots}/{maxSlots} approved</span>
        <span>{Math.round(progress)}%</span>
      </div>

      <div className="asc-progress-track">
        <div className="asc-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default async function ManageTournamentPage({
  params,
}: ManageTournamentPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) redirect("/login");
  if (!session.user.isAdmin) redirect("/admin");

  await syncTournamentLifecycleForTournament(id);

  const [tournament, games, rawTournamentMatches] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id },
      include: {
        game: true,
        registrations: {
          include: { team: true },
          orderBy: { createdAt: "desc" },
        },
        results: {
          include: { team: true },
          orderBy: [{ placement: "asc" }, { awardedAt: "desc" }],
        },
      },
    }),
    prisma.game.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        name: true,
        defaultTeamSize: true,
        defaultSubstitutes: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
      select: {
        id: true,
        roundNumber: true,
        matchNumber: true,
        status: true,
        bestOf: true,
        isBye: true,
        teamAId: true,
        teamBId: true,
        winnerTeamId: true,
        scheduledAt: true,
        completedAt: true,
        reports: {
          where: { status: "submitted" },
          select: { id: true },
        },
      },
      orderBy: [{ roundNumber: "asc" }, { matchNumber: "asc" }],
    }),
  ]);

  if (!tournament) notFound();

  // Batch-load team names for all tournament matches
  const allTeamIds = [
    ...new Set(
      rawTournamentMatches
        .flatMap((m) => [m.teamAId, m.teamBId, m.winnerTeamId])
        .filter((x): x is string => Boolean(x)),
    ),
  ];
  const teamRows =
    allTeamIds.length > 0
      ? await prisma.team.findMany({
          where: { id: { in: allTeamIds } },
          select: { id: true, name: true },
        })
      : [];
  const teamNameMap = new Map(teamRows.map((t) => [t.id, t.name]));

  const tournamentMatches = rawTournamentMatches.map((m) => ({
    id: m.id,
    roundNumber: m.roundNumber,
    matchNumber: m.matchNumber,
    status: m.status,
    bestOf: m.bestOf,
    isBye: m.isBye,
    teamAId: m.teamAId,
    teamBId: m.teamBId,
    winnerTeamId: m.winnerTeamId,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    completedAt: m.completedAt?.toISOString() ?? null,
    teamAName: m.teamAId ? (teamNameMap.get(m.teamAId) ?? null) : null,
    teamBName: m.teamBId ? (teamNameMap.get(m.teamBId) ?? null) : null,
    winnerName: m.winnerTeamId ? (teamNameMap.get(m.winnerTeamId) ?? null) : null,
    pendingReportCount: m.reports.length,
  }));

  const approvedRegistrations = tournament.registrations.filter(
    (r: RegistrationWithTeam) => r.status === "approved",
  );

  const pendingRegistrations = tournament.registrations.filter(
    (r: RegistrationWithTeam) => r.status === "registered",
  );

  const rejectedRegistrations = tournament.registrations.filter(
    (r: RegistrationWithTeam) => r.status === "rejected",
  );

  const approvedSlots = approvedRegistrations.length;
  const remainingSlots = Math.max(tournament.maxTeams - approvedSlots, 0);

  const tournamentPoints = tournament.results.reduce(
    (total: number, r: ResultWithTeam) => total + r.points,
    0,
  );

  const tournamentImage = getTournamentImageUrl(
    tournament.game?.slug ?? null,
    tournament.imageUrl,
  );

  const isEnded = tournament.status === "ended";
  const isCancelled = tournament.status === "cancelled";

  return (
    <AdminShell
      userName={session.user.name}
      eyebrow="Manage tournament"
      title={tournament.title}
      description="Manage tournament setup, registrations, matches, lifecycle controls, and final results."
      headerMeta={
        <>
          <StatusBadge status={tournament.status} />
          <StatusBadge status={tournament.registrationStatus} />
          {tournament.game && <Pill tone="violet">{tournament.game.name}</Pill>}
        </>
      }
    >
      <TournamentLifecycleRefresh
        registrationOpensAt={
          tournament.registrationOpensAt?.toISOString() ?? null
        }
        registrationClosesAt={
          tournament.registrationClosesAt?.toISOString() ?? null
        }
        startsAt={tournament.startsAt?.toISOString() ?? null}
        endsAt={tournament.endsAt?.toISOString() ?? null}
      />

      <section className="hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${tournamentImage}")` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "var(--asc-admin-hero-overlay)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-52"
          style={{
            background:
              "var(--asc-admin-hero-bottom)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-24 pt-20 lg:px-10">
          <Link
            href="/admin?tab=tournaments"
            className="mb-8 inline-flex border px-4 py-2 text-sm font-black transition hover:opacity-90"
            style={{
              borderColor: "var(--asc-line-soft)",
              background: "var(--asc-bg-2)",
              color: "var(--asc-fg-2)",
            }}
          >
            ← Back to tournament list
          </Link>

          <section
            className="border p-6 shadow-2xl backdrop-blur"
            style={{
              borderColor: "var(--asc-line-soft)",
              background: "var(--asc-card-muted)",
            }}
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
              <div>
                <p
                  className="text-xs font-black uppercase tracking-[0.18em]"
                  style={{ color: "var(--asc-accent)" }}
                >
                  Manage tournament
                </p>

                <h1
                  className="mt-3 max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight md:text-7xl"
                  style={{ color: "var(--asc-fg-0)" }}
                >
                  {tournament.title}
                </h1>

                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge status={tournament.status} />
                  <StatusBadge status={tournament.registrationStatus} />
                  {tournament.game && (
                    <Pill tone="violet">{tournament.game.name}</Pill>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <Stat label="Approved" value={approvedSlots} />
                <Stat label="Left" value={remainingSlots} />
                <Stat label="Pending" value={pendingRegistrations.length} />
                <Stat label="Rejected" value={rejectedRegistrations.length} />
                <Stat label="Results" value={tournament.results.length} />
                <Stat label="Points" value={tournamentPoints} />
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="hidden">
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-10">
        <div className="grid content-start gap-5">
          <CollapsibleSection
            label="Details"
            title="Tournament setup"
            meta="Edit title, game, dates, format, slots, and visibility."
          >
            <InlineAdminTournamentForm
              action={updateTournamentInline}
              buttonLabel="Save changes"
              pendingLabel="Saving..."
              className="grid gap-5"
            >
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <input type="hidden" name="status" value={tournament.status} />
              <input
                type="hidden"
                name="registrationStatus"
                value={tournament.registrationStatus}
              />

              <label className="grid gap-2">
                <FieldLabel>Title</FieldLabel>

                <input
                  name="title"
                  required
                  defaultValue={tournament.title}
                  className={inputClass()}
                  style={inputStyle}
                />
              </label>

              <AdminTournamentImageFields
                games={games}
                defaultGameSlug={tournament.game?.slug ?? ""}
                defaultImageUrl={tournament.imageUrl}
              />

              <label className="grid gap-2">
                <FieldLabel>Description</FieldLabel>

                <textarea
                  name="description"
                  required
                  defaultValue={tournament.description}
                  className={`${inputClass()} min-h-28 resize-y text-sm leading-6`}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="grid gap-2">
                  <FieldLabel>Prize</FieldLabel>

                  <input
                    name="prize"
                    defaultValue={tournament.prize ?? ""}
                    placeholder="Optional"
                    className={inputClass()}
                    style={inputStyle}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Max teams</FieldLabel>

                  <input
                    name="maxTeams"
                    type="number"
                    min="1"
                    required
                    defaultValue={tournament.maxTeams}
                    className={inputClass()}
                    style={inputStyle}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Min teams</FieldLabel>

                  <input
                    name="minTeams"
                    type="number"
                    min="1"
                    defaultValue={tournament.minTeams}
                    className={inputClass()}
                    style={inputStyle}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2">
                  <FieldLabel>Team size</FieldLabel>

                  <input
                    name="teamSize"
                    type="number"
                    min="1"
                    required
                    defaultValue={tournament.teamSize}
                    className={inputClass()}
                    style={inputStyle}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Substitutes per team</FieldLabel>

                  <input
                    name="substitutesAllowed"
                    type="number"
                    min="0"
                    defaultValue={tournament.substitutesAllowed}
                    className={inputClass()}
                    style={inputStyle}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Best of</FieldLabel>

                  <select
                    name="bestOf"
                    defaultValue={String(tournament.bestOf)}
                    className={inputClass()}
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

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="grid gap-2">
                  <FieldLabel>Format</FieldLabel>

                  <select
                    name="format"
                    defaultValue={tournament.format}
                    className={inputClass()}
                    style={inputStyle}
                  >
                    {tournamentFormats.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Visibility</FieldLabel>

                  <select
                    name="visibility"
                    defaultValue={tournament.visibility}
                    className={inputClass()}
                    style={inputStyle}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Region</FieldLabel>

                  <input
                    name="region"
                    defaultValue={tournament.region ?? ""}
                    placeholder="e.g. MENA, EU, NA"
                    className={inputClass()}
                    style={inputStyle}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Platform</FieldLabel>

                  <select
                    name="platform"
                    defaultValue={tournament.platform ?? ""}
                    className={inputClass()}
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
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel>Start date</FieldLabel>

                  <input
                    name="startsAt"
                    type="datetime-local"
                    defaultValue={formatDateTimeLocal(tournament.startsAt)}
                    className={inputClass()}
                    style={inputStyle}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel>End date</FieldLabel>

                  <input
                    name="endsAt"
                    type="datetime-local"
                    defaultValue={formatDateTimeLocal(tournament.endsAt)}
                    className={inputClass()}
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
                    defaultValue={formatDateTimeLocal(
                      tournament.registrationOpensAt,
                    )}
                    className={inputClass()}
                    style={inputStyle}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Registration closes</FieldLabel>

                  <input
                    name="registrationClosesAt"
                    type="datetime-local"
                    defaultValue={formatDateTimeLocal(
                      tournament.registrationClosesAt,
                    )}
                    className={inputClass()}
                    style={inputStyle}
                  />
                </label>
              </div>
            </InlineAdminTournamentForm>
          </CollapsibleSection>

          <CollapsibleSection
            label="Registrations"
            title="Applications"
            meta={`${tournament.registrations.length} total · ${approvedRegistrations.length} approved · ${pendingRegistrations.length} pending`}
          >
            {tournament.registrations.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
                No registrations yet.
              </p>
            ) : (
              <div
                className="overflow-hidden border"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  background: "var(--asc-bg-2)",
                }}
              >
                {tournament.registrations.map(
                  (registration: RegistrationWithTeam, idx) => (
                    <article
                      key={registration.id}
                      className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_120px_140px] md:items-center"
                      style={
                        idx < tournament.registrations.length - 1
                          ? { borderBottom: "1px solid var(--asc-line-soft)" }
                          : {}
                      }
                    >
                      <div>
                        <p
                          className="font-black"
                          style={{ color: "var(--asc-fg-0)" }}
                        >
                          {registration.snapshotTeamName ||
                            registration.team.name}
                        </p>

                        <p
                          className="mt-1 text-sm"
                          style={{ color: "var(--asc-fg-3)" }}
                        >
                          {registration.snapshotTeamGame ?? "—"}
                        </p>

                        {registration.rejectionReason && (
                          <p
                            className="mt-2 text-sm"
                            style={{ color: "var(--asc-live)" }}
                          >
                            {registration.rejectionReason}
                          </p>
                        )}
                      </div>

                      <StatusBadge status={registration.status} />

                      <p
                        className="text-sm"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        {formatDate(registration.createdAt)}
                      </p>
                    </article>
                  ),
                )}
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            label="Results"
            title="Tournament standings"
            meta={`${tournament.results.length} saved results · ${tournamentPoints} total points`}
          >
            <AdminTournamentResultsPanel
              tournamentId={tournament.id}
              tournamentTitle={tournament.title}
              registrations={tournament.registrations}
              results={tournament.results}
            />
          </CollapsibleSection>

          <CollapsibleSection
            label="Matches"
            title="Match schedule"
            meta={`${tournamentMatches.length} match${tournamentMatches.length === 1 ? "" : "es"}`}
          >
            <AdminTournamentMatchPanel
              tournamentId={tournament.id}
              tournamentTitle={tournament.title}
              tournamentMatches={tournamentMatches}
              approvedTeamCount={approvedRegistrations.length}
            />
          </CollapsibleSection>
        </div>

        <aside className="grid content-start gap-5 lg:sticky lg:top-24">
          <section
            className="border p-5 shadow-2xl"
            style={{
              borderColor: "var(--asc-line-soft)",
              background: "var(--asc-bg-1)",
            }}
          >
            <p
              className="text-xs font-black uppercase tracking-[0.14em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              Slots
            </p>

            <div className="mt-4">
              <ProgressBar
                approvedSlots={approvedSlots}
                maxSlots={tournament.maxTeams}
              />
            </div>

            <p className="mt-3 text-sm" style={{ color: "var(--asc-fg-3)" }}>
              {tournament.registrations.length} application
              {tournament.registrations.length === 1 ? "" : "s"} total.
            </p>
          </section>

          <CollapsibleSection
            label="Registration"
            title="Controls"
            meta={
              isEnded || isCancelled ? "Closed" : tournament.registrationStatus
            }
          >
            <div className="grid gap-2">
              {isEnded || isCancelled ? (
                <div
                  className="border px-4 py-3 text-sm font-black"
                  style={{
                    borderColor: "var(--asc-line-soft)",
                    background: "var(--asc-bg-2)",
                    color: "var(--asc-fg-3)",
                  }}
                >
                  Registration closed.
                </div>
              ) : tournament.registrationStatus === "open" ? (
                <SmallAction
                  action={closeTournamentRegistrationInline}
                  tournamentId={tournament.id}
                  label="Close registration"
                  pendingLabel="Closing..."
                  variant="danger"
                  confirmTitle="Close registration?"
                  confirmDescription={`Close registration for ${tournament.title}? Players will no longer be able to register teams.`}
                  confirmLabel="Close registration"
                />
              ) : (
                <SmallAction
                  action={openTournamentRegistrationInline}
                  tournamentId={tournament.id}
                  label="Open registration"
                  pendingLabel="Opening..."
                  variant="success"
                  confirmTitle="Open registration?"
                  confirmDescription={`Open registration for ${tournament.title}? Players will be able to register eligible teams.`}
                  confirmLabel="Open registration"
                />
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            label="Status"
            title="Tournament status"
            meta={`Current: ${tournament.status}`}
          >
            <div className="grid gap-2">
              {tournament.status !== "upcoming" && (
                <SmallAction
                  action={setTournamentUpcomingInline}
                  tournamentId={tournament.id}
                  label="Set upcoming"
                  pendingLabel="Updating..."
                  confirmTitle="Set tournament as upcoming?"
                  confirmDescription={`Set ${tournament.title} as upcoming?`}
                  confirmLabel="Set upcoming"
                />
              )}

              {tournament.status !== "open" && (
                <SmallAction
                  action={setTournamentOpenInline}
                  tournamentId={tournament.id}
                  label="Set open"
                  pendingLabel="Updating..."
                  variant="success"
                  confirmTitle="Set tournament as open?"
                  confirmDescription={`Set ${tournament.title} as open?`}
                  confirmLabel="Set open"
                />
              )}

              {tournament.status !== "closed" && (
                <SmallAction
                  action={setTournamentClosedInline}
                  tournamentId={tournament.id}
                  label="Set closed"
                  pendingLabel="Updating..."
                  variant="danger"
                  confirmTitle="Set tournament as closed?"
                  confirmDescription={`Close ${tournament.title}? This will stop active tournament access depending on your current flow.`}
                  confirmLabel="Set closed"
                />
              )}

              {tournament.status !== "ended" && (
                <SmallAction
                  action={setTournamentEndedInline}
                  tournamentId={tournament.id}
                  label="Set ended"
                  pendingLabel="Updating..."
                  variant="secondary"
                  confirmTitle="End tournament?"
                  confirmDescription={`Mark ${tournament.title} as ended? Registered players may receive tournament-ended notifications.`}
                  confirmLabel="End tournament"
                />
              )}

              {tournament.status !== "cancelled" && (
                <SmallAction
                  action={setTournamentCancelledInline}
                  tournamentId={tournament.id}
                  label="Set cancelled"
                  pendingLabel="Updating..."
                  variant="danger"
                />
              )}
            </div>
          </CollapsibleSection>

          <details
            className="group overflow-hidden border shadow-2xl"
            style={{
              borderColor: "var(--asc-live-border)",
              background: "var(--asc-live-bg)",
            }}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition">
              <div>
                <p
                  className="text-xs font-black uppercase tracking-[0.14em]"
                  style={{ color: "var(--asc-live)" }}
                >
                  Danger zone
                </p>

                <h2
                  className="mt-1 text-xl font-black"
                  style={{ color: "var(--asc-fg-0)" }}
                >
                  Delete tournament
                </h2>
              </div>

              <span
                className="grid h-10 w-10 shrink-0 place-items-center border text-lg font-black transition group-open:rotate-45"
                style={{
                  borderColor: "var(--asc-live-border)",
                  background: "var(--asc-live-bg)",
                  color: "var(--asc-live)",
                }}
              >
                +
              </span>
            </summary>

            <div
              className="p-5"
              style={{ borderTop: "1px solid var(--asc-live-border)" }}
            >
              <InlineAdminTournamentForm
                action={deleteTournamentInline}
                buttonLabel="Delete tournament"
                pendingLabel="Deleting..."
                variant="danger"
                className="grid gap-2"
                confirmTitle="Delete tournament?"
                confirmDescription={`Are you sure you want to delete ${tournament.title}? This removes registrations and results connected to it.`}
                confirmLabel="Delete permanently"
              >
                <input
                  type="hidden"
                  name="tournamentId"
                  value={tournament.id}
                />
              </InlineAdminTournamentForm>
            </div>
          </details>
        </aside>
      </section>

    </AdminShell>
  );
}
