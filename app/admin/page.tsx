import AdminModuleCard from "@/components/AdminModuleCard";
import AdminOverview from "@/components/AdminOverview";
import { DiscordLoginButton, LogoutButton } from "@/components/AuthButtons";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import { adminModules } from "@/data/admin";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AdminAnnouncementForm from "@/components/AdminAnnouncementForm";
import AdminAnnouncementList from "@/components/AdminAnnouncementList";
import AdminTournamentForm from "@/components/AdminTournamentForm";
import AdminTournamentList from "@/components/AdminTournamentList";
import AdminRuleForm from "@/components/AdminRuleForm";
import AdminRuleList from "@/components/AdminRuleList";
import AdminRoleForm from "@/components/AdminRoleForm";
import AdminRoleList from "@/components/AdminRoleList";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAdminOverview() {
  const [
    rulesCount,
    rolesCount,
    staffCount,
    tournamentsCount,
    announcementsCount,
    usersCount,
  ] = await Promise.all([
    prisma.rule.count({ where: { isActive: true } }),
    prisma.role.count({ where: { isActive: true } }),
    prisma.staffMember.count({ where: { isActive: true } }),
    prisma.tournament.count(),
    prisma.announcement.count({ where: { published: true } }),
    prisma.user.count(),
  ]);

  return [
    {
      label: "Website Content",
      value: `${rulesCount + rolesCount + staffCount + announcementsCount}`,
      description:
        "Rules, roles, staff members, and announcements currently stored in the database.",
    },
    {
      label: "Tournaments",
      value: String(tournamentsCount),
      description:
        "Tournament records prepared for future registration and admin management.",
    },
    {
      label: "XP Users",
      value: String(usersCount),
      description:
        "Users currently stored for the future XP system and leaderboard.",
    },
  ];
}

export default async function AdminPage() {
  const session = await auth();

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
        description="This admin panel is protected with Discord login and prepared for future database management, tournaments, XP settings, announcements, and live server statistics."
      />

      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-6">
          <h2 className="mb-3 text-2xl font-bold text-green-300">
            Logged in as RTN Admin
          </h2>

          <p className="leading-7 text-gray-300">
            Welcome, {session.user.name}. This dashboard is currently read-only.
            Editing tools will be added later.
          </p>

          <div className="mt-6">
            <LogoutButton />
          </div>
        </div>
      </section>

      <AdminOverview items={overviewItems} />
      <AdminAnnouncementForm />
      <AdminAnnouncementList />
      <AdminTournamentForm />
      <AdminTournamentList />
      <AdminRuleForm />
      <AdminRuleList />
      <AdminRoleForm />
      <AdminRoleList />

      

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-10">
          <h2 className="text-4xl font-black">Admin Modules</h2>
          <p className="mt-4 max-w-2xl text-gray-300">
            These sections are prepared for future management tools. Later, RTN
            admins will be able to control website content, tournaments, XP
            settings, and Discord-related data from here.
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

      <Footer />
    </main>
  );
}