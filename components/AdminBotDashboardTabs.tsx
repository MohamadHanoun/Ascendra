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
  { id: "overview", label: "Overview" },
  { id: "messages", label: "Messages" },
  { id: "tournaments", label: "Tournaments" },
  { id: "events", label: "Events" },
  { id: "commands", label: "Commands" },
  { id: "maintenance", label: "Maintenance" },
  { id: "settings", label: "Settings" },
  { id: "invite", label: "Invite" },
];

function getTabHref(section: AdminBotDashboardSection) {
  if (section === "overview") return "/admin/bot";
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
    <nav
      className="relative z-[9999] border p-2 shadow-2xl shadow-black/30 backdrop-blur-xl"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-nav-bg)" }}
    >
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = activeSection === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => goToSection(tab.id)}
              className="relative z-[9999] inline-flex cursor-pointer px-4 py-3 text-sm font-black transition hover:opacity-90"
              style={
                active
                  ? { background: "var(--asc-accent-2)", color: "var(--asc-on-accent)" }
                  : { color: "var(--asc-fg-3)" }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
