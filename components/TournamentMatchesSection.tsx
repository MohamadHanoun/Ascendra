import Link from "next/link";

type PublicMatch = {
  id: string;
  roundNumber: number;
  matchNumber: number;
  status: string;
  bestOf: number;
  isBye: boolean;
  teamAId: string | null;
  teamBId: string | null;
  winnerTeamId: string | null;
  scheduledAt: Date | null;
  teamAName: string | null;
  teamBName: string | null;
  winnerName: string | null;
};

export type TournamentMatchesSectionLabels = {
  scheduleEyebrow: string;
  matchesTitle: string;
  roundPrefix: string;
  matchCenter: string;
  live: string;
  statuses: {
    scheduled: string;
    ready: string;
    room_created: string;
    in_progress: string;
    result_pending: string;
    disputed: string;
    confirmed: string;
    completed: string;
    cancelled: string;
    forfeit: string;
    bye: string;
  };
};

type TournamentMatchesSectionProps = {
  tournamentId: string;
  matches: PublicMatch[];
  locale: string;
  labels: TournamentMatchesSectionLabels;
};

type StatusEntry = { label: string; style: React.CSSProperties };

function getStatusEntry(
  status: string,
  statuses: TournamentMatchesSectionLabels["statuses"],
): StatusEntry {
  const map: Record<string, StatusEntry> = {
    scheduled: {
      label: statuses.scheduled,
      style: {
        color: "var(--asc-blue)",
        borderColor: "oklch(0.55 0.12 220 / 0.5)",
        background: "oklch(0.25 0.10 220 / 0.18)",
      },
    },
    ready: {
      label: statuses.ready,
      style: {
        color: "var(--asc-green)",
        borderColor: "oklch(0.55 0.14 150 / 0.5)",
        background: "oklch(0.25 0.12 150 / 0.18)",
      },
    },
    room_created: {
      label: statuses.room_created,
      style: {
        color: "var(--asc-blue)",
        borderColor: "oklch(0.55 0.12 220 / 0.5)",
        background: "oklch(0.25 0.10 220 / 0.18)",
      },
    },
    in_progress: {
      label: statuses.in_progress,
      style: {
        color: "var(--asc-live)",
        borderColor: "oklch(0.50 0.20 25 / 0.5)",
        background: "oklch(0.25 0.18 25 / 0.18)",
      },
    },
    result_pending: {
      label: statuses.result_pending,
      style: {
        color: "var(--asc-amber)",
        borderColor: "oklch(0.65 0.14 75 / 0.5)",
        background: "oklch(0.25 0.12 75 / 0.18)",
      },
    },
    disputed: {
      label: statuses.disputed,
      style: {
        color: "var(--asc-live)",
        borderColor: "oklch(0.50 0.20 25 / 0.5)",
        background: "oklch(0.25 0.18 25 / 0.18)",
      },
    },
    confirmed: {
      label: statuses.confirmed,
      style: {
        color: "var(--asc-green)",
        borderColor: "oklch(0.55 0.14 150 / 0.5)",
        background: "oklch(0.25 0.12 150 / 0.18)",
      },
    },
    completed: {
      label: statuses.completed,
      style: {
        color: "var(--asc-accent)",
        borderColor: "oklch(0.50 0.20 285 / 0.4)",
        background: "var(--asc-accent-dim)",
      },
    },
    cancelled: {
      label: statuses.cancelled,
      style: {
        color: "var(--asc-live)",
        borderColor: "oklch(0.50 0.20 25 / 0.5)",
        background: "oklch(0.25 0.18 25 / 0.18)",
      },
    },
    forfeit: {
      label: statuses.forfeit,
      style: {
        color: "var(--asc-live)",
        borderColor: "oklch(0.50 0.20 25 / 0.5)",
        background: "oklch(0.25 0.18 25 / 0.18)",
      },
    },
    bye: {
      label: statuses.bye,
      style: {
        color: "var(--asc-fg-3)",
        borderColor: "var(--asc-line-soft)",
        background: "transparent",
      },
    },
  };
  return (
    map[status] ?? {
      label: status,
      style: {
        color: "var(--asc-fg-3)",
        borderColor: "var(--asc-line-soft)",
        background: "transparent",
      },
    }
  );
}

