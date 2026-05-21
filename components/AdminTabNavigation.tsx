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
  { label: "Registrations", value: "registrations" },
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
    <section className="pb-8">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-2 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.value;

              return (
                <Link
                  key={tab.value}
                  href={`/admin?tab=${tab.value}`}
                  className={`whitespace-nowrap rounded-2xl border px-4 py-2.5 text-sm font-black transition ${
                    isActive
                      ? "border-violet-400/40 bg-violet-500/15 text-white shadow-lg shadow-violet-950/20"
                      : "border-white/10 bg-black/25 text-gray-300 hover:border-violet-400/30 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
