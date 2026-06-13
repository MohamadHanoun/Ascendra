import type { Metadata } from "next";
import { redirect } from "next/navigation";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfileNotice from "@/components/ProfileNotice";
import AccountPanel from "@/components/profile/AccountPanel";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import {
  profileAccountUserSelect,
  profileGameSelect,
  profileLinkedAccountSelect,
  requireProfileUserId,
} from "@/lib/profile/profileData";
import { profileMessages } from "@/lib/profile/profileMessages";
import { prisma } from "@/lib/prisma";

function getSettingsPageText(locale: Locale) {
  return locale === "ar"
    ? {
        title: "إعدادات الحساب",
        description:
          "إدارة ملفك الشخصي، والارتباطات، والخصوصية، والتفضيلات.",
      }
    : {
        title: "Account & Settings",
        description:
          "Manage your profile, connections, privacy, and preferences.",
      };
}

type ProfileSettingsPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const pageText = getSettingsPageText(locale);

  return {
    title: pageText.title,
    description: pageText.description,
  };
}

export default async function ProfileSettingsPage({
  searchParams,
}: ProfileSettingsPageProps) {
  const [params, locale, userId] = await Promise.all([
    searchParams,
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

  const messages = profileMessages[locale];
  const pageText = getSettingsPageText(locale);

  return (
    <main
      className="asc-public-page asc-ambient asc-profile-hub min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        <section
          aria-labelledby="profile-settings-title"
          className="relative mx-auto max-w-[1440px] px-4 pb-24 pt-24 sm:px-6 lg:px-10 lg:pt-28"
        >
          <div className="mb-10 grid max-w-4xl gap-3">
            <p className="asc-profile-eyebrow">
              {pageText.title}
            </p>
            <h1
              id="profile-settings-title"
              className="text-4xl font-black leading-none sm:text-5xl lg:text-6xl"
              style={{ color: "var(--asc-fg-0)" }}
            >
              {pageText.title}
            </h1>
            <p
              className="max-w-2xl text-base leading-7"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {pageText.description}
            </p>
          </div>

          <ProfileNotice message={params.message} error={params.error} />

          <AccountPanel
            user={user}
            dbGames={dbGames}
            linkedAccounts={linkedAccounts}
            locale={locale}
            messages={messages}
          />
        </section>

        <Footer />
      </div>
    </main>
  );
}
