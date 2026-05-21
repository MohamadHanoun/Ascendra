import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfileNotice from "@/components/ProfileNotice";
import TournamentDetailsRealtime from "@/components/TournamentDetailsRealtime";
import { TournamentRegistrationPanel } from "@/components/TournamentRegistrationPanel";
import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

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

function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "green" | "yellow" | "red" | "blue" | "gray" | "violet";
}) {
  const styles = {
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    yellow: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    red: "border-red-400/25 bg-red-500/10 text-red-300",
    blue: "border-blue-400/25 bg-blue-500/10 text-blue-300",
    gray: "border-white/10 bg-white/5 text-gray-300",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase().replace("registration ", "");

  const tone =
    normalizedStatus === "open" || normalizedStatus === "approved"
      ? "green"
      : normalizedStatus === "upcoming" ||
          normalizedStatus === "pending" ||
          normalizedStatus === "registered"
        ? "yellow"
        : normalizedStatus === "closed" || normalizedStatus === "rejected"
          ? "red"
          : normalizedStatus === "ended"
            ? "blue"
            : "gray";

  return <Pill tone={tone}>{status}</Pill>;
}

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

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-white/10 px-5 py-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
        {label}
      </p>

      <h2 className="mt-1 text-xl font-black text-white">{title}</h2>
    </div>
  );
}

