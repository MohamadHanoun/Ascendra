import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community | Ascendra",
  description:
    "Explore the Ascendra community hub for tournaments, rules, roles, and platform resources.",
};

type CommunityStats = {
  activeTournaments: number;
  totalUsers: number;
  totalTeams: number;
  publicTournaments: number;
  tournamentResults: number;
  activeRules: number;
  activeRoles: number;
  activeStaff: number;
};

const monoStyle: CSSProperties = {
  fontFamily: "var(--font-mono, monospace)",
};

const clippedStyle: CSSProperties = {
  clipPath:
    "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
};

function CornerMark() {
  return <div aria-hidden="true" className="asc-corner-mark" />;
}

function DiscordGlyph({ size = 48 }: { size?: number }) {
  const iconSize = Math.round(size * 0.5);

  return (
    <div
      className="grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        background: "oklch(0.62 0.18 270)",
        clipPath:
          "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
      }}
    >
      <svg
        aria-hidden="true"
        width={iconSize}
        height={Math.round(iconSize * 0.75)}
        viewBox="0 0 24 18"
        fill="oklch(0.98 0.01 290)"
      >
        <path d="M20.3 1.8a18 18 0 0 0-4.5-1.4l-.2.4c1.6.3 3 .9 4.3 1.7-1.6-.9-3.4-1.4-5.3-1.4S10.9.6 9.3 1.5c1.3-.8 2.7-1.4 4.3-1.7l-.2-.4A18 18 0 0 0 8.9 1.8C5.7 6.7 4.9 11.4 5.3 16c1.8 1.3 3.6 2 5.4 2.5l.4-.6a11 11 0 0 1-2.2-1.1c.2-.1.4-.2.5-.3 4.1 1.9 8.5 1.9 12.5 0 .2.1.4.2.5.3-.7.4-1.4.8-2.2 1.1l.4.6c1.8-.5 3.6-1.2 5.4-2.5.5-5.4-.8-10-2.7-14.2zM9.7 13.5c-1 0-1.9-1-1.9-2.2s.9-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2zm6.6 0c-1 0-1.9-1-1.9-2.2s.9-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2z" />
      </svg>
    </div>
  );
}

function ButtonLink({
  href,
  children,
  variant = "ghost",
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "discord" | "ghost";
  external?: boolean;
}) {
  const style: CSSProperties = {
    ...clippedStyle,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "16px 26px",
    fontFamily: "var(--font-display)",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    textDecoration: "none",
    border:
      variant === "discord"
        ? "1px solid oklch(0.62 0.18 270)"
        : "1px solid var(--asc-line)",
    background:
      variant === "discord" ? "oklch(0.62 0.18 270)" : "transparent",
    color: "oklch(0.98 0.01 290)",
  };

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" style={style}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} style={style}>
      {children}
    </Link>
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
        ...clippedStyle,
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        ...style,
      }}
    >
      <CornerMark />
      {children}
    </section>
  );
}

function SectionRule({ label }: { label: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span
        className="text-[10px] uppercase tracking-[0.18em]"
        style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
      >
        <span style={{ color: "var(--asc-accent)" }}>▲</span> {label}
      </span>
      <span className="h-px flex-1" style={{ background: "var(--asc-line-soft)" }} />
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent?: boolean;
}) {
  return (
    <Panel className="p-6">
      <div className="relative z-10">
        <p
          className="text-[10px] uppercase tracking-[0.14em]"
          style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
        >
          {label}
        </p>
        <p
          className="mt-3 text-[32px] font-black leading-none tabular-nums"
          style={{
            fontFamily: "var(--font-display)",
            color: accent ? "var(--asc-accent)" : "var(--asc-fg-0)",
          }}
        >
          {value}
        </p>
        <p
          className="mt-3 text-[10px] uppercase tracking-[0.08em]"
          style={{ ...monoStyle, color: "var(--asc-green)" }}
        >
          {sub}
        </p>
      </div>
    </Panel>
  );
}

