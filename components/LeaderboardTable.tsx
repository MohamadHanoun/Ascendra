import type { LeaderboardUser } from "@/data/leaderboard";

type LeaderboardTableProps = {
  users: LeaderboardUser[];
};

function RankBadge({ rank }: { rank: number }) {
  const isTopThree = rank <= 3;

  return (
    <span
      className={`grid h-11 w-11 place-items-center rounded-xl border text-lg font-black ${
        isTopThree
          ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
          : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
      }`}
    >
      #{rank}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role.toLowerCase() === "admin";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
        isAdmin
          ? "border-red-500/20 bg-red-500/10 text-red-300"
          : "border-indigo-500/20 bg-indigo-500/10 text-indigo-300"
      }`}
    >
      {role}
    </span>
  );
}

export default function LeaderboardTable({ users }: LeaderboardTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="border-b border-white/10 bg-white/[0.03] px-5 py-5">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
          Ranking
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Tournament points
        </h2>
      </div>

      <div className="hidden border-b border-white/10 bg-black/20 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-gray-400 lg:grid lg:grid-cols-[90px_minmax(0,1fr)_160px_140px_150px_150px] lg:gap-5">
        <span>Rank</span>
        <span>Player</span>
        <span>Role</span>
        <span>Results</span>
        <span>Best</span>
        <span>Points</span>
      </div>

      <div className="divide-y divide-white/10">
        {users.map((user) => (
          <article
            key={user.id}
            className="grid gap-4 p-5 transition hover:bg-white/[0.035] lg:grid-cols-[90px_minmax(0,1fr)_160px_140px_150px_150px] lg:items-center lg:gap-5"
          >
            <RankBadge rank={user.rank} />

            <div>
              <p className="text-lg font-black text-white">{user.username}</p>

              <div className="mt-2 lg:hidden">
                <RoleBadge role={user.role} />
              </div>
            </div>

            <div className="hidden lg:block">
              <RoleBadge role={user.role} />
            </div>

            <p className="text-sm text-gray-300">
              <span className="font-black text-white">
                {user.tournamentResults}
              </span>{" "}
              result{user.tournamentResults === 1 ? "" : "s"}
            </p>

            <p className="text-sm font-black text-yellow-300">
              {user.bestPlacement ? `#${user.bestPlacement}` : "-"}
            </p>

            <p className="text-sm font-black text-green-300">
              {user.tournamentPoints.toLocaleString()} points
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
