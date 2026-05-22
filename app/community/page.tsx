import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getDictionary } from "@/lib/i18n";
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
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function CommunityRow({
  href,
  label,
  title,
  description,
  openLabel,
}: {
  href: string;
  label: string;
  title: string;
  description: string;
  openLabel: string;
}) {
  return (
    <Link
      href={href}
      className="grid gap-3 border-b border-white/10 px-5 py-5 transition last:border-b-0 hover:bg-white/[0.035] md:grid-cols-[150px_minmax(0,1fr)_90px] md:items-center"
    >
      <p className="text-sm font-black uppercase tracking-[0.14em] text-violet-300">
        {label}
      </p>

      <div>
        <h2 className="text-xl font-black text-white">{title}</h2>

        <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
      </div>

      <span className="text-sm font-black text-gray-500 md:text-right rtl:md:text-left">
        {openLabel} →
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
    <article className="grid gap-3 border-b border-white/10 px-5 py-4 last:border-b-0 md:grid-cols-[80px_180px_minmax(0,1fr)] md:items-center">
      <p className="text-sm font-black text-violet-300">{number}</p>

      <h3 className="font-black text-white">{title}</h3>

      <p className="text-sm leading-6 text-gray-400">{description}</p>
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
      className="inline-flex justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500"
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
      className="inline-flex justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
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
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[480px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.62)_44%,rgba(7,8,17,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-28 pt-20 lg:px-10">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
              {messages.hero.label}
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.04] tracking-tight text-white md:text-7xl">
              {messages.hero.title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
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
          <section className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 md:grid-cols-2 xl:grid-cols-5">
            <Stat label={messages.stats.rules} value={activeRules} />
            <Stat label={messages.stats.roles} value={activeRoles} />
            <Stat label={messages.stats.staff} value={activeStaff} />
            <Stat label={messages.stats.tournaments} value={tournaments} />
            <Stat label={messages.stats.results} value={tournamentResults} />
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                {messages.directory.label}
              </p>

              <h2 className="mt-1 text-xl font-black text-white">
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
                />
              ))}
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                  {messages.flow.label}
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
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

            <aside className="rounded-3xl border border-violet-400/20 bg-violet-500/[0.06] p-6 shadow-2xl shadow-black/20">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                {messages.quickAccess.label}
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                {messages.quickAccess.title}
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-400">
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
