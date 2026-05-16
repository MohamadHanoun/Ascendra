import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      databaseId: string;
      discordId: string;
      isAdmin: boolean;
      isGuildMember: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    databaseId?: string;
    discordId?: string;
    isAdmin?: boolean;
    isGuildMember?: boolean;
  }
}

export {};
