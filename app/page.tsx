import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RTN",
  description: "The Noobs of Temple & Rift tournament platform.",
};

const features = [
  {
    title: "Create teams",
    description:
      "Players create teams, invite members, and submit them for admin review.",
  },
  {
    title: "Join tournaments",
    description:
      "Approved teams can register for open tournaments that match their game.",
  },
  {
    title: "Admin review",
    description:
      "Admins approve teams and tournament registrations from clear review pages.",
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "border-green-500/20 bg-green-500/10 text-green-300",
    approved: "border-green-500/20 bg-green-500/10 text-green-300",
    upcoming: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    pending: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    closed: "border-red-500/20 bg-red-500/10 text-red-300",
    rejected: "border-red-500/20 bg-red-500/10 text-red-300",
    registered: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  };

  const normalizedStatus = status.toLowerCase();

  return (
    <span
      className={`inline-flex rounded border px-2.5 py-1 text-xs font-bold capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
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
      className="inline-flex rounded bg-indigo-500 px-6 py-3 font-black text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
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
      className="inline-flex rounded border border-white/10 bg-white/5 px-6 py-3 font-black text-white transition hover:bg-white/10"
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
      <p className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
        {label}
      </p>

      <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">
        {title}
      </h2>

      <p className="mt-4 text-lg leading-8 text-gray-300">{description}</p>
    </div>
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
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-[#0b0f1a]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.28)_0%,transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.16)_0%,transparent_28%)]" />

        <div className="relative z-10">
          <Navbar />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-5 text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              RTN Tournament Platform
            </p>

            <h1 className="max-w-5xl text-5xl font-black leading-[1.04] tracking-tight md:text-7xl">
              Run teams and tournaments without the clutter.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              Create teams, join tournaments, manage registrations, and keep the
              RTN community organized through a clean and practical platform.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <PrimaryLink href="/tournaments">Explore tournaments</PrimaryLink>
              <SecondaryLink href="/profile">Create a team</SecondaryLink>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/30">
            <div className="rounded-md border border-white/10 bg-[#0b0f1a]">
              <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
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
                    Upcoming RTN tournaments will appear here when they are
                    created by the admin team.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {tournaments.map((tournament) => {
                    const registeredTeams = tournament.registrations.length;

                    return (
                      <div
                        key={tournament.id}
                        className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                      >
                        <div>
                          <p className="font-black text-white">
                            {tournament.title}
                          </p>

                          <p className="mt-1 text-sm text-gray-400">
                            {tournament.game} · {tournament.teamSize}v
                            {tournament.teamSize} · {registeredTeams}/
                            {tournament.maxSlots} teams
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <StatusBadge status={tournament.status} />
                          <StatusBadge
                            status={`Registration ${tournament.registrationStatus}`}
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
          className="absolute bottom-[-1px] left-0 w-full text-[#0b0f1a]"
          viewBox="0 0 1440 120"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
        </svg>
      </section>

      <section className="bg-[#0b0f1a] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            label="How it works"
            title="A simple flow for players and admins."
            description="Each part of the platform has one clear purpose, so users know what to do without needing extra explanation."
          />

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="rounded-lg border border-white/10 bg-white/5 p-8"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded bg-indigo-500 text-lg font-black text-white">
                  {index + 1}
                </div>

                <h3 className="text-2xl font-black text-white">
                  {feature.title}
                </h3>

                <p className="mt-4 leading-7 text-gray-300">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black/20 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            label="Tournaments"
            title="RTN tournament list."
            description="The tournament page should stay clean and focused. Details and registration should open in a separate focused page."
          />

          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-sm">
            <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr_auto] border-b border-white/10 bg-white/[0.04] px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-gray-400 lg:grid">
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
                    <p className="font-black text-white">{tournament.title}</p>
                    <p className="mt-1 text-sm text-gray-400">
                      {tournament.date}
                    </p>
                  </div>

                  <p className="text-gray-300">{tournament.game}</p>

                  <p className="font-bold text-white">
                    {tournament.teamSize}v{tournament.teamSize}
                  </p>

                  <p className="font-bold text-white">
                    {tournament.registrations.length}/{tournament.maxSlots}
                  </p>

                  <StatusBadge status={tournament.status} />

                  <Link
                    href="/tournaments"
                    className="rounded bg-indigo-500 px-4 py-2 text-center text-sm font-black text-white transition hover:bg-indigo-400"
                  >
                    Details
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#0b0f1a] px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
              Player experience
            </p>

            <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              Profile should be clear, not crowded.
            </h2>

            <p className="mt-5 text-lg leading-8 text-gray-300">
              Players should see Discord status, invitations, teams, and
              tournament access clearly. Full team management should happen in
              focused pages, not all at once.
            </p>

            <div className="mt-8 flex gap-3">
              <PrimaryLink href="/profile">Open profile</PrimaryLink>

              <Link
                href="/tournaments"
                className="rounded border border-white/10 px-6 py-3 font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                View tournaments
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 shadow-sm">
            <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
                Profile structure
              </p>

              <h3 className="mt-2 text-2xl font-black text-white">
                What should be visible first
              </h3>
            </div>

            <div className="divide-y divide-white/10">
              <div className="flex items-center justify-between px-6 py-5">
                <span className="font-bold text-white">Discord status</span>
                <StatusBadge status="Approved" />
              </div>

              <div className="flex items-center justify-between px-6 py-5">
                <span className="font-bold text-white">Team invitations</span>
                <span className="rounded bg-indigo-500 px-2.5 py-1 text-xs font-bold text-white">
                  Visible as notification
                </span>
              </div>

              <div className="flex items-center justify-between px-6 py-5">
                <span className="font-bold text-white">My teams</span>
                <span className="font-black text-white">Compact list</span>
              </div>

              <div className="flex items-center justify-between px-6 py-5">
                <span className="font-bold text-white">Team management</span>
                <span className="font-black text-white">Separate page</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
