import type { Metadata } from "next";
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
import PageHeader from "@/components/PageHeader";
import { adminModules } from "@/data/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  description: "Protected RTN admin dashboard.",
};

type AdminPageProps = {
  searchParams: Promise<{
    tab?: string;
    message?: string;
    error?: string;
    type?: string;
  }>;
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

async function getAdminOverview() {
  const [
    rulesCount,
    rolesCount,
    staffCount,
    tournamentsCount,
    announcementsCount,
    usersCount,
    teamsCount,
    pendingRegistrationsCount,
    tournamentResultsCount,
    tournamentPoints,
  ] = await Promise.all([
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
    prisma.tournament.count(),
    prisma.announcement.count({
      where: {
        published: true,
      },
    }),
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
  ]);

  const totalTournamentPoints = tournamentPoints._sum.points || 0;

  return [
    {
      label: "Website Content",
      value: `${rulesCount + rolesCount + staffCount + announcementsCount}`,
      description:
        "Rules, roles, staff members, and announcements currently active on the website.",
    },
    {
      label: "Tournaments",
      value: String(tournamentsCount),
      description:
        "Tournament records prepared for RTN events and team registrations.",
    },
    {
      label: "Players",
      value: String(usersCount),
      description:
        "Players who logged in to RTN using Discord and have a profile record.",
    },
    {
      label: "Teams",
      value: String(teamsCount),
      description:
        "Teams created by players for tournament registration and team play.",
    },
    {
      label: "Tournament Results",
      value: String(tournamentResultsCount),
      description:
        "Final tournament results saved by admins and used for standings.",
    },
    {
      label: "Tournament Points",
      value: String(totalTournamentPoints),
      description: "Total points awarded from official RTN tournament results.",
    },
    {
      label: "Pending Registrations",
      value: String(pendingRegistrationsCount),
      description: `${pendingRegistrationsCount} tournament registration${
        pendingRegistrationsCount === 1 ? "" : "s"
      } waiting for review.`,
    },
  ];
}

function ModuleStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function renderAdminTab(
  activeTab: string,
  overviewItems: Awaited<ReturnType<typeof getAdminOverview>>,
  message?: string,
  error?: string,
) {
  if (activeTab === "overview") {
    return <AdminOverview items={overviewItems} />;
  }

  if (activeTab === "announcements") {
    return (
      <>
        <AdminAnnouncementForm />
        <AdminAnnouncementList />
      </>
    );
  }

  if (activeTab === "tournaments") {
    return (
      <>
        <AdminTournamentForm />
        <AdminTournamentList />
      </>
    );
  }

  if (activeTab === "registrations") {
    return <AdminRegistrationList message={message} error={error} />;
  }

  if (activeTab === "teams") {
    return <AdminTeamReview message={message} error={error} />;
  }

  if (activeTab === "players") {
    return <AdminPlayersList />;
  }

  if (activeTab === "rules") {
    return (
      <>
        <AdminRuleForm />
        <AdminRuleList />
      </>
    );
  }

  if (activeTab === "roles") {
    return (
      <>
        <AdminRoleForm />
        <AdminRoleList />
      </>
    );
  }

  if (activeTab === "staff") {
    return (
      <>
        <AdminStaffForm />
        <AdminStaffList />
      </>
    );
  }

  const readyModules = adminModules.filter(
    (module) => module.status === "Ready",
  ).length;

  const futureModules = adminModules.filter(
    (module) => module.status === "Future",
  ).length;

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
            Modules
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">Admin modules</h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            View available RTN admin tools and future modules planned for the
            platform.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ModuleStatCard label="Total" value={adminModules.length} />
          <ModuleStatCard label="Ready" value={readyModules} />
          <ModuleStatCard label="Future" value={futureModules} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await auth();
  const params = await searchParams;

  const activeTab =
    params.tab && allowedTabs.includes(params.tab) ? params.tab : "overview";

  const toastType = params.type === "error" ? "error" : "success";

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-[#0b0f1a] text-white">
        <Navbar />

        <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-32 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">
            RTN Admin Login
          </p>

          <h1 className="mb-6 text-5xl font-black md:text-7xl">
            Admin access required.
          </h1>

          <p className="mb-8 max-w-xl leading-8 text-gray-300">
            This page is protected. Login with Discord to continue to the RTN
            admin panel.
          </p>

          <DiscordLoginButton />
        </section>

        <Footer />
      </main>
    );
  }

  if (!session.user.isAdmin) {
    return (
      <main className="min-h-screen bg-[#0b0f1a] text-white">
        <Navbar />

        <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-32 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-red-400">
            Access Denied
          </p>

          <h1 className="mb-6 text-5xl font-black md:text-7xl">
            You are not an RTN admin.
          </h1>

          <p className="mb-8 max-w-xl leading-8 text-gray-300">
            You are logged in as {session.user.name}, but this Discord account
            does not have admin access to the RTN admin panel.
          </p>

          <LogoutButton />
        </section>

        <Footer />
      </main>
    );
  }

  const overviewItems = await getAdminOverview();
  const shouldShowGlobalToast =
    activeTab !== "teams" && activeTab !== "registrations";

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Admin Panel"
        title="Manage the RTN community from one place."
        description="A protected dashboard for managing announcements, tournaments, registrations, teams, players, rules, roles, staff, and RTN community tools."
      />

      <section className="mx-auto max-w-7xl px-6 pb-6">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-300">
                Admin session
              </p>

              <h2 className="mt-1 text-xl font-black text-white">
                Logged in as RTN Admin
              </h2>
            </div>

            <div className="rounded-xl border border-green-500/20 bg-black/20 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
                Current admin
              </p>

              <p className="mt-1 text-sm font-black text-white">
                {session.user.name}
              </p>
            </div>
          </div>
        </div>
      </section>

      <AdminTabNavigation activeTab={activeTab} />

      {shouldShowGlobalToast && (
        <AdminToast message={params.message} type={toastType} />
      )}

      {renderAdminTab(activeTab, overviewItems, params.message, params.error)}

      <Footer />
    </main>
  );
}
