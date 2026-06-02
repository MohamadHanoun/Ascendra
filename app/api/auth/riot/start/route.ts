import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createRateLimiter } from "@/lib/rateLimit";
import { getRiotRsoConfig } from "@/lib/riotRsoConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimiter = createRateLimiter(5, 60_000);

const RIOT_AUTH_URL = "https://auth.riotgames.com/authorize";
const STATE_COOKIE = "riot_oauth_state";
const STATE_TTL_SECONDS = 300; // 5 minutes
type Locale = "en" | "ar";

const riotStartMessages: Record<
  Locale,
  { signInFirst: string; notConfigured: string }
> = {
  en: {
    signInFirst: "Please sign in first.",
    notConfigured: "Riot account linking is not configured on this server.",
  },
  ar: {
    signInFirst: "يرجى تسجيل الدخول أولًا.",
    notConfigured: "ربط حساب Riot غير مفعّل على هذا الخادم.",
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

export async function GET(request: Request) {
  const limited = rateLimiter(request);
  if (limited) return limited;

  const messages = riotStartMessages[getRequestLocale(request)];
  const session = await auth();
  const userId = (session?.user as { databaseId?: string } | undefined)
    ?.databaseId;

  if (!userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", messages.signInFirst);
    return NextResponse.redirect(loginUrl);
  }

  const rsoConfig = getRiotRsoConfig();

  if (!rsoConfig) {
    const profileUrl = new URL("/profile", request.url);
    profileUrl.searchParams.set("error", messages.notConfigured);
    return NextResponse.redirect(profileUrl);
  }

  const { clientId, clientSecret, redirectUri } = rsoConfig;

  // Generate a cryptographically-random state. We sign it with the client
  // secret so we can verify it on the callback without storing a DB record.
  const nonce = crypto.randomBytes(16).toString("hex");
  const sig = crypto
    .createHmac("sha256", clientSecret)
    .update(`${userId}:${nonce}`)
    .digest("hex");
  const state = `${nonce}.${sig}`;

  const authorizeUrl = new URL(RIOT_AUTH_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());

  // Store state + userId in an HttpOnly cookie (never readable by JS).
  const cookieValue = `${state}|${userId}`;
  response.cookies.set(STATE_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_TTL_SECONDS,
    path: "/",
  });

  return response;
}
