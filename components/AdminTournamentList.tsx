import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

type Tone = "green" | "yellow" | "red" | "blue" | "gray" | "violet";

const toneStyleMap: Record<Tone, React.CSSProperties> = {
  green: { color: "var(--asc-green)", borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)" },
  yellow: { color: "var(--asc-amber)", borderColor: "var(--asc-amber-border)", background: "var(--asc-amber-bg)" },
  red: { color: "var(--asc-live)", borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)" },
  blue: { color: "var(--asc-blue)", borderColor: "var(--asc-blue-border)", background: "var(--asc-blue-bg)" },
  gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
  violet: { color: "var(--asc-accent)", borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)" },
};

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

  const tone = tones[normalizedStatus] ?? "gray";

  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black capitalize" style={toneStyleMap[tone]}>
      {status}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>{label}</p>
      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

function ProgressBar({ approvedSlots, maxSlots }: { approvedSlots: number; maxSlots: number }) {
  const progress = maxSlots > 0 ? Math.min((approvedSlots / maxSlots) * 100, 100) : 0;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-4 text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
        <span>{approvedSlots}/{maxSlots} approved</span>
        <span>{Math.round(progress)}%</span>
      </div>

      <div className="h-2 overflow-hidden" style={{ background: "var(--asc-line-soft)" }}>
        <div className="h-full" style={{ width: `${progress}%`, background: "var(--asc-accent-2)" }} />
      </div>
    </div>
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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
      results: { select: { id: true, points: true } },
    },
  });

  const sortedTournaments = [...tournaments].sort((a, b) => {
    const statusA = getSortPriority(a.status);
    const statusB = getSortPriority(b.status);
    if (statusA !== statusB) return statusA - statusB;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const openTournaments = tournaments.filter((t) => t.status === "open").length;

  const pendingApplications = tournaments.reduce(
    (total, t) => total + t.registrations.filter((r) => r.status === "registered").length,
    0,
  );

  const totalApproved = tournaments.reduce(
    (total, t) => total + t.registrations.filter((r) => r.status === "approved").length,
    0,
  );

  const totalResults = tournaments.reduce((total, t) => total + t.results.length, 0);

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
            Manage tournaments
          </p>
          <h2 className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>Tournament list</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
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
        <div className="border p-6 shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-3)" }}>
          No tournaments found.
        </div>
      ) : (
        <section className="overflow-hidden border shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
          <div
            className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] xl:grid xl:grid-cols-[90px_minmax(0,1fr)_170px_220px_150px_120px] xl:gap-5"
            style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "var(--asc-table-head-bg)", color: "var(--asc-fg-3)" }}
          >
            <span>Image</span>
            <span>Tournament</span>
            <span>Status</span>
            <span>Slots</span>
            <span>Activity</span>
            <span>Action</span>
          </div>

          <div>
            {sortedTournaments.map((tournament, idx) => {
              const approvedSlots = tournament.registrations.filter((r) => r.status === "approved").length;
              const pendingCount = tournament.registrations.filter((r) => r.status === "registered").length;
              const rejectedCount = tournament.registrations.filter((r) => r.status === "rejected").length;
              const applications = tournament.registrations.length;
              const remainingSlots = Math.max(tournament.maxTeams - approvedSlots, 0);
              const tournamentImage = getTournamentImageUrl(tournament.game?.slug ?? null, tournament.imageUrl);
              const tournamentPoints = tournament.results.reduce((total, r) => total + r.points, 0);

              return (
                <article
                  key={tournament.id}
                  className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035] xl:grid-cols-[90px_minmax(0,1fr)_170px_220px_150px_120px] xl:items-center xl:gap-5"
                  style={idx < sortedTournaments.length - 1 ? { borderBottom: "1px solid var(--asc-line-soft)" } : {}}
                >
                  <div
                    className="h-16 border bg-cover bg-center xl:w-[90px]"
                    style={{
                      borderColor: "var(--asc-line-soft)",
                      backgroundImage: `var(--asc-image-scrim), url("${tournamentImage}")`,
                    }}
                  />

                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{tournament.title}</h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                      {tournament.game?.name ?? "—"} · {tournament.teamSize}v{tournament.teamSize}
                      {tournament.startsAt && ` · ${formatDate(tournament.startsAt)}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={tournament.status} />
                    <StatusBadge status={tournament.registrationStatus} />
                  </div>

                  <div className="grid gap-2">
                    <ProgressBar approvedSlots={approvedSlots} maxSlots={tournament.maxTeams} />
                    <p className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
                      {remainingSlots} slot{remainingSlots === 1 ? "" : "s"} left
                    </p>
                  </div>

                  <div className="grid gap-1 text-sm">
                    <p className="font-bold" style={{ color: "var(--asc-fg-0)" }}>
                      {applications} application{applications === 1 ? "" : "s"}
                    </p>
                    <p style={{ color: "var(--asc-fg-3)" }}>
                      {pendingCount} pending · {rejectedCount} rejected
                    </p>
                    {tournament.results.length > 0 && (
                      <p className="font-bold" style={{ color: "var(--asc-green)" }}>
                        {tournament.results.length} result{tournament.results.length === 1 ? "" : "s"} · {tournamentPoints} pts
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Link
                      href={`/admin/tournaments/${tournament.id}`}
                      className="px-5 py-3 text-center text-sm font-black transition hover:opacity-90"
                      style={{ background: "var(--asc-accent-2)", color: "var(--asc-on-accent)" }}
                    >
                      Manage
                    </Link>
                    <Link
                      href={`/admin?tab=tournaments&duplicate=${tournament.id}`}
                      className="px-5 py-2 text-center text-xs font-black transition hover:opacity-90"
                      style={{ border: "1px solid var(--asc-line-soft)", color: "var(--asc-fg-2)" }}
                    >
                      Duplicate
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {totalResults > 0 && (
        <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
          Saved tournament results: <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>{totalResults}</span>
        </p>
      )}
    </section>
  );
}
