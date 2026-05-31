import { currentContent } from "@/content/siteContent";
import { serverInfo } from "@/data/server";

export default function HomeCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div
        className="relative overflow-hidden border p-10 text-center shadow-2xl"
        style={{ borderColor: "var(--asc-line)", background: "var(--asc-bg-2)", boxShadow: "0 0 60px var(--asc-accent-dim)" }}
      >
        <div className="absolute left-10 top-10 h-32 w-32 opacity-20 blur-3xl" style={{ background: "var(--asc-accent)" }} />
        <div className="absolute bottom-10 right-10 h-32 w-32 opacity-10 blur-3xl" style={{ background: "var(--asc-blue)" }} />

        <div className="relative">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.3em]" style={{ color: "var(--asc-accent)" }}>
            Join Ascendra
          </p>

          <h2 className="mx-auto mb-6 max-w-3xl text-4xl font-black leading-tight md:text-6xl" style={{ color: "var(--asc-fg-0)" }}>
            Ready to enter Ascendra?
          </h2>

          <p className="mx-auto mb-8 max-w-2xl leading-8" style={{ color: "var(--asc-fg-2)" }}>
            Join the community, meet other players, follow future tournaments, and be part of the Ascendra journey from the beginning.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={serverInfo.inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-4 font-bold transition hover:opacity-90"
              style={{ background: "#5865F2", color: "#fff" }}
            >
              {currentContent.nav.joinDiscord}
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
