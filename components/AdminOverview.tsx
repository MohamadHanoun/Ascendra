import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type DashboardTone = "gold" | "green" | "amber" | "red" | "blue" | "violet" | "gray";

export type AdminOverviewData = {
  stats: Array<{
    label: string;
    value: string | number;
    description: string;
    tone: DashboardTone;
  }>;
  priorityActions: Array<{
    title: string;
    description: string;
    href: string;
    label: string;
    tone: DashboardTone;
  }>;
  recentTournaments: Array<{
    id: string;
    title: string;
    status: string;
    registrationStatus: string;
    startsAt: Date | null;
    updatedAt: Date;
    gameName: string | null;
    registrationsCount: number;
    matchesCount: number;
  }>;
  recentRegistrations: Array<{
    id: string;
    status: string;
    createdAt: Date;
    teamName: string;
    tournamentTitle: string;
  }>;
  recentAnnouncements: Array<{
    id: string;
    title: string;
    category: string;
    published: boolean;
    important: boolean;
    createdAt: Date;
  }>;
  recentMatches: Array<{
    id: string;
    tournamentId: string;
    tournamentTitle: string;
    roundNumber: number;
    matchNumber: number;
    status: string;
    scheduledAt: Date | null;
    updatedAt: Date;
  }>;
};

type AdminOverviewProps = {
  data: AdminOverviewData;
};

const groupedSections = [
  {
    title: "Competition",
    description: "Run tournaments, review teams, and control matches.",
    links: [
      { label: "Tournaments", href: "/admin?tab=tournaments" },
      { label: "Registrations", href: "/admin?tab=registrations" },
      { label: "Teams", href: "/admin?tab=teams" },
      { label: "Players", href: "/admin?tab=players" },
      { label: "Matches", href: "/admin?tab=matches" },
      { label: "Match Operations", href: "/admin/match-operations" },
    ],
  },
  {
    title: "Public Content",
    description: "Keep the launch-facing website current and professional.",
    links: [
      { label: "Announcements", href: "/admin?tab=announcements" },
      { label: "Rules", href: "/admin?tab=rules" },
      { label: "Roles", href: "/admin?tab=roles" },
      { label: "Staff", href: "/admin?tab=staff" },
      { label: "Games", href: "/admin/games" },
    ],
  },
  {
    title: "Integrations",
    description: "Check external services and operational integrations.",
    links: [
      { label: "Bot Dashboard", href: "/admin/bot" },
      { label: "FACEIT Status", href: "/admin/faceit-webhooks" },
      { label: "Riot Status", href: "/admin/riot-status" },
    ],
  },
  {
    title: "System",
    description: "Review available modules and admin capabilities.",
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
    red: {
      color: "var(--asc-live)",
      borderColor: "var(--asc-live-border)",
      background: "var(--asc-live-bg)",
    },
    blue: {
      color: "var(--asc-blue)",
      borderColor: "var(--asc-blue-border)",
      background: "var(--asc-blue-bg)",
    },
    violet: {
      color: "var(--asc-accent)",
      borderColor: "var(--asc-accent-border)",
      background: "var(--asc-accent-dim)",
    },
    gray: {
      color: "var(--asc-fg-3)",
      borderColor: "var(--asc-line-soft)",
      background: "var(--asc-bg-2)",
    },
  };

  return styles[tone];
}

function getStatusTone(status: string): DashboardTone {
  const normalized = status.toLowerCase();

  if (["open", "active", "approved", "published", "confirmed"].includes(normalized)) {
    return "green";
  }

  if (["registered", "pending", "scheduled", "ready", "room_created"].includes(normalized)) {
    return "blue";
  }

  if (["draft", "result_pending", "disputed"].includes(normalized)) {
    return "amber";
  }

  if (["closed", "cancelled", "rejected", "failed", "forfeit"].includes(normalized)) {
    return "red";
  }

  if (["completed", "ended"].includes(normalized)) {
    return "violet";
  }

  return "gray";
}

