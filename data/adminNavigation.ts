export type AdminNavigationItem = {
  label: string;
  href: string;
  path: string;
  tab?: string;
  matchPaths?: string[];
};

export type AdminNavigationGroup = {
  title: string;
  items: AdminNavigationItem[];
};

export const adminNavigationGroups: AdminNavigationGroup[] = [
  {
    title: "Dashboard",
    items: [
      {
        label: "Overview",
        href: "/admin",
        path: "/admin",
        tab: "overview",
      },
    ],
  },
  {
    title: "Competition",
    items: [
      {
        label: "Tournaments",
        href: "/admin?tab=tournaments",
        path: "/admin",
        tab: "tournaments",
        matchPaths: ["/admin/tournaments"],
      },
      {
        label: "Registrations",
        href: "/admin?tab=registrations",
        path: "/admin",
        tab: "registrations",
      },
      {
        label: "Teams",
        href: "/admin?tab=teams",
        path: "/admin",
        tab: "teams",
      },
      {
        label: "Players",
        href: "/admin?tab=players",
        path: "/admin",
        tab: "players",
      },
      {
        label: "Matches",
        href: "/admin?tab=matches",
        path: "/admin",
        tab: "matches",
      },
      {
        label: "Match Operations",
        href: "/admin/match-operations",
        path: "/admin/match-operations",
      },
    ],
  },
  {
    title: "Public Content",
    items: [
      {
        label: "Announcements",
        href: "/admin?tab=announcements",
        path: "/admin",
        tab: "announcements",
      },
      {
        label: "Rules",
        href: "/admin?tab=rules",
        path: "/admin",
        tab: "rules",
      },
      {
        label: "Roles",
        href: "/admin?tab=roles",
        path: "/admin",
        tab: "roles",
      },
      {
        label: "Staff",
        href: "/admin?tab=staff",
        path: "/admin",
        tab: "staff",
      },
      {
        label: "Games",
        href: "/admin/games",
        path: "/admin/games",
      },
    ],
  },
  {
    title: "Integrations",
    items: [
      {
        label: "Bot Dashboard",
        href: "/admin/bot",
        path: "/admin/bot",
      },
      {
        label: "FACEIT Status",
        href: "/admin/faceit-webhooks",
        path: "/admin/faceit-webhooks",
      },
      {
        label: "Riot Status",
        href: "/admin/riot-status",
        path: "/admin/riot-status",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Modules",
        href: "/admin?tab=modules",
        path: "/admin",
        tab: "modules",
      },
    ],
  },
];
