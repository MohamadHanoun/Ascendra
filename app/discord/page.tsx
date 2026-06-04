import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
  getDiscordStats,
  type DiscordBotStatus,
  type DiscordRoleCount,
  type DiscordSlashCommand,
} from "@/lib/discordStats";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DiscordPageMessages = {
  metadata: { title: string; description: string };
  hero: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    joinServer: string;
    viewCommunity: string;
    viewTournaments: string;
  };
  stats: {
    members: { label: string; sub: string };
    online: { label: string; sub: string };
    botStatus: { label: string; heartbeatSub: string; noHeartbeatSub: string };
    lastSynced: { label: string; sub: string };
  };
  botPanel: {
    eyebrow: string;
    title: string;
    statusLabel: string;
    botLabel: string;
    uptimeLabel: string;
  };
  roles: {
    eyebrow: string;
    discordRoleLabel: string;
    staffTitle: string;
    communityTitle: string;
  };
  commands: {
    sectionLabel: string;
    slashCommandsLabel: string;
    commandsSuffix: string;
    emptyMessage: string;
    groups: {
      general: string;
      tournaments: string;
      leaderboard: string;
      teamsProfiles: string;
      community: string;
      botStatus: string;
      other: string;
    };
  };
};

const discordMessages: Record<Locale, DiscordPageMessages> = {
  en: {
    metadata: {
      title: "Discord ",
      description:
        "Ascendra Discord hub with real bot status, role counts, and slash commands.",
    },
    hero: {
      badge: "Community · Discord Native",
      titleLine1: "The Ascendra",
      titleLine2: "Discord.",
      description:
        "Live server status, moderation role counts, community roles, and the real Ascendra bot command list synced from the running bot.",
      joinServer: "Join the server",
      viewCommunity: "View community",
      viewTournaments: "View tournaments",
    },
    stats: {
      members: { label: "Members", sub: "From Discord guild" },
      online: { label: "Online", sub: "Presence data from Discord" },
      botStatus: {
        label: "Bot status",
        heartbeatSub: "Heartbeat monitored",
        noHeartbeatSub: "No heartbeat yet",
      },
      lastSynced: { label: "Last synced", sub: "Bot heartbeat" },
    },
    botPanel: {
      eyebrow: "Bot heartbeat",
      title: "Ascendra bot status",
      statusLabel: "Status",
      botLabel: "Bot",
      uptimeLabel: "Uptime",
    },
    roles: {
      eyebrow: "Roles",
      discordRoleLabel: "Discord role",
      staffTitle: "Staff and moderation",
      communityTitle: "Community access",
    },
    commands: {
      sectionLabel: "Real slash commands",
      slashCommandsLabel: "Slash commands",
      commandsSuffix: "commands",
      emptyMessage: "Bot commands will appear after the next bot sync.",
      groups: {
        general: "General",
        tournaments: "Tournaments",
        leaderboard: "Leaderboard",
        teamsProfiles: "Teams & Profiles",
        community: "Community",
        botStatus: "Bot Status",
        other: "Other",
      },
    },
  },
  ar: {
    metadata: {
      title: "Discord | Ascendra",
      description:
        "مركز Discord الخاص بـ Ascendra مع حالة البوت الحقيقية، عدد الأدوار، وأوامر الشرطة المائلة.",
    },
    hero: {
      badge: "المجتمع · مدمج مع Discord",
      titleLine1: "Discord",
      titleLine2: "Ascendra.",
      description:
        "حالة الخادم المباشرة، عدد أدوار الإشراف، أدوار المجتمع، وقائمة أوامر بوت Ascendra الحقيقية المزامَنة من البوت الفعلي.",
      joinServer: "انضم إلى الخادم",
      viewCommunity: "عرض المجتمع",
      viewTournaments: "عرض البطولات",
    },
    stats: {
      members: { label: "الأعضاء", sub: "من خادم Discord" },
      online: { label: "المتصلون", sub: "بيانات الحضور من Discord" },
      botStatus: {
        label: "حالة البوت",
        heartbeatSub: "النبضة مراقبة",
        noHeartbeatSub: "لا توجد نبضة بعد",
      },
      lastSynced: { label: "آخر مزامنة", sub: "نبضة البوت" },
    },
    botPanel: {
      eyebrow: "نبضة البوت",
      title: "حالة بوت Ascendra",
      statusLabel: "الحالة",
      botLabel: "البوت",
      uptimeLabel: "وقت التشغيل",
    },
    roles: {
      eyebrow: "الأدوار",
      discordRoleLabel: "دور Discord",
      staffTitle: "الفريق والإشراف",
      communityTitle: "وصول المجتمع",
    },
    commands: {
      sectionLabel: "أوامر شرطة مائلة حقيقية",
      slashCommandsLabel: "أوامر الشرطة المائلة",
      commandsSuffix: "أمر",
      emptyMessage: "ستظهر أوامر البوت بعد المزامنة القادمة.",
      groups: {
        general: "عام",
        tournaments: "البطولات",
        leaderboard: "لوحة المتصدرين",
        teamsProfiles: "الفرق والملفات الشخصية",
        community: "المجتمع",
        botStatus: "حالة البوت",
        other: "أخرى",
      },
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = discordMessages[locale].metadata;
  return { title: messages.title, description: messages.description };
}

const monoStyle: CSSProperties = {
  fontFamily: "var(--font-mono, monospace)",
};

const clippedStyle: CSSProperties = {
  clipPath:
    "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
};

const commandGroups = [
  {
    label: "General",
    names: ["ascendra", "about", "links", "invite", "ping", "help"],
  },
  {
    label: "Tournaments",
    names: ["tournaments", "schedule", "tournament", "results"],
  },
  {
    label: "Leaderboard",
    names: ["leaderboard", "games", "stats"],
  },
  {
    label: "Teams & Profiles",
    names: ["profile", "teams", "team", "roster", "teamresults", "registrations"],
  },
  {
    label: "Community",
    names: ["announcements", "staff", "rules", "community"],
  },
  {
    label: "Bot Status",
    names: ["status"],
  },
] as const;

function CornerMark() {
  return <div aria-hidden="true" className="asc-corner-mark" />;
}

function DiscordGlyph({ size = 52 }: { size?: number }) {
  const iconWidth = Math.round(size * 0.52);
  const iconHeight = Math.round(iconWidth * 0.75);

  return (
    <div
      className="grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #b8893d, #8f642f)",
        clipPath:
          "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
        boxShadow: "0 0 28px rgba(184, 137, 61, 0.32)",
      }}
    >
      <svg
        aria-hidden="true"
        width={iconWidth}
        height={iconHeight}
        viewBox="0 0 24 18"
        fill="#ffffff"
      >
        <path d="M20.3 1.8a18 18 0 0 0-4.5-1.4l-.2.4c1.6.3 3 .9 4.3 1.7-1.6-.9-3.4-1.4-5.3-1.4S10.9.6 9.3 1.5c1.3-.8 2.7-1.4 4.3-1.7l-.2-.4A18 18 0 0 0 8.9 1.8C5.7 6.7 4.9 11.4 5.3 16c1.8 1.3 3.6 2 5.4 2.5l.4-.6a11 11 0 0 1-2.2-1.1c.2-.1.4-.2.5-.3 4.1 1.9 8.5 1.9 12.5 0 .2.1.4.2.5.3-.7.4-1.4.8-2.2 1.1l.4.6c1.8-.5 3.6-1.2 5.4-2.5.5-5.4-.8-10-2.7-14.2zM9.7 13.5c-1 0-1.9-1-1.9-2.2s.9-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2zm6.6 0c-1 0-1.9-1-1.9-2.2s.9-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2z" />
      </svg>
    </div>
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
        ? "1px solid rgba(184, 137, 61, 0.45)"
        : "1px solid var(--asc-line)",
    background:
      variant === "discord" ? "linear-gradient(135deg, #b8893d, #8f642f)" : "transparent",
    color: "#ffffff",
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

function SectionRule({ label }: { label: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span className="asc-section-label">
        <span style={{ color: "var(--asc-accent)" }}>▲</span> {label}
      </span>
      <span className="h-px flex-1" style={{ background: "var(--asc-line-soft)" }} />
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function getStatusColor(status: DiscordBotStatus) {
  if (status === "online") {
    return "var(--asc-green)";
  }

  if (status === "stale") {
    return "var(--asc-blue)";
  }

  return "var(--asc-fg-3)";
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
          className="mt-3 text-[30px] font-black leading-none tabular-nums"
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

function RoleCountSection({
  title,
  roleCounts,
  rolesLabel,
  discordRoleLabel,
}: {
  title: string;
  roleCounts: DiscordRoleCount[];
  rolesLabel: string;
  discordRoleLabel: string;
}) {
  if (roleCounts.length === 0) {
    return null;
  }

  return (
    <Panel className="p-0">
      <div className="relative z-10 px-6 py-5">
        <p
          className="text-[10px] uppercase tracking-[0.18em]"
          style={{ ...monoStyle, color: "var(--asc-accent)" }}
        >
          {rolesLabel}
        </p>
        <h2 className="mt-2 text-2xl" style={{ color: "var(--asc-fg-0)" }}>
          {title}
        </h2>
      </div>

      {roleCounts.map((role) => (
        <div
          key={role.key}
          className="relative z-10 flex items-center justify-between gap-4 px-6 py-4"
          style={{ borderTop: "1px solid var(--asc-line-soft)" }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--asc-fg-0)" }}>
              {role.label}
            </p>
            <p
              className="mt-1 text-[10px] uppercase tracking-[0.12em]"
              style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
            >
              {discordRoleLabel}
            </p>
          </div>
          <p
            className="text-2xl font-black tabular-nums"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--asc-fg-0)",
            }}
          >
            {formatNumber(role.count)}
          </p>
        </div>
      ))}
    </Panel>
  );
}

function groupSlashCommands(
  commands: DiscordSlashCommand[],
  groupLabels: Record<string, string>,
) {
  const commandMap = new Map(commands.map((command) => [command.name, command]));
  const grouped: { label: string; commands: DiscordSlashCommand[] }[] =
    commandGroups
      .map((group) => ({
        label: groupLabels[group.label] ?? group.label,
        commands: group.names
          .map((name) => commandMap.get(name))
          .filter((command): command is DiscordSlashCommand => Boolean(command)),
      }))
      .filter((group) => group.commands.length > 0);
  const groupedNames = new Set(
    grouped.flatMap((group) => group.commands.map((command) => command.name)),
  );
  const remaining = commands.filter((command) => !groupedNames.has(command.name));

  if (remaining.length > 0) {
    grouped.push({
      label: groupLabels["Other"] ?? "Other",
      commands: remaining,
    });
  }

  return grouped;
}

function CommandOptions({ command }: { command: DiscordSlashCommand }) {
  if (command.options.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {command.options.map((option) => (
        <span
          key={option.name}
          className="border px-2 py-1 text-[10px] uppercase tracking-[0.1em]"
          style={{
            ...monoStyle,
            borderColor: "var(--asc-line-soft)",
            color: "var(--asc-fg-2)",
            background: "var(--asc-card-muted)",
          }}
          title={option.description}
        >
          {option.required ? "" : "optional "}
          {option.name}: {option.type}
        </span>
      ))}
    </div>
  );
}

function SlashCommandList({
  commands,
  messages,
}: {
  commands: DiscordSlashCommand[];
  messages: {
    emptyMessage: string;
    slashCommandsLabel: string;
    commandsSuffix: string;
    groupLabels: Record<string, string>;
  };
}) {
  if (commands.length === 0) {
    return (
      <Panel className="p-8 text-center">
        <p
          className="relative z-10 text-sm font-black uppercase tracking-[0.12em]"
          style={{ color: "var(--asc-fg-0)" }}
        >
          {messages.emptyMessage}
        </p>
      </Panel>
    );
  }

  return (
    <div className="grid gap-4">
      {groupSlashCommands(commands, messages.groupLabels).map((group) => (
        <Panel key={group.label} className="p-0">
          <details className="relative z-10 group" open>
            <summary
              className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5"
              style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
            >
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{ ...monoStyle, color: "var(--asc-accent)" }}
                >
                  {messages.slashCommandsLabel}
                </p>
                <h3 className="mt-2 text-xl" style={{ color: "var(--asc-fg-0)" }}>
                  {group.label}
                </h3>
              </div>
              <span
                className="text-[10px] uppercase tracking-[0.14em]"
                style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
              >
                {group.commands.length} {messages.commandsSuffix}
              </span>
            </summary>

            {group.commands.map((command) => (
              <div
                key={command.name}
                className="px-6 py-5"
                style={{ borderTop: "1px solid var(--asc-line-soft)" }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p
                      className="text-lg font-black"
                      style={{ color: "var(--asc-fg-0)" }}
                    >
                      /{command.name}
                    </p>
                    <p
                      className="mt-2 max-w-2xl text-sm leading-6"
                      style={{ color: "var(--asc-fg-2)" }}
                    >
                      {command.description}
                    </p>
                  </div>
                </div>
                <CommandOptions command={command} />
              </div>
            ))}
          </details>
        </Panel>
      ))}
    </div>
  );
}

export default async function DiscordPage() {
  const [stats, locale] = await Promise.all([getDiscordStats(), getLocale()]);
  const messages = discordMessages[locale];

  const statTiles = [
    stats.memberCount !== null
      ? {
          label: messages.stats.members.label,
          value: formatNumber(stats.memberCount),
          sub: messages.stats.members.sub,
          accent: true,
        }
      : null,
    stats.onlineCount !== null
      ? {
          label: messages.stats.online.label,
          value: formatNumber(stats.onlineCount),
          sub: messages.stats.online.sub,
          accent: false,
        }
      : null,
    {
      label: messages.stats.botStatus.label,
      value: stats.botStatusLabel,
      sub: stats.lastHeartbeatAt
        ? messages.stats.botStatus.heartbeatSub
        : messages.stats.botStatus.noHeartbeatSub,
      accent: stats.botStatus === "online",
    },
    stats.lastSyncedAt
      ? {
          label: messages.stats.lastSynced.label,
          value: formatDateTime(stats.lastSyncedAt) || "",
          sub: messages.stats.lastSynced.sub,
          accent: false,
        }
      : null,
  ].filter(
    (
      tile,
    ): tile is {
      label: string;
      value: string;
      sub: string;
      accent: boolean;
    } => Boolean(tile && tile.value !== ""),
  );
  const staffRoleCounts = stats.roleCounts.filter((role) => role.group === "staff");
  const communityRoleCounts = stats.roleCounts.filter(
    (role) => role.group === "community",
  );

  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        <section className="asc-image-hero relative flex min-h-[500px] items-end overflow-hidden">
          <div
            className="asc-hero-media absolute inset-0 bg-cover bg-center opacity-[0.55]"
            style={{ backgroundImage: 'url("/images/backgrounds/community-hero.webp")' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 70% 50%, rgba(184, 137, 61, 0.12), transparent 60%)",
            }}
          />
          <div
            className="asc-hero-overlay absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, rgb(12 11 9 / 0.34) 0%, rgb(12 11 9 / 0.58) 45%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, rgb(12 11 9 / 0.42) 35%, transparent 70%)",
              ].join(", "),
            }}
          />

          <div className="asc-image-hero-content relative z-10 mx-auto w-full max-w-[1480px] px-6 pb-10 pt-24 lg:px-10 2xl:px-14">
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
                    "linear-gradient(90deg, #b8893d, #f6eee5, #8f642f)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {messages.hero.titleLine2}
              </span>
            </h1>

            <p
              className="mt-[22px] max-w-[580px] text-[17px] leading-[1.55]"
              style={{ color: "var(--asc-fg-1)" }}
            >
              {messages.hero.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {stats.inviteUrl && (
                <ButtonLink href={stats.inviteUrl} variant="discord" external>
                  <DiscordGlyph size={22} />
                  {messages.hero.joinServer}
                </ButtonLink>
              )}
              <ButtonLink href="/community">{messages.hero.viewCommunity}</ButtonLink>
              <ButtonLink href="/tournaments">{messages.hero.viewTournaments}</ButtonLink>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1480px] gap-12 px-6 pb-20 pt-10 lg:px-10 2xl:px-14">
          {statTiles.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statTiles.map((tile) => (
                <StatTile
                  key={tile.label}
                  label={tile.label}
                  value={tile.value}
                  sub={tile.sub}
                  accent={tile.accent}
                />
              ))}
            </div>
          )}

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <Panel
              className="p-7 md:p-8"
              style={{
                background:
                  "linear-gradient(135deg, rgba(184, 137, 61, 0.14), var(--asc-bg-1) 62%)",
              }}
            >
              <div className="relative z-10">
                <p
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{ ...monoStyle, color: "var(--asc-accent)" }}
                >
                  {messages.botPanel.eyebrow}
                </p>
                <h2 className="mt-2 text-2xl md:text-3xl" style={{ color: "var(--asc-fg-0)" }}>
                  {messages.botPanel.title}
                </h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-[0.14em]"
                      style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
                    >
                      {messages.botPanel.statusLabel}
                    </p>
                    <p
                      className="mt-2 text-3xl font-black"
                      style={{
                        color: getStatusColor(stats.botStatus),
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {stats.botStatusLabel}
                    </p>
                  </div>
                  {stats.botTag && (
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-[0.14em]"
                        style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
                      >
                        {messages.botPanel.botLabel}
                      </p>
                      <p className="mt-2 text-lg font-bold" style={{ color: "var(--asc-fg-0)" }}>
                        {stats.botTag}
                      </p>
                    </div>
                  )}
                  {stats.uptimeMs !== null && (
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-[0.14em]"
                        style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
                      >
                        {messages.botPanel.uptimeLabel}
                      </p>
                      <p className="mt-2 text-lg font-bold" style={{ color: "var(--asc-fg-0)" }}>
                        {Math.floor(stats.uptimeMs / 60000)} min
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            <div className="grid gap-4">
              <RoleCountSection
                title={messages.roles.staffTitle}
                roleCounts={staffRoleCounts}
                rolesLabel={messages.roles.eyebrow}
                discordRoleLabel={messages.roles.discordRoleLabel}
              />
              <RoleCountSection
                title={messages.roles.communityTitle}
                roleCounts={communityRoleCounts}
                rolesLabel={messages.roles.eyebrow}
                discordRoleLabel={messages.roles.discordRoleLabel}
              />
            </div>
          </section>

          <section>
            <SectionRule label={messages.commands.sectionLabel} />
            <SlashCommandList
              commands={stats.slashCommands}
              messages={{
                emptyMessage: messages.commands.emptyMessage,
                slashCommandsLabel: messages.commands.slashCommandsLabel,
                commandsSuffix: messages.commands.commandsSuffix,
                groupLabels: {
                  General: messages.commands.groups.general,
                  Tournaments: messages.commands.groups.tournaments,
                  Leaderboard: messages.commands.groups.leaderboard,
                  "Teams & Profiles": messages.commands.groups.teamsProfiles,
                  Community: messages.commands.groups.community,
                  "Bot Status": messages.commands.groups.botStatus,
                  Other: messages.commands.groups.other,
                },
              }}
            />
          </section>
        </section>

        <Footer />
      </div>
    </main>
  );
}
