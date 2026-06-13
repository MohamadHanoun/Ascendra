"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { AuditStatus, GameProvider, Prisma } from "@prisma/client";

import { FaceitApiError, getFaceitPlayerByNickname } from "@/lib/faceit";
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
  faceitNicknameRequired: string;
  faceitPlayerNotFound: string;
  faceitLookupFailed: string;
  steamRequiredForFaceit: string;
  faceitSteamMismatch: string;
  faceitAlreadyLinked: string;
  faceitLinked: string;
  noFaceitAccount: string;
  faceitUnlinked: string;
};

const accountActionMessages: Record<Locale, AccountActionMessages> = {
  en: {
    loginRequired: "Please login first.",
    noSteamAccount: "No Steam account is linked to your profile.",
    steamUnlinked: "Steam account unlinked.",
    noRiotAccount: "No Riot account is linked to your profile.",
    riotUnlinked: "Riot account unlinked.",
    faceitNicknameRequired: "Please enter your FACEIT nickname.",
    faceitPlayerNotFound: "FACEIT player not found. Check your nickname and try again.",
    faceitLookupFailed: "FACEIT lookup failed. Please try again later.",
    steamRequiredForFaceit: "Connect Steam first before connecting FACEIT.",
    faceitSteamMismatch: "FACEIT must belong to the same Steam account linked on your profile. Check both accounts and try again.",
    faceitAlreadyLinked: "This FACEIT account is already linked to a different Ascendra account.",
    faceitLinked: "FACEIT account connected and verified against Steam.",
    noFaceitAccount: "No FACEIT account is linked to your profile.",
    faceitUnlinked: "FACEIT account unlinked.",
  },
  ar: {
    loginRequired: "يرجى تسجيل الدخول أولًا.",
    noSteamAccount: "لا يوجد حساب Steam مرتبط بملفك الشخصي.",
    steamUnlinked: "تم إلغاء ربط حساب Steam.",
    noRiotAccount: "لا يوجد حساب Riot مرتبط بملفك الشخصي.",
    riotUnlinked: "تم إلغاء ربط حساب Riot.",
    faceitNicknameRequired: "يرجى إدخال اسم مستخدمك على FACEIT.",
    faceitPlayerNotFound: "لم يتم العثور على لاعب FACEIT. تحقق من اسم المستخدم وحاول مجددًا.",
    faceitLookupFailed: "فشل البحث في FACEIT. يرجى المحاولة لاحقًا.",
    steamRequiredForFaceit: "اربط Steam أولًا قبل ربط FACEIT.",
    faceitSteamMismatch: "يجب أن يكون حساب FACEIT مرتبطًا بنفس حساب Steam الموجود في ملفك الشخصي. تحقق من الحسابين وحاول مجددًا.",
    faceitAlreadyLinked: "حساب FACEIT هذا مرتبط مسبقًا بحساب Ascendra آخر.",
    faceitLinked: "تم ربط حساب FACEIT والتحقق من مطابقته مع Steam.",
    noFaceitAccount: "لا يوجد حساب FACEIT مرتبط بملفك الشخصي.",
    faceitUnlinked: "تم إلغاء ربط حساب FACEIT.",
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
  revalidatePath("/profile/settings");
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
  revalidatePath("/profile/settings");
  return success(messages.riotUnlinked);
}

// ─── Connect FACEIT account ──────────────────────────────────────────────────

export async function connectFaceitAccount(
  _prevState: AccountActionResult,
  formData: FormData,
): Promise<AccountActionResult> {
  const messages = await getMessages();
  const user = await requireUser();
  if (!user) return fail(messages.loginRequired);

  const nickname = (formData.get("faceitNickname") as string | null)?.trim();
  if (!nickname) return fail(messages.faceitNicknameRequired);

  // Require a linked Steam account to perform the Steam ID match
  const steamAccount = await prisma.playerGameAccount.findUnique({
    where: { userId_provider: { userId: user.id, provider: GameProvider.steam } },
    select: { externalId: true },
  });
  if (!steamAccount) return fail(messages.steamRequiredForFaceit);

  // Look up the FACEIT player by nickname
  let player: Awaited<ReturnType<typeof getFaceitPlayerByNickname>>;
  try {
    player = await getFaceitPlayerByNickname(nickname, "cs2");
  } catch (err) {
    if (err instanceof FaceitApiError && err.status === 404) {
      return fail(messages.faceitPlayerNotFound);
    }
    return fail(messages.faceitLookupFailed);
  }

  // Verify the FACEIT player's Steam ID matches the user's linked Steam ID
  if (!player.steam_id_64 || player.steam_id_64 !== steamAccount.externalId) {
    return fail(messages.faceitSteamMismatch);
  }

  const existingFaceitUser = await prisma.user.findUnique({
    where: { faceitPlayerId: player.player_id },
    select: { id: true },
  });
  if (existingFaceitUser && existingFaceitUser.id !== user.id) {
    return fail(messages.faceitAlreadyLinked);
  }

  const cs2Game = player.games?.["cs2"];

  await prisma.user.update({
    where: { id: user.id },
    data: {
      faceitPlayerId: player.player_id,
      faceitNickname: player.nickname,
      faceitAvatar: player.avatar ?? null,
      faceitCountry: player.country ?? null,
      faceitUrl: player.faceit_url ?? null,
      faceitSkillLevelCs2: typeof cs2Game?.skill_level === "number" ? cs2Game.skill_level : null,
      faceitSteamId64: player.steam_id_64,
      faceitLinkedAt: new Date(),
    },
  });

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return success(messages.faceitLinked);
}

// ─── Unlink FACEIT account ───────────────────────────────────────────────────

export async function unlinkFaceitAccount(
  _prevState: AccountActionResult,
  _formData: FormData,
): Promise<AccountActionResult> {
  const messages = await getMessages();
  const user = await requireUser();
  if (!user) return fail(messages.loginRequired);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { faceitPlayerId: true },
  });
  if (!dbUser?.faceitPlayerId) return fail(messages.noFaceitAccount);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      faceitPlayerId: null,
      faceitNickname: null,
      faceitAvatar: null,
      faceitCountry: null,
      faceitUrl: null,
      faceitSkillLevelCs2: null,
      faceitSteamId64: null,
      faceitLinkedAt: null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return success(messages.faceitUnlinked);
}