function formatDate(date: Date) {
  return date.toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getSnapshotMemberCount(
  snapshotMembers: unknown,
  fallbackCount: number,
) {
  return Array.isArray(snapshotMembers)
    ? snapshotMembers.length
    : fallbackCount;
}

function PlacementBadge({ placement }: { placement: number }) {
  const tone = placement <= 3 ? "yellow" : "violet";

  return <Pill tone={tone}>#{placement}</Pill>;
}

function ProgressBar({
  approvedSlots,
  maxSlots,
}: {
  approvedSlots: number;
  maxSlots: number;
}) {
  const progress =
    maxSlots > 0 ? Math.min((approvedSlots / maxSlots) * 100, 100) : 0;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-4 text-xs font-bold text-gray-500">
        <span>
          {approvedSlots}/{maxSlots} approved
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
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

function getUnavailableTeamReason({
  teamGame,
  tournamentGame,
  memberCount,
  teamSize,
  pendingInvites,
}: {
  teamGame: string;
  tournamentGame: string;
  memberCount: number;
  teamSize: number;
  pendingInvites: number;
}) {
  if (teamGame !== tournamentGame) {
    return "Wrong game";
  }

  if (memberCount < teamSize) {
    return `Needs ${teamSize - memberCount} more player${
      teamSize - memberCount === 1 ? "" : "s"
    }`;
  }

  if (pendingInvites > 0) {
    return "Pending invites";
  }

  return "Not eligible";
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
              invites: {
                where: {
                  status: "pending",
                },
                select: {
                  id: true,
                },
              },
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
          snapshotTeamName: true,
          snapshotTeamGame: true,
          snapshotMembers: true,
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
          snapshotTeamName: true,
          snapshotTeamGame: true,
          snapshotMembers: true,
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

  const approvedSlots = approvedRegistrations.length;
  const totalApplications = submittedRegistrations.length;
  const remainingSlots = Math.max(tournament.maxSlots - approvedSlots, 0);

  const openRegistrationTeamIds = new Set(
    userTournamentRegistrations
      .filter((registration) =>
        ["registered", "approved"].includes(registration.status),
      )
      .map((registration) => registration.teamId),
  );

  const registerableOwnedTeams =
    currentUser?.ownedTeams.filter(
      (team) => !openRegistrationTeamIds.has(team.id),
    ) || [];

  const availableTeams = registerableOwnedTeams
    .filter((team) => {
      const gameMatches = team.game === tournament.game;
      const hasEnoughPlayers = team.members.length >= tournament.teamSize;
      const hasNoPendingInvites = team.invites.length === 0;

      return gameMatches && hasEnoughPlayers && hasNoPendingInvites;
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((team) => ({
      id: team.id,
      name: team.name,
      game: team.game,
      memberCount: team.members.length,
    }));

  const unavailableTeams = registerableOwnedTeams
    .filter((team) => {
      const gameMatches = team.game === tournament.game;
      const hasEnoughPlayers = team.members.length >= tournament.teamSize;
      const hasNoPendingInvites = team.invites.length === 0;

      return !gameMatches || !hasEnoughPlayers || !hasNoPendingInvites;
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((team) => ({
      id: team.id,
      name: team.name,
      game: team.game,
      memberCount: team.members.length,
      reason: getUnavailableTeamReason({
        teamGame: team.game,
        tournamentGame: tournament.game,
        memberCount: team.members.length,
        teamSize: tournament.teamSize,
        pendingInvites: team.invites.length,
      }),
    }));

  const activeRegistrations = userTournamentRegistrations
    .filter((registration) => registration.status !== "cancelled")
    .map((registration) => ({
      id: registration.id,
      status: registration.status,
      teamName: registration.team.name,
      rejectionReason: registration.rejectionReason,
    }));

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[560px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("${tournamentImage}")`,
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.62)_48%,rgba(7,8,17,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <Link
              href="/tournaments"
              className="mb-8 inline-flex rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              ← Back to tournaments
            </Link>

            <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={tournament.status} />
                    <StatusBadge
                      status={`Registration ${tournament.registrationStatus}`}
                    />
                    <Pill tone="violet">{tournament.game}</Pill>
                  </div>

                  <h1 className="mt-5 max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">
                    {tournament.title}
                  </h1>

                  {tournament.description && (
                    <p className="mt-5 max-w-3xl text-base leading-7 text-gray-300">
                      {tournament.description}
                    </p>
                  )}
                </div>

                <div className="grid gap-5">
                  <div className="grid grid-cols-2 gap-5">
                    <Stat label="Date" value={tournament.date} />
                    <Stat label="Prize" value={tournament.prize} />
                    <Stat
                      label="Team"
                      value={`${tournament.teamSize}v${tournament.teamSize}`}
                    />
                    <Stat label="Slots left" value={remainingSlots} />
                  </div>

                  <ProgressBar
                    approvedSlots={approvedSlots}
                    maxSlots={tournament.maxSlots}
                  />

                  <p className="text-sm text-gray-500">
                    {totalApplications} application
                    {totalApplications === 1 ? "" : "s"} submitted.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 lg:px-10 2xl:px-14">
          <ProfileNotice
            message={noticeParams.message}
            error={noticeParams.error}
          />

          <TournamentDetailsRealtime tournamentId={tournament.id} />

          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <SectionTitle label="Registration" title="Register your team" />

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
                  unavailableTeams={unavailableTeams}
                  activeRegistrations={activeRegistrations}
                />
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <SectionTitle label="Teams" title="Applications" />

              {tournament.registrations.length === 0 ? (
                <div className="p-5 text-gray-300">
                  No teams registered yet.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {tournament.registrations.map((registration) => {
                    const teamName =
                      registration.snapshotTeamName || registration.team.name;
                    const teamGame =
                      registration.snapshotTeamGame || registration.team.game;
                    const memberCount = getSnapshotMemberCount(
                      registration.snapshotMembers,
                      registration.team.members.length,
                    );

                    return (
                      <div
                        key={registration.id}
                        className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_110px_110px] md:items-center"
                      >
                        <div>
                          <p className="font-black text-white">{teamName}</p>

                          <p className="mt-1 text-sm text-gray-400">
                            {teamGame} · {memberCount}/{tournament.teamSize}{" "}
                            players
                          </p>
                        </div>

                        <StatusBadge status={registration.status} />

                        <p className="text-sm text-gray-500">
                          {formatDate(registration.createdAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {tournament.results.length > 0 && (
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <SectionTitle label="Results" title="Final standings" />

              <div className="divide-y divide-white/10">
                {tournament.results.map((result) => {
                  const teamName = result.snapshotTeamName || result.team.name;
                  const teamGame = result.snapshotTeamGame || result.team.game;
                  const memberCount = getSnapshotMemberCount(
                    result.snapshotMembers,
                    result.team.members.length,
                  );

                  return (
                    <article
                      key={result.id}
                      className="grid gap-4 px-5 py-4 md:grid-cols-[100px_minmax(0,1fr)_120px] md:items-center"
                    >
                      <PlacementBadge placement={result.placement} />

                      <div>
                        <p className="font-black text-white">{teamName}</p>

                        <p className="mt-1 text-sm text-gray-400">
                          {teamGame} · {memberCount} player
                          {memberCount === 1 ? "" : "s"}
                        </p>

                        {result.note && (
                          <p className="mt-2 text-sm text-gray-500">
                            {result.note}
                          </p>
                        )}
                      </div>

                      <Pill tone="green">{result.points} points</Pill>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}
