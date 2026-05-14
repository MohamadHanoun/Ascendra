import { Client, Events, GatewayIntentBits } from "discord.js";
import { botConfig } from "./config";
import { handleReady } from "./events/ready";
import { handleMessageCreate } from "./events/messageCreate";

if (!botConfig.token || botConfig.token === "your_discord_bot_token_here") {
  console.log("Bot token is missing. Add DISCORD_BOT_TOKEN in .env.local later.");
  process.exit(0);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, () => handleReady(client));

client.on(Events.MessageCreate, async (message) => {
  await handleMessageCreate(message);
});

client.login(botConfig.token);