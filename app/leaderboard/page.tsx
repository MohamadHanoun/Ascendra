import Footer from "@/components/Footer";
import LeaderboardTable from "@/components/LeaderboardTable";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import XpSystemPreview from "@/components/XpSystemPreview";
import { leaderboardUsers } from "@/data/leaderboard";

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Leaderboard"
        title="Levels, XP, and the most active players."
        description="This page is prepared for the future RTN XP system, Discord bot, database, and live community ranking."
      />

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="mb-10 rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-6">
          <h2 className="mb-3 text-2xl font-bold text-indigo-300">
            Leaderboard Data Coming Later
          </h2>

          <p className="leading-7 text-gray-300">
            The current leaderboard uses placeholder users. Later, the RTN bot
            will collect XP activity from Discord and the website will show real
            rankings from the database.
          </p>
        </div>

        <LeaderboardTable users={leaderboardUsers} />
      </section>

      <XpSystemPreview />

      <Footer />
    </main>
  );
}