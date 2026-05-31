import crypto from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function isBotAuthorized(request: Request): boolean {
  const expected = process.env.BOT_API_TOKEN?.trim();
  if (!expected) return false;

  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return false;

  const provided = authHeader.slice("Bearer ".length).trim();
  if (!provided) return false;

  return safeEqual(provided, expected);
}
