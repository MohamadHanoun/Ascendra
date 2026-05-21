import AdminRoleDragList from "@/components/AdminRoleDragList";
import { prisma } from "@/lib/prisma";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

export default async function AdminRoleList() {
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      color: true,
      description: true,
      order: true,
      isActive: true,
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const activeRoles = roles.filter((role) => role.isActive).length;
  const hiddenRoles = roles.length - activeRoles;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
            Manage roles
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">Roles list</h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            Edit, reorder, show, hide, or delete public community roles.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Stat label="Total" value={roles.length} />
          <Stat label="Active" value={activeRoles} />
          <Stat label="Hidden" value={hiddenRoles} />
        </div>
      </div>

      <AdminRoleDragList initialRoles={roles} />
    </section>
  );
}
