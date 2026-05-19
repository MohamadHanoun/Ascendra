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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tournament Details | Ascendra",
  description: "View Ascendra tournament details and registration options.",
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
    registered: "border-cyan-400/25 bg-cyan-500/10 text-cyan-300",
    upcoming: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    pending: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    closed: "border-red-400/25 bg-red-500/10 text-red-300",
    cancelled: "border-red-400/25 bg-red-500/10 text-red-300",
    rejected: "border-red-400/25 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize tracking-[0.08em] ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

function InfoBox({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-black text-white">{value}</p>
    </div>
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
    <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-300">
        {label}
      </p>

      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
        {description}
      </p>
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
      className={`grid h-11 w-11 place-items-center rounded-xl border text-lg font-black ${
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
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <div className="flex items-center justify-between gap-4 text-xs font-bold text-gray-400">
        <span>
          {usedSlots}/{maxSlots} slots used
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-violet-500 shadow-lg shadow-violet-500/30"
          style={{
            width: `${progress}%`,
          }}
        />
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

  const usedSlots = tournament.registrations.length;
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
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18)_0%,transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#0b0d17_45%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative overflow-hidden border-b border-white/10">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-35"
            style={{
              backgroundImage: `url("${tournamentImage}")`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070811]/70 via-[#070811]/88 to-[#070811]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.30)_0%,transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.10)_0%,transparent_28%)]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-16 lg:px-10">
            <Link
              href="/tournaments"
              className="mb-8 inline-flex rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              ← Back to tournaments
            </Link>

            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div className="pt-6">
                <div className="mb-5 flex flex-wrap gap-2">
                  <StatusBadge status={tournament.status} />
                  <StatusBadge
                    status={`Registration ${tournament.registrationStatus}`}
                  />

                  <span className="inline-flex rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-200">
                    {tournament.game}
                  </span>

                  {tournament.results.length > 0 && (
                    <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
                      Results posted
                    </span>
                  )}
                </div>

                <h1 className="max-w-4xl text-5xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">
                  {tournament.title}
                </h1>

                <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-300">
                  {tournament.description}
                </p>
              </div>

              <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur">
                <div
                  className="min-h-64 border-b border-white/10 bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(7,8,17,0.05), rgba(7,8,17,0.74)), url("${tournamentImage}")`,
                  }}
                />

                <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-300">
                    Tournament details
                  </p>

                  <h2 className="mt-2 text-2xl font-black">Core info</h2>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  <InfoBox label="Date" value={tournament.date} />
                  <InfoBox label="Prize" value={tournament.prize} />
                  <InfoBox
                    label="Team size"
                    value={`${tournament.teamSize}v${tournament.teamSize}`}
                  />
                  <InfoBox label="Slots left" value={remainingSlots} />
                </div>

                <div className="px-5 pb-5">
                  <ProgressBar
                    usedSlots={usedSlots}
                    maxSlots={tournament.maxSlots}
                  />
                </div>
              </section>
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

        <section className="mx-auto grid max-w-[1440px] gap-8 px-6 py-12 lg:px-10">
          <ProfileNotice
            message={noticeParams.message}
            error={noticeParams.error}
          />

          {tournament.results.length > 0 && (
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <SectionHeader
                label="Tournament results"
                title="Final standings"
                description="Results and tournament points awarded by the Ascendra admin team."
              />

              <div className="divide-y divide-white/10">
                {tournament.results.map((result) => (
                  <article
                    key={result.id}
                    className="grid gap-4 px-6 py-5 md:grid-cols-[70px_minmax(0,1fr)_130px_120px] md:items-center"
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
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <SectionHeader
                label="Registration"
                title="Register your team"
                description="Choose one of your teams that matches this tournament game and has enough players. Tournament registration may still require admin review."
              />

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

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <SectionHeader
                label="Registered teams"
                title="Current registrations"
                description="Teams currently registered or waiting for tournament approval."
              />

              {tournament.registrations.length === 0 ? (
                <div className="p-6 text-gray-300">
                  No teams registered yet.
                </div>
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
      </div>
    </main>
  );
}
