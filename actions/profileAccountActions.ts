"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { AuditStatus, GameProvider, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AccountActionResult = {
  ok: boolean;
  message: string;
};

function success(message: string): AccountActionResult {
  return { ok: true, message };
}

function fail(message: string): AccountActionResult {
  return { ok: false, message };
}

async function requireUser() {
  const session = await auth();
  const user = session?.user as { databaseId?: string } | undefined;
  if (!user?.databaseId) return null;
  return { id: user.databaseId };
}

async function writeAudit(opts: {
  action: string;
  request?: Record<string, unknown>;
  ok: boolean;
  error?: string;
}) {
  try {
    await prisma.gameApiAuditLog.create({
      data: {
        provider: GameProvider.steam,
        action: opts.action,
        request: opts.request ? (opts.request as Prisma.InputJsonValue) : Prisma.JsonNull,
        status: opts.ok ? AuditStatus.success : AuditStatus.failure,
        error: opts.error ?? null,
      },
    });
  } catch {
    // audit log must never break the action
  }
}

// ─── Unlink Steam account ────────────────────────────────────────────────────

export async function unlinkSteamAccount(
  _prevState: AccountActionResult,
  _formData: FormData,
): Promise<AccountActionResult> {
  const user = await requireUser();
  if (!user) return fail("Please login first.");

  const account = await prisma.playerGameAccount.findUnique({
    where: {
      userId_provider: { userId: user.id, provider: GameProvider.steam },
    },
    select: { id: true, externalId: true },
  });

  if (!account) return fail("No Steam account is linked to your profile.");

  await prisma.playerGameAccount.delete({ where: { id: account.id } });

  await writeAudit({
    action: "steam.account.unlink",
    request: { userId: user.id, steamId64: account.externalId },
    ok: true,
  });

  revalidatePath("/profile");
  return success("Steam account unlinked.");
}

// ─── Unlink Riot account ─────────────────────────────────────────────────────

export async function unlinkRiotAccount(
  _prevState: AccountActionResult,
  _formData: FormData,
): Promise<AccountActionResult> {
  const user = await requireUser();
  if (!user) return fail("Please login first.");

  const account = await prisma.playerGameAccount.findUnique({
    where: {
      userId_provider: { userId: user.id, provider: GameProvider.riot_lol },
    },
    select: { id: true, externalId: true },
  });

  if (!account) return fail("No Riot account is linked to your profile.");

  await prisma.playerGameAccount.delete({ where: { id: account.id } });

  await prisma.gameApiAuditLog.create({
    data: {
      provider: GameProvider.riot_lol,
      action: "riot.account.unlink",
      request: { userId: user.id, puuid: account.externalId } as Prisma.InputJsonValue,
      status: AuditStatus.success,
      error: null,
    },
  }).catch(() => undefined);

  revalidatePath("/profile");
  return success("Riot account unlinked.");
}
