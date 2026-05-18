import type { Metadata } from "next";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import ProfileNotice from "@/components/ProfileNotice";
import { getTournamentImageUrl } from "@/lib/tournamentImages";
import { prisma } from "@/lib/prisma";

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

function StatusBadge({ status }: { status: string }) {
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
      {status}
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">{value}</p>
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

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Tournaments"
        title="Browse RTN tournaments."
        description="Find tournaments, check registration status, and open a tournament page to view details or register your team."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <ProfileNotice message={params.message} error={params.error} />

        {tournaments.length === 0 ? (
          <EmptyState
            title="No tournaments yet"
            description="RTN tournaments will appear here when they are created by the admin team."
          />
        ) : (
          <div className="grid gap-6">
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
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition hover:border-cyan-400/30 hover:bg-white/[0.06]"
                >
                  <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
                    <div
                      className="min-h-72 bg-cover bg-center lg:min-h-full"
                      style={{
                        backgroundImage: `linear-gradient(to bottom, rgba(11,15,26,0.05), rgba(11,15,26,0.8)), url("${tournamentImage}")`,
                      }}
                    />

                    <div className="grid gap-5 p-6">
                      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                        <div>
                          <div className="mb-3 flex flex-wrap gap-2">
                            <StatusBadge status={tournament.status} />
                            <StatusBadge
                              status={`Registration ${tournament.registrationStatus}`}
                            />
                          </div>

                          <h2 className="text-3xl font-black text-white">
                            {tournament.title}
                          </h2>

                          <p className="mt-2 text-sm leading-6 text-gray-400">
                            {tournament.game} · {tournament.date}
                          </p>
                        </div>

                        <Link
                          href={`/tournaments/${tournament.id}`}
                          className="inline-flex w-fit rounded-xl bg-indigo-500 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-400"
                        >
                          View details
                        </Link>
                      </div>

                      <p className="max-w-4xl text-sm leading-7 text-gray-300">
                        {tournament.description}
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoCard label="Prize" value={tournament.prize} />
                        <InfoCard
                          label="Team size"
                          value={`${tournament.teamSize}v${tournament.teamSize}`}
                        />
                        <InfoCard
                          label="Slots used"
                          value={`${usedSlots}/${tournament.maxSlots}`}
                        />
                        <InfoCard label="Slots left" value={remainingSlots} />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
