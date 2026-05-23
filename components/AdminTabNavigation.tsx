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
      className={`whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-black transition ${
        isActive
          ? "border-violet-400/40 bg-violet-500/15 text-white shadow-lg shadow-violet-950/20"
          : "border-white/10 bg-black/20 text-gray-300 hover:border-violet-400/30 hover:bg-white/10 hover:text-white"
      }`}
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
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20">
        <div className="grid gap-4">
          {groups.map((group) => (
            <div
              key={group.title}
              className="grid gap-2 lg:grid-cols-[110px_minmax(0,1fr)] lg:items-center"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
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

        <div className="mt-4 flex flex-wrap gap-3 border-t border-white/10 pt-4">
          <Link
            href="/admin/games"
            className="inline-flex rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-sm font-black text-violet-200 transition hover:border-violet-300/40 hover:bg-violet-500/15 hover:text-white"
          >
            Games
          </Link>

          <Link
            href="/admin/bot"
            className="inline-flex rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-200 transition hover:border-emerald-300/40 hover:bg-emerald-500/15 hover:text-white"
          >
            Bot Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
