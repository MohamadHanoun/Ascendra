import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { GameProvider } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rateLimit";
import { getRiotRsoConfig } from "@/lib/riotRsoConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimiter = createRateLimiter(10, 60_000);

const RIOT_TOKEN_URL = "https://auth.riotgames.com/token";
const RIOT_ACCOUNT_URL =
  "https://americas.api.riotgames.com/riot/account/v1/accounts/me";
const STATE_COOKIE = "riot_oauth_state";
type Locale = "en" | "ar";

type RiotCallbackMessages = {
  cancelled: string;
  providerError: string;
  invalidCallback: string;
  sessionExpired: string;
  malformedSession: string;
  stateMismatch: string;
  invalidStateFormat: string;
  invalidSignature: string;
  userNotFound: string;
  notConfigured: string;
  authServerUnavailable: string;
  tokenExchangeFailed: string;
  unexpectedResponse: string;
  missingToken: string;
  accountServerUnavailable: string;
  accountFetchFailed: string;
  unexpectedAccountResponse: string;
  invalidAccount: string;
  alreadyLinked: string;
  linked: string;
  linkedWithName: string;
};

const riotCallbackMessages: Record<Locale, RiotCallbackMessages> = {
  en: {
    cancelled: "Riot account linking was cancelled.",
    providerError: "Riot returned an error: {error}",
    invalidCallback: "Invalid callback — missing code or state.",
    sessionExpired: "Session expired. Please try linking your account again.",
    malformedSession: "Malformed session. Please try linking your account again.",
    stateMismatch: "State mismatch — possible CSRF. Please try again.",
    invalidStateFormat: "Invalid state format.",
    invalidSignature: "Invalid state signature. Please try again.",
    userNotFound: "User not found. Please sign in again.",
    notConfigured: "Riot account linking is not configured on this server.",
    authServerUnavailable: "Could not reach Riot authentication servers.",
    tokenExchangeFailed: "Riot token exchange failed. Please try again.",
    unexpectedResponse: "Unexpected response from Riot. Please try again.",
    missingToken: "Riot did not return an access token.",
    accountServerUnavailable: "Could not reach Riot account servers.",
    accountFetchFailed: "Could not retrieve your Riot account. Please try again.",
    unexpectedAccountResponse: "Unexpected account response from Riot.",
    invalidAccount: "Riot did not return a valid account.",
    alreadyLinked:
      "This Riot account is already linked to a different Ascendra account.",
    linked: "Riot account linked successfully.",
    linkedWithName: "Riot account {name} linked successfully.",
  },
  ar: {
    cancelled: "تم إلغاء ربط حساب Riot.",
    providerError: "أعاد Riot خطأ: {error}",
    invalidCallback: "رد غير صالح من Riot. الرمز أو الحالة مفقودة.",
    sessionExpired: "انتهت الجلسة. حاول ربط حسابك مرة أخرى.",
    malformedSession: "جلسة غير صالحة. حاول ربط حسابك مرة أخرى.",
    stateMismatch: "فشل التحقق من الجلسة. حاول مرة أخرى.",
    invalidStateFormat: "تنسيق الجلسة غير صالح.",
    invalidSignature: "توقيع الجلسة غير صالح. حاول مرة أخرى.",
    userNotFound: "لم يتم العثور على المستخدم. يرجى تسجيل الدخول مرة أخرى.",
    notConfigured: "ربط حساب Riot غير مفعّل على هذا الخادم.",
    authServerUnavailable: "تعذر الاتصال بخوادم مصادقة Riot.",
    tokenExchangeFailed: "فشل تبادل رمز Riot. حاول مرة أخرى.",
    unexpectedResponse: "وصل رد غير متوقع من Riot. حاول مرة أخرى.",
    missingToken: "لم يُرجع Riot رمز وصول.",
    accountServerUnavailable: "تعذر الاتصال بخوادم حساب Riot.",
    accountFetchFailed: "تعذر جلب حساب Riot الخاص بك. حاول مرة أخرى.",
    unexpectedAccountResponse: "وصل رد حساب غير متوقع من Riot.",
    invalidAccount: "لم يُرجع Riot حسابًا صالحًا.",
    alreadyLinked: "حساب Riot هذا مرتبط بحساب Ascendra آخر.",
    linked: "تم ربط حساب Riot بنجاح.",
    linkedWithName: "تم ربط حساب Riot {name} بنجاح.",
  },
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

function redirect(baseUrl: string, path: string, params: Record<string, string>) {
  const url = new URL(path, baseUrl);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = NextResponse.redirect(url.toString());
  res.cookies.set(STATE_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}

function fail(baseUrl: string, error: string) {
  return redirect(baseUrl, "/profile/settings", { error });
}

export async function GET(request: Request) {
  const limited = rateLimiter(request);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const baseUrl = new URL(request.url).origin;
  const messages = riotCallbackMessages[getRequestLocale(request)];

  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return fail(
      baseUrl,
      errorParam === "access_denied"
        ? messages.cancelled
        : messages.providerError.replace("{error}", errorParam),
    );
  }

  if (!code || !returnedState) {
    return fail(baseUrl, messages.invalidCallback);
  }

  // Verify the state cookie.
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieMatch = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`));
  const cookieValue = cookieMatch?.slice(STATE_COOKIE.length + 1) ?? "";

  if (!cookieValue) {
    return fail(baseUrl, messages.sessionExpired);
  }

  const [cookieState, userId] = cookieValue.split("|");

  if (!cookieState || !userId) {
    return fail(baseUrl, messages.malformedSession);
  }

  // Constant-time comparison to prevent timing attacks.
  const stateA = Buffer.from(returnedState);
  const stateB = Buffer.from(cookieState);
  const statesMatch =
    stateA.length === stateB.length &&
    crypto.timingSafeEqual(stateA, stateB);

  if (!statesMatch) {
    return fail(baseUrl, messages.stateMismatch);
  }

  // Require all RSO config before any cryptographic operations.
  // clientSecret is the HMAC key – it must be a real configured secret,
  // never a well-known fallback string.
  const rsoConfig = getRiotRsoConfig();
  if (!rsoConfig) {
    return fail(baseUrl, messages.notConfigured);
  }
  const { clientId, clientSecret, redirectUri } = rsoConfig;

  // Verify the HMAC embedded in the state so nobody can forge a valid state.
  const [nonce, sig] = returnedState.split(".");
  if (!nonce || !sig) {
    return fail(baseUrl, messages.invalidStateFormat);
  }
  const expectedSig = crypto
    .createHmac("sha256", clientSecret)
    .update(`${userId}:${nonce}`)
    .digest("hex");
  const sigA = Buffer.from(sig, "hex");
  const sigB = Buffer.from(expectedSig, "hex");
  const sigValid =
    sigA.length === sigB.length && crypto.timingSafeEqual(sigA, sigB);

  if (!sigValid) {
    return fail(baseUrl, messages.invalidSignature);
  }

  // Confirm the user still exists in our DB.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    return fail(baseUrl, messages.userNotFound);
  }

  // Exchange authorization code for access token.
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );
  let tokenRes: Response;
  try {
    tokenRes = await fetch(RIOT_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
      cache: "no-store",
    });
  } catch {
    return fail(baseUrl, messages.authServerUnavailable);
  }

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text().catch(() => "");
    console.error("[riot callback] token exchange failed:", tokenRes.status, errBody);
    return fail(baseUrl, messages.tokenExchangeFailed);
  }

  let tokenData: { access_token?: string; token_type?: string };
  try {
    tokenData = (await tokenRes.json()) as {
      access_token?: string;
      token_type?: string;
    };
  } catch {
    return fail(baseUrl, messages.unexpectedResponse);
  }

  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return fail(baseUrl, messages.missingToken);
  }

  // Fetch the Riot account identity (puuid, gameName, tagLine).
  let accountRes: Response;
  try {
    accountRes = await fetch(RIOT_ACCOUNT_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
  } catch {
    return fail(baseUrl, messages.accountServerUnavailable);
  }

  if (!accountRes.ok) {
    console.error("[riot callback] account fetch failed:", accountRes.status);
    return fail(baseUrl, messages.accountFetchFailed);
  }

  let accountData: {
    puuid?: string;
    gameName?: string;
    tagLine?: string;
  };
  try {
    accountData = (await accountRes.json()) as {
      puuid?: string;
      gameName?: string;
      tagLine?: string;
    };
  } catch {
    return fail(baseUrl, messages.unexpectedAccountResponse);
  }

  const puuid = accountData.puuid;
  if (!puuid) {
    return fail(baseUrl, messages.invalidAccount);
  }

  const gameName = accountData.gameName ?? null;
  const tagLine = accountData.tagLine ?? null;
  const displayName =
    gameName && tagLine
      ? `${gameName}#${tagLine}`
      : gameName ?? tagLine ?? null;

  // Check whether this puuid is already linked to a different user.
  const existingLink = await prisma.playerGameAccount.findUnique({
    where: {
      provider_externalId: {
        provider: GameProvider.riot_lol,
        externalId: puuid,
      },
    },
    select: { userId: true },
  });

  if (existingLink && existingLink.userId !== userId) {
    return fail(baseUrl, messages.alreadyLinked);
  }

  // Upsert the linked account. The @@unique([userId, provider]) constraint
  // means each user can have at most one Riot LoL account linked.
  await prisma.playerGameAccount.upsert({
    where: {
      userId_provider: {
        userId,
        provider: GameProvider.riot_lol,
      },
    },
    update: {
      externalId: puuid,
      displayName,
      verifiedAt: new Date(),
      metadata: {
        gameName: gameName ?? null,
        tagLine: tagLine ?? null,
        linkedAt: new Date().toISOString(),
      },
    },
    create: {
      userId,
      provider: GameProvider.riot_lol,
      externalId: puuid,
      displayName,
      verifiedAt: new Date(),
      metadata: {
        gameName: gameName ?? null,
        tagLine: tagLine ?? null,
        linkedAt: new Date().toISOString(),
      },
    },
  });

  return redirect(baseUrl, "/profile/settings", {
    message: displayName
      ? messages.linkedWithName.replace("{name}", displayName)
      : messages.linked,
  });
}
