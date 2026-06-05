"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";

export type PrivacyActionResult = {
  ok: boolean;
  message: string;
};

type PrivacyActionMessages = {
  loginRequired: string;
  saved: string;
  failed: string;
};

const privacyActionMessages: Record<Locale, PrivacyActionMessages> = {
  en: {
    loginRequired: "Please login first.",
    saved: "Privacy settings saved.",
    failed: "Could not save your settings. Please try again.",
  },
  ar: {
    loginRequired: "يرجى تسجيل الدخول أولًا.",
    saved: "تم حفظ إعدادات الخصوصية.",
    failed: "تعذّر حفظ الإعدادات. يرجى المحاولة مرة أخرى.",
  },
};

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  const user = session?.user as { databaseId?: string } | undefined;
  return user?.databaseId ?? null;
}

function readToggle(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

export async function updateProfilePrivacy(
  _prevState: PrivacyActionResult,
  formData: FormData,
): Promise<PrivacyActionResult> {
  const locale = await getLocale();
  const messages = privacyActionMessages[locale];

  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, message: messages.loginRequired };
  }

  const publicProfileEnabled = readToggle(formData, "publicProfileEnabled");

  // Sub-toggles only matter when the profile is public. When the master toggle
  // is off, the whole public profile is hidden anyway, so we persist their
  // values as submitted without forcing them.
  const showDiscordId = readToggle(formData, "showDiscordId");
  const showTeams = readToggle(formData, "showTeams");
  const showTournamentHistory = readToggle(formData, "showTournamentHistory");

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        publicProfileEnabled,
        showDiscordId,
        showTeams,
        showTournamentHistory,
      },
    });
  } catch {
    return { ok: false, message: messages.failed };
  }

  revalidatePath("/profile");
  revalidatePath(`/players/${userId}`);

  return { ok: true, message: messages.saved };
}
