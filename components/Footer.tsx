import Image from "next/image";
import Link from "next/link";

import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

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

export default async function Footer() {
  const locale = await getLocale();
  const messages = getDictionary(locale).footer;

  const platformLinks = [
    { href: "/", label: messages.links.home },
    { href: "/tournaments", label: messages.links.tournaments },
    { href: "/leaderboard", label: messages.links.leaderboard },
    { href: "/announcements", label: messages.links.news },
    { href: "/community", label: messages.links.community },
  ];

  const communityLinks = [
    { href: "/about", label: messages.links.about },
    { href: "/rules", label: messages.links.rules },
    { href: "/roles", label: messages.links.roles },
    { href: "/staff", label: messages.links.staff },
    { href: "/stats", label: messages.links.stats },
  ];

  const legalLinks = [
    { href: "/terms", label: messages.links.terms },
    { href: "/privacy", label: messages.links.privacy },
    { href: "/cookies", label: messages.links.cookies },
  ];

  return (
    <footer className="border-t border-white/10 bg-[#06070f] text-white">
      <div className="grid gap-10 px-6 py-14 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr_1fr] lg:px-10 2xl:px-14">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
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
          </Link>

          <p className="mt-6 max-w-md text-sm leading-7 text-gray-500">
            {messages.description}
          </p>
        </div>

        <FooterColumn title={messages.columns.platform} links={platformLinks} />
        <FooterColumn
          title={messages.columns.community}
          links={communityLinks}
        />
        <FooterColumn title={messages.columns.legal} links={legalLinks} />

        <div>
          <h3 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-gray-300">
            {messages.columns.discord}
          </h3>

          <p className="mb-5 text-sm leading-7 text-gray-500">
            {messages.discordDescription}
          </p>

          {discordInvite && (
            <a
              href={discordInvite}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
            >
              {messages.joinDiscord}
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 lg:px-10 2xl:px-14">
        <div className="flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="font-bold text-gray-400">Ascendra</span>.{" "}
            {messages.rights}
          </p>

          <p>
            {messages.developedBy}{" "}
            <span className="font-bold text-violet-300">Abu 3Day</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
