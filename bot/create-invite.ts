import { loadEnvConfig } from "@next/env";
import { ChannelType, Client, GatewayIntentBits } from "discord.js";

loadEnvConfig(process.cwd());

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const INVITE_CHANNEL_ID =
  process.env.DISCORD_INVITE_CHANNEL_ID ||
  process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID;

if (!DISCORD_BOT_TOKEN) {
  throw new Error("Missing DISCORD_BOT_TOKEN");
}

if (!GUILD_ID) {
  throw new Error("Missing DISCORD_GUILD_ID");
}

if (!INVITE_CHANNEL_ID) {
  throw new Error(
    "Missing DISCORD_INVITE_CHANNEL_ID or DISCORD_ANNOUNCEMENT_CHANNEL_ID",
  );
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", async () => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const channel = await guild.channels.fetch(INVITE_CHANNEL_ID);

    if (!channel) {
      throw new Error("Invite channel was not found.");
    }

    if (
      channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildAnnouncement
    ) {
      throw new Error("Invite channel must be a text or announcement channel.");
    }

    const invite = await channel.createInvite({
      maxAge: 0,
      maxUses: 0,
      unique: true,
      reason: "Ascendra website invite link",
    });

    console.log("Discord invite created:");
    console.log(invite.url);
  } catch (error) {
    console.error("Failed to create Discord invite:", error);
    process.exitCode = 1;
  } finally {
    client.destroy();
  }
});

client.login(DISCORD_BOT_TOKEN);
