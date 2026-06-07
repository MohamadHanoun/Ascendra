import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import AdminAnnouncementForm from "@/components/AdminAnnouncementForm";
import AdminAnnouncementList from "@/components/AdminAnnouncementList";
import AdminModuleCard from "@/components/AdminModuleCard";
import AdminOverview, { type AdminOverviewData } from "@/components/AdminOverview";
import AdminPlayersList from "@/components/AdminPlayersList";
import AdminRegistrationList from "@/components/AdminRegistrationList";
import AdminRoleForm from "@/components/AdminRoleForm";
import AdminRoleList from "@/components/AdminRoleList";
import AdminRuleForm from "@/components/AdminRuleForm";
import AdminRuleList from "@/components/AdminRuleList";
import AdminShell from "@/components/AdminShell";
import AdminStaffForm from "@/components/AdminStaffForm";
import AdminStaffList from "@/components/AdminStaffList";
import AdminMatchesPanel from "@/components/AdminMatchesPanel";
import AdminTeamReview from "@/components/AdminTeamReview";
import AdminToast from "@/components/AdminToast";
import AdminTournamentWizard, {
  type TournamentDefaultValues,
} from "@/components/AdminTournamentWizard";
import AdminTournamentList from "@/components/AdminTournamentList";
import { DiscordLoginButton, LogoutButton } from "@/components/AuthButtons";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { adminModules } from "@/data/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | Ascendra",
  description: "Protected Ascendra admin dashboard.",
};

type AdminPageProps = {
  searchParams: Promise<{
    tab?: string;
    message?: string;
    error?: string;
    type?: string;
    botStatus?: string;
    botType?: string;
    duplicate?: string;
  }>;
};

const allowedTabs = [
  "overview",
  "announcements",
  "tournaments",
  "registrations",
  "teams",
  "players",
  "matches",
  "rules",
  "roles",
  "staff",
  "modules",
];

async function getAdminOverview(): Promise<AdminOverviewData> {
  const [
    pendingRegistrationsCount,
    openTournamentsCount,
    playersCount,
    teamsCount,
    activeMatchesCount,
    disputedMatchesCount,
  ] = await Promise.all([
    prisma.tournamentRegistration.count({
      where: {
        status: "registered",
      },
    }),
    prisma.tournament.count({
      where: {
        registrationStatus: "open",
      },
    }),
    prisma.user.count(),
    prisma.team.count(),
    prisma.tournamentMatch.count({
      where: {
        isBye: false,
        status: {
          in: [
            "scheduled",
            "ready",
            "room_created",
            "in_progress",
            "result_pending",
            "disputed",
          ],
        },
      },
    }),
    prisma.tournamentMatch.count({
      where: { isBye: false, status: "disputed" },
    }),
  ]);

  return {
    stats: [
      {
        label: "Pending registrations",
        value: pendingRegistrationsCount,
        description: "Waiting for admin review",
        tone: pendingRegistrationsCount > 0 ? "amber" : "green",
      },
      {
        label: "Open tournaments",
        value: openTournamentsCount,
        description: "Accepting team registrations",
        tone: openTournamentsCount > 0 ? "green" : "gray",
      },
      {
        label: "Players",
        value: playersCount,
        description: "Discord-authenticated accounts",
        tone: "gold",
      },
      {
        label: "Teams",
        value: teamsCount,
        description: "Player-created teams",
        tone: "gold",
      },
    ],
    attentionActions: [
      {
        title: "Review registrations",
        description: "Approve teams or reject incomplete applications.",
        href: "/admin?tab=registrations",
        label:
          pendingRegistrationsCount > 0
            ? `${pendingRegistrationsCount} pending`
            : "All clear",
        tone: pendingRegistrationsCount > 0 ? "amber" : "green",
      },
      {
        title: "Manage tournaments",
        description: "Create, publish, and update tournament status.",
        href: "/admin?tab=tournaments",
        label: `${openTournamentsCount} open`,
        tone: openTournamentsCount > 0 ? "green" : "gold",
      },
      {
        title: "Monitor matches",
        description: "Check live match operations, disputes, and results.",
        href: "/admin/match-operations",
        label: `${activeMatchesCount} active`,
        tone: "blue",
      },
      {
        title: "Review disputes",
        description: "Resolve disputed match results that need admin attention.",
        href: "/admin/match-operations?review=disputed",
        label:
          disputedMatchesCount > 0
            ? `${disputedMatchesCount} disputed`
            : "All clear",
        tone: disputedMatchesCount > 0 ? "red" : "green",
      },
    ],
  };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p
        className="text-[11px] font-black uppercase tracking-[0.14em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {label}
      </p>

      <p
        className="mt-1 text-2xl font-black"
        style={{ color: "var(--asc-fg-0)" }}
      >
        {value}
      </p>
    </div>
  );
}