function MatchStatusBadge({
  status,
  liveLabel,
  statuses,
}: {
  status: string;
  liveLabel: string;
  statuses: TournamentMatchesSectionLabels["statuses"];
}) {
  const entry = getStatusEntry(status, statuses);
  const isLive = status === "in_progress";

  if (isLive) {
    return (
      <span
        className="inline-flex items-center gap-1.5 border px-3 py-1 text-xs font-black"
        style={entry.style}
      >
        <span className="asc-live-dot" />
        {liveLabel}
      </span>
    );
  }

  return (
    <span
      className="inline-flex border px-3 py-1 text-xs font-black"
      style={entry.style}
    >
      {entry.label}
    </span>
  );
}

function MatchCard({
  match,
  tournamentId,
  locale,
  matchCenter,
  liveLabel,
  statuses,
}: {
  match: PublicMatch;
  tournamentId: string;
  locale: string;
  matchCenter: string;
  liveLabel: string;
  statuses: TournamentMatchesSectionLabels["statuses"];
}) {
  const isLive = match.status === "in_progress";
  const isDone = ["completed", "confirmed", "forfeit"].includes(match.status);

  const teamAName = match.teamAName ?? "TBD";
  const teamBName = match.isBye ? "BYE" : (match.teamBName ?? "TBD");

  const teamAWon =
    isDone && Boolean(match.winnerTeamId) && match.winnerTeamId === match.teamAId;
  const teamBWon =
    isDone && Boolean(match.winnerTeamId) && match.winnerTeamId === match.teamBId;

  return (
    <Link
      href={`/tournaments/${tournamentId}/matches/${match.id}`}
      className="block px-5 py-4 transition-colors hover:bg-white/[0.03]"
      style={isLive ? { background: "oklch(0.65 0.22 25 / 0.04)" } : {}}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
        <div className="text-right">
          <p
            className="font-black leading-tight"
            style={{ color: teamAWon ? "var(--asc-green)" : "var(--asc-fg-0)" }}
          >
            {teamAName}
          </p>
        </div>

        <div className="min-w-[52px] text-center">
          <p
            className="text-sm font-black uppercase tracking-widest"
            style={{ color: "var(--asc-fg-3)" }}
          >
            vs
          </p>
        </div>

        <div>
          <p
            className="font-black leading-tight"
            style={{ color: teamBWon ? "var(--asc-green)" : "var(--asc-fg-0)" }}
          >
            {teamBName}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <MatchStatusBadge
          status={match.status}
          liveLabel={liveLabel}
          statuses={statuses}
        />

        <span className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
          Bo{match.bestOf}
        </span>

        {match.scheduledAt && (
          <span className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
            {match.scheduledAt.toLocaleString(locale === "ar" ? "ar" : "en", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        )}

        {match.winnerName && (
          <span className="text-xs font-black" style={{ color: "var(--asc-green)" }}>
            ✓ {match.winnerName}
          </span>
        )}

        <span
          className="ml-auto text-xs font-black uppercase tracking-[0.08em]"
          style={{ color: "var(--asc-accent)" }}
        >
          {matchCenter}
        </span>
      </div>
    </Link>
  );
}

export default function TournamentMatchesSection({
  tournamentId,
  matches,
  locale,
  labels,
}: TournamentMatchesSectionProps) {
  if (matches.length === 0) return null;

  const rounds = matches.reduce<Record<number, PublicMatch[]>>((acc, m) => {
    (acc[m.roundNumber] ??= []).push(m);
    return acc;
  }, {});

  const roundNumbers = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <section
      className="overflow-hidden border shadow-2xl"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
      >
        <p
          className="text-xs font-black uppercase tracking-[0.16em]"
          style={{ color: "var(--asc-accent)" }}
        >
          {labels.scheduleEyebrow}
        </p>
        <h2 className="mt-1 text-xl" style={{ color: "var(--asc-fg-0)" }}>
          {labels.matchesTitle}
        </h2>
      </div>

      <div>
        {roundNumbers.map((round) => (
          <div key={round}>
            <div
              className="px-5 py-2.5"
              style={{ background: "var(--asc-table-head-bg)" }}
            >
              <p
                className="text-[11px] font-black uppercase tracking-[0.14em]"
                style={{ color: "var(--asc-fg-3)" }}
              >
                {labels.roundPrefix} {round}
              </p>
            </div>

            <div>
              {rounds[round].map((match) => (
                <div
                  key={match.id}
                  style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
                >
                  <MatchCard
                    match={match}
                    tournamentId={tournamentId}
                    locale={locale}
                    matchCenter={labels.matchCenter}
                    liveLabel={labels.live}
                    statuses={labels.statuses}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
