import type { ReactNode } from "react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfileRealtime from "@/components/ProfileRealtime";
import ProfileHero from "@/components/profile/ProfileHero";
import ProfileSubnav from "@/components/profile/ProfileSubnav";
import type { ProfileShellUser } from "@/lib/profile/profileData";
import type { ProfileMessages } from "@/lib/profile/profileMessages";

export default function ProfileShell({
  children,
  user,
  messages,
  dir,
  rankingPoints,
  resultsCount,
  bestPlacement,
  invitationCount,
  activeMatchesCount,
}: {
  children: ReactNode;
  user: ProfileShellUser;
  messages: ProfileMessages;
  dir: "ltr" | "rtl";
  rankingPoints: number;
  resultsCount: number;
  bestPlacement: number | null;
  invitationCount: number;
  activeMatchesCount: number;
}) {
  const displayName = user.displayName?.trim() || user.username;

  return (
    <main
      className="asc-public-page asc-ambient asc-profile-hub min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />
        <ProfileRealtime />

        <ProfileHero
          username={user.username}
          avatar={user.avatar}
          displayName={displayName}
          discordId={user.discordId}
          isGuildMember={user.isGuildMember}
          resultsCount={resultsCount}
          rankingPoints={rankingPoints}
          bestPlacement={bestPlacement}
          messages={messages}
        />

        <section className="asc-profile-stage relative z-20 -mt-8 mx-auto max-w-[1440px] px-4 pb-24 sm:px-6 lg:-mt-10 lg:px-10">
          <div className="grid gap-7 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-8">
            <ProfileSubnav
              labels={messages.tabLabels}
              invitationCount={invitationCount}
              activeMatchesCount={activeMatchesCount}
              dir={dir}
            />

            <div className="asc-profile-content min-w-0">{children}</div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
