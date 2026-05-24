import type { Metadata } from "next";
import type { ReactNode } from "react";
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
  const messages = getDictionary(locale).community.metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </p>

      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
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
      className="grid gap-3 px-5 py-5 transition last:border-b-0 md:grid-cols-[150px_minmax(0,1fr)_90px] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <p className="text-sm font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-accent)" }}>
        {label}
      </p>

      <div>
        <h2 className="text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{title}</h2>

        <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>{description}</p>
      </div>

      <span className="text-sm font-black md:text-right rtl:md:text-left" style={{ color: "var(--asc-fg-3)" }}>
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
      className="grid gap-3 px-5 py-4 last:border-b-0 md:grid-cols-[80px_180px_minmax(0,1fr)] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <p className="text-sm font-black" style={{ color: "var(--asc-accent)" }}>{number}</p>

      <h3 className="font-black" style={{ color: "var(--asc-fg-0)" }}>{title}</h3>

      <p className="text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>{description}</p>
    </article>
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
      className="inline-flex justify-center px-6 py-3 text-sm font-black text-white shadow-lg transition"
      style={{ background: "var(--asc-accent-2)" }}
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
      className="inline-flex justify-center px-6 py-3 text-sm font-black transition"
      style={{ border: "1px solid var(--asc-line)", color: "var(--asc-fg-2)" }}
    >
      {children}
    </Link>
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
    <main className="asc-ambient min-h-screen overflow-hidden" style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}>
      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[480px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,oklch(0.06 0.03 287 / 0.92) 0%,oklch(0.06 0.03 287 / 0.62) 44%,oklch(0.06 0.03 287 / 0.82) 100%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-48" style={{ background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))" }} />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-28 pt-20 lg:px-10">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--asc-accent)" }}>
              {messages.hero.label}
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.04] tracking-tight md:text-7xl" style={{ color: "var(--asc-fg-0)" }}>
              {messages.hero.title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7" style={{ color: "var(--asc-fg-1)" }}>
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

        <section className="relative -mt-16 mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:px-10">
          <section
            className="grid gap-5 p-5 shadow-2xl shadow-black/20 md:grid-cols-2 xl:grid-cols-5"
            style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <Stat label={messages.stats.rules} value={activeRules} />
            <Stat label={messages.stats.roles} value={activeRoles} />
            <Stat label={messages.stats.staff} value={activeStaff} />
            <Stat label={messages.stats.tournaments} value={tournaments} />
            <Stat label={messages.stats.results} value={tournamentResults} />
          </section>

          <section
            className="overflow-hidden shadow-2xl shadow-black/20"
            style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
              <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
                {messages.directory.label}
              </p>

              <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                {messages.directory.title}
              </h2>
            </div>

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
          </section>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section
              className="overflow-hidden shadow-2xl shadow-black/20"
              style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
            >
              <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
                <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
                  {messages.flow.label}
                </p>

                <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                  {messages.flow.title}
                </h2>
              </div>

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
            </section>

            <aside
              className="p-6 shadow-2xl shadow-black/20"
              style={{ border: "1px solid var(--asc-line)", background: "var(--asc-accent-dim)" }}
            >
              <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
                {messages.quickAccess.label}
              </p>

              <h2 className="mt-2 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                {messages.quickAccess.title}
              </h2>

              <p className="mt-3 text-sm leading-7" style={{ color: "var(--asc-fg-3)" }}>
                {messages.quickAccess.description}
              </p>

              <div className="mt-6 grid gap-3">
                <PrimaryLink href="/profile">
                  {messages.quickAccess.profile}
                </PrimaryLink>
                <SecondaryLink href="/leaderboard">
                  {messages.quickAccess.leaderboard}
                </SecondaryLink>
              </div>
            </aside>
          </section>
        </section>

        <Footer />
      </div>
    </main>
  );
}
