import Link from "next/link";

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
      borderColor: "var(--asc-green-border)",
      background: "var(--asc-green-bg)",
    },
    blue: {
      color: "var(--asc-blue)",
      borderColor: "var(--asc-blue-border)",
      background: "var(--asc-blue-bg)",
    },
    red: {
      color: "var(--asc-live)",
      borderColor: "var(--asc-live-border)",
      background: "var(--asc-live-bg)",
    },
    gray: {
      color: "var(--asc-fg-3)",
      borderColor: "var(--asc-line-soft)",
      background: "transparent",
    },
    violet: {
      color: "var(--asc-accent)",
      borderColor: "var(--asc-accent-border)",
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
  const s = status.toLowerCase();
  if (["open", "live", "active", "approved"].includes(s)) return "green";
  if (["draft", "upcoming", "pending"].includes(s)) return "blue";
  if (["ended", "completed"].includes(s)) return "violet";
  if (["cancelled", "closed"].includes(s)) return "red";
  return "gray";
}

function getMatchStatusTone(
  status: string,
): "green" | "blue" | "red" | "gray" | "violet" {
  switch (status) {
    case "completed":
    case "confirmed":
      return "violet";
    case "in_progress":
    case "ready":
    case "room_created":
      return "green";
    case "result_pending":
    case "disputed":
      return "red";
    case "bye":
    case "cancelled":
    case "forfeit":
      return "gray";
    default:
      return "blue";
  }
}

function getMatchStatusLabel(status: string) {
  if (status === "disputed") return "Admin review required";
  return status.replace(/_/g, " ");
}

