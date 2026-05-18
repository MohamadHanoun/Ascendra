import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import StaffCard from "@/components/StaffCard";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import EmptyState from "@/components/EmptyState";

export const metadata: Metadata = {
  title: "Staff",
  description:
    "Meet the people helping build, manage, and improve the RTN community.",
};

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
        description="Meet the people helping manage RTN events, community tools, and player experience."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        {staffMembers.length === 0 ? (
          <EmptyState
            title="No active staff yet"
            description="Staff members will appear here when they are available."
          />
        ) : (
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
        )}
      </section>

      <Footer />
    </main>
  );
}
