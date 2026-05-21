import type { LeaderboardTeam } from "@/data/leaderboard";

type TeamLeaderboardTableProps = {
  teams: LeaderboardTeam[];
};

function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "yellow" | "gray" | "violet";
}) {
  const styles = {
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    yellow: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    gray: "border-white/10 bg-white/5 text-gray-300",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function RankingRow({ team }: { team: LeaderboardTeam }) {
  return (
    <article className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035] md:grid-cols-[80px_minmax(0,1fr)_130px_130px_100px_110px_120px] md:items-center">
      <Pill tone={team.rank <= 3 ? "yellow" : "violet"}>#{team.rank}</Pill>

      <div className="min-w-0">
        <p className="truncate font-black text-white">{team.name}</p>

        <p className="mt-1 text-sm text-gray-400 md:hidden">
          {team.game} · led by {team.leaderName}
        </p>
      </div>

      <Pill tone="violet">{team.game}</Pill>

      <p className="text-sm text-gray-300">{team.leaderName}</p>

      <p className="text-sm text-gray-300">
        <span className="font-black text-white">{team.membersCount}</span>{" "}
        member{team.membersCount === 1 ? "" : "s"}
      </p>

      <Pill tone="yellow">
        {team.bestPlacement ? `#${team.bestPlacement}` : "-"}
      </Pill>

      <Pill tone="green">{team.tournamentPoints.toLocaleString()} pts</Pill>
    </article>
  );
}

export default function TeamLeaderboardTable({
  teams,
}: TeamLeaderboardTableProps) {
  const topThree = teams.slice(0, 3);
  const remaining = teams.slice(3);

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
          Team ranking
        </p>

        <h2 className="mt-1 text-xl font-black text-white">Standings</h2>
      </div>

      {topThree.length > 0 && (
        <div className="grid gap-3 border-b border-white/10 p-5 lg:grid-cols-3">
          {topThree.map((team) => (
            <article
              key={team.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <Pill tone={team.rank <= 3 ? "yellow" : "violet"}>
                  #{team.rank}
                </Pill>

                <Pill tone="violet">{team.game}</Pill>
              </div>

              <p className="mt-4 truncate text-xl font-black text-white">
                {team.name}
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Led by {team.leaderName}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="green">
                  {team.tournamentPoints.toLocaleString()} pts
                </Pill>
                <Pill>{team.tournamentResults} results</Pill>
                <Pill tone="yellow">
                  Best {team.bestPlacement ? `#${team.bestPlacement}` : "-"}
                </Pill>
              </div>
            </article>
          ))}
        </div>
      )}

      {remaining.length > 0 && (
        <div>
          <div className="hidden border-b border-white/10 bg-black/20 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-gray-500 md:grid md:grid-cols-[80px_minmax(0,1fr)_130px_130px_100px_110px_120px]">
            <span>Rank</span>
            <span>Team</span>
            <span>Game</span>
            <span>Leader</span>
            <span>Members</span>
            <span>Best</span>
            <span>Points</span>
          </div>

          <div className="divide-y divide-white/10">
            {remaining.map((team) => (
              <RankingRow key={team.id} team={team} />
            ))}
          </div>
        </div>
      )}

      {teams.length === 0 && (
        <div className="p-5 text-sm text-gray-400">No ranked teams yet.</div>
      )}
    </section>
  );
}
