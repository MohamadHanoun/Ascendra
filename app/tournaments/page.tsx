import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import TournamentBrowser from "@/components/TournamentBrowser";
import TournamentHero from "@/components/TournamentHero";
import TournamentStatusSummary from "@/components/TournamentStatusSummary";
import type { Tournament, TournamentStatus } from "@/data/tournaments";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tournaments",
  description:
    "Explore RTN tournaments, events, team slots, and community competitions.",
};

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

        <TournamentBrowser tournaments={tournaments} />
      </section>

      <Footer />
    </main>
  );
}