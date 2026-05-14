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
        label="XP Leaderboard"
        title="Track levels, XP, and the most active members."
        description="This page is prepared for the future Discord bot, XP system, database, and live community ranking."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <LeaderboardTable users={leaderboardUsers} />
      </section>

      <XpSystemPreview />

      <Footer />
    </main>
  );
}