import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SectionReveal from "@/components/SectionReveal";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

type CommunityPageMessages = {
  metadata: { title: string; description: string };
  hero: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    openDiscordHub: string;
    viewTournaments: string;
  };
  stats: {
    activeTournaments: { label: string; sub: string };
    players: { label: string; sub: string };
    teams: { label: string; sub: string };
    results: { label: string; sub: string };
  };
  discordCard: {
    eyebrow: string;
    title: string;
    description: string;
    buttonLabel: string;
  };
  features: {
    sectionLabel: string;
    cards: {
      tournament: { title: string; description: string; label: string };
      rules: { title: string; description: string; label: string };
      leaderboard: { title: string; description: string; label: string };
      staff: { title: string; description: string; label: string };
    };
  };
  directory: {
    sectionLabel: string;
    eyebrow: string;
    title: string;
    countLabel: string;
    rows: {
      events: { label: string; title: string; description: string };
      governance: { label: string; title: string; description: string };
      access: { label: string; title: string; description: string };
      support: { label: string; title: string; description: string };
    };
  };
};

const communityMessages: Record<Locale, CommunityPageMessages> = {
  en: {
    metadata: {
      title: "Community",
      description:
        "Explore the Ascendra community hub for tournaments, rules, roles, and platform resources.",
    },
    hero: {
      badge: "Community · Ascendra Native",
      titleLine1: "The Ascendra",
      titleLine2: "Community.",
      description:
        "The site-backed home for Ascendra players, teams, tournaments, rules, roles, and staff resources.",
      openDiscordHub: "Open Discord Hub",
      viewTournaments: "View tournaments",
    },
    stats: {
      activeTournaments: {
        label: "Active tournaments",
        sub: "Public events now open or upcoming",
      },
      players: {
        label: "Players",
        sub: "Registered Ascendra accounts",
      },
      teams: {
        label: "Teams",
        sub: "Teams created on Ascendra",
      },
      results: {
        label: "Results",
        sub: "Recorded tournament results",
      },
    },
    discordCard: {
      eyebrow: "Community",
      title: "The Ascendra Discord",
      description:
        "Open the dedicated Discord hub for live server status, bot commands, role counts, and the server invite when configured.",
      buttonLabel: "Open Discord Hub",
    },
    features: {
      sectionLabel: "Platform-backed community",
      cards: {
        tournament: {
          title: "Tournament hub",
          description:
            "Browse public Ascendra tournaments without relying on Discord-only context.",
          label: "Open tournaments",
        },
        rules: {
          title: "Community rules",
          description:
            "Read the active rulebook and role structure that guide community participation.",
          label: "View rules",
        },
        leaderboard: {
          title: "Leaderboard context",
          description:
            "Follow community tournament points with Riot-safe ranking language and real results.",
          label: "Open leaderboard",
        },
        staff: {
          title: "Staff directory",
          description:
            "Find published staff contacts and community roles maintained inside Ascendra.",
          label: "View staff",
        },
      },
    },
    directory: {
      sectionLabel: "Community directory",
      eyebrow: "Real platform data",
      title: "Ascendra community resources",
      countLabel: "Count",
      rows: {
        events: {
          label: "Events",
          title: "Public tournaments",
          description:
            "Published tournaments currently available through the Ascendra platform.",
        },
        governance: {
          label: "Governance",
          title: "Active rules",
          description:
            "Rules currently marked active for community and tournament conduct.",
        },
        access: {
          label: "Access",
          title: "Active roles",
          description:
            "Community roles currently published in the Ascendra role directory.",
        },
        support: {
          label: "Support",
          title: "Active staff",
          description:
            "Staff profiles currently visible in the public staff directory.",
        },
      },
    },
  },
  ar: {
    metadata: {
      title: "المجتمع",
      description:
        "استكشف مركز مجتمع Ascendra للبطولات والقواعد والأدوار وموارد المنصة.",
    },
    hero: {
      badge: "المجتمع · مدمج مع Ascendra",
      titleLine1: "مجتمع",
      titleLine2: "Ascendra.",
      description:
        "المنزل الرسمي للاعبي Ascendra، الفرق، البطولات، القواعد، الأدوار، وموارد الفريق.",
      openDiscordHub: "فتح مركز Discord",
      viewTournaments: "عرض البطولات",
    },
    stats: {
      activeTournaments: {
        label: "البطولات النشطة",
        sub: "فعاليات عامة مفتوحة أو قادمة",
      },
      players: {
        label: "اللاعبون",
        sub: "حسابات Ascendra المسجلة",
      },
      teams: {
        label: "الفرق",
        sub: "فرق تم إنشاؤها على Ascendra",
      },
      results: {
        label: "النتائج",
        sub: "نتائج بطولات مسجلة",
      },
    },
    discordCard: {
      eyebrow: "المجتمع",
      title: "Discord Ascendra",
      description:
        "افتح مركز Discord المخصص لحالة الخادم المباشرة، أوامر البوت، عدد الأدوار، ورابط الدعوة عند توفره.",
      buttonLabel: "فتح مركز Discord",
    },
    features: {
      sectionLabel: "مجتمع مدعوم بالمنصة",
      cards: {
        tournament: {
          title: "مركز البطولات",
          description:
            "استعرض بطولات Ascendra العامة دون الاعتماد على سياق Discord فقط.",
          label: "فتح البطولات",
        },
        rules: {
          title: "قواعد المجتمع",
          description:
            "اطّلع على دليل القواعد النشط وهيكل الأدوار الذي يوجّه مشاركة المجتمع.",
          label: "عرض القواعد",
        },
        leaderboard: {
          title: "سياق لوحة المتصدرين",
          description:
            "تابع نقاط بطولات المجتمع بلغة ترتيب آمنة مع Riot ونتائج حقيقية.",
          label: "فتح لوحة المتصدرين",
        },
        staff: {
          title: "دليل الفريق",
          description:
            "اعثر على جهات اتصال الفريق المنشورة وأدوار المجتمع المُدارة داخل Ascendra.",
          label: "عرض الفريق",
        },
      },
    },
    directory: {
      sectionLabel: "دليل المجتمع",
      eyebrow: "بيانات حقيقية من المنصة",
      title: "موارد مجتمع Ascendra",
      countLabel: "العدد",
      rows: {
        events: {
          label: "الفعاليات",
          title: "البطولات العامة",
          description: "بطولات منشورة متاحة حاليًا عبر منصة Ascendra.",
        },
        governance: {
          label: "الحوكمة",
          title: "القواعد النشطة",
          description:
            "القواعد المحددة حاليًا كنشطة لسلوك المجتمع والبطولات.",
        },
        access: {
          label: "الوصول",
          title: "الأدوار النشطة",
          description:
            "أدوار المجتمع المنشورة حاليًا في دليل أدوار Ascendra.",
        },
        support: {
          label: "الدعم",
          title: "الفريق النشط",
          description: "ملفات الفريق المرئية حاليًا في دليل الفريق العام.",
        },
      },
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = communityMessages[locale].metadata;
  return { title: messages.title, description: messages.description };
}

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
        background: "linear-gradient(135deg, #c9a24a, #9c6f33)",
        clipPath:
          "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
      }}
    >
      <svg
        aria-hidden="true"
        width={iconSize}
        height={Math.round(iconSize * 0.75)}
        viewBox="0 0 24 18"
        fill="#ffffff"
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
        ? "1px solid rgba(201, 162, 74, 0.45)"
        : "1px solid var(--asc-line)",
    background:
      variant === "discord" ? "linear-gradient(135deg, #c9a24a, #9c6f33)" : "transparent",
    color: variant === "discord" ? "#0a0a0b" : "var(--asc-fg-0)",
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
      className={`asc-pub-surface shadow-2xl shadow-black/20 ${className}`}
      style={style}
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
        className="asc-section-label"
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

