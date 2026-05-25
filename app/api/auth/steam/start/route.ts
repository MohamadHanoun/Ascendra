import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STATE_COOKIE = "steam_openid_state";
const STATE_TTL_SECONDS = 600; // 10 minutes

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

export async function GET(request: Request) {
  const session = await auth();
  const userId = (session?.user as { databaseId?: string } | undefined)
    ?.databaseId;

  if (!userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Please sign in first.");
    return NextResponse.redirect(loginUrl);
  }

  const appBaseUrl = getAppBaseUrl(request);
  const returnTo = new URL("/api/auth/steam/callback", appBaseUrl).toString();

  // CSRF nonce signed with a server-side secret so the callback can verify it.
  const secret = process.env.STEAM_OPENID_SECRET?.trim();
  if (!secret) {
    const errUrl = new URL("/profile", appBaseUrl);
    errUrl.searchParams.set(
      "error",
      "Steam linking is not configured. Contact an administrator.",
    );
    return NextResponse.redirect(errUrl);
  }
  const nonce = crypto.randomBytes(16).toString("hex");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${nonce}`)
    .digest("hex");
  const state = `${nonce}.${sig}`;

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": `${returnTo}?state=${encodeURIComponent(state)}`,
    "openid.realm": appBaseUrl,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  const redirectUrl = `${STEAM_OPENID_URL}?${params.toString()}`;
  const response = NextResponse.redirect(redirectUrl);

  // Store state + userId in an HttpOnly cookie (never readable by JS).
  response.cookies.set(STATE_COOKIE, `${state}|${userId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_TTL_SECONDS,
    path: "/",
  });

  return response;
}
