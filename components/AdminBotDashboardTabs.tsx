import Link from "next/link";

export type AdminBotDashboardSection =
  | "overview"
  | "queue"
  | "events"
  | "commands"
  | "messages"
  | "tournaments"
  | "settings"
  | "maintenance";

const sections: Array<{
  id: AdminBotDashboardSection;
  label: string;
}> = [
  { id: "overview", label: "Overview" },
  { id: "queue", label: "Queue" },
  { id: "events", label: "Events" },
  { id: "commands", label: "Commands" },
  { id: "messages", label: "Messages" },
  { id: "tournaments", label: "Tournaments" },
  { id: "settings", label: "Settings" },
  { id: "maintenance", label: "Maintenance" },
];

function getSectionHref(section: AdminBotDashboardSection) {
  if (section === "overview") return "/admin/bot";
  return `/admin/bot?botSection=${section}`;
}

export default function AdminBotDashboardTabs({
  activeSection,
}: {
  activeSection: AdminBotDashboardSection;
}) {
  return (
    <aside
      className="relative z-[9999] border shadow-2xl shadow-black/30 backdrop-blur-xl lg:sticky lg:top-24"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-nav-bg)" }}
    >
      <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
        <p
          className="text-xs font-black uppercase tracking-[0.16em]"
          style={{ color: "var(--asc-accent)" }}
        >
          Control center
        </p>
      </div>

      <nav className="grid gap-1 p-2" aria-label="Bot dashboard sections">
        {sections.map((section) => {
          const active = activeSection === section.id;
          return (
            <Link
              key={section.id}
              href={getSectionHref(section.id)}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className="relative z-[9999] flex px-4 py-3 text-sm font-black transition hover:opacity-90"
              style={
                active
                  ? { background: "var(--asc-accent-2)", color: "var(--asc-on-accent)" }
                  : { color: "var(--asc-fg-3)" }
              }
            >
              {section.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
