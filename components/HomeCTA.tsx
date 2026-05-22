import { currentContent } from "@/content/siteContent";
import { serverInfo } from "@/data/server";

export default function HomeCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-cyan-500/20 p-10 text-center shadow-2xl shadow-indigo-500/10">
        <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">
            Join Ascendra
          </p>

          <h2 className="mx-auto mb-6 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Ready to enter Ascendra?
          </h2>

          <p className="mx-auto mb-8 max-w-2xl leading-8 text-gray-300">
            Join the community, meet other players, follow future tournaments,
            and be part of the Ascendra journey from the beginning.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={serverInfo.inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-indigo-500 px-7 py-4 font-bold transition hover:-translate-y-1 hover:bg-indigo-400"
            >
              {currentContent.nav.joinDiscord}
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