function DiscordCard() {
  return (
    <Panel
      className="p-0"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.30 0.18 270 / 0.88) 0%, oklch(0.12 0.05 280 / 0.96) 60%, oklch(0.08 0.03 285) 100%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 82% 18%, oklch(0.62 0.18 270 / 0.24), transparent 42%)",
        }}
      />
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex items-center gap-4">
          <DiscordGlyph />
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ ...monoStyle, color: "oklch(0.85 0.10 270)" }}
            >
              Community
            </p>
            <h2 className="mt-1 text-2xl" style={{ color: "var(--asc-fg-0)" }}>
              The Ascendra Discord
            </h2>
          </div>
        </div>

        <p
          className="mt-5 max-w-[440px] text-sm leading-6"
          style={{ color: "var(--asc-fg-1)" }}
        >
          Open the dedicated Discord hub for live server status, bot commands,
          role counts, and the server invite when configured.
        </p>

        <div className="mt-6">
          <ButtonLink href="/discord" variant="discord">
            <DiscordGlyph size={22} />
            Open Discord Hub
          </ButtonLink>
        </div>
      </div>
    </Panel>
  );
}

function FeatureCard({
  index,
  title,
  description,
  href,
  label,
}: {
  index: number;
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <Panel className="p-6 md:p-7">
      <div className="relative z-10">
        <p
          className="mb-4 text-4xl font-black leading-none"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--asc-accent)",
          }}
        >
          {String(index).padStart(2, "0")}
        </p>
        <h3 className="text-xl" style={{ color: "var(--asc-fg-0)" }}>
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--asc-fg-2)" }}>
          {description}
        </p>
        <Link
          href={href}
          className="mt-5 inline-flex text-[11px] font-black uppercase tracking-[0.14em]"
          style={{ ...monoStyle, color: "var(--asc-accent)", textDecoration: "none" }}
        >
          {label} <span aria-hidden="true">&nbsp;›</span>
        </Link>
      </div>
    </Panel>
  );
}

function DirectoryRow({
  href,
  title,
  label,
  value,
  description,
}: {
  href: string;
  title: string;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="grid gap-4 px-6 py-5 transition hover:bg-[oklch(0.20_0.10_285_/_0.08)] md:grid-cols-[minmax(0,1fr)_140px_32px] md:items-center"
      style={{ borderTop: "1px solid var(--asc-line-soft)", textDecoration: "none" }}
    >
      <div>
        <p
          className="text-[10px] uppercase tracking-[0.16em]"
          style={{ ...monoStyle, color: "var(--asc-accent)" }}
        >
          {label}
        </p>
        <h3 className="mt-2 text-lg" style={{ color: "var(--asc-fg-0)" }}>
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
          {description}
        </p>
      </div>
      <div className="md:text-right">
        <p
          className="text-[10px] uppercase tracking-[0.14em]"
          style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
        >
          Count
        </p>
        <p
          className="mt-1 text-2xl font-black tabular-nums"
          style={{ fontFamily: "var(--font-display)", color: "var(--asc-fg-0)" }}
        >
          {value}
        </p>
      </div>
      <span className="text-2xl" style={{ color: "var(--asc-fg-3)" }}>
        ›
      </span>
    </Link>
  );
}

async function getCommunityStats(): Promise<CommunityStats> {
  const [
    activeTournaments,
    totalUsers,
    totalTeams,
    publicTournaments,
    tournamentResults,
    activeRules,
    activeRoles,
    activeStaff,
  ] = await Promise.all([
    prisma.tournament.count({
      where: {
        visibility: "public",
        status: {
          in: ["open", "upcoming"],
        },
      },
    }),
    prisma.user.count(),
    prisma.team.count(),
    prisma.tournament.count({
      where: {
        visibility: "public",
      },
    }),
    prisma.tournamentResult.count(),
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
  ]);

  return {
    activeTournaments,
    totalUsers,
    totalTeams,
    publicTournaments,
    tournamentResults,
    activeRules,
    activeRoles,
    activeStaff,
  };
}

