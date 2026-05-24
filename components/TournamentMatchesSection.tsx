type MatchTeam = { id: string; name: string };

type PublicMatch = {
  id: string;
  round: number;
  matchNumber: number;
  teamA: MatchTeam | null;
  teamB: MatchTeam | null;
  scheduledAt: Date | null;
  status: string;
  bestOf: number;
  scoreA: number;
  scoreB: number;
  winnerTeamId: string | null;
  confirmedByAdmin: boolean;
};

type TournamentMatchesSectionProps = {
  matches: PublicMatch[];
  locale: string;
};

function MatchStatusBadge({ status }: { status: string }) {
  if (status === "live") {
    return (
      <span
        className="inline-flex items-center gap-1.5 border px-3 py-1 text-xs font-black"
        style={{ color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" }}
      >
        <span className="asc-live-dot" />
        Live
      </span>
    );
  }

  const config: Record<string, { label: string; style: React.CSSProperties }> = {
    pending: {
      label: "Pending",
      style: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
    },
    scheduled: {
      label: "Scheduled",
      style: { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" },
    },
    completed: {
      label: "Completed",
      style: { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
    },
    cancelled: {
      label: "Cancelled",
      style: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
    },
  };

  const entry = config[status] ?? { label: status, style: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" } };

  return (
    <span className="inline-flex border px-3 py-1 text-xs font-black" style={entry.style}>
      {entry.label}
    </span>
  );
}

function MatchCard({ match, locale }: { match: PublicMatch; locale: string }) {
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";

  const teamAName = match.teamA?.name ?? "TBD";
  const teamBName = match.teamB?.name ?? "TBD";

  const teamAWon = isCompleted && match.winnerTeamId === match.teamA?.id;
  const teamBWon = isCompleted && match.winnerTeamId === match.teamB?.id;

  return (
    <div
      className="px-5 py-4 transition-colors"
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

        <div className="min-w-[80px] text-center">
          {isCompleted ? (
            <p className="text-lg font-black tabular-nums" style={{ color: "var(--asc-fg-0)" }}>
              {match.scoreA}{" "}
              <span style={{ color: "var(--asc-fg-3)" }}>—</span>{" "}
              {match.scoreB}
            </p>
          ) : (
            <p className="text-sm font-black uppercase tracking-widest" style={{ color: "var(--asc-fg-3)" }}>
              vs
            </p>
          )}
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
        <MatchStatusBadge status={match.status} />

        <span className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
          Bo{match.bestOf}
        </span>

        {match.scheduledAt && (
          <span className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
            {match.scheduledAt.toLocaleString(
              locale === "ar" ? "ar" : "en",
              { dateStyle: "medium", timeStyle: "short" },
            )}
          </span>
        )}

        {isCompleted && match.confirmedByAdmin && (
          <span className="text-xs font-black" style={{ color: "var(--asc-green)" }}>
            ✓ Official
          </span>
        )}
      </div>
    </div>
  );
}

export default function TournamentMatchesSection({
  matches,
  locale,
}: TournamentMatchesSectionProps) {
  if (matches.length === 0) return null;

  const rounds = matches.reduce<Record<number, PublicMatch[]>>((acc, m) => {
    (acc[m.round] ??= []).push(m);
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
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
          Schedule
        </p>
        <h2 className="mt-1 text-xl" style={{ color: "var(--asc-fg-0)" }}>Matches</h2>
      </div>

      <div>
        {roundNumbers.map((round) => (
          <div key={round}>
            <div className="px-5 py-2.5" style={{ background: "oklch(0.10 0.03 287 / 0.5)" }}>
              <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                Round {round}
              </p>
            </div>

            <div>
              {rounds[round].map((match) => (
                <div key={match.id} style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
                  <MatchCard match={match} locale={locale} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