function AdminAccessShell({
  tone,
  label,
  title,
  description,
  children,
}: {
  tone: "violet" | "red";
  label: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const labelStyle: React.CSSProperties = {
    color: tone === "red" ? "var(--asc-live)" : "var(--asc-accent)",
  };

  return (
    <main
      className="asc-admin-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)" }}
    >
      <Navbar />

      <section className="asc-admin-hero relative min-h-[520px] overflow-hidden">
        <div
          className="asc-admin-hero-image absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("/images/backgrounds/admin-hero.webp")',
          }}
        />
        <div className="asc-admin-hero-overlay pointer-events-none absolute inset-0" />
        <div className="asc-admin-hero-bottom pointer-events-none absolute inset-x-0 bottom-0 h-32" />

        <div className="relative z-10 mx-auto flex min-h-[520px] max-w-[820px] flex-col items-center justify-center px-6 pb-24 pt-20 text-center lg:px-10">
          <p
            className="mb-4 text-sm font-black uppercase tracking-[0.24em]"
            style={labelStyle}
          >
            {label}
          </p>
          <h1
            className="text-5xl font-black uppercase leading-[1.04] tracking-tight md:text-6xl"
            style={{ color: "var(--asc-fg-0)" }}
          >
            {title}
          </h1>
          <p
            className="mt-5 max-w-xl leading-7"
            style={{ color: "var(--asc-fg-2)" }}
          >
            {description}
          </p>
          <div className="mt-8">{children}</div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

