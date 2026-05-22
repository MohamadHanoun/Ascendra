"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AdminRoleActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

function success(message: string): AdminRoleActionResult {
  return {
    ok: true,
    message,
  };
}

function fail(message: string, redirectTo?: string): AdminRoleActionResult {
  return {
    ok: false,
    message,
    redirectTo,
  };
}

function getValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function getNumber(formData: FormData, name: string) {
  const value = Number(formData.get(name));

  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

function revalidateRolePaths() {
  revalidatePath("/admin");
  revalidatePath("/roles");
}

async function requireAdmin(): Promise<AdminRoleActionResult | null> {
  const session = await auth();

  const sessionUser = session?.user as
    | {
        databaseId?: string;
        isAdmin?: boolean;
      }
    | undefined;

  if (!sessionUser?.databaseId) {
    return fail("Please login first.", "/login");
  }

  if (!sessionUser.isAdmin) {
    return fail("Only Ascendra admins can manage roles.");
  }

  return null;
}

async function normalizeRoleOrders() {
  const roles = await prisma.role.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  if (roles.length === 0) {
    return;
  }

  await prisma.$transaction(
    roles.map((role, index) =>
      prisma.role.update({
        where: {
          id: role.id,
        },
        data: {
          order: index + 1,
        },
      }),
    ),
  );
}

export async function createRoleInline(
  formData: FormData,
): Promise<AdminRoleActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const name = getValue(formData, "name");
  const color = getValue(formData, "color");
  const description = getValue(formData, "description");

  if (!name) {
    return fail("Role name is required.");
  }

  if (!color) {
    return fail("Role color is required.");
  }

  if (!description) {
    return fail("Role description is required.");
  }

  const existingRole = await prisma.role.findUnique({
    where: {
      name,
    },
  });

  if (existingRole) {
    return fail("A role with this name already exists.");
  }

  const rolesCount = await prisma.role.count();

  await prisma.role.create({
    data: {
      name,
      color,
      description,
      order: rolesCount + 1,
      isActive: true,
    },
  });

  await normalizeRoleOrders();

  revalidateRolePaths();

  return success("Role created successfully.");
}

export async function updateRoleInline(
  formData: FormData,
): Promise<AdminRoleActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const roleId = getValue(formData, "roleId") || getValue(formData, "id");
  const name = getValue(formData, "name");
  const color = getValue(formData, "color");
  const description = getValue(formData, "description");
  const order = getNumber(formData, "order");

  if (!roleId) {
    return fail("Role ID is missing.");
  }

  if (!name) {
    return fail("Role name is required.");
  }

  if (!color) {
    return fail("Role color is required.");
  }

  if (!description) {
    return fail("Role description is required.");
  }

  if (!order || order < 1) {
    return fail("Role order must be at least 1.");
  }

  const role = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
  });

  if (!role) {
    return fail("Role was not found.");
  }

  const duplicateName = await prisma.role.findFirst({
    where: {
      name,
      NOT: {
        id: role.id,
      },
    },
  });

  if (duplicateName) {
    return fail("Another role with this name already exists.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: {
        id: role.id,
      },
      data: {
        name,
        color,
        description,
      },
    });

    const orderedRoles = await tx.role.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    const otherRoleIds = orderedRoles
      .filter((currentRole) => currentRole.id !== role.id)
      .map((currentRole) => currentRole.id);

    const targetOrder = Math.min(order, orderedRoles.length);
    const reorderedRoleIds = [...otherRoleIds];

    reorderedRoleIds.splice(targetOrder - 1, 0, role.id);

    for (const [index, currentRoleId] of reorderedRoleIds.entries()) {
      await tx.role.update({
        where: {
          id: currentRoleId,
        },
        data: {
          order: index + 1,
        },
      });
    }
  });

  revalidateRolePaths();

  return success("Role updated successfully.");
}

export async function reorderRolesInline(
  formData: FormData,
): Promise<AdminRoleActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const rawRoleIds = getValue(formData, "orderedRoleIds");

  if (!rawRoleIds) {
    return fail("Role order is missing.");
  }

  let orderedRoleIds: string[];

  try {
    const parsed = JSON.parse(rawRoleIds);

    if (!Array.isArray(parsed)) {
      return fail("Role order is invalid.");
    }

    orderedRoleIds = parsed
      .map((value) => String(value || "").trim())
      .filter(Boolean);
  } catch {
    return fail("Role order is invalid.");
  }

  if (orderedRoleIds.length === 0) {
    return fail("Role order is empty.");
  }

  const uniqueRoleIds = new Set(orderedRoleIds);

  if (uniqueRoleIds.size !== orderedRoleIds.length) {
    return fail("Role order contains duplicate roles.");
  }

  const existingRoles = await prisma.role.findMany({
    select: {
      id: true,
    },
  });

  const existingRoleIds = new Set(existingRoles.map((role) => role.id));

  if (orderedRoleIds.length !== existingRoles.length) {
    return fail("Role order does not match the current roles list.");
  }

  const hasInvalidRole = orderedRoleIds.some(
    (roleId) => !existingRoleIds.has(roleId),
  );

  if (hasInvalidRole) {
    return fail("Role order contains an unknown role.");
  }

  await prisma.$transaction(
    orderedRoleIds.map((roleId, index) =>
      prisma.role.update({
        where: {
          id: roleId,
        },
        data: {
          order: index + 1,
        },
      }),
    ),
  );

  revalidateRolePaths();

  return success("Role order updated.");
}

export async function activateRoleInline(
  formData: FormData,
): Promise<AdminRoleActionResult> {
  return setRoleActiveStatus(formData, true);
}

export async function deactivateRoleInline(
  formData: FormData,
): Promise<AdminRoleActionResult> {
  return setRoleActiveStatus(formData, false);
}

async function setRoleActiveStatus(
  formData: FormData,
  isActive: boolean,
): Promise<AdminRoleActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const roleId = getValue(formData, "roleId") || getValue(formData, "id");

  if (!roleId) {
    return fail("Role ID is missing.");
  }

  const role = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
  });

  if (!role) {
    return fail("Role was not found.");
  }

  await prisma.role.update({
    where: {
      id: role.id,
    },
    data: {
      isActive,
    },
  });

  revalidateRolePaths();

  return success(isActive ? "Role activated." : "Role deactivated.");
}

export async function deleteRoleInline(
  formData: FormData,
): Promise<AdminRoleActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const roleId = getValue(formData, "roleId") || getValue(formData, "id");

  if (!roleId) {
    return fail("Role ID is missing.");
  }

  const role = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
  });

  if (!role) {
    return fail("Role was not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.role.delete({
      where: {
        id: role.id,
      },
    });

    const remainingRoles = await tx.role.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    for (const [index, remainingRole] of remainingRoles.entries()) {
      await tx.role.update({
        where: {
          id: remainingRole.id,
        },
        data: {
          order: index + 1,
        },
      });
    }
  });

  revalidateRolePaths();

  return success("Role deleted successfully.");
}
