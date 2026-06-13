import type { ReactNode } from "react";
import { GameProvider } from "@prisma/client";

import {
  connectFaceitAccount,
  unlinkFaceitAccount,
  unlinkRiotAccount,
  unlinkSteamAccount,
} from "@/actions/profileAccountActions";
import { signOut } from "@/auth";
import FaceitConnectRow from "@/components/FaceitConnectRow";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LinkedAccountRow from "@/components/LinkedAccountRow";
import PrivacyToggles from "@/components/PrivacyToggles";
import ProfileInfoForm from "@/components/ProfileInfoForm";
import PublicThemeToggle from "@/components/PublicThemeToggle";
import { CopyLinkButton } from "@/components/profile/CopyLinkButton";
import { Card } from "@/components/profile/shared";
import { getCountryOptions } from "@/lib/countries";
import { getDictionary, type Locale } from "@/lib/i18n";
import type {
  ProfileAccountUser,
  ProfileGame,
  ProfileLinkedAccount,
} from "@/lib/profile/profileData";
import type { ProfileMessages } from "@/lib/profile/profileMessages";

function getPrivacyToggleLabels(locale: Locale) {
  return locale === "ar"
    ? {
        masterTitle: "الملف العام مفعّل",
        masterDesc:
          "عند الإيقاف، لن يتمكن الآخرون من رؤية ملفك العام.",
        showDiscordId: "إظهار معرّف Discord",
        showTeams: "إظهار الفرق",
        showTournamentHistory: "إظهار سجل البطولات",
        save: "حفظ",
        saving: "جارٍ الحفظ...",
      }
    : {
        masterTitle: "Public profile enabled",
        masterDesc: "When off, other users cannot view your public profile.",
        showDiscordId: "Show Discord ID",
        showTeams: "Show teams",
        showTournamentHistory: "Show tournament history",
        save: "Save",
        saving: "Saving...",
      };
}

function getProfileInfoLabels(locale: Locale, username: string) {
  return locale === "ar"
    ? {
        title: "معلومات الملف الشخصي",
        description: "خصّص المعلومات التي تظهر في ملفك العام.",
        displayNameLabel: "الاسم المعروض",
        displayNamePlaceholder: username,
        displayNameHelp:
          "إذا تُرك فارغًا، سيُستخدم اسم Discord الخاص بك.",
        bioLabel: "نبذة",
        bioPlaceholder: "اكتب نبذة قصيرة عنك...",
        countryLabel: "الدولة",
        countryPlaceholder: "اختر دولتك",
        favoriteGameLabel: "اللعبة المفضلة",
        favoriteGamePlaceholder: "اختر لعبتك المفضلة",
        none: "بدون",
        save: "حفظ",
        saving: "جارٍ الحفظ...",
      }
    : {
        title: "Profile information",
        description: "Customize the information shown on your public profile.",
        displayNameLabel: "Display name",
        displayNamePlaceholder: username,
        displayNameHelp: "If left empty, your Discord username is used.",
        bioLabel: "Bio",
        bioPlaceholder: "Write a short bio about yourself...",
        countryLabel: "Country",
        countryPlaceholder: "Select your country",
        favoriteGameLabel: "Favorite game",
        favoriteGamePlaceholder: "Select your favorite game",
        none: "None",
        save: "Save",
        saving: "Saving...",
      };
}

function getInterfaceLabels(locale: Locale) {
  return locale === "ar"
    ? {
        copyLink: "نسخ رابط الملف",
        copied: "تم النسخ!",
        theme: "المظهر",
      }
    : {
        copyLink: "Copy profile link",
        copied: "Copied!",
        theme: "Theme",
      };
}

type SettingsNavItem = {
  href: string;
  label: string;
};

