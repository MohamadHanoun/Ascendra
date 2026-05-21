import type { Metadata } from "next";

import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Staff | Ascendra",
  description: "Ascendra staff members.",
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

function StaffRow({
  name,
  role,
  status,
}: {
  name: string;
  role: string;
  status: string;
}) {
  return (
    <article className="grid gap-3 border-b border-white/10 px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_220px_120px] md:items-center">
      <div>
        <p className="font-black text-white">{name}</p>
        <p className="mt-1 text-sm text-gray-500">Ascendra staff</p>
      </div>

      <p className="text-sm font-bold text-gray-300">{role}</p>

      <span className="w-fit rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
        {status}
      </span>
    </article>
  );
}

export default async function StaffPage() {
  const staffMembers = await getStaffMembers();

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[430px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.62)_44%,rgba(7,8,17,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
              Community
            </p>

            <h1 className="text-5xl font-black uppercase tracking-tight text-white md:text-7xl">
              Staff
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
              People helping manage Ascendra and keep events organized.
            </p>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 lg:px-10 2xl:px-14">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_160px] md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                  Staff team
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
                  Active staff
                </h2>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
                  Total
                </p>

                <p className="mt-1 text-2xl font-black text-white">
                  {staffMembers.length}
                </p>
              </div>
            </div>
          </section>

          {staffMembers.length === 0 ? (
            <EmptyState
              title="No active staff yet"
              description="Staff members will appear here when they are published."
            />
          ) : (
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
              <div>
                {staffMembers.map((member) => (
                  <StaffRow
                    key={member.id}
                    name={member.name}
                    role={member.role}
                    status={member.status}
                  />
                ))}
              </div>
            </section>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}
