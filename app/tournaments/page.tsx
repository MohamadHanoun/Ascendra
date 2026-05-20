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
  description: "Ascendra tournaments and events.",
};

type TournamentsPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

function StatusBadge({ status }: { status: string }) {
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
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

function PageStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 shadow-2xl shadow-black/20">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-base font-black text-white">{value}</p>
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
      <div className="flex items-center justify-between text-xs font-bold text-gray-500">
        <span>
          {usedSlots}/{maxSlots}
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-violet-500 shadow-lg shadow-violet-500/25"
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

  const gamesCount = new Set(tournaments.map((tournament) => tournament.game))
    .size;

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#0b0d17_45%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative overflow-hidden border-b border-white/10">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(7,8,17,0.98), rgba(7,8,17,0.82), rgba(7,8,17,0.94)), url("/images/backgrounds/tournaments-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.22)_0%,transparent_34%)]" />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 py-20 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
              Ascendra events
            </p>

            <h1 className="max-w-4xl text-5xl font-black uppercase tracking-tight text-white md:text-7xl">
              Tournaments
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
              Open, upcoming, and completed community events.
            </p>
          </div>

          <svg
            className="absolute bottom-[-1px] left-0 w-full text-[#070811]"
            viewBox="0 0 1440 90"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,48L120,53.3C240,59,480,69,720,58.7C960,48,1200,16,1320,0L1440,0L1440,90L1320,90C1200,90,960,90,720,90C480,90,240,90,120,90L0,90Z" />
          </svg>
        </section>

        <section className="mx-auto grid max-w-[1680px] gap-7 px-6 py-10 lg:px-10 2xl:px-14">
          <ProfileNotice message={params.message} error={params.error} />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PageStatCard label="Tournaments" value={tournaments.length} />
            <PageStatCard label="Open" value={openTournamentCount} />
            <PageStatCard label="Registration" value={openRegistrationCount} />
            <PageStatCard label="Games" value={gamesCount} />
          </section>

          {tournaments.length === 0 ? (
            <EmptyState
              title="No tournaments yet"
              description="Events will appear here when they are published."
            />
          ) : (
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <div className="hidden border-b border-white/10 bg-black/25 px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-gray-500 xl:grid xl:grid-cols-[minmax(0,1.35fr)_150px_150px_130px_190px_140px] xl:gap-6">
                <span>Tournament</span>
                <span>Date</span>
                <span>Prize</span>
                <span>Team</span>
                <span>Slots</span>
                <span>Action</span>
              </div>

              <div className="divide-y divide-white/10">
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

                  return (
                    <article
                      key={tournament.id}
                      className="grid gap-5 p-5 transition hover:bg-white/[0.035] xl:grid-cols-[minmax(0,1.35fr)_150px_150px_130px_190px_140px] xl:items-center xl:gap-6"
                    >
                      <div className="flex min-w-0 gap-5">
                        <div
                          className="relative h-24 w-36 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-cover bg-center"
                          style={{
                            backgroundImage: `linear-gradient(to bottom, rgba(7,8,17,0.05), rgba(7,8,17,0.55)), url("${tournamentImage}")`,
                          }}
                        />

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-2xl font-black text-white">
                              {tournament.title}
                            </h2>

                            <StatusBadge status={tournament.status} />
                            <StatusBadge
                              status={`Registration ${tournament.registrationStatus}`}
                            />
                          </div>

                          <p className="mt-2 text-base font-bold text-violet-300">
                            {tournament.game}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-6 xl:hidden">
                            <MiniInfo label="Date" value={tournament.date} />
                            <MiniInfo label="Prize" value={tournament.prize} />
                            <MiniInfo
                              label="Team"
                              value={`${tournament.teamSize}v${tournament.teamSize}`}
                            />
                            <MiniInfo label="Left" value={remainingSlots} />
                          </div>
                        </div>
                      </div>

                      <div className="hidden xl:block">
                        <MiniInfo label="Date" value={tournament.date} />
                      </div>

                      <div className="hidden xl:block">
                        <MiniInfo label="Prize" value={tournament.prize} />
                      </div>

                      <div className="hidden xl:block">
                        <MiniInfo
                          label="Team"
                          value={`${tournament.teamSize}v${tournament.teamSize}`}
                        />
                      </div>

                      <div className="grid gap-2">
                        <ProgressBar
                          usedSlots={usedSlots}
                          maxSlots={tournament.maxSlots}
                        />

                        <p className="text-xs font-bold text-gray-500">
                          {remainingSlots} slots left
                        </p>
                      </div>

                      <Link
                        href={`/tournaments/${tournament.id}`}
                        className="inline-flex justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
                      >
                        Details
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}
