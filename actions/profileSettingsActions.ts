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

// ─── Editable profile info (displayName, bio) ────────────────────────────────

export type ProfileInfoActionResult = {
  ok: boolean;
  message: string;
};

type ProfileInfoActionMessages = {
  loginRequired: string;
  saved: string;
  failed: string;
  displayNameTooLong: string;
  bioTooLong: string;
};

const DISPLAY_NAME_MAX = 32;
const BIO_MAX = 280;

const profileInfoActionMessages: Record<Locale, ProfileInfoActionMessages> = {
  en: {
    loginRequired: "Please login first.",
    saved: "Profile info saved.",
    failed: "Could not save your profile info. Please try again.",
    displayNameTooLong: `Display name must be ${DISPLAY_NAME_MAX} characters or fewer.`,
    bioTooLong: `Bio must be ${BIO_MAX} characters or fewer.`,
  },
  ar: {
    loginRequired: "يرجى تسجيل الدخول أولًا.",
    saved: "تم حفظ معلومات الملف الشخصي.",
    failed: "تعذّر حفظ معلومات الملف الشخصي. يرجى المحاولة مرة أخرى.",
    displayNameTooLong: `يجب ألا يتجاوز الاسم المعروض ${DISPLAY_NAME_MAX} حرفًا.`,
    bioTooLong: `يجب ألا تتجاوز النبذة ${BIO_MAX} حرفًا.`,
  },
};

// Remove anything that looks like an HTML tag. Plain text only — no markup.
function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

// Drop control characters by code point. C0 controls are 0x00-0x1F; DEL and the
// C1 block are 0x7F-0x9F. When keepNewline is true the line feed (0x0A) is
// preserved so multi-line bio text keeps its breaks. Done with codePointAt
// rather than a regex so no literal control bytes live in this source file.
function stripControlChars(value: string, keepNewline: boolean): string {
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const isControl = code <= 0x1f || (code >= 0x7f && code <= 0x9f);
    if (isControl && !(keepNewline && code === 0x0a)) {
      continue;
    }
    out += char;
  }
  return out;
}

function cleanDisplayName(raw: string): string {
  return stripControlChars(stripHtml(raw), false).trim();
}

function cleanBio(raw: string): string {
  // Normalize CRLF, strip control chars (keeping newlines), collapse runs of 3+
  // newlines down to a single blank line, then trim ends.
  const normalized = stripControlChars(stripHtml(raw).replace(/\r\n/g, "\n"), true);
  return normalized.replace(/\n{3,}/g, "\n\n").trim();
}

export async function updateProfileInfo(
  _prevState: ProfileInfoActionResult,
  formData: FormData,
): Promise<ProfileInfoActionResult> {
  const locale = await getLocale();
  const messages = profileInfoActionMessages[locale];

  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, message: messages.loginRequired };
  }

  const displayName = cleanDisplayName(String(formData.get("displayName") ?? ""));
  const bio = cleanBio(String(formData.get("bio") ?? ""));

  if (displayName.length > DISPLAY_NAME_MAX) {
    return { ok: false, message: messages.displayNameTooLong };
  }
  if (bio.length > BIO_MAX) {
    return { ok: false, message: messages.bioTooLong };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Empty string stores null.
        displayName: displayName.length > 0 ? displayName : null,
        bio: bio.length > 0 ? bio : null,
      },
    });
  } catch {
    return { ok: false, message: messages.failed };
  }

  revalidatePath("/profile");
  revalidatePath(`/players/${userId}`);

  return { ok: true, message: messages.saved };
}
