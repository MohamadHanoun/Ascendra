import { AchievementsPanel } from "@/components/profile/AchievementsPanel";
import { getLocale } from "@/lib/i18nServer";
import { requireProfileUserId } from "@/lib/profile/profileData";
import { profileMessages } from "@/lib/profile/profileMessages";

export default async function ProfileAchievementsPage() {
  const [locale] = await Promise.all([
    getLocale(),
    requireProfileUserId(),
  ]);

  return (
    <AchievementsPanel sectionLabels={profileMessages[locale].sections} />
  );
}
