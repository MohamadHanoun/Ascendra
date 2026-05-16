import Link from "next/link";

type AdminTab = {
  label: string;
  value: string;
};

type AdminTabNavigationProps = {
  activeTab: string;
};

const tabs: AdminTab[] = [
  { label: "Overview", value: "overview" },
  { label: "Announcements", value: "announcements" },
  { label: "Tournaments", value: "tournaments" },
  { label: "Teams", value: "teams" },
  { label: "Players", value: "players" },
  { label: "Rules", value: "rules" },
  { label: "Roles", value: "roles" },
  { label: "Staff", value: "staff" },
  { label: "Modules", value: "modules" },
];

export default function AdminTabNavigation({
  activeTab,
}: AdminTabNavigationProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-8">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-2 shadow-2xl shadow-indigo-500/5">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;

            return (
              <Link
                key={tab.value}
                href={`/admin?tab=${tab.value}`}
                className={`whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-bold transition ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