export default async function CommunityPage() {
  const stats = await getCommunityStats();

  return (
    <main
      className="asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        <section className="relative flex min-h-[460px] items-end overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.55]"
            style={{ backgroundImage: 'url("/images/backgrounds/community-hero.webp")' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 70% 50%, oklch(0.42 0.20 270 / 0.30), transparent 60%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.34) 0%, oklch(0.07 0.025 285 / 0.58) 45%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, oklch(0.07 0.025 285 / 0.42) 35%, transparent 70%)",
              ].join(", "),
            }}
          />

          <div className="relative z-10 mx-auto w-full max-w-[1480px] px-6 pb-9 pt-24 lg:px-10 2xl:px-14">
            <div className="mb-[18px] flex items-center gap-3">
              <DiscordGlyph />
              <span
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ ...monoStyle, color: "var(--asc-fg-2)" }}
              >
                Community · Ascendra Native
              </span>
            </div>

            <h1
              className="max-w-5xl text-[clamp(48px,6.4vw,108px)] leading-[0.92]"
              style={{ color: "var(--asc-fg-0)" }}
            >
              The Ascendra
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(92deg, oklch(0.72 0.20 270) 0%, var(--asc-accent) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Community.
              </span>
            </h1>

            <p
              className="mt-[22px] max-w-[560px] text-[17px] leading-[1.55]"
              style={{ color: "var(--asc-fg-1)" }}
            >
              The site-backed home for Ascendra players, teams, tournaments,
              rules, roles, and staff resources.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/discord" variant="discord">
                <DiscordGlyph size={22} />
                Open Discord Hub
              </ButtonLink>
              <ButtonLink href="/tournaments">View tournaments</ButtonLink>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1480px] gap-12 px-6 pb-20 pt-10 lg:px-10 2xl:px-14">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Active tournaments"
              value={stats.activeTournaments}
              sub="Public events now open or upcoming"
              accent
            />
            <StatTile
              label="Players"
              value={stats.totalUsers}
              sub="Registered Ascendra accounts"
            />
            <StatTile
              label="Teams"
              value={stats.totalTeams}
              sub="Teams created on Ascendra"
            />
            <StatTile
              label="Results"
              value={stats.tournamentResults}
              sub="Recorded tournament results"
            />
          </div>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <SectionRule label="Platform-backed community" />
              <div className="grid gap-4 md:grid-cols-2">
                <FeatureCard
                  index={1}
                  title="Tournament hub"
                  description="Browse public Ascendra tournaments without relying on Discord-only context."
                  href="/tournaments"
                  label="Open tournaments"
                />
                <FeatureCard
                  index={2}
                  title="Community rules"
                  description="Read the active rulebook and role structure that guide community participation."
                  href="/rules"
                  label="View rules"
                />
                <FeatureCard
                  index={3}
                  title="Leaderboard context"
                  description="Follow community tournament points with Riot-safe ranking language and real results."
                  href="/leaderboard"
                  label="Open leaderboard"
                />
                <FeatureCard
                  index={4}
                  title="Staff directory"
                  description="Find published staff contacts and community roles maintained inside Ascendra."
                  href="/staff"
                  label="View staff"
                />
              </div>
            </div>

            <DiscordCard />
          </section>

          <section>
            <SectionRule label="Community directory" />
            <Panel className="p-0">
              <div className="px-6 py-5">
                <p
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{ ...monoStyle, color: "var(--asc-accent)" }}
                >
                  Real platform data
                </p>
                <h2 className="mt-2 text-2xl md:text-3xl" style={{ color: "var(--asc-fg-0)" }}>
                  Ascendra community resources
                </h2>
              </div>

              <DirectoryRow
                href="/tournaments"
                label="Events"
                title="Public tournaments"
                value={stats.publicTournaments}
                description="Published tournaments currently available through the Ascendra platform."
              />
              <DirectoryRow
                href="/rules"
                label="Governance"
                title="Active rules"
                value={stats.activeRules}
                description="Rules currently marked active for community and tournament conduct."
              />
              <DirectoryRow
                href="/roles"
                label="Access"
                title="Active roles"
                value={stats.activeRoles}
                description="Community roles currently published in the Ascendra role directory."
              />
              <DirectoryRow
                href="/staff"
                label="Support"
                title="Active staff"
                value={stats.activeStaff}
                description="Staff profiles currently visible in the public staff directory."
              />
            </Panel>
          </section>
        </section>

        <Footer />
      </div>
    </main>
  );
}
