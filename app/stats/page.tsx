import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import { serverStats } from "@/data/stats";

export default function StatsPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="Server Stats"
        title="Live Discord statistics will appear here."
        description="For now these are static stats. Later, this page will connect to the Discord bot and database."
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {serverStats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-3xl border border-white/10 bg-white/5 p-8"
          >
            <p className="text-5xl font-black text-indigo-400">
              {stat.value}
            </p>
            <p className="mt-3 text-gray-300">{stat.label}</p>
          </article>
        ))}
      </section>

      <Footer />
    </main>
  );
}