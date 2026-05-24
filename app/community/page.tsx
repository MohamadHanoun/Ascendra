import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getDictionary(locale).community;

  return {
    title: messages.metadata.title,
    description: messages.metadata.description,
  };
}

function CornerMark() {
  return (
    <div
      aria-hidden="true"
      className="asc-corner-mark"
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        width: 12,
        height: 12,
        borderTop: "1.5px solid var(--asc-accent)",
        borderLeft: "1.5px solid var(--asc-accent)",
        opacity: 0.9,
        pointerEvents: "none",
        zIndex: 30,
      }}
    />
  );
}

function Panel({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section
      className={`relative overflow-hidden border shadow-2xl shadow-black/20 ${className}`}
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath:
          "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
        ...style,
      }}
    >
      <CornerMark />
      {children}
    </section>
  );
}

function PanelHeader({ label, title }: { label: string; title: string }) {
  return (
    <div
      className="px-6 py-5"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <p
        className="text-xs font-black uppercase tracking-[0.18em]"
        style={{ color: "var(--asc-accent)" }}
      >
        ▲ {label}
      </p>

      <h2
        className="mt-2 text-2xl md:text-3xl"
        style={{ color: "var(--asc-fg-0)" }}
      >
        {title}
      </h2>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className="relative border p-5"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath:
          "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      }}
    >
      <CornerMark />

      <p
        className="text-[10px] font-black uppercase tracking-[0.18em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {label}
      </p>

      <p
        className="mt-3 text-4xl font-black tabular-nums"
        style={{
          color: accent ? "var(--asc-accent)" : "var(--asc-fg-0)",
          fontFamily: "var(--font-display)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg transition hover:opacity-90"
      style={{
        background: "var(--asc-accent-2)",
        boxShadow: "0 0 20px var(--asc-accent-glow)",
        clipPath:
          "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
      }}
    >
      {children}
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center border px-6 py-3 text-sm font-black uppercase tracking-[0.08em] transition hover:opacity-80"
      style={{
        borderColor: "var(--asc-line)",
        color: "var(--asc-fg-2)",
        clipPath:
          "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
      }}
    >
      {children}
    </Link>
  );
}

function CommunityRow({
  href,
  label,
  title,
  description,
  openLabel,
  locale,
}: {
  href: string;
  label: string;
  title: string;
  description: string;
  openLabel: string;
  locale: Locale;
}) {
  return (
    <Link
      href={href}
      className="group grid gap-4 px-6 py-5 transition hover:bg-[oklch(0.20_0.10_285_/_0.08)] md:grid-cols-[150px_minmax(0,1fr)_110px] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <p
        className="text-xs font-black uppercase tracking-[0.16em]"
        style={{ color: "var(--asc-accent)" }}
      >
        {label}
      </p>

      <div>
        <h3 className="text-xl" style={{ color: "var(--asc-fg-0)" }}>
          {title}
        </h3>

        <p
          className="mt-2 max-w-3xl text-sm leading-6"
          style={{ color: "var(--asc-fg-3)" }}
        >
          {description}
        </p>
      </div>

      <span
        className="text-sm font-black transition group-hover:translate-x-1 md:text-right rtl:md:text-left"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {openLabel} {locale === "ar" ? "←" : "→"}
      </span>
    </Link>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article
      className="grid gap-4 px-6 py-5 md:grid-cols-[90px_180px_minmax(0,1fr)] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <p
        className="text-5xl font-black leading-none"
        style={{
          color: "var(--asc-accent)",
          fontFamily: "var(--font-display)",
        }}
      >
        {number}
      </p>

      <h3 className="text-lg" style={{ color: "var(--asc-fg-0)" }}>
        {title}
      </h3>

      <p className="text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
        {description}
      </p>
    </article>
  );
}

function DiscordGlyph() {
  return (
    <div
      className="grid h-12 w-12 shrink-0 place-items-center"
      style={{
        background: "oklch(0.62 0.18 270)",
        clipPath:
          "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
      }}
    >
      <svg
        width="24"
        height="18"
        viewBox="0 0 24 18"
        fill="oklch(0.98 0.01 290)"
      >
        <path d="M20.3 1.8a18 18 0 0 0-4.5-1.4l-.2.4c1.6.3 3 .9 4.3 1.7-1.6-.9-3.4-1.4-5.3-1.4S10.9.6 9.3 1.5c1.3-.8 2.7-1.4 4.3-1.7l-.2-.4A18 18 0 0 0 8.9 1.8C5.7 6.7 4.9 11.4 5.3 16c1.8 1.3 3.6 2 5.4 2.5l.4-.6a11 11 0 0 1-2.2-1.1c.2-.1.4-.2.5-.3 4.1 1.9 8.5 1.9 12.5 0 .2.1.4.2.5.3-.7.4-1.4.8-2.2 1.1l.4.6c1.8-.5 3.6-1.2 5.4-2.5.5-5.4-.8-10-2.7-14.2zM9.7 13.5c-1 0-1.9-1-1.9-2.2s.9-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2zm6.6 0c-1 0-1.9-1-1.9-2.2s.9-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2z" />
      </svg>
    </div>
  );
}

export default async function CommunityPage() {
  const locale = await getLocale();
  const messages = getDictionary(locale).community;

  const [
    activeRules,
    activeRoles,
    activeStaff,
    tournaments,
    tournamentResults,
  ] = await Promise.all([
    prisma.rule.count({
      where: {
        isActive: true,
      },
    }),

    prisma.role.count({
      where: {
        isActive: true,
      },
    }),

    prisma.staffMember.count({
      where: {
        isActive: true,
      },
    }),

    prisma.tournament.count(),

    prisma.tournamentResult.count(),
  ]);

  return (
    <main
      className="asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[520px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.28) 0%, oklch(0.07 0.025 285 / 0.62) 52%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, oklch(0.07 0.025 285 / 0.42) 38%, transparent 72%)",
              ].join(", "),
            }}
          />

          <div
            className="absolute inset-x-0 bottom-0 h-48"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--asc-bg-0))",
            }}
          />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-32 pt-24 lg:px-10">
            <p
              className="mb-4 text-xs font-black uppercase tracking-[0.22em]"
              style={{ color: "var(--asc-accent)" }}
            >
              ▲ {messages.hero.label}
            </p>

            <h1
              className="max-w-5xl text-5xl md:text-7xl"
              style={{ color: "var(--asc-fg-0)" }}
            >
              {messages.hero.title}
            </h1>

            <p
              className="mt-5 max-w-2xl text-base leading-7"
              style={{ color: "var(--asc-fg-2)" }}
            >
              {messages.hero.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryLink href="/tournaments">
                {messages.hero.primary}
              </PrimaryLink>

              <SecondaryLink href="/rules">
                {messages.hero.secondary}
              </SecondaryLink>
            </div>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1440px] gap-10 px-6 pb-20 lg:px-10">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label={messages.stats.rules} value={activeRules} />
            <StatCard label={messages.stats.roles} value={activeRoles} />
            <StatCard label={messages.stats.staff} value={activeStaff} />
            <StatCard label={messages.stats.tournaments} value={tournaments} />
            <StatCard
              label={messages.stats.results}
              value={tournamentResults}
              accent
            />
          </section>

          <Panel>
            <PanelHeader
              label={messages.directory.label}
              title={messages.directory.title}
            />

            <div>
              {messages.directory.links.map((link) => (
                <CommunityRow
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  title={link.title}
                  description={link.description}
                  openLabel={messages.directory.open}
                  locale={locale}
                />
              ))}
            </div>
          </Panel>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <Panel>
              <PanelHeader
                label={messages.flow.label}
                title={messages.flow.title}
              />

              <div>
                {messages.flow.steps.map((step) => (
                  <Step
                    key={step.number}
                    number={step.number}
                    title={step.title}
                    description={step.description}
                  />
                ))}
              </div>
            </Panel>

            <Panel
              className="p-6"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.30 0.18 270 / 0.82) 0%, oklch(0.12 0.05 280 / 0.96) 58%, oklch(0.08 0.03 285) 100%)",
              }}
            >
              <div className="relative z-10">
                <div className="flex items-start gap-4">
                  <DiscordGlyph />

                  <div>
                    <p
                      className="text-[10px] font-black uppercase tracking-[0.18em]"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      {messages.quickAccess.label}
                    </p>

                    <h2
                      className="mt-1 text-2xl"
                      style={{ color: "var(--asc-fg-0)" }}
                    >
                      {messages.quickAccess.title}
                    </h2>
                  </div>
                </div>

                <p
                  className="mt-5 text-sm leading-7"
                  style={{ color: "var(--asc-fg-2)" }}
                >
                  {messages.quickAccess.description}
                </p>

                <div className="mt-7 grid gap-3">
                  <PrimaryLink href="/profile">
                    {messages.quickAccess.profile}
                  </PrimaryLink>

                  <SecondaryLink href="/leaderboard">
                    {messages.quickAccess.leaderboard}
                  </SecondaryLink>
                </div>
              </div>
            </Panel>
          </section>
        </section>

        <Footer />
      </div>
    </main>
  );
}
