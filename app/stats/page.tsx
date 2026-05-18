import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import StatsDetailCard from "@/components/StatsDetailCard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getStatsData() {
  const [
    rulesCount,
    rolesCount,
    staffCount,
    tournamentsCount,
    announcementsCount,
    usersCount,
    teamsCount,
    approvedRegistrationsCount,
  ] = await Promise.all([
    prisma.rule.count({ where: { isActive: true } }),
    prisma.role.count({ where: { isActive: true } }),
    prisma.staffMember.count({ where: { isActive: true } }),
    prisma.tournament.count(),
    prisma.announcement.count({ where: { published: true } }),
    prisma.user.count(),
    prisma.team.count(),
    prisma.tournamentRegistration.count({
      where: {
        status: "approved",
      },
    }),
  ]);

  return [
    {
      title: "Players",
      value: String(usersCount),
      description: "Players who have logged in with Discord.",
    },
    {
      title: "Teams",
      value: String(teamsCount),
      description: "Teams created by RTN players.",
    },
    {
      title: "Tournaments",
      value: String(tournamentsCount),
      description: "Tournament records available on RTN.",
    },
    {
      title: "Approved Registrations",
      value: String(approvedRegistrationsCount),
      description: "Tournament registrations approved by admins.",
    },
    {
      title: "Announcements",
      value: String(announcementsCount),
      description: "Published community announcements.",
    },
    {
      title: "Rules",
      value: String(rulesCount),
      description: "Active community rules.",
    },
    {
      title: "Roles",
      value: String(rolesCount),
      description: "Active community roles.",
    },
    {
      title: "Staff",
      value: String(staffCount),
      description: "Visible staff members.",
    },
  ];
}

export default async function StatsPage() {
  const stats = await getStatsData();

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Stats"
        title="Community statistics."
        description="Current RTN numbers for players, teams, tournaments, registrations, announcements, and community content."
      />

      <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-24 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatsDetailCard
            key={item.title}
            title={item.title}
            value={item.value}
            description={item.description}
          />
        ))}
      </section>

      <Footer />
    </main>
  );
}
