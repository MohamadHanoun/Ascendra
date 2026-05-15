import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import TournamentBrowser from "@/components/TournamentBrowser";
import TournamentHero from "@/components/TournamentHero";
import TournamentStatusSummary from "@/components/TournamentStatusSummary";
import type { Tournament, TournamentStatus } from "@/data/tournaments";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getTournaments(): Promise<Tournament[]> {
  const databaseTournaments = await prisma.tournament.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return databaseTournaments.map((tournament) => ({
    id: tournament.id,
    title: tournament.title,
    game: tournament.game,
    date: tournament.date,
    prize: tournament.prize,
    teams: `${tournament.maxSlots} slots`,
    status: tournament.status as TournamentStatus,
    description: tournament.description,
  }));
}

export default async function TournamentsPage() {
  const tournaments = await getTournaments();

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <TournamentHero />

      <TournamentStatusSummary tournaments={tournaments} />

      <section id="tournaments" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-10">
          <h2 className="text-4xl font-black">RTN Tournaments</h2>

          <p className="mt-4 max-w-2xl text-gray-300">
            Here you will find RTN tournaments, registration preparation, team
            slots, match schedules, brackets, and tournament results.
          </p>
        </div>

        <div className="mb-10 rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-6">
          <h3 className="mb-3 text-2xl font-bold text-indigo-300">
            Registration System Coming Later
          </h3>

          <p className="leading-7 text-gray-300">
            Tournament registration is prepared visually for now. Later, members
            will be able to log in with Discord, register for tournaments, join
            teams, and track match results directly from the website.
          </p>
        </div>

        <TournamentBrowser tournaments={tournaments} />
      </section>

      <Footer />
    </main>
  );
}