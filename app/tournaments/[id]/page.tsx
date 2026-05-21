import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfileNotice from "@/components/ProfileNotice";
import { TournamentRegistrationPanel } from "@/components/TournamentRegistrationPanel";
import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";
import TournamentDetailsRealtime from "@/components/TournamentDetailsRealtime";


export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tournament Details | Ascendra",
  description: "Tournament details and registration.",
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
    open: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    approved: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    registered: "border-violet-400/25 bg-violet-500/10 text-violet-200",
    upcoming: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    pending: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    closed: "border-red-400/25 bg-red-500/10 text-red-300",
    cancelled: "border-white/10 bg-white/5 text-gray-300",
    rejected: "border-red-400/25 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

function InfoBox({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-base font-black text-white">
        {value}
      </p>
    </div>
  );
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="bg-white/[0.03] px-5 py-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
        {label}
      </p>

      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
    </div>
  );
}

function formatDate(date: Date) {
  return date.toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function PlacementBadge({ placement }: { placement: number }) {
  const isTopThree = placement <= 3;

  return (
    <span
      className={`grid h-11 w-11 place-items-center rounded-2xl border text-lg font-black ${
        isTopThree
          ? "border-yellow-400/25 bg-yellow-500/10 text-yellow-300"
          : "border-violet-400/25 bg-violet-500/10 text-violet-200"
      }`}
    >
      #{placement}
    </span>
  );
}

function ProgressBar({
  usedSlots,
  maxSlots,
}: {
  usedSlots: number;
  maxSlots: number;
}) {
  const progress =
    maxSlots > 0 ? Math.min((usedSlots / maxSlots) * 100, 100) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-center justify-between gap-4 text-xs font-bold text-gray-500">
        <span>
          {usedSlots}/{maxSlots} approved teams
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}

function ApplicationCounterBar({
  totalApplications,
}: {
  totalApplications: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-center justify-between gap-4 text-xs font-bold text-gray-500">
        <span>Total applications</span>

        <span>
          {totalApplications} team{totalApplications === 1 ? "" : "s"} applied
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-full rounded-full bg-white/10" />
      </div>
    </div>
  );
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
      imageUrl: true,
      maxSlots: true,
      teamSize: true,
      status: true,
      registrationStatus: true,
      results: {
        select: {
          id: true,
          placement: true,
          points: true,
          note: true,
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
        orderBy: [
          {
            placement: "asc",
          },
          {
            awardedAt: "desc",
          },
        ],
      },
      registrations: {
        where: {
          status: {
            in: ["registered", "approved", "rejected"],
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

  const tournamentImage = getTournamentImageUrl(
    tournament.game,
    tournament.imageUrl,
  );

  const ownedTeamIds = currentUser?.ownedTeams.map((team) => team.id) || [];

  const userTournamentRegistrations =
    currentUser && ownedTeamIds.length > 0
      ? await prisma.tournamentRegistration.findMany({
          where: {
            tournamentId: tournament.id,
            teamId: {
              in: ownedTeamIds,
            },
          },
          include: {
            team: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      : [];

  const approvedRegistrations = tournament.registrations.filter(
    (registration) => registration.status === "approved",
  );

  const submittedRegistrations = tournament.registrations.filter(
    (registration) =>
      ["registered", "approved", "rejected"].includes(registration.status),
  );

  const usedSlots = approvedRegistrations.length;
  const totalApplications = submittedRegistrations.length;
  const remainingSlots = Math.max(tournament.maxSlots - usedSlots, 0);

  const openRegistrationTeamIds = new Set(
    userTournamentRegistrations
      .filter((registration) =>
        ["registered", "approved"].includes(registration.status),
      )
      .map((registration) => registration.teamId),
  );

  const availableTeams =
    currentUser?.ownedTeams
      .filter((team) => {
        const gameMatches = team.game === tournament.game;
        const hasEnoughPlayers = team.members.length >= tournament.teamSize;
        const isAlreadyOpen = openRegistrationTeamIds.has(team.id);

        return gameMatches && hasEnoughPlayers && !isAlreadyOpen;
      })
      .map((team) => ({
        id: team.id,
        name: team.name,
        game: team.game,
        memberCount: team.members.length,
      })) || [];

  const activeRegistrations = userTournamentRegistrations.map(
    (registration) => ({
      id: registration.id,
      status: registration.status,
      teamName: registration.team.name,
      rejectionReason: registration.rejectionReason,
    }),
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[620px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("${tournamentImage}")`,
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.90)_0%,rgba(7,8,17,0.58)_44%,rgba(7,8,17,0.76)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.22),transparent_34%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-32 pt-20 lg:px-10 2xl:px-14">
            <Link
              href="/tournaments"
              className="mb-8 inline-flex rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              ← Back to tournaments
            </Link>

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
              <div>
                <div className="mb-5 flex flex-wrap gap-2">
                  <StatusBadge status={tournament.status} />
                  <StatusBadge
                    status={`Registration ${tournament.registrationStatus}`}
                  />

                  <span className="inline-flex rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-200">
                    {tournament.game}
                  </span>
                </div>

                <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">
                  {tournament.title}
                </h1>

                {tournament.description && (
                  <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-300">
                    {tournament.description}
                  </p>
                )}
              </div>

              <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur">
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <InfoBox label="Date" value={tournament.date} />
                  <InfoBox label="Prize" value={tournament.prize} />
                  <InfoBox
                    label="Team size"
                    value={`${tournament.teamSize}v${tournament.teamSize}`}
                  />
                  <InfoBox label="Approved slots left" value={remainingSlots} />
                </div>

                <div className="grid gap-3 px-4 pb-4">
                  <ProgressBar
                    usedSlots={usedSlots}
                    maxSlots={tournament.maxSlots}
                  />

                  <ApplicationCounterBar
                    totalApplications={totalApplications}
                  />
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="relative -mt-20 mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 lg:px-10 2xl:px-14">
          <ProfileNotice
            message={noticeParams.message}
            error={noticeParams.error}
          />

          <TournamentDetailsRealtime tournamentId={tournament.id} />

          {tournament.results.length > 0 && (
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
              <SectionHeader label="Results" title="Final standings" />

              <div className="divide-y divide-white/10">
                {tournament.results.map((result) => (
                  <article
                    key={result.id}
                    className="grid gap-4 px-5 py-4 md:grid-cols-[70px_minmax(0,1fr)_130px_120px] md:items-center"
                  >
                    <PlacementBadge placement={result.placement} />

                    <div>
                      <p className="font-black text-white">
                        {result.team.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        {result.team.game} · {result.team.members.length} player
                        {result.team.members.length === 1 ? "" : "s"}
                      </p>

                      {result.note && (
                        <p className="mt-2 text-sm text-gray-500">
                          {result.note}
                        </p>
                      )}
                    </div>

                    <p className="text-sm font-black text-emerald-300">
                      {result.points} points
                    </p>

                    <p className="text-sm font-bold text-gray-300">
                      #{result.placement}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
              <SectionHeader label="Registration" title="Register your team" />

              <div className="p-5">
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

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
              <SectionHeader label="Teams" title="Team applications" />

              {tournament.registrations.length === 0 ? (
                <div className="p-5 text-gray-300">
                  No teams registered yet.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {tournament.registrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_120px_160px_120px] md:items-center"
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
      </div>
    </main>
  );
}
