import type { Message } from "discord.js";
import { addXp } from "../services/xpService";

export async function handleMessageCreate(message: Message) {
  if (message.author.bot) {
    return;
  }

  await addXp({
    discordId: message.author.id,
    username: message.author.username,
    amount: 10,
    reason: "message_activity",
  });
}