async function renderAdminTab(
  activeTab: string,
  message?: string,
  error?: string,
  duplicateId?: string,
) {
  if (activeTab === "overview") {
    const overview = await getAdminOverview();

    return (
      <section className="mx-auto max-w-[1440px] px-6 pb-16 lg:px-10">
        <AdminOverview data={overview} />
      </section>
    );
  }

  if (activeTab === "announcements") {
    return (
      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:px-10">
        <AdminAnnouncementForm />
        <AdminAnnouncementList />
      </section>
    );
  }

  if (activeTab === "tournaments") {
    const games = await prisma.game.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        name: true,
        defaultTeamSize: true,
        defaultSubstitutes: true,
      },
      orderBy: { name: "asc" },
    });

    let defaultValues: TournamentDefaultValues | undefined;

    if (duplicateId) {
      const source = await prisma.tournament.findUnique({
        where: { id: duplicateId },
        select: {
          title: true,
          description: true,
          prize: true,
          imageUrl: true,
          maxTeams: true,
          minTeams: true,
          teamSize: true,
          substitutesAllowed: true,
          format: true,
          bestOf: true,
          region: true,
          platform: true,
          visibility: true,
          game: { select: { slug: true } },
        },
      });

      if (source) {
        defaultValues = {
          title: `${source.title} — copy`,
          gameSlug: source.game?.slug ?? "",
          imageUrl: source.imageUrl ?? "",
          description: source.description,
          prize: source.prize ?? "",
          format: source.format,
          bestOf: source.bestOf,
          maxTeams: source.maxTeams,
          minTeams: source.minTeams,
          teamSize: source.teamSize,
          substitutesAllowed: source.substitutesAllowed,
          region: source.region ?? "",
          platform: source.platform ?? "",
          visibility: source.visibility,
        };
      }
    }

    return (
      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:px-10">
        <AdminTournamentWizard
          games={games}
          defaultValues={defaultValues}
          key={duplicateId ?? "create"}
        />
        <AdminTournamentList />
      </section>
    );
  }

  if (activeTab === "registrations") {
    return (
      <section className="mx-auto max-w-[1440px] px-6 pb-16 lg:px-10">
        <AdminRegistrationList message={message} error={error} />
      </section>
    );
  }

  if (activeTab === "teams") {
    return (
      <section className="mx-auto max-w-[1440px] px-6 pb-16 lg:px-10">
        <AdminTeamReview message={message} error={error} />
      </section>
    );
  }

  if (activeTab === "players") {
    return (
      <section className="mx-auto max-w-[1440px] px-6 pb-16 lg:px-10">
        <AdminPlayersList />
      </section>
    );
  }

  if (activeTab === "matches") {
    return (
      <section className="mx-auto max-w-[1440px] px-6 pb-16 lg:px-10">
        <AdminMatchesPanel />
      </section>
    );
  }

  if (activeTab === "rules") {
    return (
      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:px-10">
        <AdminRuleForm />
        <AdminRuleList />
      </section>
    );
  }

  if (activeTab === "roles") {
    return (
      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:px-10">
        <AdminRoleForm />
        <AdminRoleList />
      </section>
    );
  }

  if (activeTab === "staff") {
    return (
      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:px-10">
        <AdminStaffForm />
        <AdminStaffList />
      </section>
    );
  }

  const readyModules = adminModules.filter(
    (module) => module.status === "Ready",
  ).length;

  const importantModules = adminModules.filter(
    (module) => module.status === "Important",
  ).length;

  return (
    <section className="mx-auto grid max-w-[1440px] gap-6 px-6 pb-16 lg:px-10">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p
            className="text-sm font-black uppercase tracking-[0.18em]"
            style={{ color: "var(--asc-accent)" }}
          >
            Modules
          </p>

          <h2
            className="mt-2 text-3xl font-black"
            style={{ color: "var(--asc-fg-0)" }}
          >
            Admin modules
          </h2>

          <p
            className="mt-3 max-w-3xl text-sm leading-6"
            style={{ color: "var(--asc-fg-3)" }}
          >
            Connected admin tools currently available in Ascendra.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Stat label="Total" value={adminModules.length} />
          <Stat label="Ready" value={readyModules} />
          <Stat label="Important" value={importantModules} />
        </div>
      </div>

      <section
        className="overflow-hidden border shadow-2xl"
        style={{
          borderColor: "var(--asc-line-soft)",
          background: "var(--asc-bg-1)",
        }}
      >
        <div>
          {adminModules.map((module) => (
            <AdminModuleCard
              key={module.title}
              title={module.title}
              description={module.description}
              status={module.status}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (params.tab === "bot") {
    const botParams = new URLSearchParams();

    if (params.botStatus) {
      botParams.set("botStatus", params.botStatus);
    }

    if (params.botType) {
      botParams.set("botType", params.botType);
    }

    const query = botParams.toString();

    redirect(query ? `/admin/bot?${query}` : "/admin/bot");
  }

  const activeTab =
    params.tab && allowedTabs.includes(params.tab) ? params.tab : "overview";

  const toastType = params.type === "error" ? "error" : "success";

  if (!session?.user) {
    return (
      <AdminAccessShell
        tone="violet"
        label="Ascendra admin"
        title="Admin access required."
        description="Login with Discord to continue to the protected admin panel."
      >
        <DiscordLoginButton />
      </AdminAccessShell>
    );
  }

  if (!session.user.isAdmin) {
    return (
      <AdminAccessShell
        tone="red"
        label="Access denied"
        title="You are not an Ascendra admin."
        description={`You are logged in as ${session.user.name}, but this account does not have admin access.`}
      >
        <LogoutButton />
      </AdminAccessShell>
    );
  }

  const shouldShowGlobalToast =
    activeTab !== "teams" && activeTab !== "registrations";

  const activeTabContent = await renderAdminTab(
    activeTab,
    params.message,
    params.error,
    params.duplicate,
  );

  return (
    <AdminShell
      userName={session.user.name}
      title="Admin Dashboard"
      description="A simple control center for Ascendra operations."
    >
      {shouldShowGlobalToast && (
        <AdminToast message={params.message} type={toastType} />
      )}

      {activeTabContent}
    </AdminShell>
  );
}
