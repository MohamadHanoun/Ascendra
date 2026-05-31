import Link from "next/link";

type AdminTab = {
  label: string;
  value: string;
};

type AdminTabGroup = {
  title: string;
  tabs: AdminTab[];
};

type AdminTabNavigationProps = {
  activeTab: string;
};

const groups: AdminTabGroup[] = [
  {
    title: "Core",
    tabs: [
      { label: "Overview", value: "overview" },
      { label: "Tournaments", value: "tournaments" },
      { label: "Registrations", value: "registrations" },
      { label: "Teams", value: "teams" },
      { label: "Players", value: "players" },
      { label: "Matches", value: "matches" },
    ],
  },
  {
    title: "Content",
    tabs: [
      { label: "Announcements", value: "announcements" },
      { label: "Rules", value: "rules" },
      { label: "Roles", value: "roles" },
      { label: "Staff", value: "staff" },
    ],
  },
  {
    title: "Tools",
    tabs: [{ label: "Modules", value: "modules" }],
  },
];

function TabLink({ tab, activeTab }: { tab: AdminTab; activeTab: string }) {
  const isActive = activeTab === tab.value;

  return (
    <Link
      href={`/admin?tab=${tab.value}`}
      className="whitespace-nowrap border px-4 py-2 text-sm font-black transition"
      style={
        isActive
          ? { borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-fg-0)" }
          : { borderColor: "var(--asc-line-soft)", background: "transparent", color: "var(--asc-fg-2)" }
      }
    >
      {tab.label}
    </Link>
  );
}

export default function AdminTabNavigation({
  activeTab,
}: AdminTabNavigationProps) {
  return (
    <section className="pb-8">
      <div
        className="border p-4 shadow-2xl"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <div className="grid gap-4">
          {groups.map((group) => (
            <div
              key={group.title}
              className="grid gap-2 lg:grid-cols-[110px_minmax(0,1fr)] lg:items-center"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-fg-3)" }}>
                {group.title}
              </p>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {group.tabs.map((tab) => (
                  <TabLink key={tab.value} tab={tab} activeTab={activeTab} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 pt-4" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
          <Link
            href="/admin/games"
            className="inline-flex border px-4 py-2 text-sm font-black transition hover:opacity-90"
            style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
          >
            Games
          </Link>

          <Link
            href="/admin/faceit-webhooks"
            className="inline-flex border px-4 py-2 text-sm font-black transition hover:opacity-90"
            style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
          >
            FACEIT Status
          </Link>

          <Link
            href="/admin/riot-status"
            className="inline-flex border px-4 py-2 text-sm font-black transition hover:opacity-90"
            style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
          >
            Riot Status
          </Link>

          <Link
            href="/admin/match-operations"
            className="inline-flex border px-4 py-2 text-sm font-black transition hover:opacity-90"
            style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
          >
            Match Operations
          </Link>

          <Link
            href="/admin/bot"
            className="inline-flex border px-4 py-2 text-sm font-black transition hover:opacity-90"
            style={{ borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }}
          >
            Bot Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
