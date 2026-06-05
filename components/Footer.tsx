import Image from "next/image";
import Link from "next/link";

import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="asc-footer-col__title mb-4">
        <span aria-hidden="true">▲</span>
        {title}
      </h3>

      <div className="grid gap-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="asc-footer-link">
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
    { href: "/games", label: messages.links.games },
    { href: "/leaderboard", label: messages.links.leaderboard },
    { href: "/announcements", label: messages.links.news },
    { href: "/community", label: messages.links.community },
  ];

  const communityLinks = [
    { href: "/community", label: messages.links.community },
    { href: "/discord", label: "Discord" },
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
    <footer className="asc-footer">
      <span aria-hidden="true" className="asc-footer__edge" />
      <span aria-hidden="true" className="asc-footer__watermark">
        ASCENDRA
      </span>

      <div className="asc-footer__inner grid gap-10 px-6 py-14 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr_1fr] lg:px-10 2xl:px-14">
        <div>
          <span className="asc-footer-status">
            <span aria-hidden="true">▲</span>
            {messages.columns.platform}
          </span>

          <Link href="/" className="mt-4 inline-flex items-center gap-3">
            <Image
              src="/images/brand/ascendra-logo-mark.png"
              alt="Ascendra"
              width={50}
              height={50}
              className="asc-brand-mark h-12 w-12 object-contain"
            />

            <Image
              src="/images/brand/ascendra-wordmark.png"
              alt="Ascendra"
              width={190}
              height={50}
              className="asc-brand-wordmark h-11 w-auto object-contain"
            />
          </Link>

          <p
            className="mt-6 max-w-md text-sm leading-7"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {messages.description}
          </p>

          <div className="asc-footer-brand-divider" />
        </div>

        <FooterColumn title={messages.columns.platform} links={platformLinks} />
        <FooterColumn title={messages.columns.community} links={communityLinks} />
        <FooterColumn title={messages.columns.legal} links={legalLinks} />

        <div>
          <h3 className="asc-footer-col__title mb-4">
            <span aria-hidden="true">▲</span>
            {messages.columns.discord}
          </h3>

          <p
            className="mb-5 text-sm leading-7"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {messages.discordDescription}
          </p>

          <Link href="/discord" className="asc-footer-discord-cta">
            {messages.openDiscordHub}
          </Link>
        </div>
      </div>

      <div className="asc-footer__base px-6 py-6 lg:px-10 2xl:px-14">
        <p className="asc-footer__copy text-sm">
          © 2026 <strong>Ascendra</strong>. {messages.rights}
        </p>
      </div>
    </footer>
  );
}
