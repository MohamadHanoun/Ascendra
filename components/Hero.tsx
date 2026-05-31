const discordInvite = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "#";

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-24 text-white md:py-32">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "radial-gradient(circle at top,var(--asc-accent-dim),transparent 40%),linear-gradient(180deg,var(--asc-bg-0),var(--asc-bg-1))" }}
      />

      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="mb-5 text-sm font-black uppercase tracking-[0.35em]" style={{ color: "var(--asc-accent)" }}>
            Ascendra
          </p>

          <h1 className="text-5xl font-black leading-tight md:text-7xl" style={{ color: "var(--asc-fg-0)" }}>
            A gaming community for players, tournaments, and unforgettable moments.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8" style={{ color: "var(--asc-fg-2)" }}>
            Ascendra brings players together through games, events, friendly competition, and a community built for people who enjoy playing, improving, and having fun together.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href={discordInvite}
              target="_blank"
              rel="noreferrer"
              className="px-7 py-4 font-bold text-white transition hover:opacity-90"
              style={{ background: "#5865F2" }}
            >
              Join Discord
            </a>

            <a
              href="/tournaments"
              className="border px-7 py-4 font-bold transition hover:opacity-90"
              style={{ borderColor: "var(--asc-line)", color: "var(--asc-fg-2)", background: "transparent" }}
            >
              View Tournaments
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
