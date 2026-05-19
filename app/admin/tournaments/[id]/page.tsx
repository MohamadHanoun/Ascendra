import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  closeTournamentRegistrationInline,
  deleteTournamentInline,
  openTournamentRegistrationInline,
  setTournamentCancelledInline,
  setTournamentClosedInline,
  setTournamentOpenInline,
  setTournamentUpcomingInline,
  updateTournamentInline,
} from "@/actions/adminTournamentInlineActions";
import AdminTabNavigation from "@/components/AdminTabNavigation";
import AdminTournamentImageFields from "@/components/AdminTournamentImageFields";
import AdminTournamentResultsPanel from "@/components/AdminTournamentResultsPanel";
import Footer from "@/components/Footer";
import InlineAdminTournamentForm from "@/components/InlineAdminTournamentForm";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Tournament",
  description: "Manage RTN tournament details, registration, and results.",
};

type ManageTournamentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

type TournamentAction = (formData: FormData) => Promise<{
  ok: boolean;
  message: string;
  redirectTo?: string;
}>;

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-sm font-bold text-gray-200">{children}</span>;
}

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400";
}

function StatusBadge({ label, status }: { label: string; status: string }) {
  const normalizedStatus = status.toLowerCase();

  const styles: Record<string, string> = {
    open: "border-green-500/20 bg-green-500/10 text-green-300",
    upcoming: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    closed: "border-red-500/20 bg-red-500/10 text-red-300",
    cancelled: "border-white/10 bg-white/5 text-gray-300",
    registered: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    approved: "border-green-500/20 bg-green-500/10 text-green-300",
    rejected: "border-red-500/20 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {label}: {status}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
        {label}
      </p>

      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
        {description}
      </p>
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

function ProgressBar({
  usedSlots,
  maxSlots,
}: {
  usedSlots: number;
  maxSlots: number;
}) {
  const progress =
    maxSlots > 0 ? Math.min((usedSlots / maxSlots) * 100, 100) : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-4 text-xs font-bold text-gray-400">
        <span>
          {usedSlots}/{maxSlots} slots used
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-400"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
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

  const activeRegistrations = tournament.registrations.filter((registration) =>
    ["registered", "approved"].includes(registration.status),
  );

  const usedSlots = activeRegistrations.length;
  const remainingSlots = Math.max(tournament.maxSlots - usedSlots, 0);

  const tournamentPoints = tournament.results.reduce(
    (total, result) => total + result.points,
    0,
  );

  const tournamentImage = getTournamentImageUrl(
    tournament.game,
    tournament.imageUrl,
  );

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="Manage Tournament"
        title={tournament.title}
        description="Edit tournament details, manage registrations, add results, and award tournament points."
      />

      <AdminTabNavigation activeTab="tournaments" />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Link
              href="/admin?tab=tournaments"
              className="inline-flex rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              ← Back to tournament list
            </Link>

            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge label="Tournament" status={tournament.status} />
              <StatusBadge
                label="Registration"
                status={tournament.registrationStatus}
              />
              <StatusBadge label="Game" status={tournament.game} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard label="Slots" value={tournament.maxSlots} />
            <StatCard label="Used" value={usedSlots} />
            <StatCard label="Left" value={remainingSlots} />
            <StatCard label="Results" value={tournament.results.length} />
            <StatCard label="Points" value={tournamentPoints} />
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div
            className="relative min-h-72 border-b border-white/10 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(11,15,26,0.05), rgba(11,15,26,0.86)), url("${tournamentImage}")`,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.26)_0%,transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.14)_0%,transparent_30%)]" />

            <div className="relative z-10 flex min-h-72 flex-col justify-end p-6">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                Overview
              </p>

              <h2 className="mt-2 max-w-4xl text-4xl font-black text-white">
                {tournament.title}
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300">
                {tournament.game} · {tournament.date}
              </p>
            </div>
          </div>

          <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="grid gap-6">
              <section className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                <SectionHeader
                  label="Details"
                  title="Edit main information"
                  description="Update the title, game, image, description, date, prize, slots, and team size."
                />

                <div className="p-5">
                  <InlineAdminTournamentForm
                    action={updateTournamentInline}
                    buttonLabel="Save changes"
                    pendingLabel="Saving..."
                    className="grid gap-4"
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

              <section className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                <SectionHeader
                  label="Registrations"
                  title="Registered teams"
                  description="View every registration connected to this tournament."
                />

                {tournament.registrations.length === 0 ? (
                  <div className="p-5 text-sm text-gray-400">
                    No registrations yet.
                  </div>
                ) : (
                  <div className="grid gap-3 p-5">
                    {tournament.registrations.map((registration) => (
                      <article
                        key={registration.id}
                        className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 lg:grid-cols-[minmax(0,1fr)_130px_170px] lg:items-center"
                      >
                        <div>
                          <p className="font-black text-white">
                            {registration.team.name}
                          </p>

                          <p className="mt-1 text-sm text-gray-400">
                            {registration.team.game} · Team ID:{" "}
                            {registration.team.id}
                          </p>

                          {registration.rejectionReason && (
                            <p className="mt-2 text-sm text-red-300">
                              Rejection reason: {registration.rejectionReason}
                            </p>
                          )}
                        </div>

                        <StatusBadge
                          label="Status"
                          status={registration.status}
                        />

                        <p className="text-sm text-gray-400">
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

            <aside className="grid content-start gap-4 xl:sticky xl:top-24">
              <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
                  Slots
                </p>

                <div className="mt-3">
                  <ProgressBar
                    usedSlots={usedSlots}
                    maxSlots={tournament.maxSlots}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
                  Registration controls
                </p>

                <div className="mt-3 grid gap-2">
                  {tournament.registrationStatus === "open" ? (
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

              <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
                  Tournament status
                </p>

                <div className="mt-3 grid gap-2">
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

              <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-red-300">
                  Danger zone
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Delete this tournament and its connected registrations,
                  results, and points.
                </p>

                <div className="mt-3">
                  <InlineAdminTournamentForm
                    action={deleteTournamentInline}
                    buttonLabel="Delete tournament"
                    pendingLabel="Deleting..."
                    variant="danger"
                    className="grid gap-2"
                    confirmTitle="Delete tournament?"
                    confirmDescription={`Are you sure you want to delete ${tournament.title}? This will also remove registrations and tournament results connected to it.`}
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
          </div>
        </section>
      </section>

      <Footer />
    </main>
  );
}
