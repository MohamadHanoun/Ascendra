import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { AuditStatus, GameProvider, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimiter = createRateLimiter(10, 60_000);

const STEAM_VERIFY_URL = "https://steamcommunity.com/openid/login";
const STEAM_PLAYER_URL =
  "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002";
const STEAM_ID64_REGEX = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;
const STATE_COOKIE = "steam_openid_state";
type Locale = "en" | "ar";

type SteamCallbackMessages = {
  sessionExpired: string;
  malformedSession: string;
  stateMismatch: string;
  invalidStateFormat: string;
  notConfigured: string;
  invalidSignature: string;
  userNotFound: string;
  cancelled: string;
  networkError: string;
  verifyFailed: string;
  steamIdFailed: string;
  alreadyLinked: string;
  linked: string;
  linkedWithName: string;
};

const steamCallbackMessages: Record<Locale, SteamCallbackMessages> = {
  en: {
    sessionExpired: "Session expired. Please try linking your account again.",
    malformedSession: "Malformed session. Please try linking your account again.",
    stateMismatch: "State mismatch. Please try again.",
    invalidStateFormat: "Invalid state format.",
    notConfigured: "Steam linking is not configured. Contact an administrator.",
    invalidSignature: "Invalid state signature. Please try again.",
    userNotFound: "User not found. Please sign in again.",
    cancelled: "Steam account linking was cancelled.",
    networkError: "Could not reach Steam servers. Please try again.",
    verifyFailed: "Steam could not verify your identity. Please try again.",
    steamIdFailed: "Could not extract Steam ID. Please try again.",
    alreadyLinked:
      "This Steam account is already linked to a different Ascendra account.",
    linked: "Steam account linked successfully.",
    linkedWithName: 'Steam account "{name}" linked successfully.',
  },
  ar: {
    sessionExpired: "انتهت الجلسة. حاول ربط حسابك مرة أخرى.",
    malformedSession: "جلسة غير صالحة. حاول ربط حسابك مرة أخرى.",
    stateMismatch: "فشل التحقق من الجلسة. حاول مرة أخرى.",
    invalidStateFormat: "تنسيق الجلسة غير صالح.",
    notConfigured: "ربط حساب Steam غير مفعّل. تواصل مع أحد المشرفين.",
    invalidSignature: "توقيع الجلسة غير صالح. حاول مرة أخرى.",
    userNotFound: "لم يتم العثور على المستخدم. يرجى تسجيل الدخول مرة أخرى.",
    cancelled: "تم إلغاء ربط حساب Steam.",
    networkError: "تعذر الاتصال بخوادم Steam. حاول مرة أخرى.",
    verifyFailed: "تعذر على Steam التحقق من هويتك. حاول مرة أخرى.",
    steamIdFailed: "تعذر استخراج معرّف Steam. حاول مرة أخرى.",
    alreadyLinked: "حساب Steam هذا مرتبط بحساب Ascendra آخر.",
    linked: "تم ربط حساب Steam بنجاح.",
    linkedWithName: 'تم ربط حساب Steam "{name}" بنجاح.',
  },
};

const STATE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

function getRequestLocale(request: Request): Locale {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const localeCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("ascendra_locale="));
  const locale = localeCookie?.slice("ascendra_locale=".length);

  return locale === "ar" ? "ar" : "en";
}

function getAppBaseUrl(request: Request) {
  const configuredBaseUrl = process.env.APP_BASE_URL?.trim();

  if (configuredBaseUrl) {
    try {
      return new URL(configuredBaseUrl).origin;
    } catch {
      // Fall back to the current request origin if APP_BASE_URL is invalid.
    }
  }

  return new URL(request.url).origin;
}

