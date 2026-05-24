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
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-xs font-black text-red-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
        Live
      </span>
    );
  }

  const config: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "border-white/10 bg-white/5 text-gray-400",
    },
    scheduled: {
      label: "Scheduled",
      className: "border-blue-400/25 bg-blue-500/10 text-blue-300",
    },
    completed: {
      label: "Completed",
      className: "border-violet-400/25 bg-violet-500/10 text-violet-200",
    },
    cancelled: {
      label: "Cancelled",
      className: "border-red-400/25 bg-red-500/10 text-red-300",
    },
  };

  const { label, className } = config[status] ?? {
    label: status,
    className: "border-white/10 bg-white/5 text-gray-400",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${className}`}
    >
      {label}
    </span>
  );
}

function MatchCard({
  match,
  locale,
}: {
  match: PublicMatch;
  locale: string;
}) {
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";

  const teamAName = match.teamA?.name ?? "TBD";
  const teamBName = match.teamB?.name ?? "TBD";

  const teamAWon = isCompleted && match.winnerTeamId === match.teamA?.id;
  const teamBWon = isCompleted && match.winnerTeamId === match.teamB?.id;

  return (
    <div
      className={`px-5 py-4 transition-colors${isLive ? " bg-red-500/[0.035]" : ""}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
        <div className="text-right">
          <p
            className={`font-black leading-tight ${teamAWon ? "text-emerald-300" : "text-white"}`}
          >
            {teamAName}
          </p>
        </div>

        <div className="min-w-[80px] text-center">
          {isCompleted ? (
            <p className="text-lg font-black tabular-nums text-white">
              {match.scoreA}{" "}
              <span className="text-gray-500">—</span>{" "}
              {match.scoreB}
            </p>
          ) : (
            <p className="text-sm font-black uppercase tracking-widest text-gray-600">
              vs
            </p>
          )}
        </div>

        <div>
          <p
            className={`font-black leading-tight ${teamBWon ? "text-emerald-300" : "text-white"}`}
          >
            {teamBName}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <MatchStatusBadge status={match.status} />

        <span className="text-xs font-bold text-gray-600">
          Bo{match.bestOf}
        </span>

        {match.scheduledAt && (
          <span className="text-xs text-gray-500">
            {match.scheduledAt.toLocaleString(
              locale === "ar" ? "ar" : "en",
              { dateStyle: "medium", timeStyle: "short" },
            )}
          </span>
        )}

        {isCompleted && match.confirmedByAdmin && (
          <span className="text-xs font-black text-emerald-500">
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
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
          Schedule
        </p>
        <h2 className="mt-1 text-xl font-black text-white">Matches</h2>
      </div>

      <div className="divide-y divide-white/10">
        {roundNumbers.map((round) => (
          <div key={round}>
            <div className="bg-white/[0.02] px-5 py-2.5">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
                Round {round}
              </p>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {rounds[round].map((match) => (
                <MatchCard key={match.id} match={match} locale={locale} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