function SettingsSidebar({
  items,
  label,
}: {
  items: SettingsNavItem[];
  label: string;
}) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <nav
        aria-label={label}
        className="overflow-hidden border"
        style={{
          borderColor: "var(--asc-line-soft)",
          background: "var(--asc-bg-2)",
        }}
      >
        <div
          className="flex gap-px overflow-x-auto p-px lg:grid lg:overflow-visible"
          style={{ background: "var(--asc-line-soft)" }}
        >
          {items.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              className="flex min-h-12 min-w-[11rem] shrink-0 items-center justify-between gap-3 bg-[var(--asc-bg-1)] px-4 py-3 text-xs font-black uppercase tracking-[0.10em] transition hover:opacity-85 lg:min-w-0"
              style={{ color: "var(--asc-fg-2)" }}
            >
              <span className="truncate">{item.label}</span>
              <span
                className="tabular-nums"
                style={{ color: "var(--asc-accent)" }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            </a>
          ))}
        </div>
      </nav>
    </aside>
  );
}

function SettingsSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-3">
        <p className="asc-profile-eyebrow">{eyebrow}</p>
        <h2 className="asc-profile-section-title mt-2">{title}</h2>
        {description && (
          <p
            className="mt-2 max-w-3xl text-sm leading-6"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function AccountPanel({
  user,
  dbGames,
  linkedAccounts,
  locale,
  messages,
}: {
  user: ProfileAccountUser;
  dbGames: ProfileGame[];
  linkedAccounts: ProfileLinkedAccount[];
  locale: Locale;
  messages: ProfileMessages;
}) {
  const navDictionary = getDictionary(locale);
  const countryOptions = getCountryOptions(locale);
  const gameOptions = dbGames.map((game) => ({
    value: game.slug,
    label: game.name,
  }));
  const privacyToggleLabels = getPrivacyToggleLabels(locale);
  const profileInfoLabels = getProfileInfoLabels(locale, user.username);
  const interfaceLabels = getInterfaceLabels(locale);
  const riotAccount = linkedAccounts.find(
    (account) => account.provider === GameProvider.riot_lol,
  );
  const steamAccount = linkedAccounts.find(
    (account) => account.provider === GameProvider.steam,
  );
  const settingsNavItems: SettingsNavItem[] = [
    { href: "#general", label: profileInfoLabels.title },
    { href: "#connected-accounts", label: messages.labels.linkedAccounts },
    { href: "#privacy", label: messages.sections.privacyTitle },
    { href: "#preferences", label: messages.sections.preferencesTitle },
    { href: "#account", label: messages.tabLabels.account },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
        <SettingsSidebar
          items={settingsNavItems}
          label={messages.sections.accountTitle}
        />

        <div className="grid min-w-0 gap-8">
          <section id="general" className="scroll-mt-28">
            <ProfileInfoForm
              initial={{
                displayName: user.displayName ?? "",
                bio: user.bio ?? "",
                country: user.country ?? "",
                favoriteGame: user.favoriteGame ?? "",
              }}
              usernameFallback={user.username}
              countryOptions={countryOptions}
              gameOptions={gameOptions}
              labels={profileInfoLabels}
            />
          </section>

          <SettingsSection
            id="connected-accounts"
            eyebrow={messages.sections.accountTitle}
            title={messages.labels.linkedAccounts}
            description={messages.sections.connectedAccountsDesc}
          >
            <Card>
              <div className="grid gap-px" style={{ background: "var(--asc-line-soft)" }}>
                <div className="asc-profile-row flex flex-wrap items-center justify-between gap-4 bg-[var(--asc-bg-1)] px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center border text-xs font-black"
                      style={{
                        borderColor: "var(--asc-green-border)",
                        background: "var(--asc-green-bg)",
                        color: "var(--asc-green)",
                      }}
                    >
                      D
                    </div>
                    <div>
                      <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
                        {messages.sections.discordAccountTitle}
                      </p>
                      <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
                        {messages.sections.discordSubtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {user.isGuildMember && (
                      <span
                        className="asc-profile-pill border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.10em]"
                        style={{
                          borderColor: "var(--asc-green-border)",
                          background: "var(--asc-green-bg)",
                          color: "var(--asc-green)",
                        }}
                      >
                        {messages.statuses.member}
                      </span>
                    )}
                    <span
                      className="asc-profile-pill border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.10em]"
                      style={{
                        borderColor: "var(--asc-green-border)",
                        background: "var(--asc-green-bg)",
                        color: "var(--asc-green)",
                      }}
                    >
                      {messages.labels.connected}
                    </span>
                  </div>
                </div>

                <LinkedAccountRow
                  icon="R"
                  title={messages.labels.riotAccount}
                  providerName="Riot"
                  subtitle="League of Legends - VALORANT"
                  connected={Boolean(riotAccount)}
                  displayName={
                    riotAccount?.displayName ??
                    (riotAccount ? `${riotAccount.externalId.slice(0, 8)}...` : null)
                  }
                  linkedDate={
                    riotAccount?.verifiedAt
                      ? riotAccount.verifiedAt.toLocaleDateString(locale, {
                          dateStyle: "medium",
                        })
                      : null
                  }
                  connectHref="/api/auth/riot/start"
                  unlinkAction={unlinkRiotAccount}
                  labels={{
                    linked: messages.labels.linked,
                    connected: messages.labels.connected,
                    connect: messages.labels.connect,
                    unlink: messages.labels.unlink,
                    unlinking: messages.labels.unlinking,
                    confirmationEyebrow: messages.labels.confirmationEyebrow,
                    unlinkAccountConfirmTitle: messages.labels.unlinkAccountConfirmTitle,
                    unlinkAccountConfirmDescription:
                      messages.labels.unlinkAccountConfirmDescription,
                    unlinkAccountConfirmButton:
                      messages.labels.unlinkAccountConfirmButton,
                    cancel: messages.labels.cancelLabel,
                  }}
                />

                <LinkedAccountRow
                  icon="S"
                  title={messages.labels.steamAccount}
                  providerName="Steam"
                  subtitle={messages.labels.steamSubtitle}
                  connected={Boolean(steamAccount)}
                  displayName={
                    steamAccount?.displayName ??
                    (steamAccount ? `${steamAccount.externalId.slice(0, 8)}...` : null)
                  }
                  linkedDate={
                    steamAccount?.verifiedAt
                      ? steamAccount.verifiedAt.toLocaleDateString(locale, {
                          dateStyle: "medium",
                        })
                      : null
                  }
                  connectHref="/api/auth/steam/start"
                  unlinkAction={unlinkSteamAccount}
                  labels={{
                    linked: messages.labels.linked,
                    connected: messages.labels.connected,
                    connect: messages.labels.connect,
                    unlink: messages.labels.unlink,
                    unlinking: messages.labels.unlinking,
                    confirmationEyebrow: messages.labels.confirmationEyebrow,
                    unlinkAccountConfirmTitle: messages.labels.unlinkAccountConfirmTitle,
                    unlinkAccountConfirmDescription:
                      messages.labels.unlinkAccountConfirmDescription,
                    unlinkAccountConfirmButton:
                      messages.labels.unlinkAccountConfirmButton,
                    cancel: messages.labels.cancelLabel,
                  }}
                />

                <FaceitConnectRow
                  connected={Boolean(user.faceitPlayerId)}
                  faceitNickname={user.faceitNickname ?? null}
                  faceitSkillLevel={user.faceitSkillLevelCs2 ?? null}
                  faceitLinkedAt={
                    user.faceitLinkedAt
                      ? user.faceitLinkedAt.toLocaleDateString(locale, {
                          dateStyle: "medium",
                        })
                      : null
                  }
                  connectAction={connectFaceitAccount}
                  unlinkAction={unlinkFaceitAccount}
                  labels={{
                    title: messages.labels.faceitAccount,
                    subtitle: messages.labels.faceitSubtitle,
                    help: messages.labels.faceitHelp,
                    connectedHelp: messages.labels.faceitConnectedHelp,
                    connected: messages.labels.connected,
                    connect: messages.labels.connect,
                    connecting: messages.labels.faceitConnecting,
                    unlink: messages.labels.unlink,
                    unlinking: messages.labels.unlinking,
                    linked: messages.labels.linked,
                    skillLevel: messages.labels.faceitSkillLevel,
                    nicknamePlaceholder: messages.labels.faceitNicknamePlaceholder,
                    confirmationEyebrow: messages.labels.confirmationEyebrow,
                    unlinkAccountConfirmTitle: messages.labels.unlinkAccountConfirmTitle,
                    unlinkAccountConfirmDescription:
                      messages.labels.unlinkAccountConfirmDescription.replace(
                        "{provider}",
                        "FACEIT",
                      ),
                    unlinkAccountConfirmButton:
                      messages.labels.unlinkAccountConfirmButton,
                    cancel: messages.labels.cancelLabel,
                  }}
                />
              </div>
            </Card>
          </SettingsSection>

          <SettingsSection
            id="privacy"
            eyebrow={messages.sections.privacyTitle}
            title={messages.sections.privacyTitle}
            description={messages.sections.privacyDesc}
          >
            <PrivacyToggles
              initial={{
                publicProfileEnabled: user.publicProfileEnabled,
                showDiscordId: user.showDiscordId,
                showTeams: user.showTeams,
                showTournamentHistory: user.showTournamentHistory,
              }}
              labels={privacyToggleLabels}
            />
          </SettingsSection>

          <SettingsSection
            id="preferences"
            eyebrow={messages.sections.preferencesTitle}
            title={messages.sections.preferencesTitle}
            description={messages.sections.preferencesDesc}
          >
            <Card>
              <div className="grid gap-px" style={{ background: "var(--asc-line-soft)" }}>
                <div className="asc-profile-row flex flex-wrap items-center justify-between gap-3 bg-[var(--asc-bg-1)] px-5 py-4">
                  <p className="text-sm font-black" style={{ color: "var(--asc-fg-0)" }}>
                    {navDictionary.navbar.language.label}
                  </p>
                  <LanguageSwitcher
                    locale={locale}
                    labels={navDictionary.navbar.language}
                  />
                </div>
                <div className="asc-profile-row flex flex-wrap items-center justify-between gap-3 bg-[var(--asc-bg-1)] px-5 py-4">
                  <p className="text-sm font-black" style={{ color: "var(--asc-fg-0)" }}>
                    {interfaceLabels.theme}
                  </p>
                  <PublicThemeToggle />
                </div>
              </div>
            </Card>
          </SettingsSection>

          <SettingsSection
            id="account"
            eyebrow={messages.sections.securityTitle}
            title={messages.tabLabels.account}
            description={messages.sections.signOutDesc}
          >
            <Card>
              <div className="grid gap-px" style={{ background: "var(--asc-line-soft)" }}>
                <div className="asc-profile-row flex flex-wrap items-center justify-between gap-3 bg-[var(--asc-bg-1)] px-5 py-4">
                  <div>
                    <p className="text-sm font-black" style={{ color: "var(--asc-fg-0)" }}>
                      {interfaceLabels.copyLink}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--asc-fg-3)" }}>
                      /players/{user.id}
                    </p>
                  </div>
                  <CopyLinkButton
                    label={interfaceLabels.copyLink}
                    copiedLabel={interfaceLabels.copied}
                    path={`/players/${user.id}`}
                  />
                </div>

                <div className="asc-profile-row flex flex-wrap items-center justify-between gap-4 bg-[var(--asc-bg-1)] px-5 py-4">
                  <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
                    {messages.sections.signOutDesc}
                  </p>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button
                      type="submit"
                      className="asc-profile-action asc-profile-action--ghost px-5 py-2.5 text-sm tracking-[0.10em]"
                    >
                      {messages.labels.signOut}
                    </button>
                  </form>
                </div>
              </div>
            </Card>
          </SettingsSection>
        </div>
    </div>
  );
}
