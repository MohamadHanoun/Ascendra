import {
  deleteRole,
  reorderRoles,
  toggleRoleActive,
  updateRole,
} from "@/actions/roleActions";
import AdminRoleListClient from "@/components/AdminRoleListClient";
import { prisma } from "@/lib/prisma";

async function getRoles() {
  return prisma.role.findMany({
    orderBy: {
      order: "asc",
    },
  });
}

export default async function AdminRoleList() {
  const roles = await getRoles();

  return (
    <AdminRoleListClient
      roles={roles}
      updateRole={updateRole}
      toggleRoleActive={toggleRoleActive}
      deleteRole={deleteRole}
      reorderRoles={reorderRoles}
    />
  );
}