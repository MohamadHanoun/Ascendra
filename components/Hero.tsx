import { serverInfo } from "@/data/server";

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2">
      <div>
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">
          Modern Discord Community
        </p>

        <h2 className="mb-6 text-5xl font-black leading-tight md:text-7xl">
          Build your place inside the community.
        </h2>

        <p className="mb-8 max-w-xl text-lg leading-8 text-gray-300">
          {serverInfo.description}
        </p>

        <div className="flex flex-wrap gap-4">
          <a
            href={serverInfo.inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-indigo-500 px-7 py-4 font-bold transition hover:bg-indigo-400"
          >
            Join Server
          </a>

          <a
            href="#features"
            className="rounded-xl border border-white/10 px-7 py-4 font-bold text-gray-200 transition hover:bg-white/10"
          >
            Explore More
          </a>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-indigo-500/10">
        <div className="mb-6 h-64 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400" />

        <h3 className="mb-3 text-2xl font-bold">Server Highlights</h3>
        <p className="text-gray-300">
          XP system, real Discord stats, admin panel, bot integration, and
          leaderboard will be added step by step.
        </p>
      </div>
    </section>
  );
}