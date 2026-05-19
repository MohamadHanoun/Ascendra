import Link from "next/link";

const footerLinks = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/announcements", label: "News" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rules", label: "Rules" },
  { href: "/staff", label: "Staff" },
];

const discordInvite = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "#";

function AscendraMark() {
  return (
    <span className="relative grid h-11 w-11 shrink-0 place-items-center">
      <span className="absolute inset-0 rounded-xl bg-violet-500/40 blur-xl" />
      <span className="relative h-8 w-8 rotate-45 border-l-4 border-t-4 border-violet-400" />
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#06070f] text-white">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr] lg:px-10">
        <div>
          <div className="flex items-center gap-3">
            <AscendraMark />

            <div>
              <h2 className="text-2xl font-black uppercase tracking-[0.16em]">
                Ascendra
              </h2>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">
                Rise Beyond Limits
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-md leading-7 text-gray-400">
            Ascendra is a competitive gaming platform built around tournaments,
            teams, rankings, and community-driven competition.
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-black text-gray-200">Explore</h3>

          <div className="grid gap-3">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-400 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-black text-gray-200">Join Ascendra</h3>

          <p className="mb-5 leading-7 text-gray-400">
            Join the Discord server, meet the community, and stay updated on
            tournaments, results, and events.
          </p>

          <a
            href={discordInvite}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-xl bg-violet-600 px-5 py-3 font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
          >
            Join Discord
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5">
        <div className="flex flex-col items-center justify-center gap-2 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Ascendra. All rights reserved.</p>

          <p>
            Website by{" "}
            <span className="font-bold text-violet-300">Abu 3Day</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
