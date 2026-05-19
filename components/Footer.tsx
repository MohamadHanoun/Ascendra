import Link from "next/link";

const platformLinks = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/announcements", label: "News" },
  { href: "/profile", label: "Profile" },
];

const communityLinks = [
  { href: "/about", label: "About" },
  { href: "/rules", label: "Rules" },
  { href: "/roles", label: "Roles" },
  { href: "/staff", label: "Staff" },
  { href: "/stats", label: "Stats" },
];

const legalLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
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

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-gray-300">
        {title}
      </h3>

      <div className="grid gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-bold text-gray-500 transition hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#06070f] text-white">
      <div className="grid gap-10 px-6 py-14 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr] lg:px-10 2xl:px-14">
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

          <p className="mt-5 max-w-md text-sm leading-7 text-gray-500">
            A community platform for teams, tournaments, rankings, and organized
            competitive events.
          </p>
        </div>

        <FooterColumn title="Platform" links={platformLinks} />
        <FooterColumn title="Community" links={communityLinks} />
        <FooterColumn title="Legal" links={legalLinks} />

        <div>
          <h3 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-gray-300">
            Discord
          </h3>

          <p className="mb-5 text-sm leading-7 text-gray-500">
            Join the server to follow events, announcements, and tournament
            updates.
          </p>

          <a
            href={discordInvite}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
          >
            Join Discord
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 lg:px-10 2xl:px-14">
        <div className="flex flex-col justify-between gap-3 text-sm text-gray-600 md:flex-row md:items-center">
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