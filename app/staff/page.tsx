import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import StaffCard from "@/components/StaffCard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getStaffMembers() {
  return prisma.staffMember.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      order: "asc",
    },
  });
}

export default async function StaffPage() {
  const staffMembers = await getStaffMembers();

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Staff"
        title="The team behind The Noobs of Temple & Rift."
        description="This page is connected to the database and prepared for future Discord avatars, staff profiles, developer members, and admin management."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-10 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {staffMembers.map((member) => (
            <StaffCard
              key={member.id}
              name={member.name}
              role={member.role}
              status={member.status}
            />
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}