import type { LeaderboardTeam } from "@/data/leaderboard";

type TeamLeaderboardTableProps = {
  teams: LeaderboardTeam[];
};

function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "blue" | "gray" | "violet";
}) {
  const styles = {
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    blue: "border-sky-400/25 bg-sky-500/10 text-sky-300",
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

function RankBadge({ rank }: { rank: number }) {
  const tone = rank === 1 ? "green" : rank <= 3 ? "blue" : "violet";

  return <Pill tone={tone}>#{rank}</Pill>;
}

function RankingRow({ team }: { team: LeaderboardTeam }) {
  return (
    <article className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035] md:grid-cols-[80px_minmax(0,1fr)_130px_130px_100px_110px_120px] md:items-center">
      <RankBadge rank={team.rank} />

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

      <Pill tone="blue">
        Best {team.bestPlacement ? `#${team.bestPlacement}` : "-"}
      </Pill>

      <Pill tone="green">{team.tournamentPoints.toLocaleString()} pts</Pill>
    </article>
  );
}

function PodiumCard({ team }: { team: LeaderboardTeam }) {
  const isFirst = team.rank === 1;

  return (
    <article
      className={`rounded-3xl border p-5 shadow-2xl ${
        isFirst
          ? "border-emerald-400/25 bg-emerald-500/[0.08] shadow-emerald-950/20"
          : "border-white/10 bg-black/20 shadow-black/20"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <RankBadge rank={team.rank} />
        <Pill tone="violet">{team.game}</Pill>
      </div>

      <p className="mt-5 truncate text-2xl font-black text-white">
        {team.name}
      </p>

      <p className="mt-1 text-sm text-gray-500">
        Led by {team.leaderName} · {team.membersCount} member
        {team.membersCount === 1 ? "" : "s"}
      </p>

      <div className="mt-5">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
          Points
        </p>

        <p className="mt-1 text-3xl font-black text-emerald-300">
          {team.tournamentPoints.toLocaleString()}
        </p>
      </div>
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
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
          Team ranking
        </p>

        <h2 className="mt-1 text-xl font-black text-white">Standings</h2>
      </div>

      {topThree.length > 0 && (
        <div className="grid gap-4 border-b border-white/10 p-5 lg:grid-cols-3">
          {topThree.map((team) => (
            <PodiumCard key={team.id} team={team} />
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