function DiscordCard({
  messages,
}: {
  messages: CommunityPageMessages["discordCard"];
}) {
  return (
    <Panel
      className="p-0"
      style={{
        background: "var(--asc-discord-card-bg)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 82% 18%, rgba(201, 162, 74, 0.18), transparent 42%)",
        }}
      />
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex items-center gap-4">
          <DiscordGlyph />
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ ...monoStyle, color: "var(--asc-fg-2)" }}
            >
              {messages.eyebrow}
            </p>
            <h2 className="mt-1 text-2xl" style={{ color: "var(--asc-fg-0)" }}>
              {messages.title}
            </h2>
          </div>
        </div>

        <p
          className="mt-5 max-w-[440px] text-sm leading-6"
          style={{ color: "var(--asc-fg-1)" }}
        >
          {messages.description}
        </p>

        <div className="mt-6">
          <ButtonLink href="/discord" variant="discord">
            <DiscordGlyph size={22} />
            {messages.buttonLabel}
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
          className="asc-mini-button mt-5"
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
  countLabel,
}: {
  href: string;
  title: string;
  label: string;
  value: string | number;
  description: string;
  countLabel: string;
}) {
  return (
    <Link
      href={href}
      className="grid gap-4 px-6 py-5 transition hover:bg-[var(--asc-hover-soft)] md:grid-cols-[minmax(0,1fr)_140px_32px] md:items-center"
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
          {countLabel}
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
  const [stats, locale] = await Promise.all([getCommunityStats(), getLocale()]);
  const messages = communityMessages[locale];

  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        <section className="asc-image-hero relative flex min-h-[460px] items-end overflow-hidden">
          <div
            className="asc-hero-media absolute inset-0 bg-cover bg-center opacity-[0.55]"
            style={{ backgroundImage: 'url("/images/backgrounds/community-hero.webp")' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 70% 50%, rgba(201, 162, 74, 0.12), transparent 60%)",
            }}
          />
          <div
            className="asc-hero-overlay absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, rgb(var(--asc-scrim-rgb) / 0.34) 0%, rgb(var(--asc-scrim-rgb) / 0.58) 45%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, rgb(var(--asc-scrim-rgb) / 0.42) 35%, transparent 70%)",
              ].join(", "),
            }}
          />

          <div className="asc-image-hero-content relative z-10 mx-auto w-full max-w-[1480px] px-6 pb-9 pt-24 lg:px-10 2xl:px-14">
            <div className="mb-[18px] flex items-center gap-3">
              <DiscordGlyph />
              <span
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ ...monoStyle, color: "var(--asc-fg-2)" }}
              >
                {messages.hero.badge}
              </span>
            </div>

            <h1
              className="max-w-5xl text-[clamp(48px,6.4vw,108px)] leading-[0.92]"
              style={{ color: "var(--asc-fg-0)" }}
            >
              {messages.hero.titleLine1}
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #c9a24a, #f0e2c0, #9c6f33)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {messages.hero.titleLine2}
              </span>
            </h1>

            <p
              className="mt-[22px] max-w-[560px] text-[17px] leading-[1.55]"
              style={{ color: "var(--asc-fg-1)" }}
            >
              {messages.hero.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/discord" variant="discord">
                <DiscordGlyph size={22} />
                {messages.hero.openDiscordHub}
              </ButtonLink>
              <ButtonLink href="/tournaments">
                {messages.hero.viewTournaments}
              </ButtonLink>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1480px] gap-12 px-6 pb-20 pt-10 lg:px-10 2xl:px-14">
          <SectionReveal>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatTile
                label={messages.stats.activeTournaments.label}
                value={stats.activeTournaments}
                sub={messages.stats.activeTournaments.sub}
                accent
              />
              <StatTile
                label={messages.stats.players.label}
                value={stats.totalUsers}
                sub={messages.stats.players.sub}
              />
              <StatTile
                label={messages.stats.teams.label}
                value={stats.totalTeams}
                sub={messages.stats.teams.sub}
              />
              <StatTile
                label={messages.stats.results.label}
                value={stats.tournamentResults}
                sub={messages.stats.results.sub}
              />
            </div>
          </SectionReveal>

          <SectionReveal delay={0.08}>
            <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
              <div>
                <SectionRule label={messages.features.sectionLabel} />
                <div className="grid gap-4 md:grid-cols-2">
                  <FeatureCard
                    index={1}
                    title={messages.features.cards.tournament.title}
                    description={messages.features.cards.tournament.description}
                    href="/tournaments"
                    label={messages.features.cards.tournament.label}
                  />
                  <FeatureCard
                    index={2}
                    title={messages.features.cards.rules.title}
                    description={messages.features.cards.rules.description}
                    href="/rules"
                    label={messages.features.cards.rules.label}
                  />
                  <FeatureCard
                    index={3}
                    title={messages.features.cards.leaderboard.title}
                    description={messages.features.cards.leaderboard.description}
                    href="/leaderboard"
                    label={messages.features.cards.leaderboard.label}
                  />
                  <FeatureCard
                    index={4}
                    title={messages.features.cards.staff.title}
                    description={messages.features.cards.staff.description}
                    href="/staff"
                    label={messages.features.cards.staff.label}
                  />
                </div>
              </div>

              <DiscordCard messages={messages.discordCard} />
            </section>
          </SectionReveal>

          <SectionReveal delay={0.12}>
          <section>
            <SectionRule label={messages.directory.sectionLabel} />
            <Panel className="p-0">
              <div className="px-6 py-5">
                <p
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{ ...monoStyle, color: "var(--asc-accent)" }}
                >
                  {messages.directory.eyebrow}
                </p>
                <h2 className="mt-2 text-2xl md:text-3xl" style={{ color: "var(--asc-fg-0)" }}>
                  {messages.directory.title}
                </h2>
              </div>

              <DirectoryRow
                href="/tournaments"
                label={messages.directory.rows.events.label}
                title={messages.directory.rows.events.title}
                value={stats.publicTournaments}
                description={messages.directory.rows.events.description}
                countLabel={messages.directory.countLabel}
              />
              <DirectoryRow
                href="/rules"
                label={messages.directory.rows.governance.label}
                title={messages.directory.rows.governance.title}
                value={stats.activeRules}
                description={messages.directory.rows.governance.description}
                countLabel={messages.directory.countLabel}
              />
              <DirectoryRow
                href="/roles"
                label={messages.directory.rows.access.label}
                title={messages.directory.rows.access.title}
                value={stats.activeRoles}
                description={messages.directory.rows.access.description}
                countLabel={messages.directory.countLabel}
              />
              <DirectoryRow
                href="/staff"
                label={messages.directory.rows.support.label}
                title={messages.directory.rows.support.title}
                value={stats.activeStaff}
                description={messages.directory.rows.support.description}
                countLabel={messages.directory.countLabel}
              />
            </Panel>
          </section>
          </SectionReveal>
        </section>

        <Footer />
      </div>
    </main>
  );
}
