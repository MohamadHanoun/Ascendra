"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AdminRuleActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

function success(message: string): AdminRuleActionResult {
  return {
    ok: true,
    message,
  };
}

function fail(message: string, redirectTo?: string): AdminRuleActionResult {
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

async function requireAdmin(): Promise<AdminRuleActionResult | null> {
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
    return fail("Only RTN admins can manage rules.");
  }

  return null;
}

export async function createRuleInline(
  formData: FormData,
): Promise<AdminRuleActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const text = getValue(formData, "text");

  if (!text) {
    return fail("Rule text is required.");
  }

  const lastRule = await prisma.rule.findFirst({
    orderBy: {
      order: "desc",
    },
  });

  await prisma.rule.create({
    data: {
      text,
      order: lastRule ? lastRule.order + 1 : 1,
      isActive: true,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/rules");

  return success("Rule created successfully.");
}

export async function updateRuleInline(
  formData: FormData,
): Promise<AdminRuleActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const ruleId = getValue(formData, "ruleId") || getValue(formData, "id");
  const text = getValue(formData, "text");
  const order = getNumber(formData, "order");

  if (!ruleId) {
    return fail("Rule ID is missing.");
  }

  if (!text) {
    return fail("Rule text is required.");
  }

  if (!order || order < 1) {
    return fail("Rule order must be at least 1.");
  }

  const rule = await prisma.rule.findUnique({
    where: {
      id: ruleId,
    },
  });

  if (!rule) {
    return fail("Rule was not found.");
  }

  await prisma.rule.update({
    where: {
      id: rule.id,
    },
    data: {
      text,
      order,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/rules");

  return success("Rule updated successfully.");
}

export async function activateRuleInline(
  formData: FormData,
): Promise<AdminRuleActionResult> {
  return setRuleActiveStatus(formData, true);
}

export async function deactivateRuleInline(
  formData: FormData,
): Promise<AdminRuleActionResult> {
  return setRuleActiveStatus(formData, false);
}

async function setRuleActiveStatus(
  formData: FormData,
  isActive: boolean,
): Promise<AdminRuleActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const ruleId = getValue(formData, "ruleId") || getValue(formData, "id");

  if (!ruleId) {
    return fail("Rule ID is missing.");
  }

  const rule = await prisma.rule.findUnique({
    where: {
      id: ruleId,
    },
  });

  if (!rule) {
    return fail("Rule was not found.");
  }

  await prisma.rule.update({
    where: {
      id: rule.id,
    },
    data: {
      isActive,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/rules");

  return success(isActive ? "Rule activated." : "Rule deactivated.");
}

export async function deleteRuleInline(
  formData: FormData,
): Promise<AdminRuleActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const ruleId = getValue(formData, "ruleId") || getValue(formData, "id");

  if (!ruleId) {
    return fail("Rule ID is missing.");
  }

  const rule = await prisma.rule.findUnique({
    where: {
      id: ruleId,
    },
  });

  if (!rule) {
    return fail("Rule was not found.");
  }

  await prisma.rule.delete({
    where: {
      id: rule.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/rules");

  return success("Rule deleted successfully.");
}
