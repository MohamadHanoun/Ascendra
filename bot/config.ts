import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export const botConfig = {
  token: process.env.DISCORD_BOT_TOKEN,
  guildId: process.env.DISCORD_GUILD_ID,
};