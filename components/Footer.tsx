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
      <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
        {title}
      </h3>
      <div className="grid gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-bold transition hover:text-white"
            style={{ color: "var(--asc-fg-3)" }}
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
    <footer style={{ borderTop: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-1)" }}>
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

          <p className="mt-6 max-w-md text-sm leading-7" style={{ color: "var(--asc-fg-3)" }}>
            {messages.description}
          </p>

          <div
            className="mt-6 h-px w-12"
            style={{ background: "var(--asc-accent)" }}
          />
        </div>

        <FooterColumn title={messages.columns.platform} links={platformLinks} />
        <FooterColumn title={messages.columns.community} links={communityLinks} />
        <FooterColumn title={messages.columns.legal} links={legalLinks} />

        <div>
          <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
            {messages.columns.discord}
          </h3>
          <p className="mb-5 text-sm leading-7" style={{ color: "var(--asc-fg-3)" }}>
            {messages.discordDescription}
          </p>
          <Link
            href="/discord"
            className="inline-flex px-5 py-3 text-sm font-black text-white transition"
            style={{ background: "var(--asc-accent-2)" }}
          >
            Open Discord Hub
          </Link>
        </div>
      </div>

      <div
        className="px-6 py-5 lg:px-10 2xl:px-14"
        style={{ borderTop: "1px solid var(--asc-line-soft)" }}
      >
        <div
          className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between"
          style={{ color: "var(--asc-fg-3)" }}
        >
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="font-bold" style={{ color: "var(--asc-fg-2)" }}>Ascendra</span>.{" "}
            {messages.rights}
          </p>
          <p>
            {messages.developedBy}{" "}
            <span className="font-bold" style={{ color: "var(--asc-accent)" }}>Abu 3Day</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
