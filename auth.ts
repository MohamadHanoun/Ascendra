import { prisma } from "@/lib/prisma";
import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

const adminDiscordIds = (process.env.ADMIN_DISCORD_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

async function checkDiscordGuildMembership(accessToken?: string) {
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!accessToken || !guildId) {
    return false;
  }

  try {
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const guilds = (await response.json()) as { id: string }[];

    return guilds.some((guild) => guild.id === guildId);
  } catch {
    return false;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      authorization: {
        params: {
          scope: "identify guilds",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider === "discord") {
        const discordId = account.providerAccountId;
        const isGuildMember = await checkDiscordGuildMembership(
          account.access_token,
        );

        const savedUser = await prisma.user.upsert({
          where: {
            discordId,
          },
          update: {
            username: user.name || "Discord User",
            avatar: user.image || null,
            isGuildMember,
            lastGuildCheckAt: new Date(),
            lastLoginAt: new Date(),
          },
          create: {
            discordId,
            username: user.name || "Discord User",
            avatar: user.image || null,
            isGuildMember,
            lastGuildCheckAt: new Date(),
            lastLoginAt: new Date(),
          },
        });

        token.databaseId = savedUser.id;
        token.discordId = discordId;
        token.isGuildMember = savedUser.isGuildMember;
        token.isAdmin = adminDiscordIds.includes(discordId);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          typeof token.databaseId === "string" ? token.databaseId : "";

        session.user.databaseId =
          typeof token.databaseId === "string" ? token.databaseId : "";

        session.user.discordId =
          typeof token.discordId === "string" ? token.discordId : "";

        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.isGuildMember = Boolean(token.isGuildMember);
      }

      return session;
    },
  },
});
