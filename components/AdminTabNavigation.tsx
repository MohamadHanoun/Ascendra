import Link from "next/link";

type AdminTab = {
  label: string;
  value: string;
  description: string;
};

type AdminTabNavigationProps = {
  activeTab: string;
};

const tabs: AdminTab[] = [
  {
    label: "Overview",
    value: "overview",
    description: "Database summary",
  },
  {
    label: "Announcements",
    value: "announcements",
    description: "News and updates",
  },
  {
    label: "Tournaments",
    value: "tournaments",
    description: "Events and competitions",
  },
  {
    label: "Rules",
    value: "rules",
    description: "Community rules",
  },
  {
    label: "Roles",
    value: "roles",
    description: "Discord roles",
  },
  {
    label: "Staff",
    value: "staff",
    description: "Team members",
  },
  {
    label: "Modules",
    value: "modules",
    description: "Future tools",
  },
];

export default function AdminTabNavigation({
  activeTab,
}: AdminTabNavigationProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-10">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-indigo-500/5">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;

            return (
              <Link
                key={tab.value}
                href={`/admin?tab=${tab.value}`}
                className={`rounded-2xl border p-4 transition ${
                  isActive
                    ? "border-indigo-400/40 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/10"
                    : "border-white/10 bg-black/20 text-gray-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                }`}
              >
                <p className="font-bold">{tab.label}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {tab.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}