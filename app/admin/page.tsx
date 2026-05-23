import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import AdminAnnouncementForm from "@/components/AdminAnnouncementForm";
import AdminAnnouncementList from "@/components/AdminAnnouncementList";
import AdminModuleCard from "@/components/AdminModuleCard";
import AdminOverview from "@/components/AdminOverview";
import AdminPlayersList from "@/components/AdminPlayersList";
import AdminRegistrationList from "@/components/AdminRegistrationList";
import AdminRoleForm from "@/components/AdminRoleForm";
import AdminRoleList from "@/components/AdminRoleList";
import AdminRuleForm from "@/components/AdminRuleForm";
import AdminRuleList from "@/components/AdminRuleList";
import AdminStaffForm from "@/components/AdminStaffForm";
import AdminStaffList from "@/components/AdminStaffList";
import AdminTabNavigation from "@/components/AdminTabNavigation";
import AdminTeamReview from "@/components/AdminTeamReview";
import AdminToast from "@/components/AdminToast";
import AdminTournamentForm from "@/components/AdminTournamentForm";
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
  }>;
};

type AdminOverviewItem = {
  label: string;
  value: string;
  description: string;
};

const allowedTabs = [
  "overview",
  "announcements",
  "tournaments",
  "registrations",
  "teams",
  "players",
  "rules",
  "roles",
  "staff",
  "modules",
];

async function getAdminOverview(): Promise<AdminOverviewItem[]> {
  const [
    tournamentsCount,
    usersCount,
    teamsCount,
    pendingRegistrationsCount,
    tournamentResultsCount,
    tournamentPoints,
    announcementsCount,
    rulesCount,
    rolesCount,
    staffCount,
  ] = await Promise.all([
    prisma.tournament.count(),
    prisma.user.count(),
    prisma.team.count(),
    prisma.tournamentRegistration.count({
      where: {
        status: "registered",
      },
    }),
    prisma.tournamentResult.count(),
    prisma.tournamentResult.aggregate({
      _sum: {
        points: true,
      },
    }),
    prisma.announcement.count({
      where: {
        published: true,
      },
    }),
    prisma.rule.count({
      where: {
        isActive: true,
      },
    }),
    prisma.role.count({
      where: {
        isActive: true,
      },
    }),
    prisma.staffMember.count({
      where: {
        isActive: true,
      },
    }),
  ]);

  const totalTournamentPoints = tournamentPoints._sum.points || 0;
  const activeContentCount =
    announcementsCount + rulesCount + rolesCount + staffCount;

  return [
    {
      label: "Pending Registrations",
      value: String(pendingRegistrationsCount),
      description: "Tournament applications waiting for admin review.",
    },
    {
      label: "Tournaments",
      value: String(tournamentsCount),
      description: "Tournament records created on Ascendra.",
    },
    {
      label: "Players",
      value: String(usersCount),
      description: "Players who logged in with Discord.",
    },
    {
      label: "Teams",
      value: String(teamsCount),
      description: "Teams created by players.",
    },
    {
      label: "Tournament Results",
      value: String(tournamentResultsCount),
      description: "Official saved tournament results.",
    },
    {
      label: "Tournament Points",
      value: String(totalTournamentPoints),
      description: "Total points awarded from official results.",
    },
    {
      label: "Website Content",
      value: String(activeContentCount),
      description: "Published announcements, active rules, roles, and staff.",
    },
  ];
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">{value}</p>
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
  const labelColor = tone === "red" ? "text-red-300" : "text-violet-300";

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[520px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/admin-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.70)_48%,rgba(7,8,17,0.86)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto flex min-h-[520px] max-w-[820px] flex-col items-center justify-center px-6 pb-24 pt-20 text-center lg:px-10">
            <p
              className={`mb-4 text-sm font-black uppercase tracking-[0.24em] ${labelColor}`}
            >
              {label}
            </p>

            <h1 className="text-5xl font-black uppercase leading-[1.04] tracking-tight md:text-6xl">
              {title}
            </h1>

            <p className="mt-5 max-w-xl leading-7 text-gray-300">
              {description}
            </p>

            <div className="mt-8">{children}</div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}

async function renderAdminTab(
  activeTab: string,
  message?: string,
  error?: string,
) {
  if (activeTab === "overview") {
    const overviewItems = await getAdminOverview();

    return (
      <section className="mx-auto max-w-[1440px] px-6 pb-16 lg:px-10">
        <AdminOverview items={overviewItems} />
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
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
    });

    return (
      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:px-10">
        <AdminTournamentForm games={games} />
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
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
            Modules
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">Admin modules</h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            Connected admin tools currently available in Ascendra.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Stat label="Total" value={adminModules.length} />
          <Stat label="Ready" value={readyModules} />
          <Stat label="Important" value={importantModules} />
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
        <div className="divide-y divide-white/10">
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
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[430px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/admin-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.66)_44%,rgba(7,8,17,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-24 pt-20 lg:px-10">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.22em] text-violet-300">
              Ascendra admin panel
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.04] tracking-tight text-white md:text-6xl">
              Manage Ascendra.
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-gray-300">
              Control tournaments, registrations, teams, players, content, and
              community tools from one protected dashboard.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 font-black text-emerald-300">
                Admin
              </span>

              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 font-bold text-gray-300">
                {session.user.name}
              </span>
            </div>
          </div>
        </section>

        <section className="relative -mt-12 mx-auto max-w-[1440px] px-6 pb-8 lg:px-10">
          <AdminTabNavigation activeTab={activeTab} />
        </section>

        {shouldShowGlobalToast && (
          <AdminToast message={params.message} type={toastType} />
        )}

        {activeTabContent}

        <Footer />
      </div>
    </main>
  );
}
