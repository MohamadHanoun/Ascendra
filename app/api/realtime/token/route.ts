import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  buildAllowedRooms,
  resolveClientTokenTtlSeconds,
  signClientToken,
} from "@/lib/realtime/clientToken";

/**
 * Realtime client-token issuance (Batch 1F — DORMANT until enabled).
 *
 * Mints a short-lived signed token the browser will later present to the
 * Hetzner realtime server to join its own notification room.
 *
 * Security:
 *  - Returns 404 while REALTIME_ENABLE_SOCKET !== "true" (route stays hidden).
 *  - Reads REALTIME_CLIENT_TOKEN_SECRET server-side only (never NEXT_PUBLIC).
 *  - 503 if the secret is missing or (in production) too weak.
 *  - 401 for unauthenticated callers.
 *  - Token carries only: database user id, admin flag, the allowed notification
 *    room, iat/exp, version. No Discord id, email, username, OAuth tokens,
 *    cookies, or session.
 *  - No secret/token/cookie/header values are logged.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_SECRET_LENGTH = 32;

const SECURITY_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
} as const;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: SECURITY_HEADERS });
}

export async function GET() {
  // Dormant: do not advertise the route while realtime is disabled.
  if (process.env.REALTIME_ENABLE_SOCKET !== "true") {
    return json({ ok: false, error: "Not found" }, 404);
  }

  const secret = process.env.REALTIME_CLIENT_TOKEN_SECRET;
  if (!secret) {
    return json({ ok: false, error: "Realtime is unavailable." }, 503);
  }
  if (
    process.env.NODE_ENV === "production" &&
    secret.length < MIN_SECRET_LENGTH
  ) {
    return json({ ok: false, error: "Realtime is unavailable." }, 503);
  }

  const session = await auth();
  const databaseId = session?.user?.databaseId;
  if (!databaseId) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  const isAdmin = session?.user?.isAdmin === true;
  const rooms = buildAllowedRooms({ databaseId, isAdmin });
  const ttlSeconds = resolveClientTokenTtlSeconds(
    process.env.REALTIME_CLIENT_TOKEN_TTL_SECONDS,
  );

  const { token, payload } = signClientToken({
    secret,
    sub: databaseId,
    isAdmin,
    rooms,
    ttlSeconds,
  });

  return json({
    ok: true,
    token,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    rooms,
  });
}
