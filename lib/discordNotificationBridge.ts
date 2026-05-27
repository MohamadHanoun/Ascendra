import "server-only";

import { prisma } from "@/lib/prisma";

const DISCORD_API = "https://discord.com/api/v10";
const MAX_CONTENT_LENGTH = 1900;

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function uniqueDiscordIds(
  ids: Array<string | null | undefined>,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    const trimmed = id?.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result;
}

export function buildDiscordMessageContent(
  title: string,
  message: string,
  url?: string | null,
): string {
  const lines: string[] = [`**${title}**`, message];
  const trimmedUrl = url?.trim();
  if (trimmedUrl) lines.push(trimmedUrl);
  return lines.join("\n").slice(0, MAX_CONTENT_LENGTH);
}

export function isDiscordSendConfigured(): boolean {
  return Boolean(process.env.DISCORD_BOT_TOKEN?.trim());
}

// ─── Internal ─────────────────────────────────────────────────────────────────

async function fetchDiscordIdsForUsers(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const rows = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { discordId: true },
  });
  return uniqueDiscordIds(rows.map((r) => r.discordId));
}

function buildAbsoluteUrl(href?: string | null): string | null {
  const trimmed = href?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  return siteUrl ? `${siteUrl}${trimmed}` : null;
}

async function openDmChannel(
  token: string,
  discordId: string,
): Promise<string | null> {
  const res = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient_id: discordId }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { id?: string };
  return data?.id ?? null;
}

async function sendChannelMessage(
  token: string,
  channelId: string,
  content: string,
): Promise<void> {
  await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
}

async function sendOneDm(
  token: string,
  discordId: string,
  content: string,
): Promise<void> {
  const channelId = await openDmChannel(token, discordId);
  if (!channelId) return;
  await sendChannelMessage(token, channelId, content);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type DiscordNotificationInput = {
  userIds: string[];
  title: string;
  message: string;
  href?: string | null;
};

export async function sendDiscordNotificationsToUsers(
  input: DiscordNotificationInput,
): Promise<void> {
  if (!isDiscordSendConfigured()) return;
  if (input.userIds.length === 0) return;

  const discordIds = await fetchDiscordIdsForUsers(input.userIds).catch(
    () => [] as string[],
  );
  if (discordIds.length === 0) return;

  const url = buildAbsoluteUrl(input.href);
  const content = buildDiscordMessageContent(input.title, input.message, url);
  const token = process.env.DISCORD_BOT_TOKEN!;

  await Promise.allSettled(
    discordIds.map((id) => sendOneDm(token, id, content).catch(() => {})),
  );
}
