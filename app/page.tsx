import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ascendra",
  description: "Ascendra competitive gaming and tournament platform.",
};

const features = [
  {
    title: "Create a team",
    description:
      "Build a roster, invite players, and keep your squad ready for events.",
  },
  {
    title: "Register for events",
    description:
      "Join open tournaments when your team matches the game and team size.",
  },
  {
    title: "Track results",
    description:
      "Follow placements, points, and leaderboard progress after each event.",
  },
];

function StatusBadge({
  status,
  variant = "default",
}: {
  status: string;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const styles = {
    default: "border-violet-400/25 bg-violet-500/10 text-violet-200",
    success: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    warning: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    danger: "border-red-400/25 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${styles[variant]}`}
    >
      {status}
    </span>
  );
}

function getStatusVariant(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("open") || normalized.includes("approved")) {
    return "success";
  }

  if (normalized.includes("upcoming") || normalized.includes("pending")) {
    return "warning";
  }

  if (normalized.includes("closed") || normalized.includes("rejected")) {
    return "danger";
  }

  return "default";
}

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
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
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black text-white transition hover:border-violet-400/30 hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-violet-300">
        {label}
      </p>

      <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">
        {title}
      </h2>

      <p className="mt-4 text-base leading-8 text-gray-400 md:text-lg">
        {description}
      </p>
    </div>
  );
}

function FeatureCard({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <article className="group rounded-3xl border border-white/10 bg-white/[0.04] p-8 transition hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.06]">
      <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 text-lg font-black text-white shadow-lg shadow-violet-950/30">
        {index}
      </div>

      <h3 className="text-2xl font-black text-white">{title}</h3>

      <p className="mt-4 leading-7 text-gray-400">{description}</p>
    </article>
  );
}

export default async function HomePage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
    select: {
      id: true,
      title: true,
      game: true,
      date: true,
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
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18)_0%,transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#0b0d17_45%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative border-b border-white/10">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-85"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(7,8,17,0.98), rgba(7,8,17,0.68), rgba(7,8,17,0.94)), url("/images/backgrounds/home-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.22)_0%,transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08)_0%,transparent_28%)]" />

          <div className="relative z-10 grid w-full gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:py-24 2xl:px-14">
            <div>
              <p className="mb-5 text-sm font-black uppercase tracking-[0.22em] text-violet-300">
                Ascendra tournament platform
              </p>

              <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">
                Compete in organized community tournaments
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
                Create a team, register for events, and follow tournament
                progress from one clean player hub.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <PrimaryLink href="/tournaments">
                  Explore tournaments
                </PrimaryLink>
                <SecondaryLink href="/profile">Create a team</SecondaryLink>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#11121d]/85 p-4 shadow-2xl shadow-violet-950/25 backdrop-blur">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#080912]">
                <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-300">
                    Upcoming tournaments
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-white">
                    Tournament overview
                  </h2>
                </div>

                {tournaments.length === 0 ? (
                  <div className="px-5 py-6">
                    <p className="font-bold text-white">No tournaments yet</p>
                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      Upcoming Ascendra tournaments will appear here when they
                      are created by the admin team.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {tournaments.map((tournament) => {
                      const registeredTeams = tournament.registrations.length;

                      return (
                        <div
                          key={tournament.id}
                          className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-black text-white">
                              {tournament.title}
                            </p>

                            <p className="mt-1 text-sm text-gray-400">
                              {tournament.game} · {tournament.teamSize}v
                              {tournament.teamSize} · {registeredTeams}/
                              {tournament.maxSlots} teams
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            <StatusBadge
                              status={tournament.status}
                              variant={getStatusVariant(tournament.status)}
                            />
                            <StatusBadge
                              status={`Registration ${tournament.registrationStatus}`}
                              variant={getStatusVariant(
                                tournament.registrationStatus,
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <svg
            className="absolute bottom-[-1px] left-0 w-full text-[#070811]"
            viewBox="0 0 1440 120"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
          </svg>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
          <SectionHeader
            label="Platform flow"
            title="Teams, events, and results."
            description="Ascendra keeps the main player actions simple: create a team, enter events, and follow results."
          />

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                index={index + 1}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-black/20">
          <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
            <SectionHeader
              label="Tournaments"
              title="Ascendra tournament list."
              description="The tournament page stays clean and focused. Details and registration open in a separate page."
            />

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30">
              <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr_auto] border-b border-white/10 bg-white/[0.04] px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-gray-500 lg:grid">
                <span>Tournament</span>
                <span>Game</span>
                <span>Team size</span>
                <span>Teams</span>
                <span>Status</span>
                <span></span>
              </div>

              {tournaments.length === 0 ? (
                <div className="px-5 py-8 text-gray-300">
                  No tournaments available yet.
                </div>
              ) : (
                tournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="grid gap-4 border-b border-white/10 px-5 py-5 last:border-b-0 lg:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr_auto] lg:items-center"
                  >
                    <div>
                      <p className="font-black text-white">
                        {tournament.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {tournament.date}
                      </p>
                    </div>

                    <p className="text-sm font-bold text-violet-300">
                      {tournament.game}
                    </p>

                    <p className="font-bold text-white">
                      {tournament.teamSize}v{tournament.teamSize}
                    </p>

                    <p className="font-bold text-white">
                      {tournament.registrations.length}/{tournament.maxSlots}
                    </p>

                    <StatusBadge
                      status={tournament.status}
                      variant={getStatusVariant(tournament.status)}
                    />

                    <Link
                      href={`/tournaments/${tournament.id}`}
                      className="rounded-xl bg-violet-600 px-4 py-2 text-center text-sm font-black text-white transition hover:bg-violet-500"
                    >
                      Details
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-black/20">
          <div className="grid w-full gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-10 2xl:px-14">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-violet-300">
                Player hub
              </p>

              <h2 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl">
                One place for teams and tournament access.
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-400">
                The profile page gives players a quick overview of their
                account, invitations, teams, and tournament activity.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryLink href="/profile">Open profile</PrimaryLink>
                <SecondaryLink href="/tournaments">
                  View tournaments
                </SecondaryLink>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30">
              <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-300">
                  Profile overview
                </p>

                <h3 className="mt-2 text-2xl font-black text-white">
                  Main player information
                </h3>
              </div>

              <div className="divide-y divide-white/10">
                {[
                  ["Discord account", "Connection status"],
                  ["Team invitations", "Pending invites"],
                  ["My teams", "Created and joined teams"],
                  ["Tournament access", "Eligible registrations"],
                  ["Results", "Points and placements"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="grid gap-2 px-6 py-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center"
                  >
                    <span className="font-black text-white">{label}</span>

                    <span className="text-sm font-bold text-gray-400 sm:text-right">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
