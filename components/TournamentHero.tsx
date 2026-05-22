export default function TournamentHero() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-indigo-500/10">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">
          Ascendra Tournaments
        </p>

        <h1 className="mb-6 max-w-3xl text-5xl font-black leading-tight md:text-7xl">
          Compete with the community and join future Ascendra events.
        </h1>

        <p className="max-w-2xl text-lg leading-8 text-gray-300">
          This page will become the main place for Ascendra tournament announcements,
          registrations, team slots, match schedules, brackets, and future
          Discord account login.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="#tournaments"
            className="rounded-xl bg-indigo-500 px-7 py-4 font-bold transition hover:bg-indigo-400"
          >
            View Tournaments
          </a>

          <button
            disabled
            className="cursor-not-allowed rounded-xl border border-white/10 px-7 py-4 font-bold text-gray-400"
          >
            Login Coming Soon
          </button>
        </div>
      </div>
    </section>
  );
}