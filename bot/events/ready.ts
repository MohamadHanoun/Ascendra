import type { Client } from "discord.js";

export function handleReady(client: Client) {
  console.log(`Bot is ready as ${client.user?.tag}`);
}