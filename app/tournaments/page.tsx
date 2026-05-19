import type { Metadata } from "next";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfileNotice from "@/components/ProfileNotice";
import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tournaments | Ascendra",
  description: "Browse Ascendra tournaments.",
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
    open: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    approved: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    upcoming: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    pending: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    closed: "border-red-400/25 bg-red-500/10 text-red-300",
    rejected: "border-red-400/25 bg-red-500/10 text-red-300",
    registered: "border-violet-400/25 bg-violet-500/10 text-violet-200",
    cancelled: "border-white/10 bg-white/5 text-gray-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize tracking-[0.08em] ${
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
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
        {label}
      </p>

      <p className="mt-3 text-4xl font-black text-white">{value}</p>

      <p className="mt-3 text-sm leading-6 text-gray-400">{description}</p>
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
    <div className="min-h-[70px] rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black text-white">{value}</p>
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
          className="h-full rounded-full bg-violet-500 shadow-lg shadow-violet-500/30"
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
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18)_0%,transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#0b0d17_45%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative border-b border-white/10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(7,8,17,0.98),rgba(7,8,17,0.72),rgba(7,8,17,0.98)),url('https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=2200&q=80')] bg-cover bg-center opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.22)_0%,transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08)_0%,transparent_28%)]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
            <p className="mb-5 text-sm font-black uppercase tracking-[0.22em] text-violet-300">
              Ascendra tournaments
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">
              Browse tournaments and claim your slot.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              Find open tournaments, check registration status, review team
              requirements, and enter the competition with your squad.
            </p>
          </div>

          <svg
            className="absolute bottom-[-1px] left-0 w-full text-[#070811]"
            viewBox="0 0 1440 120"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
          </svg>
        </section>

        <section className="grid gap-8 px-6 py-12 lg:px-10 2xl:px-16">
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
              description="Ascendra tournaments will appear here when they are created by the admin team."
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
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-violet-400/35 hover:bg-white/[0.06]"
                  >
                    <div
                      className="relative h-64 shrink-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `linear-gradient(to bottom, rgba(7,8,17,0.08), rgba(7,8,17,0.9)), url("${tournamentImage}")`,
                      }}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.30)_0%,transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.12)_0%,transparent_30%)]" />

                      <div className="relative z-10 flex h-full flex-col justify-between p-5">
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={tournament.status} />
                          <StatusBadge
                            label="Registration"
                            status={tournament.registrationStatus}
                          />
                        </div>

                        <div>
                          <p className="mb-2 text-sm font-black uppercase tracking-[0.16em] text-violet-300">
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
                              ? "text-emerald-300"
                              : "text-gray-400"
                          }`}
                        >
                          {isRegistrationOpen
                            ? "Registration is open."
                            : "Registration is currently closed."}
                        </p>

                        <Link
                          href={`/tournaments/${tournament.id}`}
                          className="inline-flex justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
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
      </div>
    </main>
  );
}
