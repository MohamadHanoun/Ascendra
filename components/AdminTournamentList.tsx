import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

type Tone = "green" | "yellow" | "red" | "blue" | "gray" | "violet";

function toneClass(tone: Tone) {
  const styles: Record<Tone, string> = {
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    yellow: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    red: "border-red-400/25 bg-red-500/10 text-red-300",
    blue: "border-blue-400/25 bg-blue-500/10 text-blue-300",
    gray: "border-white/10 bg-white/5 text-gray-300",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  };

  return styles[tone];
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const tones: Record<string, Tone> = {
    open: "green",
    upcoming: "yellow",
    closed: "red",
    cancelled: "gray",
    ended: "blue",
    registered: "violet",
    approved: "green",
    rejected: "red",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize ${toneClass(
        tones[normalizedStatus] || "gray",
      )}`}
    >
      {status}
    </span>
  );
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
          className="h-full rounded-full bg-violet-500 shadow-lg shadow-violet-500/25"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getSortPriority(status: string) {
  const priorities: Record<string, number> = {
    open: 0,
    upcoming: 1,
    closed: 2,
    ended: 3,
    cancelled: 4,
  };

  return priorities[status] ?? 10;
}

export default async function AdminTournamentList() {
  const tournaments = await prisma.tournament.findMany({
    select: {
      id: true,
      title: true,
      game: { select: { name: true, slug: true } },
      startsAt: true,
      imageUrl: true,
      maxTeams: true,
      teamSize: true,
      status: true,
      registrationStatus: true,
      createdAt: true,
      registrations: {
        where: { status: { in: ["registered", "approved", "rejected"] } },
        select: { id: true, status: true },
      },
      results: {
        select: { id: true, points: true },
      },
    },
  });

  const sortedTournaments = [...tournaments].sort((a, b) => {
    const statusA = getSortPriority(a.status);
    const statusB = getSortPriority(b.status);

    if (statusA !== statusB) return statusA - statusB;

    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const openTournaments = tournaments.filter(
    (t) => t.status === "open",
  ).length;

  const pendingApplications = tournaments.reduce(
    (total, t) =>
      total +
      t.registrations.filter((r) => r.status === "registered").length,
    0,
  );

  const totalApproved = tournaments.reduce(
    (total, t) =>
      total + t.registrations.filter((r) => r.status === "approved").length,
    0,
  );

  const totalResults = tournaments.reduce(
    (total, t) => total + t.results.length,
    0,
  );

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
            Manage tournaments
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            Tournament list
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            Open a tournament to manage details, registrations, and results.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <Stat label="Tournaments" value={tournaments.length} />
          <Stat label="Open" value={openTournaments} />
          <Stat label="Approved" value={totalApproved} />
          <Stat label="Pending" value={pendingApplications} />
        </div>
      </div>

      {sortedTournaments.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-gray-300 shadow-2xl shadow-black/20">
          No tournaments found.
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <div className="hidden border-b border-white/10 bg-black/20 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-gray-500 xl:grid xl:grid-cols-[90px_minmax(0,1fr)_170px_220px_150px_120px] xl:gap-5">
            <span>Image</span>
            <span>Tournament</span>
            <span>Status</span>
            <span>Slots</span>
            <span>Activity</span>
            <span>Action</span>
          </div>

          <div className="divide-y divide-white/10">
            {sortedTournaments.map((tournament) => {
              const approvedSlots = tournament.registrations.filter(
                (r) => r.status === "approved",
              ).length;

              const pendingCount = tournament.registrations.filter(
                (r) => r.status === "registered",
              ).length;

              const rejectedCount = tournament.registrations.filter(
                (r) => r.status === "rejected",
              ).length;

              const applications = tournament.registrations.length;
              const remainingSlots = Math.max(
                tournament.maxTeams - approvedSlots,
                0,
              );

              const tournamentImage = getTournamentImageUrl(
                tournament.game?.slug ?? null,
                tournament.imageUrl,
              );

              const tournamentPoints = tournament.results.reduce(
                (total, r) => total + r.points,
                0,
              );

              return (
                <article
                  key={tournament.id}
                  className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035] xl:grid-cols-[90px_minmax(0,1fr)_170px_220px_150px_120px] xl:items-center xl:gap-5"
                >
                  <div
                    className="h-16 rounded-2xl border border-white/10 bg-cover bg-center xl:w-[90px]"
                    style={{
                      backgroundImage: `linear-gradient(to bottom, rgba(7,8,17,0.06), rgba(7,8,17,0.62)), url("${tournamentImage}")`,
                    }}
                  />

                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-black text-white">
                      {tournament.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-400">
                      {tournament.game?.name ?? "—"} ·{" "}
                      {tournament.teamSize}v{tournament.teamSize}
                      {tournament.startsAt &&
                        ` · ${formatDate(tournament.startsAt)}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={tournament.status} />
                    <StatusBadge status={tournament.registrationStatus} />
                  </div>

                  <div className="grid gap-2">
                    <ProgressBar
                      approvedSlots={approvedSlots}
                      maxSlots={tournament.maxTeams}
                    />

                    <p className="text-xs font-bold text-gray-500">
                      {remainingSlots} slot{remainingSlots === 1 ? "" : "s"}{" "}
                      left
                    </p>
                  </div>

                  <div className="grid gap-1 text-sm">
                    <p className="font-bold text-white">
                      {applications} application
                      {applications === 1 ? "" : "s"}
                    </p>

                    <p className="text-gray-500">
                      {pendingCount} pending · {rejectedCount} rejected
                    </p>

                    {tournament.results.length > 0 && (
                      <p className="font-bold text-emerald-300">
                        {tournament.results.length} result
                        {tournament.results.length === 1 ? "" : "s"} ·{" "}
                        {tournamentPoints} pts
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/admin/tournaments/${tournament.id}`}
                    className="rounded-xl bg-violet-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-violet-500"
                  >
                    Manage
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {totalResults > 0 && (
        <p className="text-sm text-gray-500">
          Saved tournament results:{" "}
          <span className="font-black text-white">{totalResults}</span>
        </p>
      )}
    </section>
  );
}
