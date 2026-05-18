import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfileNotice from "@/components/ProfileNotice";
import TournamentRegistrationPanel from "@/components/TournamentRegistrationPanel";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tournament Details",
  description: "View RTN tournament details and registration options.",
};

type TournamentDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase().replace("registration ", "");

  const styles: Record<string, string> = {
    open: "border-green-500/20 bg-green-500/10 text-green-300",
    approved: "border-green-500/20 bg-green-500/10 text-green-300",
    registered: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    upcoming: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    pending: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    closed: "border-red-500/20 bg-red-500/10 text-red-300",
    cancelled: "border-red-500/20 bg-red-500/10 text-red-300",
    rejected: "border-red-500/20 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded border px-3 py-1 text-xs font-bold capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 px-6 py-5">
      <span className="font-bold text-gray-300">{label}</span>
      <span className="text-right font-black text-white">{value}</span>
    </div>
  );
}

function formatDate(date: Date) {
  return date.toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function TournamentDetailsPage({
  params,
  searchParams,
}: TournamentDetailsPageProps) {
  const { id } = await params;
  const noticeParams = await searchParams;
  const session = await auth();

  const currentUser = session?.user?.databaseId
    ? await prisma.user.findUnique({
        where: {
          id: session.user.databaseId,
        },
        include: {
          ownedTeams: {
            include: {
              members: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      })
    : null;

  const ownedTeamIds = new Set(
    currentUser?.ownedTeams.map((team) => team.id) || [],
  );

  const tournament = await prisma.tournament.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      game: true,
      description: true,
      date: true,
      prize: true,
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
          status: true,
          teamId: true,
          createdAt: true,
          team: {
            select: {
              id: true,
              name: true,
              game: true,
              members: {
                include: {
                  user: true,
                },
                orderBy: {
                  joinedAt: "asc",
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  const usedSlots = tournament.registrations.length;
  const remainingSlots = Math.max(tournament.maxSlots - usedSlots, 0);

  const availableTeams =
    currentUser?.ownedTeams
      .filter((team) => {
        const gameMatches = team.game === tournament.game;
        const hasEnoughPlayers = team.members.length >= tournament.teamSize;

        return gameMatches && hasEnoughPlayers;
      })
      .map((team) => ({
        id: team.id,
        name: team.name,
        game: team.game,
        memberCount: team.members.length,
      })) || [];

  const activeRegistrations = tournament.registrations
    .filter((registration) => ownedTeamIds.has(registration.teamId))
    .map((registration) => ({
      id: registration.id,
      status: registration.status,
      teamName: registration.team.name,
    }));

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 bg-[#0b0f1a]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.24)_0%,transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.13)_0%,transparent_28%)]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16">
          <Link
            href="/tournaments"
            className="mb-8 inline-flex rounded border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            ← Back to tournaments
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                <StatusBadge status={tournament.status} />

                <StatusBadge
                  status={`Registration ${tournament.registrationStatus}`}
                />

                <span className="inline-flex rounded border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
                  {tournament.game}
                </span>
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
                {tournament.title}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-300">
                {tournament.description}
              </p>
            </div>

            <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
                  Tournament Info
                </p>

                <h2 className="mt-2 text-2xl font-black">Details</h2>
              </div>

              <div className="divide-y divide-white/10">
                <InfoRow label="Date" value={tournament.date} />
                <InfoRow label="Prize" value={tournament.prize} />
                <InfoRow
                  label="Team size"
                  value={`${tournament.teamSize}v${tournament.teamSize}`}
                />
                <InfoRow
                  label="Slots"
                  value={`${usedSlots}/${tournament.maxSlots}`}
                />
                <InfoRow label="Remaining" value={remainingSlots} />
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <ProfileNotice
          message={noticeParams.message}
          error={noticeParams.error}
        />

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
                Registration
              </p>

              <h2 className="mt-2 text-2xl font-black">Register your team</h2>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                Choose one of your teams that matches this tournament game and
                has enough players. Tournament registration may still require
                admin review.
              </p>
            </div>

            <div className="p-6">
              <TournamentRegistrationPanel
                tournamentId={tournament.id}
                tournamentStatus={tournament.status}
                registrationStatus={tournament.registrationStatus}
                slotsRemaining={remainingSlots}
                teamSize={tournament.teamSize}
                isLoggedIn={Boolean(currentUser)}
                isGuildMember={Boolean(currentUser?.isGuildMember)}
                availableTeams={availableTeams}
                activeRegistrations={activeRegistrations}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
                Registered Teams
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Current registrations
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                Teams currently registered or waiting for tournament approval.
              </p>
            </div>

            {tournament.registrations.length === 0 ? (
              <div className="p-6 text-gray-300">No teams registered yet.</div>
            ) : (
              <div className="divide-y divide-white/10">
                {tournament.registrations.map((registration) => (
                  <div
                    key={registration.id}
                    className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_120px_160px_120px] md:items-center"
                  >
                    <div>
                      <p className="font-black text-white">
                        {registration.team.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        {registration.team.game} ·{" "}
                        {registration.team.members.length} players
                      </p>
                    </div>

                    <StatusBadge status={registration.status} />

                    <p className="text-sm text-gray-400">
                      {formatDate(registration.createdAt)}
                    </p>

                    <p className="text-sm font-bold text-gray-300">
                      {registration.team.members.length}/{tournament.teamSize}{" "}
                      players
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
