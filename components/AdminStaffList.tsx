import AdminStaffDragList from "@/components/AdminStaffDragList";
import { prisma } from "@/lib/prisma";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>{label}</p>
      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

export default async function AdminStaffList() {
  const staffMembers = await prisma.staffMember.findMany({
    select: { id: true, name: true, role: true, status: true, order: true, isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const activeStaff = staffMembers.filter((member) => member.isActive).length;
  const hiddenStaff = staffMembers.length - activeStaff;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
            Manage staff
          </p>
          <h2 className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>Staff list</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            Edit, reorder, show, hide, or delete public staff members.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Stat label="Total" value={staffMembers.length} />
          <Stat label="Active" value={activeStaff} />
          <Stat label="Hidden" value={hiddenStaff} />
        </div>
      </div>

      <AdminStaffDragList initialStaffMembers={staffMembers} />
    </section>
  );
}