function formatDate(date: Date | null | undefined, emptyLabel = "Not scheduled") {
  if (!date) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function Pill({ children, tone = "gray" }: { children: ReactNode; tone?: DashboardTone }) {
  return (
    <span
      className="inline-flex w-fit border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em]"
      style={toneStyle(tone)}
    >
      {children}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p
        className="text-xs font-black uppercase tracking-[0.18em]"
        style={{ color: "var(--asc-accent)" }}
      >
        {eyebrow}
      </p>
      <h2 className="text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>
        {title}
      </h2>
      {description && (
        <p className="max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
          {description}
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  tone,
}: AdminOverviewData["stats"][number]) {
  return (
    <article
      className="border p-5 shadow-2xl shadow-black/20"
      style={{
        borderColor: "var(--asc-line-soft)",
        background:
          "linear-gradient(180deg, rgb(255 255 255 / 0.045), rgb(255 255 255 / 0.018))",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <p
          className="text-[11px] font-black uppercase tracking-[0.14em]"
          style={{ color: "var(--asc-fg-3)" }}
        >
          {label}
        </p>
        <span
          className="h-2.5 w-2.5 border"
          style={{
            borderColor: toneStyle(tone).borderColor,
            background: toneStyle(tone).color,
          }}
        />
      </div>

      <p className="mt-4 text-4xl font-black tabular-nums" style={{ color: "var(--asc-fg-0)" }}>
        {value}
      </p>
      <p className="mt-3 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
        {description}
      </p>
    </article>
  );
}

function PriorityActionCard({
  title,
  description,
  href,
  label,
  tone,
}: AdminOverviewData["priorityActions"][number]) {
  return (
    <Link
      href={href}
      className="group block border p-5 shadow-2xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-[var(--asc-accent-border)] hover:bg-white/[0.035]"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <Pill tone={tone}>{label}</Pill>
        <span
          className="text-xs font-black uppercase tracking-[0.12em] transition group-hover:text-[var(--asc-accent)]"
          style={{ color: "var(--asc-fg-3)" }}
        >
          Open
        </span>
      </div>
      <h3 className="mt-4 text-lg font-black" style={{ color: "var(--asc-fg-0)" }}>
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
        {description}
      </p>
    </Link>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div
      className="border px-4 py-5 text-sm"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-2)",
        color: "var(--asc-fg-3)",
      }}
    >
      {children}
    </div>
  );
}

function RecentPanel({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section
      className="overflow-hidden border shadow-2xl shadow-black/20"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div
        className="flex items-center justify-between gap-4 px-5 py-4"
        style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
      >
        <h3 className="font-black" style={{ color: "var(--asc-fg-0)" }}>
          {title}
        </h3>
        <Link
          href={href}
          className="text-xs font-black uppercase tracking-[0.12em] transition hover:text-[var(--asc-accent)]"
          style={{ color: "var(--asc-fg-3)" }}
        >
          View all
        </Link>
      </div>
      <div className="divide-y divide-[var(--asc-line-soft)]">{children}</div>
    </section>
  );
}

function ActivityRow({
  title,
  meta,
  href,
  children,
}: {
  title: string;
  meta: string;
  href?: string;
  children?: ReactNode;
}) {
  const content = (
    <div className="grid gap-2 px-5 py-4 transition hover:bg-white/[0.025]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-black" style={{ color: "var(--asc-fg-0)" }}>
            {title}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--asc-fg-3)" }}>
            {meta}
          </p>
        </div>
        {children}
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

function AdminSectionCard({
  title,
  description,
  links,
}: {
  title: string;
  description: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <section
      className="border p-5 shadow-2xl shadow-black/20"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <h3 className="text-lg font-black" style={{ color: "var(--asc-fg-0)" }}>
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
        {description}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border px-3 py-2 text-xs font-black uppercase tracking-[0.08em] transition hover:border-[var(--asc-accent-border)] hover:text-[var(--asc-accent)]"
            style={{
              borderColor: "var(--asc-line-soft)",
              color: "var(--asc-fg-2)",
              background: "var(--asc-bg-2)",
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function AdminOverview({ data }: AdminOverviewProps) {
  return (
    <section className="grid gap-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <SectionHeader
            eyebrow="Priority"
            title="Actions that move operations forward"
            description="High-signal links into the existing admin workflows."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {data.priorityActions.map((action) => (
              <PriorityActionCard key={action.href} {...action} />
            ))}
          </div>
        </div>

        <aside
          className="border p-5 shadow-2xl shadow-black/20"
          style={{
            borderColor: "var(--asc-line-soft)",
            background:
              "linear-gradient(180deg, rgb(197 157 95 / 0.12), rgb(255 255 255 / 0.025))",
          }}
        >
          <p
            className="text-xs font-black uppercase tracking-[0.18em]"
            style={{ color: "var(--asc-accent)" }}
          >
            Operator focus
          </p>
          <h3 className="mt-3 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>
            Review, publish, monitor.
          </h3>
          <p className="mt-3 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            Start with registrations, then confirm live tournaments, content, and match operations.
          </p>
          <div className="mt-5 grid gap-3">
            {data.priorityActions.slice(0, 3).map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center justify-between gap-3 border px-4 py-3 text-sm font-bold transition hover:bg-white/[0.035]"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  color: "var(--asc-fg-2)",
                  background: "rgb(0 0 0 / 0.16)",
                }}
              >
                <span>{action.title}</span>
                <Pill tone={action.tone}>{action.label}</Pill>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-5">
        <SectionHeader
          eyebrow="Recent activity"
          title="Latest operational records"
          description="A quick read of what changed recently across competition and public content."
        />

        <div className="grid gap-5 xl:grid-cols-2">
          <RecentPanel title="Tournaments" href="/admin?tab=tournaments">
            {data.recentTournaments.length === 0 ? (
              <EmptyState>No tournaments found.</EmptyState>
            ) : (
              data.recentTournaments.map((tournament) => (
                <ActivityRow
                  key={tournament.id}
                  title={tournament.title}
                  meta={`${tournament.gameName ?? "Tournament"} - ${formatDate(
                    tournament.startsAt,
                  )}`}
                  href={`/admin/tournaments/${tournament.id}`}
                >
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={getStatusTone(tournament.status)}>{tournament.status}</Pill>
                    <Pill tone={getStatusTone(tournament.registrationStatus)}>
                      {tournament.registrationStatus}
                    </Pill>
                    <Pill tone="gray">{tournament.registrationsCount} teams</Pill>
                    <Pill tone="gray">{tournament.matchesCount} matches</Pill>
                  </div>
                </ActivityRow>
              ))
            )}
          </RecentPanel>

          <RecentPanel title="Registrations" href="/admin?tab=registrations">
            {data.recentRegistrations.length === 0 ? (
              <EmptyState>No registrations found.</EmptyState>
            ) : (
              data.recentRegistrations.map((registration) => (
                <ActivityRow
                  key={registration.id}
                  title={registration.teamName}
                  meta={`${registration.tournamentTitle} - ${formatDate(registration.createdAt)}`}
                >
                  <Pill tone={getStatusTone(registration.status)}>{registration.status}</Pill>
                </ActivityRow>
              ))
            )}
          </RecentPanel>

          <RecentPanel title="Announcements" href="/admin?tab=announcements">
            {data.recentAnnouncements.length === 0 ? (
              <EmptyState>No announcements found.</EmptyState>
            ) : (
              data.recentAnnouncements.map((announcement) => (
                <ActivityRow
                  key={announcement.id}
                  title={announcement.title}
                  meta={`${announcement.category} - ${formatDate(announcement.createdAt)}`}
                >
                  <div className="flex flex-wrap gap-2">
                    {announcement.important && <Pill tone="amber">Important</Pill>}
                    <Pill tone={announcement.published ? "green" : "gray"}>
                      {announcement.published ? "Published" : "Hidden"}
                    </Pill>
                  </div>
                </ActivityRow>
              ))
            )}
          </RecentPanel>

          <RecentPanel title="Matches" href="/admin/match-operations">
            {data.recentMatches.length === 0 ? (
              <EmptyState>No match records found.</EmptyState>
            ) : (
              data.recentMatches.map((match) => (
                <ActivityRow
                  key={match.id}
                  title={`${match.tournamentTitle} - R${match.roundNumber} M${match.matchNumber}`}
                  meta={formatDate(match.scheduledAt, `Updated ${formatDate(match.updatedAt)}`)}
                  href={`/tournaments/${match.tournamentId}/matches/${match.id}`}
                >
                  <Pill tone={getStatusTone(match.status)}>
                    {match.status.replace(/_/g, " ")}
                  </Pill>
                </ActivityRow>
              ))
            )}
          </RecentPanel>
        </div>
      </section>

      <section className="grid gap-5">
        <SectionHeader
          eyebrow="Admin areas"
          title="Grouped workspace"
          description="The same admin routes, organized for faster scanning."
        />
        <div className="grid gap-5 xl:grid-cols-2">
          {groupedSections.map((section) => (
            <AdminSectionCard key={section.title} {...section} />
          ))}
        </div>
      </section>
    </section>
  );
}