function clearStateCookie(response: NextResponse) {
  response.cookies.set(STATE_COOKIE, "", {
    ...STATE_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

function getStateCookieValue(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieMatch = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`));
  const rawValue = cookieMatch?.slice(STATE_COOKIE.length + 1) ?? "";

  if (!rawValue) {
    return "";
  }

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

function redirect(
  baseUrl: string,
  path: string,
  params: Record<string, string>,
) {
  const url = new URL(path, baseUrl);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = NextResponse.redirect(url.toString());
  clearStateCookie(res);
  return res;
}

function fail(baseUrl: string, error: string) {
  return redirect(baseUrl, "/profile", { error });
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
    // audit log must never break the handler
  }
}

export async function GET(request: Request) {
  const limited = rateLimiter(request);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const baseUrl = getAppBaseUrl(request);
  const messages = steamCallbackMessages[getRequestLocale(request)];

  const returnedState = searchParams.get("state");

  const cookieValue = getStateCookieValue(request);

  if (!cookieValue || !returnedState) {
    return fail(baseUrl, messages.sessionExpired);
  }

  const [cookieState, userId] = cookieValue.split("|");

  if (!cookieState || !userId) {
    return fail(baseUrl, messages.malformedSession);
  }

  // Constant-time comparison prevents timing attacks.
  const stateA = Buffer.from(returnedState);
  const stateB = Buffer.from(cookieState);
  const statesMatch =
    stateA.length === stateB.length && crypto.timingSafeEqual(stateA, stateB);

  if (!statesMatch) {
    return fail(baseUrl, messages.stateMismatch);
  }

  // Verify the HMAC embedded in the state.
  const [nonce, sig] = returnedState.split(".");
  if (!nonce || !sig) {
    return fail(baseUrl, messages.invalidStateFormat);
  }
  const secret = process.env.STEAM_OPENID_SECRET?.trim();
  if (!secret) {
    await writeAudit({
      action: "steam.openid.verify.misconfigured",
      ok: false,
      error: "missing_STEAM_OPENID_SECRET",
    });
    return fail(baseUrl, messages.notConfigured);
  }
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${nonce}`)
    .digest("hex");
  const sigA = Buffer.from(sig, "hex");
  const sigB = Buffer.from(expectedSig, "hex");
  const sigValid =
    sigA.length === sigB.length && crypto.timingSafeEqual(sigA, sigB);

  if (!sigValid) {
    return fail(baseUrl, messages.invalidSignature);
  }

  // Confirm the user still exists.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    return fail(baseUrl, messages.userNotFound);
  }

  // Steam returns openid.mode=cancel when the user cancels.
  const mode = searchParams.get("openid.mode");
  if (mode === "cancel") {
    return fail(baseUrl, messages.cancelled);
  }

  // Verify the assertion with Steam (check_authentication).
  const verifyParams = new URLSearchParams();
  verifyParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
  verifyParams.set("openid.mode", "check_authentication");
  for (const [key, value] of searchParams.entries()) {
    if (key !== "state" && key.startsWith("openid.") && key !== "openid.mode") {
      verifyParams.set(key, value);
    }
  }

  let verifyRes: Response;
  try {
    verifyRes = await fetch(STEAM_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyParams.toString(),
      cache: "no-store",
    });
  } catch {
    await writeAudit({
      action: "steam.openid.verify.network_error",
      request: { userId },
      ok: false,
      error: "network_error",
    });
    return fail(baseUrl, messages.networkError);
  }

  const verifyText = await verifyRes.text().catch(() => "");
  const isValid = verifyText.includes("is_valid:true");

  if (!isValid) {
    await writeAudit({
      action: "steam.openid.verify.invalid",
      request: { userId },
      ok: false,
      error: "invalid_assertion",
    });
    return fail(baseUrl, messages.verifyFailed);
  }

  // Extract SteamID64 from claimed_id URL.
  const claimedId = searchParams.get("openid.claimed_id") ?? "";
  const match = STEAM_ID64_REGEX.exec(claimedId);
  if (!match) {
    await writeAudit({
      action: "steam.openid.verify.invalid_claimed_id",
      request: { userId },
      ok: false,
      error: "invalid_claimed_id",
    });
    return fail(baseUrl, messages.steamIdFailed);
  }
  const steamId64 = match[1];

  // Optionally fetch display name from Steam Web API.
  let displayName: string | null = null;
  const steamApiKey = process.env.STEAM_API_KEY?.trim();
  if (steamApiKey) {
    try {
      const playerUrl = new URL(STEAM_PLAYER_URL);
      playerUrl.searchParams.set("key", steamApiKey);
      playerUrl.searchParams.set("steamids", steamId64);
      const playerRes = await fetch(playerUrl.toString(), {
        cache: "no-store",
      });
      if (playerRes.ok) {
        const playerData = (await playerRes.json()) as {
          response?: {
            players?: Array<{ personaname?: string }>;
          };
        };
        displayName =
          playerData.response?.players?.[0]?.personaname ?? null;
      }
    } catch {
      // Non-fatal; we still proceed without a display name.
    }
  }

  // Check whether this SteamID64 is already linked to a different user.
  const existingLink = await prisma.playerGameAccount.findUnique({
    where: {
      provider_externalId: {
        provider: GameProvider.steam,
        externalId: steamId64,
      },
    },
    select: { userId: true },
  });

  if (existingLink && existingLink.userId !== userId) {
    await writeAudit({
      action: "steam.openid.link.conflict",
      request: { userId },
      ok: false,
      error: "already_linked_to_other_user",
    });
    return fail(baseUrl, messages.alreadyLinked);
  }

  // Upsert the linked account.
  await prisma.playerGameAccount.upsert({
    where: {
      userId_provider: { userId, provider: GameProvider.steam },
    },
    update: {
      externalId: steamId64,
      displayName,
      verifiedAt: new Date(),
      metadata: {
        steamId64,
        linkedAt: new Date().toISOString(),
      },
    },
    create: {
      userId,
      provider: GameProvider.steam,
      externalId: steamId64,
      displayName,
      verifiedAt: new Date(),
      metadata: {
        steamId64,
        linkedAt: new Date().toISOString(),
      },
    },
  });

  await writeAudit({
    action: "steam.openid.link.success",
    request: { userId },
    ok: true,
  });

  return redirect(baseUrl, "/profile", {
    message: displayName
      ? messages.linkedWithName.replace("{name}", displayName)
      : messages.linked,
  });
}
