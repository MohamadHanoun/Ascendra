import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Home",
  description:
    "The Noobs of Temple & Rift is a gaming community for players, tournaments, teamwork, and shared moments.",
};

const highlights = [
  {
    title: "Community",
    description:
      "Meet players, join conversations, and become part of an active gaming group.",
  },
  {
    title: "Tournaments",
    description:
      "Follow RTN events, tournament updates, team slots, and competitive moments.",
  },
  {
    title: "Leaderboard",
    description:
      "Track rankings, activity, and community progress through the RTN leaderboard.",
  },
];

const quickLinks = [
  {
    href: "/tournaments",
    title: "Tournaments",
    description: "View active and upcoming RTN events.",
  },
  {
    href: "/leaderboard",
    title: "Leaderboard",
    description: "See community rankings and progress.",
  },
  {
    href: "/announcements",
    title: "Announcements",
    description: "Read the latest community updates.",
  },
  {
    href: "/rules",
    title: "Rules",
    description: "Learn how RTN keeps the community fair.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <Hero />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-10">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">
            RTN Community
          </p>

          <h2 className="max-w-3xl text-4xl font-black md:text-5xl">
            Built for players who enjoy games, teamwork, and competition.
          </h2>

          <p className="mt-5 max-w-2xl leading-8 text-gray-300">
            RTN brings members together through gaming sessions, tournaments,
            server events, and a friendly community space.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <h3 className="mb-4 text-2xl font-bold">{item.title}</h3>

              <p className="leading-7 text-gray-300">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">
              Explore
            </p>

            <h2 className="text-4xl font-black md:text-5xl">
              Start with the main RTN sections.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-3xl border border-white/10 bg-black/20 p-6 transition hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-indigo-500/10"
              >
                <h3 className="mb-3 text-xl font-bold">{item.title}</h3>

                <p className="leading-7 text-gray-300">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">
                Join RTN
              </p>

              <h2 className="text-4xl font-black md:text-5xl">
                Ready to be part of the community?
              </h2>

              <p className="mt-5 max-w-2xl leading-8 text-gray-300">
                Join the Discord server, meet other players, follow events, and
                stay connected with RTN.
              </p>
            </div>

            <a
              href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "#"}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-indigo-500 px-7 py-4 text-center font-bold text-white transition hover:-translate-y-1 hover:bg-indigo-400"
            >
              Join Discord
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}