import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { GameProvider } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RIOT_TOKEN_URL = "https://auth.riotgames.com/token";
const RIOT_ACCOUNT_URL =
  "https://americas.api.riotgames.com/riot/account/v1/accounts/me";
const STATE_COOKIE = "riot_oauth_state";

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
  return redirect(baseUrl, "/profile", { error });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const baseUrl = new URL(request.url).origin;

  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return fail(
      baseUrl,
      errorParam === "access_denied"
        ? "Riot account linking was cancelled."
        : `Riot returned an error: ${errorParam}`,
    );
  }

  if (!code || !returnedState) {
    return fail(baseUrl, "Invalid callback — missing code or state.");
  }

  // Verify the state cookie.
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieMatch = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`));
  const cookieValue = cookieMatch?.slice(STATE_COOKIE.length + 1) ?? "";

  if (!cookieValue) {
    return fail(baseUrl, "Session expired. Please try linking your account again.");
  }

  const [cookieState, userId] = cookieValue.split("|");

  if (!cookieState || !userId) {
    return fail(baseUrl, "Malformed session. Please try linking your account again.");
  }

  // Constant-time comparison to prevent timing attacks.
  const stateA = Buffer.from(returnedState);
  const stateB = Buffer.from(cookieState);
  const statesMatch =
    stateA.length === stateB.length &&
    crypto.timingSafeEqual(stateA, stateB);

  if (!statesMatch) {
    return fail(baseUrl, "State mismatch — possible CSRF. Please try again.");
  }

  // Verify the HMAC embedded in the state so nobody can forge a valid state.
  const [nonce, sig] = returnedState.split(".");
  if (!nonce || !sig) {
    return fail(baseUrl, "Invalid state format.");
  }
  const secret = process.env.RIOT_RSO_CLIENT_SECRET?.trim() ?? "fallback";
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${nonce}`)
    .digest("hex");
  const sigA = Buffer.from(sig, "hex");
  const sigB = Buffer.from(expectedSig, "hex");
  const sigValid =
    sigA.length === sigB.length && crypto.timingSafeEqual(sigA, sigB);

  if (!sigValid) {
    return fail(baseUrl, "Invalid state signature. Please try again.");
  }

  // Confirm the user still exists in our DB.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    return fail(baseUrl, "User not found. Please sign in again.");
  }

  const clientId = process.env.RIOT_RSO_CLIENT_ID?.trim();
  const clientSecret = process.env.RIOT_RSO_CLIENT_SECRET?.trim();
  const redirectUri = process.env.RIOT_RSO_REDIRECT_URI?.trim();

  if (!clientId || !clientSecret || !redirectUri) {
    return fail(
      baseUrl,
      "Riot account linking is not configured on this server.",
    );
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
    return fail(baseUrl, "Could not reach Riot authentication servers.");
  }

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text().catch(() => "");
    console.error("[riot callback] token exchange failed:", tokenRes.status, errBody);
    return fail(baseUrl, "Riot token exchange failed. Please try again.");
  }

  let tokenData: { access_token?: string; token_type?: string };
  try {
    tokenData = (await tokenRes.json()) as {
      access_token?: string;
      token_type?: string;
    };
  } catch {
    return fail(baseUrl, "Unexpected response from Riot. Please try again.");
  }

  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return fail(baseUrl, "Riot did not return an access token.");
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
    return fail(baseUrl, "Could not reach Riot account servers.");
  }

  if (!accountRes.ok) {
    console.error("[riot callback] account fetch failed:", accountRes.status);
    return fail(baseUrl, "Could not retrieve your Riot account. Please try again.");
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
    return fail(baseUrl, "Unexpected account response from Riot.");
  }

  const puuid = accountData.puuid;
  if (!puuid) {
    return fail(baseUrl, "Riot did not return a valid account.");
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
    return fail(
      baseUrl,
      "This Riot account is already linked to a different Ascendra account.",
    );
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

  return redirect(baseUrl, "/profile", {
    message: displayName
      ? `Riot account ${displayName} linked successfully.`
      : "Riot account linked successfully.",
  });
}
