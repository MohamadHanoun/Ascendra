import Link from "next/link";
import Image from "next/image";

const footerLinks = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/announcements", label: "Announcements" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rules", label: "Rules" },
  { href: "/staff", label: "Staff" },
];

const discordInvite = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "#";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070a12] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/logo-mark-clean.svg"
              alt="RTN logo"
              width={52}
              height={52}
              className="rounded-xl"
            />

            <div>
              <h2 className="text-2xl font-black">RTN</h2>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">
                The Noobs of Temple & Rift
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-md leading-7 text-gray-400">
            The Noobs of Temple & Rift is a gaming community built around
            players, tournaments, teamwork, and shared moments.
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-gray-200">Explore</h3>

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
          <h3 className="mb-4 font-bold text-gray-200">Join RTN</h3>

          <p className="mb-5 leading-7 text-gray-400">
            Join the Discord server, meet the community, and stay updated on
            tournaments and events.
          </p>

          <a
            href={discordInvite}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-xl bg-indigo-500 px-5 py-3 font-bold text-white transition hover:bg-indigo-400"
          >
            Join Discord
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 text-center text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} The Noobs of Temple & Rift. All rights
            reserved.
          </p>

          <p>
            Website by{" "}
            <span className="font-bold text-indigo-300">Abu 3Day</span>
          </p>
        </div>
      </div>
    </footer>
  );
}