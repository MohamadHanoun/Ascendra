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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discord | Ascendra",
  description:
    "Ascendra Discord hub with real bot status, role counts, and slash commands.",
};

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
        background: "oklch(0.62 0.18 270)",
        clipPath:
          "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
        boxShadow: "0 0 28px oklch(0.62 0.18 270 / 0.28)",
      }}
    >
      <svg
        aria-hidden="true"
        width={iconWidth}
        height={iconHeight}
        viewBox="0 0 24 18"
        fill="oklch(0.98 0.01 290)"
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
}: {
  title: string;
  roleCounts: DiscordRoleCount[];
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
          Roles
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
              Discord role
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

function groupSlashCommands(commands: DiscordSlashCommand[]) {
  const commandMap = new Map(commands.map((command) => [command.name, command]));
  const grouped: { label: string; commands: DiscordSlashCommand[] }[] =
    commandGroups
    .map((group) => ({
      label: group.label,
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
      label: "Other",
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
            background: "oklch(0.12 0.04 285 / 0.58)",
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

function SlashCommandList({ commands }: { commands: DiscordSlashCommand[] }) {
  if (commands.length === 0) {
    return (
      <Panel className="p-8 text-center">
        <p
          className="relative z-10 text-sm font-black uppercase tracking-[0.12em]"
          style={{ color: "var(--asc-fg-0)" }}
        >
          Bot commands will appear after the next bot sync.
        </p>
      </Panel>
    );
  }

  return (
    <div className="grid gap-4">
      {groupSlashCommands(commands).map((group) => (
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
                  Slash commands
                </p>
                <h3 className="mt-2 text-xl" style={{ color: "var(--asc-fg-0)" }}>
                  {group.label}
                </h3>
              </div>
              <span
                className="text-[10px] uppercase tracking-[0.14em]"
                style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
              >
                {group.commands.length} commands
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
  const stats = await getDiscordStats();
  const statTiles = [
    stats.memberCount !== null
      ? {
          label: "Members",
          value: formatNumber(stats.memberCount),
          sub: "From Discord guild",
          accent: true,
        }
      : null,
    stats.onlineCount !== null
      ? {
          label: "Online",
          value: formatNumber(stats.onlineCount),
          sub: "Presence data from Discord",
          accent: false,
        }
      : null,
    {
      label: "Bot status",
      value: stats.botStatusLabel,
      sub: stats.lastHeartbeatAt ? "Heartbeat monitored" : "No heartbeat yet",
      accent: stats.botStatus === "online",
    },
    stats.lastSyncedAt
      ? {
          label: "Last synced",
          value: formatDateTime(stats.lastSyncedAt) || "",
          sub: "Bot heartbeat",
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
      className="asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        <section className="relative flex min-h-[500px] items-end overflow-hidden">
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

          <div className="relative z-10 mx-auto w-full max-w-[1480px] px-6 pb-10 pt-24 lg:px-10 2xl:px-14">
            <div className="mb-[18px] flex items-center gap-3">
              <DiscordGlyph />
              <span
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ ...monoStyle, color: "var(--asc-fg-2)" }}
              >
                Community · Discord Native
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
                Discord.
              </span>
            </h1>

            <p
              className="mt-[22px] max-w-[580px] text-[17px] leading-[1.55]"
              style={{ color: "var(--asc-fg-1)" }}
            >
              Live server status, moderation role counts, community roles, and
              the real Ascendra bot command list synced from the running bot.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {stats.inviteUrl && (
                <ButtonLink href={stats.inviteUrl} variant="discord" external>
                  <DiscordGlyph size={22} />
                  Join the server
                </ButtonLink>
              )}
              <ButtonLink href="/community">View community</ButtonLink>
              <ButtonLink href="/tournaments">View tournaments</ButtonLink>
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
                  "linear-gradient(135deg, oklch(0.25 0.15 270 / 0.62), var(--asc-bg-1) 62%)",
              }}
            >
              <div className="relative z-10">
                <p
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{ ...monoStyle, color: "var(--asc-accent)" }}
                >
                  Bot heartbeat
                </p>
                <h2 className="mt-2 text-2xl md:text-3xl" style={{ color: "var(--asc-fg-0)" }}>
                  Ascendra bot status
                </h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-[0.14em]"
                      style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
                    >
                      Status
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
                        Bot
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
                        Uptime
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
                title="Staff and moderation"
                roleCounts={staffRoleCounts}
              />
              <RoleCountSection
                title="Community access"
                roleCounts={communityRoleCounts}
              />
            </div>
          </section>

          <section>
            <SectionRule label="Real slash commands" />
            <SlashCommandList commands={stats.slashCommands} />
          </section>
        </section>

        <Footer />
      </div>
    </main>
  );
}
