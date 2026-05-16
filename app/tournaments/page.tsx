import type { Metadata } from "next";
import { auth } from "@/auth";
import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import ProfileNotice from "@/components/ProfileNotice";
import TournamentRegistrationPanel from "@/components/TournamentRegistrationPanel";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tournaments",
  description: "Browse RTN tournaments and registration information.",
};

type TournamentsPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

function statusStyle(status: string) {
  if (status === "open") {
    return "border-green-500/20 bg-green-500/10 text-green-300";
  }

  if (status === "closed") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  return "border-indigo-500/20 bg-indigo-500/10 text-indigo-300";
}

function registrationStyle(status: string) {
  if (status === "open") {
    return "border-cyan-500/20 bg-cyan-500/10 text-cyan-300";
  }

  return "border-gray-500/20 bg-gray-500/10 text-gray-300";
}

function statusLabel(status: string) {
  if (status === "open") {
    return "Open";
  }

  if (status === "closed") {
    return "Closed";
  }

  return "Upcoming";
}

function registrationLabel(status: string) {
  if (status === "open") {
    return "Registration Open";
  }

  return "Registration Closed";
}

export default async function TournamentsPage({
  searchParams,
}: TournamentsPageProps) {
  const params = await searchParams;
  const session = await auth();

  const currentUser = session?.user?.databaseId
    ? await prisma.user.findUnique({
        where: {
          id: session.user.databaseId,
        },
        include: {
          ownedTeams: {
            where: {
              status: "approved",
            },
            include: {
              members: true,
            },
          },
        },
      })
    : null;

  const ownedTeamIds = new Set(
    currentUser?.ownedTeams.map((team) => team.id) || [],
  );

  const tournaments = await prisma.tournament.findMany({
    orderBy: {
      createdAt: "desc",
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
          team: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Tournaments"
        title="Compete with your team."
        description="Browse RTN tournaments, check registration status, and register your approved team."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <ProfileNotice message={params.message} error={params.error} />

        {tournaments.length === 0 ? (
          <EmptyState
            title="No tournaments yet"
            description="RTN tournaments will appear here when they are created by the admin team."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {tournaments.map((tournament) => {
              const usedSlots = tournament.registrations.length;
              const remainingSlots = Math.max(
                tournament.maxSlots - usedSlots,
                0,
              );

              const availableTeams =
                currentUser?.ownedTeams
                  .filter(
                    (team) =>
                      team.game === tournament.game &&
                      team.members.length >= tournament.teamSize,
                  )
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
                <article
                  key={tournament.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                >
                  <div className="border-b border-white/10 bg-white/[0.03] p-6">
                    <div className="mb-5 flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full border px-4 py-1 text-sm font-bold ${statusStyle(
                          tournament.status,
                        )}`}
                      >
                        {statusLabel(tournament.status)}
                      </span>

                      <span
                        className={`rounded-full border px-4 py-1 text-sm font-bold ${registrationStyle(
                          tournament.registrationStatus,
                        )}`}
                      >
                        {registrationLabel(tournament.registrationStatus)}
                      </span>
                    </div>

                    <h2 className="text-3xl font-black">{tournament.title}</h2>

                    <p className="mt-3 leading-7 text-gray-300">
                      {tournament.description}
                    </p>
                  </div>

                  <div className="grid gap-4 p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                          Game
                        </p>

                        <p className="mt-2 text-lg font-bold">
                          {tournament.game}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                          Date
                        </p>

                        <p className="mt-2 text-lg font-bold">
                          {tournament.date}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                          Team Size
                        </p>

                        <p className="mt-2 text-lg font-bold">
                          {tournament.teamSize} player
                          {tournament.teamSize === 1 ? "" : "s"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                          Slots
                        </p>

                        <p className="mt-2 text-lg font-bold">
                          {usedSlots}/{tournament.maxSlots} teams
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          {remainingSlots} slot
                          {remainingSlots === 1 ? "" : "s"} remaining
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
                        Prize
                      </p>

                      <p className="mt-2 text-xl font-black">
                        {tournament.prize}
                      </p>
                    </div>

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
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
