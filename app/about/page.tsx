import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "About | Ascendra",
  description: "Learn more about Ascendra.",
};

const values = [
  {
    title: "Teams",
    description: "Create teams, invite players, and prepare for tournaments.",
  },
  {
    title: "Tournaments",
    description: "Register for events, follow applications, and track results.",
  },
  {
    title: "Leaderboard",
    description: "Official points and rankings based on saved results.",
  },
  {
    title: "Community",
    description: "A cleaner place for organized competitive play.",
  },
];

function ValueRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="grid gap-2 border-b border-white/10 px-5 py-4 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
      <h3 className="font-black text-white">{title}</h3>

      <p className="text-sm leading-6 text-gray-400">{description}</p>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[430px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.62)_44%,rgba(7,8,17,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
              Platform
            </p>

            <h1 className="text-5xl font-black uppercase tracking-tight text-white md:text-7xl">
              About
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
              Ascendra is built for teams, tournaments, rankings, and organized
              competitive play.
            </p>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 lg:px-10 2xl:px-14">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                  Purpose
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                  Organized competitive play.
                </h2>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-400">
                  The platform helps players manage teams, join tournaments,
                  follow official results, and compete through a cleaner system.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <Stat label="Focus" value="Teams" />
                <Stat label="System" value="Tournaments" />
                <Stat label="Tracking" value="Results" />
                <Stat label="Motto" value="Rise" />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                What Ascendra does
              </p>

              <h2 className="mt-1 text-xl font-black text-white">Core areas</h2>
            </div>

            <div>
              {values.map((item) => (
                <ValueRow
                  key={item.title}
                  title={item.title}
                  description={item.description}
                />
              ))}
            </div>
          </section>

          <section className="flex flex-col justify-between gap-4 rounded-3xl border border-violet-400/20 bg-violet-500/[0.06] p-6 shadow-2xl shadow-black/20 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                Start
              </p>

              <h2 className="mt-1 text-2xl font-black text-white">
                Join the next tournament.
              </h2>
            </div>

            <Link
              href="/tournaments"
              className="w-fit rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-500"
            >
              View tournaments
            </Link>
          </section>
        </section>

        <Footer />
      </div>
    </main>
  );
}
