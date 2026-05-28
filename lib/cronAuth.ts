import crypto from "node:crypto";

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  // Fail closed: if CRON_SECRET is not configured no request is accepted.
  if (!secret) return false;

  // Authorization: Bearer <secret> — Vercel cron / production path.
  // Query-string secrets are intentionally not supported: URLs appear in logs,
  // browser history, proxies, and analytics.
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader !== "" && safeEqual(authHeader, `Bearer ${secret}`);
}
