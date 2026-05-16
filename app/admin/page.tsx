import type { Metadata } from "next";
import { auth } from "@/auth";
import AdminAnnouncementForm from "@/components/AdminAnnouncementForm";
import AdminAnnouncementList from "@/components/AdminAnnouncementList";
import AdminModuleCard from "@/components/AdminModuleCard";
import AdminOverview from "@/components/AdminOverview";
import AdminPlayersList from "@/components/AdminPlayersList";
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
import AdminTournamentRegistrations from "@/components/AdminTournamentRegistrations";

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
  "teams",
  "players",
  "rules",
  "roles",
  "staff",
  "modules",
  "registrations",
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
    pendingTeamsCount,
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
    prisma.team.count({
      where: {
        status: "pending",
      },
    }),
  ]);

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
        "Tournament records prepared for RTN events and future registrations.",
    },
    {
      label: "Teams",
      value: String(teamsCount),
      description: `${pendingTeamsCount} team request${
        pendingTeamsCount === 1 ? "" : "s"
      } waiting for review.`,
    },
    {
      label: "Players",
      value: String(usersCount),
      description:
        "Players who logged in to RTN using Discord and have a profile record.",
    },
  ];
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
  if (activeTab === "registrations") {
  return (
    <AdminTournamentRegistrations
      message={message}
      error={error}
    />
  );
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
    return <AdminTournamentRegistrations message={message} error={error} />;
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

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="mb-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-300">
          Modules
        </p>

        <h2 className="text-4xl font-black">Admin Modules</h2>

        <p className="mt-4 max-w-2xl text-gray-300">
          Additional RTN management tools can be added here as the platform
          grows.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Admin Panel"
        title="Manage the RTN community from one place."
        description="A protected dashboard for managing announcements, tournaments, teams, players, rules, roles, staff, and future RTN tools."
      />

      <section className="mx-auto max-w-7xl px-6 pb-6">
        <div className="rounded-3xl border border-green-500/20 bg-green-500/10 px-6 py-5">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-green-300">
              Admin Session
            </p>

            <h2 className="text-2xl font-black text-white">
              Logged in as RTN Admin
            </h2>

            <p className="mt-2 max-w-3xl leading-7 text-gray-300">
              Welcome, {session.user.name}. Use the sections below to manage RTN
              content, teams, players, and community tools.
            </p>
          </div>
        </div>
      </section>

      <AdminTabNavigation activeTab={activeTab} />

      {activeTab !== "teams" && (
        <AdminToast message={params.message} type={toastType} />
      )}

      {renderAdminTab(activeTab, overviewItems, params.message, params.error)}

      <Footer />
    </main>
  );
}
