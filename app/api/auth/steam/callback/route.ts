import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { AuditStatus, GameProvider, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STEAM_VERIFY_URL = "https://steamcommunity.com/openid/login";
const STEAM_PLAYER_URL =
  "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002";
const STEAM_ID64_REGEX = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;
const STATE_COOKIE = "steam_openid_state";

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
  res.cookies.set(STATE_COOKIE, "", { maxAge: 0, path: "/" });
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
  const { searchParams } = new URL(request.url);
  const baseUrl = new URL(request.url).origin;

  const returnedState = searchParams.get("state");

  // Verify the state cookie.
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieMatch = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`));
  const cookieValue = cookieMatch?.slice(STATE_COOKIE.length + 1) ?? "";

  if (!cookieValue || !returnedState) {
    return fail(baseUrl, "Session expired. Please try linking your account again.");
  }

  const [cookieState, userId] = cookieValue.split("|");

  if (!cookieState || !userId) {
    return fail(baseUrl, "Malformed session. Please try linking your account again.");
  }

  // Constant-time comparison — prevents timing attacks.
  const stateA = Buffer.from(returnedState);
  const stateB = Buffer.from(cookieState);
  const statesMatch =
    stateA.length === stateB.length && crypto.timingSafeEqual(stateA, stateB);

  if (!statesMatch) {
    return fail(baseUrl, "State mismatch — possible CSRF. Please try again.");
  }

  // Verify the HMAC embedded in the state.
  const [nonce, sig] = returnedState.split(".");
  if (!nonce || !sig) {
    return fail(baseUrl, "Invalid state format.");
  }
  const secret = process.env.STEAM_OPENID_SECRET?.trim();
  if (!secret) {
    await writeAudit({
      action: "steam.openid.verify.misconfigured",
      ok: false,
      error: "missing_STEAM_OPENID_SECRET",
    });
    return fail(
      baseUrl,
      "Steam linking is not configured. Contact an administrator.",
    );
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
    return fail(baseUrl, "Invalid state signature. Please try again.");
  }

  // Confirm the user still exists.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    return fail(baseUrl, "User not found. Please sign in again.");
  }

  // Steam returns openid.mode=cancel when the user cancels.
  const mode = searchParams.get("openid.mode");
  if (mode === "cancel") {
    return fail(baseUrl, "Steam account linking was cancelled.");
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
    return fail(baseUrl, "Could not reach Steam servers. Please try again.");
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
    return fail(
      baseUrl,
      "Steam could not verify your identity. Please try again.",
    );
  }

  // Extract SteamID64 from claimed_id URL.
  const claimedId = searchParams.get("openid.claimed_id") ?? "";
  const match = STEAM_ID64_REGEX.exec(claimedId);
  if (!match) {
    await writeAudit({
      action: "steam.openid.verify.invalid_claimed_id",
      request: { userId, claimedId },
      ok: false,
      error: "invalid_claimed_id",
    });
    return fail(baseUrl, "Could not extract Steam ID. Please try again.");
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
      // Non-fatal — we still proceed without a display name.
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
      request: { userId, steamId64 },
      ok: false,
      error: "already_linked_to_other_user",
    });
    return fail(
      baseUrl,
      "This Steam account is already linked to a different Ascendra account.",
    );
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
    request: { userId, steamId64 },
    ok: true,
  });

  return redirect(baseUrl, "/profile", {
    message: displayName
      ? `Steam account "${displayName}" linked successfully.`
      : "Steam account linked successfully.",
  });
}
