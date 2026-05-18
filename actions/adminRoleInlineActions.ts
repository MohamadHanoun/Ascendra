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
    return fail("Only RTN admins can manage roles.");
  }

  return null;
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

  const lastRole = await prisma.role.findFirst({
    orderBy: {
      order: "desc",
    },
  });

  await prisma.role.create({
    data: {
      name,
      color,
      description,
      order: lastRole ? lastRole.order + 1 : 1,
      isActive: true,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/roles");

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

  await prisma.role.update({
    where: {
      id: role.id,
    },
    data: {
      name,
      color,
      description,
      order,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/roles");

  return success("Role updated successfully.");
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

  revalidatePath("/admin");
  revalidatePath("/roles");

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

  await prisma.role.delete({
    where: {
      id: role.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/roles");

  return success("Role deleted successfully.");
}
