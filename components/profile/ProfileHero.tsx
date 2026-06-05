import type { CSSProperties, ReactNode } from "react";

import ProfileIdentityActions from "@/components/ProfileIdentityActions";
import { CornerMark } from "@/components/profile/shared";
import type { ProfileMessages } from "@/lib/profile/profileMessages";

function Avatar({ username, avatar }: { username: string; avatar: string | null }) {
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt={username}
        className="asc-profile-avatar h-24 w-24 shrink-0 object-cover md:h-32 md:w-32"
      />
    );
  }

  return (
    <div
      className="asc-profile-avatar grid h-24 w-24 shrink-0 place-items-center md:h-32 md:w-32"
      style={{
        background:
          "linear-gradient(135deg, var(--asc-gold-bright), var(--asc-accent) 54%, var(--asc-bronze))",
      }}
    >
      <span
        className="text-3xl font-black uppercase md:text-5xl"
        style={{ color: "white", fontFamily: "var(--font-display)" }}
      >
        {username.slice(0, 2)}
      </span>
    </div>
  );
}

function GuildBadge({
  isMember,
  memberLabel,
  notMemberLabel,
}: {
  isMember: boolean;
  memberLabel: string;
  notMemberLabel: string;
}) {
  const style: CSSProperties = isMember
    ? { color: "var(--asc-green)", borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)" }
    : { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" };

  return (
    <span className="asc-profile-pill inline-flex w-fit border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]" style={style}>
      {isMember ? memberLabel : notMemberLabel}
    </span>
  );
}

function HeroStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="asc-profile-stat">
      <p className="asc-profile-stat__label">
        {label}
      </p>
      <p
        className={`asc-profile-stat__value tabular-nums${accent ? " asc-profile-stat__value--accent" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function ProfileHero({
  username,
  avatar,
  displayName,
  discordId,
  isGuildMember,
  resultsCount,
  rankingPoints,
  bestPlacement,
  messages,
}: {
  username: string;
  avatar: string | null;
  displayName: string;
  discordId: string;
  isGuildMember: boolean;
  resultsCount: number;
  rankingPoints: number;
  bestPlacement: number | null;
  messages: ProfileMessages;
}) {
  return (
    <section className="asc-image-hero asc-profile-hero relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url("/images/backgrounds/profile-hero.webp")' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: [
            "linear-gradient(180deg, rgb(var(--asc-scrim-rgb) / 0.30) 0%, rgb(var(--asc-scrim-rgb) / 0.64) 54%, var(--asc-bg-0) 100%)",
            "linear-gradient(90deg, var(--asc-bg-0) 0%, rgb(var(--asc-scrim-rgb) / 0.45) 40%, transparent 72%)",
          ].join(", "),
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-48"
        style={{ background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))" }}
      />

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 pb-24 pt-20 sm:px-6 md:pb-28 md:pt-24 lg:px-10">
        <section
          className="asc-profile-hero-panel relative mt-4 p-5 md:p-7"
        >
          <CornerMark />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-center">
              <Avatar username={username} avatar={avatar} />

              <div className="min-w-0">
                <p className="asc-profile-eyebrow">
                  {messages.hero.label}
                </p>

                <h1
                  className="mt-4 max-w-full break-words text-4xl leading-none sm:text-5xl md:text-7xl"
                  style={{ color: "var(--asc-fg-0)" }}
                >
                  {displayName}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <GuildBadge
                    isMember={isGuildMember}
                    memberLabel={messages.statuses.member}
                    notMemberLabel={messages.statuses.notMember}
                  />

                  <span
                    className="asc-profile-pill inline-flex border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
                    style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-3)" }}
                  >
                    {resultsCount} {messages.labels.results}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:justify-items-end">
              <p
                className="text-[10px] font-black uppercase tracking-[0.16em]"
                style={{ color: "var(--asc-fg-3)" }}
              >
                {messages.hero.discordId}
              </p>

              <ProfileIdentityActions discordId={discordId} />
            </div>
          </div>

          <div className="asc-profile-stat-rail asc-profile-stat-rail--hero mt-7 md:mt-8">
            <HeroStat label={messages.hero.points} value={rankingPoints.toLocaleString()} accent />
            <HeroStat label={messages.labels.results} value={resultsCount} />
            <HeroStat label={messages.labels.best} value={bestPlacement ? `#${bestPlacement}` : "—"} />
          </div>
        </section>
      </div>
    </section>
  );
}