export default async function AdminMatchesPanel() {
  const tournaments = await prisma.tournament.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      registrationStatus: true,
      startsAt: true,
      game: { select: { name: true } },
      tournamentMatches: {
        select: {
          id: true,
          roundNumber: true,
          matchNumber: true,
          teamAId: true,
          teamBId: true,
          winnerTeamId: true,
          status: true,
          bestOf: true,
          isBye: true,
        },
        orderBy: [{ roundNumber: "asc" }, { matchNumber: "asc" }],
      },
    },
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
  });

  // Batch-load all team names needed across all tournaments
  const allTeamIds = [
    ...new Set(
      tournaments.flatMap((t) =>
        t.tournamentMatches.flatMap((m) =>
          [m.teamAId, m.teamBId, m.winnerTeamId].filter((x): x is string =>
            Boolean(x),
          ),
        ),
      ),
    ),
  ];
  const teamRows =
    allTeamIds.length > 0
      ? await prisma.team.findMany({
          where: { id: { in: allTeamIds } },
          select: { id: true, name: true },
        })
      : [];
  const teamName = new Map(teamRows.map((t) => [t.id, t.name]));

  const totalMatches = tournaments.reduce(
    (total, t) => total + t.tournamentMatches.length,
    0,
  );
  const tournamentsWithMatches = tournaments.filter(
    (t) => t.tournamentMatches.length > 0,
  ).length;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h2
            className="text-2xl font-black"
            style={{ color: "var(--asc-fg-0)" }}
          >
            Matches
          </h2>

          <p
            className="mt-3 max-w-3xl text-sm leading-6"
            style={{ color: "var(--asc-fg-3)" }}
          >
            Review tournament brackets and jump into a match when it needs attention.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="border px-3 py-2 font-bold" style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-2)" }}>
            {tournaments.length} tournaments
          </span>
          <span className="border px-3 py-2 font-bold" style={{ borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }}>
            {tournamentsWithMatches} with matches
          </span>
          <span className="border px-3 py-2 font-bold" style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}>
            {totalMatches} matches
          </span>
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div
          className="border p-6 shadow-xl shadow-black/15"
          style={{
            borderColor: "var(--asc-line-soft)",
            background: "var(--asc-bg-1)",
            color: "var(--asc-fg-3)",
          }}
        >
          No tournaments found.
        </div>
      ) : (
          <div className="grid gap-4">
            {tournaments.map((tournament, index) => {
              const matches = tournament.tournamentMatches;

              return (
                <details
                  key={tournament.id}
                  open={index === 0}
                  className="group overflow-hidden border shadow-xl shadow-black/15"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  background: "var(--asc-bg-1)",
                }}
              >
                <summary
                  className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 transition hover:bg-white/[0.025] lg:flex-row lg:items-center lg:justify-between"
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
                      className="mt-1 truncate text-lg font-black"
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

                    <Pill tone="violet">{matches.length} matches</Pill>

                    <span
                      className="grid h-8 w-8 place-items-center text-sm font-black transition group-open:rotate-45"
                      style={{
                        border: "1px solid var(--asc-line-soft)",
                        background: "var(--asc-bg-2)",
                        color: "var(--asc-fg-3)",
                      }}
                    >
                      +
                    </span>
                  </div>
                </summary>

                <div className="p-5">
                  {matches.length === 0 ? (
                    <div className="flex items-center justify-between gap-4">
                      <p
                        className="text-sm"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        No bracket generated yet.
                      </p>
                      <Link
                        href={`/admin/tournaments/${tournament.id}`}
                        className="inline-flex items-center border px-4 py-2 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-90"
                        style={{
                          borderColor: "var(--asc-accent-border)",
                          color: "var(--asc-accent)",
                          background: "var(--asc-accent-dim)",
                        }}
                      >
                        Manage tournament →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <div
                        className="grid items-center gap-3 px-3 py-2 md:grid-cols-[60px_minmax(0,1fr)_110px_44px_100px]"
                        style={{
                          background: "var(--asc-card-muted)",
                          border: "1px solid var(--asc-line-soft)",
                        }}
                      >
                        {["Slot", "Teams", "Status", "BO", ""].map((h) => (
                          <span
                            key={h}
                            className="text-[10px] font-black uppercase tracking-[0.14em]"
                            style={{ color: "var(--asc-fg-3)" }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>

                      {matches.map((match) => {
                        const teamAName = match.teamAId
                          ? (teamName.get(match.teamAId) ?? "TBD")
                          : "TBD";
                        const teamBName = match.isBye
                          ? "BYE"
                          : match.teamBId
                            ? (teamName.get(match.teamBId) ?? "TBD")
                            : "TBD";
                        const winnerName = match.winnerTeamId
                          ? teamName.get(match.winnerTeamId)
                          : null;

                        return (
                          <div
                            key={match.id}
                            className="grid items-center gap-3 border px-3 py-2.5 transition hover:bg-white/[0.025] md:grid-cols-[60px_minmax(0,1fr)_110px_44px_100px]"
                            style={{ borderColor: "var(--asc-line-soft)" }}
                          >
                            <div className="flex flex-wrap gap-1">
                              <span
                                className="border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]"
                                style={{
                                  borderColor: "var(--asc-line-soft)",
                                  background: "var(--asc-bg-2)",
                                  color: "var(--asc-fg-3)",
                                }}
                              >
                                R{match.roundNumber}
                              </span>
                              <span
                                className="border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]"
                                style={{
                                  borderColor: "var(--asc-line-soft)",
                                  background: "var(--asc-bg-2)",
                                  color: "var(--asc-fg-3)",
                                }}
                              >
                                M{match.matchNumber}
                              </span>
                            </div>

                            <div>
                              <p
                                className="text-sm font-black leading-tight"
                                style={{ color: "var(--asc-fg-0)" }}
                              >
                                <span
                                  style={{
                                    color:
                                      winnerName &&
                                      winnerName === teamName.get(match.teamAId ?? "")
                                        ? "var(--asc-green)"
                                        : undefined,
                                  }}
                                >
                                  {teamAName}
                                </span>{" "}
                                <span style={{ color: "var(--asc-fg-3)" }}>
                                  vs
                                </span>{" "}
                                <span
                                  style={{
                                    color:
                                      winnerName &&
                                      winnerName === teamName.get(match.teamBId ?? "")
                                        ? "var(--asc-green)"
                                        : undefined,
                                  }}
                                >
                                  {teamBName}
                                </span>
                              </p>
                              {winnerName && (
                                <p
                                  className="mt-0.5 text-xs font-bold"
                                  style={{ color: "var(--asc-green)" }}
                                >
                                  ✓ {winnerName}
                                </p>
                              )}
                            </div>

                            <Pill tone={getMatchStatusTone(match.status)}>
                              {getMatchStatusLabel(match.status)}
                            </Pill>

                            <span
                              className="text-xs font-black tabular-nums"
                              style={{ color: "var(--asc-fg-3)" }}
                            >
                              BO{match.bestOf}
                            </span>

                            <Link
                              href={`/admin/tournaments/${tournament.id}/matches#match-${match.id}`}
                              className="inline-flex items-center justify-center border px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-90"
                              style={{
                                borderColor: "var(--asc-accent-border)",
                                color: "var(--asc-accent)",
                                background: "var(--asc-accent-dim)",
                              }}
                            >
                              Manage →
                            </Link>
                          </div>
                        );
                      })}

                      <div className="mt-2 flex justify-end">
                        <Link
                          href={`/admin/tournaments/${tournament.id}`}
                          className="inline-flex items-center border px-4 py-2 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-75"
                          style={{
                            borderColor: "var(--asc-line-soft)",
                            color: "var(--asc-fg-3)",
                          }}
                        >
                          Full tournament admin →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
