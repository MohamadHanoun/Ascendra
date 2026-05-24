import AdminMatchPanel from "@/components/AdminMatchPanel";
import { prisma } from "@/lib/prisma";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p
        className="text-[11px] font-black uppercase tracking-[0.14em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {label}
      </p>

      <p
        className="mt-1 text-2xl font-black"
        style={{ color: "var(--asc-fg-0)" }}
      >
        {value}
      </p>
    </div>
  );
}

function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "blue" | "red" | "gray" | "violet";
}) {
  const styleMap: Record<string, React.CSSProperties> = {
    green: {
      color: "var(--asc-green)",
      borderColor: "oklch(0.55 0.14 150 / 0.5)",
      background: "oklch(0.25 0.12 150 / 0.18)",
    },
    blue: {
      color: "var(--asc-blue)",
      borderColor: "oklch(0.55 0.12 220 / 0.5)",
      background: "oklch(0.25 0.10 220 / 0.18)",
    },
    red: {
      color: "var(--asc-live)",
      borderColor: "oklch(0.50 0.20 25 / 0.5)",
      background: "oklch(0.25 0.18 25 / 0.18)",
    },
    gray: {
      color: "var(--asc-fg-3)",
      borderColor: "var(--asc-line-soft)",
      background: "transparent",
    },
    violet: {
      color: "var(--asc-accent)",
      borderColor: "oklch(0.50 0.20 285 / 0.4)",
      background: "var(--asc-accent-dim)",
    },
  };

  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-xs font-black capitalize"
      style={styleMap[tone]}
    >
      {children}
    </span>
  );
}

function getStatusTone(
  status: string,
): "green" | "blue" | "red" | "gray" | "violet" {
  const normalizedStatus = status.toLowerCase();

  if (["open", "live", "active", "approved"].includes(normalizedStatus)) {
    return "green";
  }

  if (["draft", "upcoming", "pending"].includes(normalizedStatus)) {
    return "blue";
  }

  if (["ended", "completed"].includes(normalizedStatus)) {
    return "violet";
  }

  if (["cancelled", "closed"].includes(normalizedStatus)) {
    return "red";
  }

  return "gray";
}

export default async function AdminMatchesPanel() {
  const tournaments = await prisma.tournament.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      registrationStatus: true,
      startsAt: true,
      game: {
        select: {
          name: true,
        },
      },
      registrations: {
        where: {
          status: {
            in: ["registered", "approved"],
          },
        },
        select: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      matches: {
        select: {
          id: true,
          round: true,
          matchNumber: true,
          teamAId: true,
          teamBId: true,
          teamA: {
            select: {
              id: true,
              name: true,
            },
          },
          teamB: {
            select: {
              id: true,
              name: true,
            },
          },
          scheduledAt: true,
          status: true,
          bestOf: true,
          scoreA: true,
          scoreB: true,
          winnerTeamId: true,
          confirmedByAdmin: true,
          notes: true,
        },
        orderBy: [
          {
            round: "asc",
          },
          {
            matchNumber: "asc",
          },
        ],
      },
    },
    orderBy: [
      {
        startsAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const totalMatches = tournaments.reduce(
    (total, tournament) => total + tournament.matches.length,
    0,
  );

  const tournamentsWithMatches = tournaments.filter(
    (tournament) => tournament.matches.length > 0,
  ).length;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p
            className="text-sm font-black uppercase tracking-[0.18em]"
            style={{ color: "var(--asc-accent)" }}
          >
            Manage matches
          </p>

          <h2
            className="mt-2 text-3xl font-black"
            style={{ color: "var(--asc-fg-0)" }}
          >
            Tournament matches
          </h2>

          <p
            className="mt-3 max-w-3xl text-sm leading-6"
            style={{ color: "var(--asc-fg-3)" }}
          >
            Create, edit, confirm, and delete matches for each tournament.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Stat label="Tournaments" value={tournaments.length} />
          <Stat label="With matches" value={tournamentsWithMatches} />
          <Stat label="Matches" value={totalMatches} />
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div
          className="border p-6 shadow-2xl shadow-black/20"
          style={{
            borderColor: "var(--asc-line-soft)",
            background: "var(--asc-bg-1)",
            color: "var(--asc-fg-3)",
          }}
        >
          No tournaments found.
        </div>
      ) : (
        <div className="grid gap-5">
          {tournaments.map((tournament, index) => {
            const registeredTeams = Array.from(
              new Map(
                tournament.registrations.map((registration) => [
                  registration.team.id,
                  {
                    id: registration.team.id,
                    name: registration.team.name,
                  },
                ]),
              ).values(),
            );

            const matches = tournament.matches.map((match) => ({
              ...match,
              scheduledAt: match.scheduledAt?.toISOString() ?? null,
            }));

            return (
              <details
                key={tournament.id}
                open={index === 0}
                className="group overflow-hidden border shadow-2xl shadow-black/20"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  background: "var(--asc-bg-1)",
                }}
              >
                <summary
                  className="flex cursor-pointer list-none flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.035] lg:flex-row lg:items-center lg:justify-between"
                  style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
                >
                  <div className="min-w-0">
                    <p
                      className="text-xs font-black uppercase tracking-[0.16em]"
                      style={{ color: "var(--asc-accent)" }}
                    >
                      {tournament.game?.name ?? "Tournament"}
                    </p>

                    <h3
                      className="mt-1 truncate text-xl font-black"
                      style={{ color: "var(--asc-fg-0)" }}
                    >
                      {tournament.title}
                    </h3>

                    <p
                      className="mt-1 text-sm"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      {tournament.startsAt
                        ? tournament.startsAt.toLocaleString("en", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "No start date"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={getStatusTone(tournament.status)}>
                      {tournament.status}
                    </Pill>

                    <Pill tone={getStatusTone(tournament.registrationStatus)}>
                      {tournament.registrationStatus}
                    </Pill>

                    <Pill tone="gray">{registeredTeams.length} teams</Pill>
                    <Pill tone="violet">{matches.length} matches</Pill>

                    <span
                      className="grid h-8 w-8 place-items-center text-sm font-black transition group-open:rotate-45"
                      style={{
                        border: "1px solid var(--asc-line-soft)",
                        background: "oklch(0.09 0.02 287)",
                        color: "var(--asc-fg-3)",
                      }}
                    >
                      +
                    </span>
                  </div>
                </summary>

                <div className="p-5">
                  <AdminMatchPanel
                    tournamentId={tournament.id}
                    matches={matches}
                    registeredTeams={registeredTeams}
                  />
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
