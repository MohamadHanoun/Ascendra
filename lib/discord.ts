export const config = {
  site: {
    name: process.env.NEXT_PUBLIC_SITE_NAME || "DISCORE",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    discordInviteUrl: process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "",
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  discord: {
    botToken: process.env.DISCORD_BOT_TOKEN,
    guildId: process.env.DISCORD_GUILD_ID,
  },
};
