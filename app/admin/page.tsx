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
        "Tournament records prepared for Ascendra events and team registrations.",
    },
    {
      label: "Players",
      value: String(usersCount),
      description:
        "Players who logged in to Ascendra using Discord and have a profile record.",
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
      description:
        "Total points awarded from official Ascendra tournament results.",
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
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">{value}</p>
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
  children: React.ReactNode;
}) {
  const labelColor = tone === "red" ? "text-red-300" : "text-violet-300";

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18)_0%,transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#0b0d17_45%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(7,8,17,0.98),rgba(7,8,17,0.82),rgba(7,8,17,0.98)),url('/images/backgrounds/community-hero.webp')] bg-cover bg-center opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.28)_0%,transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.10)_0%,transparent_28%)]" />

          <div className="relative z-10 mx-auto flex max-w-[900px] flex-col items-center px-6 py-28 text-center lg:px-10">
            <p
              className={`mb-4 text-sm font-black uppercase tracking-[0.3em] ${labelColor}`}
            >
              {label}
            </p>

            <h1 className="mb-6 text-5xl font-black uppercase leading-[1.02] tracking-tight md:text-7xl">
              {title}
            </h1>

            <p className="mb-8 max-w-xl leading-8 text-gray-300">
              {description}
            </p>

            {children}
          </div>

          <svg
            className="absolute bottom-[-1px] left-0 w-full text-[#070811]"
            viewBox="0 0 1440 120"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
          </svg>
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
    return (
      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:px-10">
        <AdminTournamentForm />
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
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
            Modules
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">Admin modules</h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            View available Ascendra admin tools currently connected to the
            platform.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ModuleStatCard label="Total" value={adminModules.length} />
          <ModuleStatCard label="Ready" value={readyModules} />
          <ModuleStatCard label="Important" value={importantModules} />
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
      <AdminAccessShell
        tone="violet"
        label="Ascendra admin login"
        title="Admin access required."
        description="This page is protected. Login with Discord to continue to the Ascendra admin panel."
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
        description={`You are logged in as ${session.user.name}, but this Discord account does not have admin access to the Ascendra admin panel.`}
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
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18)_0%,transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#0b0d17_45%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(7,8,17,0.98),rgba(7,8,17,0.82),rgba(7,8,17,0.98)),url('/images/backgrounds/community-hero.webp')] bg-cover bg-center opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.28)_0%,transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.10)_0%,transparent_28%)]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
            <p className="mb-5 text-sm font-black uppercase tracking-[0.22em] text-violet-300">
              Ascendra admin panel
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">
              Manage the community from one place.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-300">
              A protected dashboard for managing announcements, tournaments,
              registrations, teams, players, rules, roles, staff, and Ascendra
              community tools.
            </p>
          </div>

          <svg
            className="absolute bottom-[-1px] left-0 w-full text-[#070811]"
            viewBox="0 0 1440 120"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
          </svg>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
          <div className="rounded-3xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 shadow-2xl shadow-black/20">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                  Admin session
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
                  Logged in as Ascendra Admin
                </h2>
              </div>

              <div className="rounded-2xl border border-emerald-400/25 bg-black/25 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                  Current admin
                </p>

                <p className="mt-1 text-sm font-black text-white">
                  {session.user.name}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <AdminTabNavigation activeTab={activeTab} />
        </div>

        {shouldShowGlobalToast && (
          <AdminToast message={params.message} type={toastType} />
        )}

        {activeTabContent}

        <Footer />
      </div>
    </main>
  );
}
