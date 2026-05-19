import type { Metadata } from "next";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import ProfileNotice from "@/components/ProfileNotice";
import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tournaments",
  description: "Browse RTN tournaments.",
};

type TournamentsPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const normalizedStatus = status.toLowerCase().replace("registration ", "");

  const styles: Record<string, string> = {
    open: "border-green-500/20 bg-green-500/10 text-green-300",
    approved: "border-green-500/20 bg-green-500/10 text-green-300",
    upcoming: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    pending: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    closed: "border-red-500/20 bg-red-500/10 text-red-300",
    rejected: "border-red-500/20 bg-red-500/10 text-red-300",
    registered: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    cancelled: "border-white/10 bg-white/5 text-gray-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {label ? `${label}: ` : ""}
      {status}
    </span>
  );
}

function PageStatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-white">{value}</p>

      <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
}

function DetailPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-h-[62px] rounded-xl border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-black text-white">{value}</p>
    </div>
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
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-4 text-xs font-bold text-gray-400">
        <span>
          {usedSlots}/{maxSlots} slots used
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
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

export default async function TournamentsPage({
  searchParams,
}: TournamentsPageProps) {
  const params = await searchParams;

  const tournaments = await prisma.tournament.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      game: true,
      description: true,
      date: true,
      prize: true,
      imageUrl: true,
      maxSlots: true,
      teamSize: true,
      status: true,
      registrationStatus: true,
      registrations: {
        where: {
          status: {
            in: ["registered", "approved"],
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  const openRegistrationCount = tournaments.filter(
    (tournament) => tournament.registrationStatus === "open",
  ).length;

  const openTournamentCount = tournaments.filter(
    (tournament) => tournament.status === "open",
  ).length;

  const totalUsedSlots = tournaments.reduce(
    (total, tournament) => total + tournament.registrations.length,
    0,
  );

  const gamesCount = new Set(tournaments.map((tournament) => tournament.game))
    .size;

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Tournaments"
        title="Browse RTN tournaments."
        description="Find tournaments, check registration status, and open a tournament page to view details or register your team."
      />

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-24">
        <ProfileNotice message={params.message} error={params.error} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PageStatCard
            label="Tournaments"
            value={tournaments.length}
            description="Total tournaments listed."
          />

          <PageStatCard
            label="Open"
            value={openTournamentCount}
            description="Tournaments currently open."
          />

          <PageStatCard
            label="Registration"
            value={openRegistrationCount}
            description="Tournaments accepting teams."
          />

          <PageStatCard
            label="Games"
            value={gamesCount}
            description={`${totalUsedSlots} active team slot${
              totalUsedSlots === 1 ? "" : "s"
            } used.`}
          />
        </section>

        {tournaments.length === 0 ? (
          <EmptyState
            title="No tournaments yet"
            description="RTN tournaments will appear here when they are created by the admin team."
          />
        ) : (
          <section className="grid items-stretch gap-5 lg:grid-cols-2">
            {tournaments.map((tournament) => {
              const usedSlots = tournament.registrations.length;
              const remainingSlots = Math.max(
                tournament.maxSlots - usedSlots,
                0,
              );

              const tournamentImage = getTournamentImageUrl(
                tournament.game,
                tournament.imageUrl,
              );

              const isRegistrationOpen =
                tournament.registrationStatus === "open";

              return (
                <article
                  key={tournament.id}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition hover:border-cyan-400/30 hover:bg-white/[0.06]"
                >
                  <div
                    className="relative h-64 shrink-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `linear-gradient(to bottom, rgba(11,15,26,0.05), rgba(11,15,26,0.88)), url("${tournamentImage}")`,
                    }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.28)_0%,transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.16)_0%,transparent_30%)]" />

                    <div className="relative z-10 flex h-full flex-col justify-between p-5">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={tournament.status} />
                        <StatusBadge
                          label="Registration"
                          status={tournament.registrationStatus}
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
                          {tournament.game}
                        </p>

                        <h2 className="max-w-2xl text-3xl font-black leading-tight text-white">
                          {tournament.title}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-5 p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailPill label="Date" value={tournament.date} />
                      <DetailPill label="Prize" value={tournament.prize} />
                    </div>

                    <p className="min-h-[84px] overflow-hidden text-sm leading-7 text-gray-300">
                      {tournament.description}
                    </p>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <DetailPill
                        label="Team size"
                        value={`${tournament.teamSize}v${tournament.teamSize}`}
                      />
                      <DetailPill label="Slots left" value={remainingSlots} />
                      <DetailPill
                        label="Max slots"
                        value={tournament.maxSlots}
                      />
                    </div>

                    <ProgressBar
                      usedSlots={usedSlots}
                      maxSlots={tournament.maxSlots}
                    />

                    <div className="mt-auto flex flex-col justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center">
                      <p
                        className={`text-sm font-bold ${
                          isRegistrationOpen
                            ? "text-green-300"
                            : "text-gray-400"
                        }`}
                      >
                        {isRegistrationOpen
                          ? "Registration is open."
                          : "Registration is currently closed."}
                      </p>

                      <Link
                        href={`/tournaments/${tournament.id}`}
                        className="inline-flex justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-400"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </section>

      <Footer />
    </main>
  );
}
