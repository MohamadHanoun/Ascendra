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
import AdminTabNavigation from "@/components/AdminTabNavigation";
import AdminTournamentImageFields from "@/components/AdminTournamentImageFields";
import AdminMatchPanel from "@/components/AdminMatchPanel";
import AdminTournamentResultsPanel from "@/components/AdminTournamentResultsPanel";
import Footer from "@/components/Footer";
import InlineAdminTournamentForm from "@/components/InlineAdminTournamentForm";
import Navbar from "@/components/Navbar";
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

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400";
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-sm font-bold text-gray-200">{children}</span>;
}

function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
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
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize ${styles[tone]}`}
    >
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
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">{value}</p>
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
    <details className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[0.035]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
            {label}
          </p>

          <h2 className="mt-1 text-xl font-black text-white">{title}</h2>

          {meta && <p className="mt-1 text-sm text-gray-500">{meta}</p>}
        </div>

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/25 text-lg font-black text-gray-300 transition group-open:rotate-45 group-hover:border-violet-400/30 group-hover:text-white">
          +
        </span>
      </summary>

      <div className="border-t border-white/10 p-5">{children}</div>
    </details>
  );
}

function SmallAction({
  action,
  tournamentId,
  label,
  pendingLabel,
  variant = "secondary",
}: {
  action: TournamentAction;
  tournamentId: string;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "success" | "danger" | "secondary";
}) {
  return (
    <InlineAdminTournamentForm
      action={action}
      buttonLabel={label}
      pendingLabel={pendingLabel}
      variant={variant}
      className="grid gap-2"
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
      <div className="flex items-center justify-between gap-4 text-xs font-bold text-gray-500">
        <span>
          {approvedSlots}/{maxSlots} approved
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25"
          style={{ width: `${progress}%` }}
        />
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

  const [tournament, games, rawMatches] = await Promise.all([
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
    prisma.match.findMany({
      where: { tournamentId: id },
      select: {
        id: true,
        round: true,
        matchNumber: true,
        teamAId: true,
        teamBId: true,
        teamA: { select: { id: true, name: true } },
        teamB: { select: { id: true, name: true } },
        scheduledAt: true,
        status: true,
        bestOf: true,
        scoreA: true,
        scoreB: true,
        winnerTeamId: true,
        confirmedByAdmin: true,
        notes: true,
      },
      orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
    }),
  ]);

  if (!tournament) notFound();

  const matches = rawMatches.map((m: (typeof rawMatches)[number]) => ({
    ...m,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
  }));

  const approvedRegistrations = tournament.registrations.filter(
    (r: RegistrationWithTeam) => r.status === "approved",
  );

  const registeredTeams = approvedRegistrations.map((r) => ({
    id: r.team.id,
    name: r.team.name,
  }));

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
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[480px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${tournamentImage}")` }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.62)_48%,rgba(7,8,17,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-24 pt-20 lg:px-10">
            <Link
              href="/admin?tab=tournaments"
              className="mb-8 inline-flex rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              ← Back to tournament list
            </Link>

            <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                    Manage tournament
                  </p>

                  <h1 className="mt-3 max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">
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

        <section className="relative -mt-12 mx-auto max-w-[1440px] px-6 pb-8 lg:px-10">
          <AdminTabNavigation activeTab="tournaments" />
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
                    />
                  </label>

                  <label className="grid gap-2">
                    <FieldLabel>Best of</FieldLabel>

                    <select
                      name="bestOf"
                      defaultValue={String(tournament.bestOf)}
                      className={inputClass()}
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
                    />
                  </label>

                  <label className="grid gap-2">
                    <FieldLabel>Platform</FieldLabel>

                    <select
                      name="platform"
                      defaultValue={tournament.platform ?? ""}
                      className={inputClass()}
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
                    />
                  </label>

                  <label className="grid gap-2">
                    <FieldLabel>End date</FieldLabel>

                    <input
                      name="endsAt"
                      type="datetime-local"
                      defaultValue={formatDateTimeLocal(tournament.endsAt)}
                      className={inputClass()}
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
                <div className="text-sm text-gray-400">
                  No registrations yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <div className="divide-y divide-white/10">
                    {tournament.registrations.map((registration: RegistrationWithTeam) => (
                      <article
                        key={registration.id}
                        className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_120px_140px] md:items-center"
                      >
                        <div>
                          <p className="font-black text-white">
                            {registration.snapshotTeamName ||
                              registration.team.name}
                          </p>

                          <p className="mt-1 text-sm text-gray-400">
                            {registration.snapshotTeamGame ?? "—"}
                          </p>

                          {registration.rejectionReason && (
                            <p className="mt-2 text-sm text-red-300">
                              {registration.rejectionReason}
                            </p>
                          )}
                        </div>

                        <StatusBadge status={registration.status} />

                        <p className="text-sm text-gray-500">
                          {formatDate(registration.createdAt)}
                        </p>
                      </article>
                    ))}
                  </div>
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
              meta={`${matches.length} match${matches.length === 1 ? "" : "es"}`}
            >
              <AdminMatchPanel
                tournamentId={tournament.id}
                matches={matches}
                registeredTeams={registeredTeams}
              />
            </CollapsibleSection>
          </div>

          <aside className="grid content-start gap-5 lg:sticky lg:top-24">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                Slots
              </p>

              <div className="mt-4">
                <ProgressBar
                  approvedSlots={approvedSlots}
                  maxSlots={tournament.maxTeams}
                />
              </div>

              <p className="mt-3 text-sm text-gray-500">
                {tournament.registrations.length} application
                {tournament.registrations.length === 1 ? "" : "s"} total.
              </p>
            </section>

            <CollapsibleSection
              label="Registration"
              title="Controls"
              meta={
                isEnded || isCancelled
                  ? "Closed"
                  : tournament.registrationStatus
              }
            >
              <div className="grid gap-2">
                {isEnded || isCancelled ? (
                  <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-black text-gray-400">
                    Registration closed.
                  </div>
                ) : tournament.registrationStatus === "open" ? (
                  <SmallAction
                    action={closeTournamentRegistrationInline}
                    tournamentId={tournament.id}
                    label="Close registration"
                    pendingLabel="Closing..."
                    variant="danger"
                  />
                ) : (
                  <SmallAction
                    action={openTournamentRegistrationInline}
                    tournamentId={tournament.id}
                    label="Open registration"
                    pendingLabel="Opening..."
                    variant="success"
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
                  />
                )}

                {tournament.status !== "open" && (
                  <SmallAction
                    action={setTournamentOpenInline}
                    tournamentId={tournament.id}
                    label="Set open"
                    pendingLabel="Updating..."
                    variant="success"
                  />
                )}

                {tournament.status !== "closed" && (
                  <SmallAction
                    action={setTournamentClosedInline}
                    tournamentId={tournament.id}
                    label="Set closed"
                    pendingLabel="Updating..."
                    variant="danger"
                  />
                )}

                {tournament.status !== "ended" && (
                  <SmallAction
                    action={setTournamentEndedInline}
                    tournamentId={tournament.id}
                    label="Set ended"
                    pendingLabel="Updating..."
                    variant="secondary"
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

            <details className="group overflow-hidden rounded-3xl border border-red-500/20 bg-red-500/5 shadow-2xl shadow-black/20">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition hover:bg-red-500/10">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-red-300">
                    Danger zone
                  </p>

                  <h2 className="mt-1 text-xl font-black text-white">
                    Delete tournament
                  </h2>
                </div>

                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-400/20 bg-black/25 text-lg font-black text-red-200 transition group-open:rotate-45">
                  +
                </span>
              </summary>

              <div className="border-t border-red-500/20 p-5">
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

        <Footer />
      </div>
    </main>
  );
}
