import { ActiveMatchesPanel } from "@/components/profile/ActiveMatchesPanel";
import { getLocale } from "@/lib/i18nServer";
import { getActiveMatchesForUser } from "@/lib/playerMatchHub";
import { requireProfileUserId } from "@/lib/profile/profileData";
import { profileMessages } from "@/lib/profile/profileMessages";

export default async function ProfileMatchesPage() {
  const [locale, userId] = await Promise.all([
    getLocale(),
    requireProfileUserId(),
  ]);
  const activeMatches = await getActiveMatchesForUser(userId);
  const messages = profileMessages[locale];

  return (
    <ActiveMatchesPanel
      cards={activeMatches}
      messages={messages.activeMatches}
      locale={locale}
    />
  );
}
