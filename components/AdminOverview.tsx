import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type DashboardTone = "gold" | "green" | "amber" | "blue" | "gray" | "red";

export type AdminOverviewData = {
  stats: Array<{
    label: string;
    value: string | number;
    description: string;
    tone: DashboardTone;
  }>;
  attentionActions: Array<{
    title: string;
    description: string;
    href: string;
    label: string;
    tone: DashboardTone;
  }>;
};

type AdminOverviewProps = {
  data: AdminOverviewData;
};

const adminAreas = [
  {
    title: "Competition",
    description: "Tournament setup, registrations, teams, and match control.",
    links: [
      { label: "Tournaments", href: "/admin?tab=tournaments" },
      { label: "Registrations", href: "/admin?tab=registrations" },
      { label: "Teams", href: "/admin?tab=teams" },
      { label: "Match Operations", href: "/admin/match-operations" },
    ],
  },
  {
    title: "Public Content",
    description: "Launch-facing pages and community information.",
    links: [
      { label: "Announcements", href: "/admin?tab=announcements" },
      { label: "Games", href: "/admin/games" },
      { label: "Rules", href: "/admin?tab=rules" },
      { label: "Staff", href: "/admin?tab=staff" },
    ],
  },
  {
    title: "Integrations",
    description: "Operational services connected to Ascendra.",
    links: [
      { label: "Bot Dashboard", href: "/admin/bot" },
      { label: "FACEIT Status", href: "/admin/faceit-webhooks" },
      { label: "Riot Status", href: "/admin/riot-status" },
    ],
  },
  {
    title: "System",
    description: "Admin capability overview and module status.",
    links: [{ label: "Modules", href: "/admin?tab=modules" }],
  },
];

function toneStyle(tone: DashboardTone): CSSProperties {
  const styles: Record<DashboardTone, CSSProperties> = {
    gold: {
      color: "var(--asc-accent)",
      borderColor: "var(--asc-accent-border)",
      background: "var(--asc-accent-dim)",
    },
    green: {
      color: "var(--asc-green)",
      borderColor: "var(--asc-green-border)",
      background: "var(--asc-green-bg)",
    },
    amber: {
      color: "var(--asc-amber)",
      borderColor: "var(--asc-amber-border)",
      background: "var(--asc-amber-bg)",
    },
    blue: {
      color: "var(--asc-blue)",
      borderColor: "var(--asc-blue-border)",
      background: "var(--asc-blue-bg)",
    },
    gray: {
      color: "var(--asc-fg-3)",
      borderColor: "var(--asc-line-soft)",
      background: "var(--asc-bg-2)",
    },
    red: {
      color: "var(--asc-live)",
      borderColor: "var(--asc-live-border)",
      background: "var(--asc-live-bg)",
    },
  };

  return styles[tone];
}

function Pill({ children, tone = "gray" }: { children: ReactNode; tone?: DashboardTone }) {
  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-xs font-black uppercase tracking-[0.08em]"
      style={toneStyle(tone)}
    >
      {children}
    </span>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      className="overflow-hidden border shadow-xl shadow-black/15"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
      }}
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
      >
        <h2 className="text-lg font-black" style={{ color: "var(--asc-fg-0)" }}>
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function StatusStrip({ stats }: { stats: AdminOverviewData["stats"] }) {
  return (
    <section
      className="grid overflow-hidden border shadow-xl shadow-black/15 sm:grid-cols-2 xl:grid-cols-4"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
      }}
    >
      {stats.map((stat, index) => (
        <article
          key={stat.label}
          className="px-5 py-5"
          style={{
            borderTop:
              index > 0 ? "1px solid var(--asc-line-soft)" : undefined,
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <p
              className="text-xs font-black uppercase tracking-[0.12em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {stat.label}
            </p>
            <span
              className="h-2 w-2"
              style={{ background: toneStyle(stat.tone).color }}
            />
          </div>
          <p
            className="mt-3 text-3xl font-black tabular-nums"
            style={{ color: "var(--asc-fg-0)" }}
          >
            {stat.value}
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
            {stat.description}
          </p>
        </article>
      ))}
    </section>
  );
}

function AttentionRow({
  title,
  description,
  href,
  label,
  tone,
}: AdminOverviewData["attentionActions"][number]) {
  return (
    <Link
      href={href}
      className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.03] md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <div className="min-w-0">
        <h3 className="font-black" style={{ color: "var(--asc-fg-0)" }}>
          {title}
        </h3>
        <p className="mt-1 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
          {description}
        </p>
      </div>
      <Pill tone={tone}>{label}</Pill>
      <span
        className="text-xs font-black uppercase tracking-[0.12em]"
        style={{ color: "var(--asc-accent)" }}
      >
        Open
      </span>
    </Link>
  );
}

function AreaRow({
  title,
  description,
  links,
}: {
  title: string;
  description: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div
      className="grid gap-4 px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)_minmax(260px,auto)] lg:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <h3 className="font-black" style={{ color: "var(--asc-fg-0)" }}>
        {title}
      </h3>
      <p className="text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
        {description}
      </p>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border px-3 py-2 text-xs font-black uppercase tracking-[0.08em] transition hover:border-[var(--asc-accent-border)] hover:text-[var(--asc-accent)]"
            style={{
              borderColor: "var(--asc-line-soft)",
              background: "var(--asc-bg-2)",
              color: "var(--asc-fg-2)",
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AdminOverview({ data }: AdminOverviewProps) {
  return (
    <section className="grid gap-6">
      <StatusStrip stats={data.stats} />

      <Panel
        title="What needs attention"
        description="Start here when you open the admin panel."
      >
        <div>
          {data.attentionActions.map((action) => (
            <AttentionRow key={action.href} {...action} />
          ))}
        </div>
      </Panel>

      <Panel
        title="Admin areas"
        description="Choose the area you want to manage."
      >
        <div>
          {adminAreas.map((area) => (
            <AreaRow key={area.title} {...area} />
          ))}
        </div>
      </Panel>
    </section>
  );
}
