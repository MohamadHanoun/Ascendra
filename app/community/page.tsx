import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community | Ascendra",
  description: "Ascendra community hub.",
};

const communityLinks = [
  {
    href: "/about",
    label: "About",
    title: "Platform purpose",
    description:
      "Learn what Ascendra is built for and how the platform supports organized competitive play.",
  },
  {
    href: "/rules",
    label: "Rules",
    title: "Community rules",
    description:
      "Read the active rules that keep tournaments and community activity fair and clear.",
  },
  {
    href: "/roles",
    label: "Roles",
    title: "Public roles",
    description:
      "View the roles used inside the community and understand what each role means.",
  },
  {
    href: "/staff",
    label: "Staff",
    title: "Staff team",
    description:
      "See the people helping manage Ascendra, events, and community operations.",
  },
  {
    href: "/stats",
    label: "Stats",
    title: "Platform stats",
    description:
      "Follow useful numbers from tournaments, results, rankings, and game activity.",
  },
];

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function CommunityRow({
  href,
  label,
  title,
  description,
}: {
  href: string;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="grid gap-3 border-b border-white/10 px-5 py-5 transition last:border-b-0 hover:bg-white/[0.035] md:grid-cols-[150px_minmax(0,1fr)_90px] md:items-center"
    >
      <p className="text-sm font-black uppercase tracking-[0.14em] text-violet-300">
        {label}
      </p>

      <div>
        <h2 className="text-xl font-black text-white">{title}</h2>

        <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
      </div>

      <span className="text-sm font-black text-gray-500 md:text-right">
        Open →
      </span>
    </Link>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="grid gap-3 border-b border-white/10 px-5 py-4 last:border-b-0 md:grid-cols-[80px_180px_minmax(0,1fr)] md:items-center">
      <p className="text-sm font-black text-violet-300">{number}</p>

      <h3 className="font-black text-white">{title}</h3>

      <p className="text-sm leading-6 text-gray-400">{description}</p>
    </article>
  );
}

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

export default async function CommunityPage() {
  const [
    activeRules,
    activeRoles,
    activeStaff,
    tournaments,
    tournamentResults,
  ] = await Promise.all([
    prisma.rule.count({
      where: {
        isActive: true,
      },
    }),

    prisma.role.count({
      where: {
        isActive: true,
      },
    }),

    prisma.staffMember.count({
      where: {
        isActive: true,
      },
    }),

    prisma.tournament.count(),

    prisma.tournamentResult.count(),
  ]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[480px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.62)_44%,rgba(7,8,17,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-28 pt-20 lg:px-10">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
              Ascendra community
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.04] tracking-tight text-white md:text-7xl">
              Community hub
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
              Everything around the Ascendra community in one clean place:
              purpose, rules, roles, staff, and platform activity.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryLink href="/tournaments">View tournaments</PrimaryLink>
              <SecondaryLink href="/rules">Read rules</SecondaryLink>
            </div>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:px-10">
          <section className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 md:grid-cols-2 xl:grid-cols-5">
            <Stat label="Rules" value={activeRules} />
            <Stat label="Roles" value={activeRoles} />
            <Stat label="Staff" value={activeStaff} />
            <Stat label="Tournaments" value={tournaments} />
            <Stat label="Results" value={tournamentResults} />
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                Directory
              </p>

              <h2 className="mt-1 text-xl font-black text-white">
                Community pages
              </h2>
            </div>

            <div>
              {communityLinks.map((link) => (
                <CommunityRow
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  title={link.title}
                  description={link.description}
                />
              ))}
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                  How it works
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
                  Clean community flow
                </h2>
              </div>

              <div>
                <Step
                  number="01"
                  title="Join"
                  description="Login with Discord and connect your Ascendra profile."
                />

                <Step
                  number="02"
                  title="Team up"
                  description="Create or join a team and prepare for tournaments."
                />

                <Step
                  number="03"
                  title="Register"
                  description="Submit a team application for open tournaments."
                />

                <Step
                  number="04"
                  title="Compete"
                  description="Play approved events and earn official points."
                />
              </div>
            </section>

            <aside className="rounded-3xl border border-violet-400/20 bg-violet-500/[0.06] p-6 shadow-2xl shadow-black/20">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                Quick access
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Ready to compete?
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-400">
                Open tournaments, create your team, and follow rankings from the
                same platform.
              </p>

              <div className="mt-6 grid gap-3">
                <PrimaryLink href="/profile">Open profile</PrimaryLink>
                <SecondaryLink href="/leaderboard">Leaderboard</SecondaryLink>
              </div>
            </aside>
          </section>
        </section>

        <Footer />
      </div>
    </main>
  );
}
