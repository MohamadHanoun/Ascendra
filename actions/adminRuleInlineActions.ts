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

function revalidateRulePaths() {
  revalidatePath("/admin");
  revalidatePath("/rules");
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

async function normalizeRuleOrders() {
  const rules = await prisma.rule.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  if (rules.length === 0) {
    return;
  }

  await prisma.$transaction(
    rules.map((rule, index) =>
      prisma.rule.update({
        where: {
          id: rule.id,
        },
        data: {
          order: index + 1,
        },
      }),
    ),
  );
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

  const rulesCount = await prisma.rule.count();

  await prisma.rule.create({
    data: {
      text,
      order: rulesCount + 1,
      isActive: true,
    },
  });

  await normalizeRuleOrders();

  revalidateRulePaths();

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

  await prisma.$transaction(async (tx) => {
    await tx.rule.update({
      where: {
        id: rule.id,
      },
      data: {
        text,
      },
    });

    const orderedRules = await tx.rule.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    const otherRuleIds = orderedRules
      .filter((currentRule) => currentRule.id !== rule.id)
      .map((currentRule) => currentRule.id);

    const targetOrder = Math.min(order, orderedRules.length);
    const reorderedRuleIds = [...otherRuleIds];

    reorderedRuleIds.splice(targetOrder - 1, 0, rule.id);

    for (const [index, currentRuleId] of reorderedRuleIds.entries()) {
      await tx.rule.update({
        where: {
          id: currentRuleId,
        },
        data: {
          order: index + 1,
        },
      });
    }
  });

  revalidateRulePaths();

  return success("Rule updated successfully.");
}

export async function reorderRulesInline(
  formData: FormData,
): Promise<AdminRuleActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const rawRuleIds = getValue(formData, "orderedRuleIds");

  if (!rawRuleIds) {
    return fail("Rule order is missing.");
  }

  let orderedRuleIds: string[];

  try {
    const parsed = JSON.parse(rawRuleIds);

    if (!Array.isArray(parsed)) {
      return fail("Rule order is invalid.");
    }

    orderedRuleIds = parsed
      .map((value) => String(value || "").trim())
      .filter(Boolean);
  } catch {
    return fail("Rule order is invalid.");
  }

  if (orderedRuleIds.length === 0) {
    return fail("Rule order is empty.");
  }

  const uniqueRuleIds = new Set(orderedRuleIds);

  if (uniqueRuleIds.size !== orderedRuleIds.length) {
    return fail("Rule order contains duplicate rules.");
  }

  const existingRules = await prisma.rule.findMany({
    select: {
      id: true,
    },
  });

  const existingRuleIds = new Set(existingRules.map((rule) => rule.id));

  if (orderedRuleIds.length !== existingRules.length) {
    return fail("Rule order does not match the current rules list.");
  }

  const hasInvalidRule = orderedRuleIds.some(
    (ruleId) => !existingRuleIds.has(ruleId),
  );

  if (hasInvalidRule) {
    return fail("Rule order contains an unknown rule.");
  }

  await prisma.$transaction(
    orderedRuleIds.map((ruleId, index) =>
      prisma.rule.update({
        where: {
          id: ruleId,
        },
        data: {
          order: index + 1,
        },
      }),
    ),
  );

  revalidateRulePaths();

  return success("Rule order updated.");
}

export async function moveRuleUpInline(
  formData: FormData,
): Promise<AdminRuleActionResult> {
  return moveRuleInline(formData, -1);
}

export async function moveRuleDownInline(
  formData: FormData,
): Promise<AdminRuleActionResult> {
  return moveRuleInline(formData, 1);
}

async function moveRuleInline(
  formData: FormData,
  direction: -1 | 1,
): Promise<AdminRuleActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const ruleId = getValue(formData, "ruleId") || getValue(formData, "id");

  if (!ruleId) {
    return fail("Rule ID is missing.");
  }

  const rules = await prisma.rule.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const currentIndex = rules.findIndex((rule) => rule.id === ruleId);

  if (currentIndex === -1) {
    return fail("Rule was not found.");
  }

  const targetIndex = currentIndex + direction;

  if (targetIndex < 0) {
    return success("Rule is already at the top.");
  }

  if (targetIndex >= rules.length) {
    return success("Rule is already at the bottom.");
  }

  const reorderedRuleIds = rules.map((rule) => rule.id);

  [reorderedRuleIds[currentIndex], reorderedRuleIds[targetIndex]] = [
    reorderedRuleIds[targetIndex],
    reorderedRuleIds[currentIndex],
  ];

  await prisma.$transaction(
    reorderedRuleIds.map((currentRuleId, index) =>
      prisma.rule.update({
        where: {
          id: currentRuleId,
        },
        data: {
          order: index + 1,
        },
      }),
    ),
  );

  revalidateRulePaths();

  return success("Rule order updated.");
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

  revalidateRulePaths();

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

  await prisma.$transaction(async (tx) => {
    await tx.rule.delete({
      where: {
        id: rule.id,
      },
    });

    const remainingRules = await tx.rule.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    for (const [index, remainingRule] of remainingRules.entries()) {
      await tx.rule.update({
        where: {
          id: remainingRule.id,
        },
        data: {
          order: index + 1,
        },
      });
    }
  });

  revalidateRulePaths();

  return success("Rule deleted successfully.");
}
