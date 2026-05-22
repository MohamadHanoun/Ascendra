const discordInvite = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "#";

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-24 text-white md:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.25),transparent_40%),linear-gradient(180deg,#0b0f1a,#070a12)]" />

      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.35em] text-indigo-300">
            Ascendra
          </p>

          <h1 className="text-5xl font-black leading-tight md:text-7xl">
            A gaming community for players, tournaments, and unforgettable
            moments.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
            Ascendra brings players together through games, events, friendly
            competition, and a community built for people who enjoy playing,
            improving, and having fun together.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href={discordInvite}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-indigo-500 px-7 py-4 font-bold text-white transition hover:-translate-y-1 hover:bg-indigo-400"
            >
              Join Discord
            </a>

            <a
              href="/tournaments"
              className="rounded-xl border border-white/10 px-7 py-4 font-bold text-gray-200 transition hover:-translate-y-1 hover:bg-white/10"
            >
              View Tournaments
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
