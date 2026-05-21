import type { Metadata } from "next";
import type { ReactNode } from "react";
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
  params: Promise<{
    id: string;
  }>;
};

type TournamentAction = (formData: FormData) => Promise<{
  ok: boolean;
  message: string;
  redirectTo?: string;
}>;

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

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

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-white/10 px-5 py-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
        {label}
      </p>

      <h2 className="mt-1 text-xl font-black text-white">{title}</h2>
    </div>
  );
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
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
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

export default async function ManageTournamentPage({
  params,
}: ManageTournamentPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isAdmin) {
    redirect("/admin");
  }

  const tournament = await prisma.tournament.findUnique({
    where: {
      id,
    },
    include: {
      registrations: {
        include: {
          team: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      results: {
        include: {
          team: true,
        },
        orderBy: [
          {
            placement: "asc",
          },
          {
            awardedAt: "desc",
          },
        ],
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  const approvedRegistrations = tournament.registrations.filter(
    (registration) => registration.status === "approved",
  );

  const pendingRegistrations = tournament.registrations.filter(
    (registration) => registration.status === "registered",
  );

  const rejectedRegistrations = tournament.registrations.filter(
    (registration) => registration.status === "rejected",
  );

  const approvedSlots = approvedRegistrations.length;
  const remainingSlots = Math.max(tournament.maxSlots - approvedSlots, 0);

  const tournamentPoints = tournament.results.reduce(
    (total, result) => total + result.points,
    0,
  );

  const tournamentImage = getTournamentImageUrl(
    tournament.game,
    tournament.imageUrl,
  );

  const isEnded = tournament.status === "ended";
  const isCancelled = tournament.status === "cancelled";

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[540px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("${tournamentImage}")`,
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.62)_48%,rgba(7,8,17,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-28 pt-20 lg:px-10">
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
                    <Pill tone="violet">{tournament.game}</Pill>
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

        <section className="relative -mt-16 mx-auto max-w-[1440px] px-6 pb-8 lg:px-10">
          <AdminTabNavigation activeTab="tournaments" />
        </section>

        <section className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-10">
          <div className="grid gap-8">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <SectionTitle label="Details" title="Tournament setup" />

              <div className="p-5">
                <InlineAdminTournamentForm
                  action={updateTournamentInline}
                  buttonLabel="Save changes"
                  pendingLabel="Saving..."
                  className="grid gap-5"
                >
                  <input
                    type="hidden"
                    name="tournamentId"
                    value={tournament.id}
                  />
                  <input
                    type="hidden"
                    name="status"
                    value={tournament.status}
                  />
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
                    defaultGame={tournament.game}
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

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="grid gap-2">
                      <FieldLabel>Date</FieldLabel>

                      <input
                        name="date"
                        required
                        defaultValue={tournament.date}
                        className={inputClass()}
                      />
                    </label>

                    <label className="grid gap-2">
                      <FieldLabel>Prize</FieldLabel>

                      <input
                        name="prize"
                        required
                        defaultValue={tournament.prize}
                        className={inputClass()}
                      />
                    </label>

                    <label className="grid gap-2">
                      <FieldLabel>Max slots</FieldLabel>

                      <input
                        name="maxSlots"
                        type="number"
                        min="1"
                        required
                        defaultValue={tournament.maxSlots}
                        className={inputClass()}
                      />
                    </label>

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
                  </div>
                </InlineAdminTournamentForm>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <SectionTitle label="Registrations" title="Applications" />

              {tournament.registrations.length === 0 ? (
                <div className="p-5 text-sm text-gray-400">
                  No registrations yet.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {tournament.registrations.map((registration) => (
                    <article
                      key={registration.id}
                      className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_120px_140px] md:items-center"
                    >
                      <div>
                        <p className="font-black text-white">
                          {registration.snapshotTeamName ||
                            registration.team.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          {registration.snapshotTeamGame ||
                            registration.team.game}
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
              )}
            </section>

            <AdminTournamentResultsPanel
              tournamentId={tournament.id}
              tournamentTitle={tournament.title}
              registrations={tournament.registrations}
              results={tournament.results}
            />
          </div>

          <aside className="grid content-start gap-5 lg:sticky lg:top-24">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                Slots
              </p>

              <div className="mt-4">
                <ProgressBar
                  approvedSlots={approvedSlots}
                  maxSlots={tournament.maxSlots}
                />
              </div>

              <p className="mt-3 text-sm text-gray-500">
                {tournament.registrations.length} application
                {tournament.registrations.length === 1 ? "" : "s"} total.
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                Registration
              </p>

              <div className="mt-4 grid gap-2">
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
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                Tournament status
              </p>

              <div className="mt-4 grid gap-2">
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
            </section>

            <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-red-300">
                Danger zone
              </p>

              <div className="mt-4">
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
            </section>
          </aside>
        </section>

        <Footer />
      </div>
    </main>
  );
}
