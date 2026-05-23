"use client";

import { useRouter } from "next/navigation";

export type AdminBotDashboardSection =
  | "overview"
  | "messages"
  | "tournaments"
  | "events"
  | "commands"
  | "maintenance"
  | "settings"
  | "invite";

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
    id: "commands",
    label: "Commands",
  },
  {
    id: "maintenance",
    label: "Maintenance",
  },
  {
    id: "settings",
    label: "Settings",
  },
  {
    id: "invite",
    label: "Invite",
  },
];

function getTabHref(section: AdminBotDashboardSection) {
  if (section === "overview") {
    return "/admin/bot";
  }

  return `/admin/bot?botSection=${section}`;
}

export default function AdminBotDashboardTabs({
  activeSection,
}: {
  activeSection: AdminBotDashboardSection;
}) {
  const router = useRouter();

  function goToSection(section: AdminBotDashboardSection) {
    router.push(getTabHref(section));
  }

  return (
    <nav className="relative z-[9999] rounded-3xl border border-white/10 bg-[#11121d]/95 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = activeSection === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => goToSection(tab.id)}
              className={`relative z-[9999] inline-flex cursor-pointer rounded-2xl px-4 py-3 text-sm font-black transition ${
                active
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-950/30"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
