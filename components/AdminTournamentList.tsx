import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

function StatusBadge({ label, status }: { label: string; status: string }) {
  const normalizedStatus = status.toLowerCase();

  const styles: Record<string, string> = {
    open: "border-green-500/20 bg-green-500/10 text-green-300",
    upcoming: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    closed: "border-red-500/20 bg-red-500/10 text-red-300",
    cancelled: "border-white/10 bg-white/5 text-gray-300",
    registered: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    approved: "border-green-500/20 bg-green-500/10 text-green-300",
    rejected: "border-red-500/20 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {label}: {status}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
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
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-4 text-xs font-bold text-gray-400">
        <span>
          {usedSlots}/{maxSlots}
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-400"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}

export default async function AdminTournamentList() {
  const tournaments = await prisma.tournament.findMany({
    include: {
      registrations: {
        where: {
          status: {
            in: ["registered", "approved"],
          },
        },
        select: {
          id: true,
          status: true,
        },
      },
      results: {
        select: {
          id: true,
          points: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const openTournaments = tournaments.filter(
    (tournament) => tournament.status === "open",
  ).length;

  const openRegistrations = tournaments.filter(
    (tournament) => tournament.registrationStatus === "open",
  ).length;

  const totalResults = tournaments.reduce(
    (total, tournament) => total + tournament.results.length,
    0,
  );

  const totalPoints = tournaments.reduce(
    (total, tournament) =>
      total +
      tournament.results.reduce((sum, result) => sum + result.points, 0),
    0,
  );

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
            Manage Tournaments
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            Tournament list
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            Open a tournament to edit details, manage registration, and award
            tournament points.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Total" value={tournaments.length} />
          <StatCard label="Open" value={openTournaments} />
          <StatCard label="Reg. open" value={openRegistrations} />
          <StatCard label="Results" value={totalResults} />
          <StatCard label="Points" value={totalPoints} />
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-gray-300">
          No tournaments found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="hidden border-b border-white/10 bg-black/20 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-gray-400 xl:grid xl:grid-cols-[90px_minmax(0,1fr)_150px_170px_170px_120px] xl:gap-5">
            <span>Image</span>
            <span>Tournament</span>
            <span>Game</span>
            <span>Status</span>
            <span>Slots</span>
            <span>Action</span>
          </div>

          <div className="divide-y divide-white/10">
            {tournaments.map((tournament) => {
              const usedSlots = tournament.registrations.length;
              const remainingSlots = Math.max(
                tournament.maxSlots - usedSlots,
                0,
              );
              const tournamentImage = getTournamentImageUrl(
                tournament.game,
                tournament.imageUrl,
              );

              const tournamentPoints = tournament.results.reduce(
                (total, result) => total + result.points,
                0,
              );

              return (
                <article
                  key={tournament.id}
                  className="grid gap-4 p-5 transition hover:bg-white/[0.035] xl:grid-cols-[90px_minmax(0,1fr)_150px_170px_170px_120px] xl:items-center xl:gap-5"
                >
                  <div
                    className="h-16 w-full rounded-xl border border-white/10 bg-cover bg-center xl:w-[90px]"
                    style={{
                      backgroundImage: `linear-gradient(to bottom, rgba(11,15,26,0.05), rgba(11,15,26,0.55)), url("${tournamentImage}")`,
                    }}
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-xl font-black text-white">
                        {tournament.title}
                      </h3>

                      {tournament.results.length > 0 && (
                        <span className="inline-flex rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-black text-green-300">
                          {tournament.results.length} result
                          {tournament.results.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-gray-400">
                      {tournament.date}
                    </p>

                    {tournamentPoints > 0 && (
                      <p className="mt-1 text-xs font-bold text-green-300">
                        {tournamentPoints} tournament points awarded
                      </p>
                    )}
                  </div>

                  <p className="text-sm font-bold text-cyan-300">
                    {tournament.game}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      label="Tournament"
                      status={tournament.status}
                    />
                    <StatusBadge
                      label="Registration"
                      status={tournament.registrationStatus}
                    />
                  </div>

                  <div className="grid gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      <MiniStat label="Used" value={usedSlots} />
                      <MiniStat label="Left" value={remainingSlots} />
                      <MiniStat label="Max" value={tournament.maxSlots} />
                    </div>

                    <ProgressBar
                      usedSlots={usedSlots}
                      maxSlots={tournament.maxSlots}
                    />
                  </div>

                  <Link
                    href={`/admin/tournaments/${tournament.id}`}
                    className="rounded-xl bg-indigo-500 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-indigo-400"
                  >
                    Manage
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
