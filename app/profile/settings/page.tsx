import { redirect } from "next/navigation";

import AccountPanel from "@/components/profile/AccountPanel";
import { getLocale } from "@/lib/i18nServer";
import {
  profileAccountUserSelect,
  profileGameSelect,
  profileLinkedAccountSelect,
  requireProfileUserId,
} from "@/lib/profile/profileData";
import { profileMessages } from "@/lib/profile/profileMessages";
import { prisma } from "@/lib/prisma";

export default async function ProfileSettingsPage() {
  const [locale, userId] = await Promise.all([
    getLocale(),
    requireProfileUserId(),
  ]);

  const [user, dbGames, linkedAccounts] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: profileAccountUserSelect,
    }),
    prisma.game.findMany({
      where: {
        isActive: true,
      },
      select: profileGameSelect,
      orderBy: {
        name: "asc",
      },
    }),
    prisma.playerGameAccount.findMany({
      where: {
        userId,
      },
      select: profileLinkedAccountSelect,
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <AccountPanel
      user={user}
      dbGames={dbGames}
      linkedAccounts={linkedAccounts}
      locale={locale}
      messages={profileMessages[locale]}
    />
  );
}
