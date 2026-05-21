import Image from "next/image";
import Link from "next/link";

const platformLinks = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/announcements", label: "News" },
  { href: "/stats", label: "Stats" },
];

const communityLinks = [
  { href: "/about", label: "About" },
  { href: "/rules", label: "Rules" },
  { href: "/roles", label: "Roles" },
  { href: "/staff", label: "Staff" },
];

const discordInvite = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "";

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
      <div className="grid gap-10 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] lg:px-10 2xl:px-14">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/images/brand/ascendra-logo-mark.png"
              alt="Ascendra"
              width={50}
              height={50}
              className="h-12 w-12 object-contain"
            />

            <Image
              src="/images/brand/ascendra-wordmark.png"
              alt="Ascendra"
              width={190}
              height={50}
              className="h-11 w-auto object-contain"
            />
          </div>

          <p className="mt-5 max-w-sm text-sm leading-7 text-gray-500">
            Competitive gaming community, tournaments, teams, and official
            standings.
          </p>
        </div>

        <FooterColumn title="Platform" links={platformLinks} />
        <FooterColumn title="Community" links={communityLinks} />

        {discordInvite && (
          <div>
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-gray-300">
              Discord
            </h3>

            <p className="mb-5 text-sm leading-7 text-gray-500">
              Join the server to follow events and tournament updates.
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
        )}
      </div>

      <div className="border-t border-white/10 px-6 py-5 lg:px-10 2xl:px-14">
        <div className="flex flex-col justify-between gap-3 text-sm text-gray-600 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Ascendra. All rights reserved.</p>

          <p>
            Developed by{" "}
            <span className="font-bold text-violet-300">Abu 3Day</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
