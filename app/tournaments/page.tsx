import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import TournamentCard from "@/components/TournamentCard";
import TournamentHero from "@/components/TournamentHero";
import TournamentStatusSummary from "@/components/TournamentStatusSummary";
import { tournaments } from "@/data/tournaments";

export default function TournamentsPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />
      <TournamentHero />
      <TournamentStatusSummary />

      <section id="tournaments" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-10">
          <h2 className="text-4xl font-black">RTN Tournaments</h2>
          <p className="mt-4 max-w-2xl text-gray-300">
            Here you will later find active RTN tournaments, registration forms,
            team slots, match schedules, brackets, and tournament results.
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}