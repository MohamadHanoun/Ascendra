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
  ] = await Promise.all([
    prisma.rule.count({ where: { isActive: true } }),
    prisma.role.count({ where: { isActive: true } }),
    prisma.staffMember.count({ where: { isActive: true } }),
    prisma.tournament.count(),
    prisma.announcement.count({ where: { published: true } }),
    prisma.user.count(),
  ]);

  return {
    summary: [
      { label: "Rules", value: String(rulesCount) },
      { label: "Roles", value: String(rolesCount) },
      { label: "Staff", value: String(staffCount) },
      { label: "Tournaments", value: String(tournamentsCount) },
    ],
    details: [
      {
        title: "Rules",
        value: String(rulesCount),
        description: "Active RTN rules loaded from the database.",
      },
      {
        title: "Roles",
        value: String(rolesCount),
        description: "Active RTN roles prepared for future Discord sync.",
      },
      {
        title: "Staff Members",
        value: String(staffCount),
        description: "Staff profiles currently stored in the database.",
      },
      {
        title: "Tournaments",
        value: String(tournamentsCount),
        description: "Tournament records prepared for future registration.",
      },
      {
        title: "Announcements",
        value: String(announcementsCount),
        description: "Published announcements stored in the database.",
      },
      {
        title: "Registered Users",
        value: String(usersCount),
        description:
          "Users will appear here later after Discord login and XP tracking are connected.",
      },
    ],
  };
}

export default async function StatsPage() {
  const stats = await getStatsData();

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Stats"
        title="Real community statistics will live here."
        description="This page is now connected to the database. Later, it will also show live Discord stats collected from the RTN bot."
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-12 sm:grid-cols-2 lg:grid-cols-4">
        {stats.summary.map((stat) => (
          <article
            key={stat.label}
            className="rounded-3xl border border-white/10 bg-white/5 p-8"
          >
            <p className="text-5xl font-black text-indigo-400">
              {stat.value}
            </p>
            <p className="mt-3 text-gray-300">{stat.label}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-10 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">
          <h2 className="mb-3 text-2xl font-bold text-cyan-300">
            Database Stats Connected
          </h2>

          <p className="leading-7 text-gray-300">
            These numbers are now loaded from the RTN database. Later, the
            Discord bot will add live server activity, XP data, online members,
            and more advanced statistics.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stats.details.map((item) => (
            <StatsDetailCard
              key={item.title}
              title={item.title}
              value={item.value}
              description={item.description}
            />
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}