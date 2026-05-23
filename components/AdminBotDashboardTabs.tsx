import Link from "next/link";

export type AdminBotDashboardSection =
  | "overview"
  | "messages"
  | "tournaments"
  | "events"
  | "settings";

const tabs: Array<{
  id: AdminBotDashboardSection;
  label: string;
}> = [
  {
    id: "overview",
    label: "Overview",
  },
  {
    id: "messages",
    label: "Messages",
  },
  {
    id: "tournaments",
    label: "Tournaments",
  },
  {
    id: "events",
    label: "Events",
  },
  {
    id: "settings",
    label: "Settings",
  },
];

function getTabHref(section: AdminBotDashboardSection) {
  const params = new URLSearchParams();

  if (section !== "overview") {
    params.set("botSection", section);
  }

  const query = params.toString();

  return query ? `/admin/bot?${query}` : "/admin/bot";
}

export default function AdminBotDashboardTabs({
  activeSection,
}: {
  activeSection: AdminBotDashboardSection;
}) {
  return (
    <nav className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-2 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = activeSection === tab.id;

          return (
            <Link
              key={tab.id}
              href={getTabHref(tab.id)}
              scroll={false}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                active
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-950/30"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
