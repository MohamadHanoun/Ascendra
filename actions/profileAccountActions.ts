"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { AuditStatus, GameProvider, Prisma } from "@prisma/client";

import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";

export type AccountActionResult = {
  ok: boolean;
  message: string;
};

type AccountActionMessages = {
  loginRequired: string;
  noSteamAccount: string;
  steamUnlinked: string;
  noRiotAccount: string;
  riotUnlinked: string;
};

const accountActionMessages: Record<Locale, AccountActionMessages> = {
  en: {
    loginRequired: "Please login first.",
    noSteamAccount: "No Steam account is linked to your profile.",
    steamUnlinked: "Steam account unlinked.",
    noRiotAccount: "No Riot account is linked to your profile.",
    riotUnlinked: "Riot account unlinked.",
  },
  ar: {
    loginRequired: "يرجى تسجيل الدخول أولًا.",
    noSteamAccount: "لا يوجد حساب Steam مرتبط بملفك الشخصي.",
    steamUnlinked: "تم إلغاء ربط حساب Steam.",
    noRiotAccount: "لا يوجد حساب Riot مرتبط بملفك الشخصي.",
    riotUnlinked: "تم إلغاء ربط حساب Riot.",
  },
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

async function getMessages() {
  const locale = await getLocale();

  return accountActionMessages[locale];
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
  const messages = await getMessages();
  const user = await requireUser();
  if (!user) return fail(messages.loginRequired);

  const account = await prisma.playerGameAccount.findUnique({
    where: {
      userId_provider: { userId: user.id, provider: GameProvider.steam },
    },
    select: { id: true },
  });

  if (!account) return fail(messages.noSteamAccount);

  await prisma.playerGameAccount.delete({ where: { id: account.id } });

  await writeAudit({
    action: "steam.account.unlink",
    request: { userId: user.id },
    ok: true,
  });

  revalidatePath("/profile");
  return success(messages.steamUnlinked);
}

// ─── Unlink Riot account ─────────────────────────────────────────────────────

export async function unlinkRiotAccount(
  _prevState: AccountActionResult,
  _formData: FormData,
): Promise<AccountActionResult> {
  const messages = await getMessages();
  const user = await requireUser();
  if (!user) return fail(messages.loginRequired);

  const account = await prisma.playerGameAccount.findUnique({
    where: {
      userId_provider: { userId: user.id, provider: GameProvider.riot_lol },
    },
    select: { id: true, externalId: true },
  });

  if (!account) return fail(messages.noRiotAccount);

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
  return success(messages.riotUnlinked);
}
