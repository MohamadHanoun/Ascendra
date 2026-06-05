import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { CopyIdButton, PublicProgressChart } from "@/components/PublicProfileClient";
import { formatCountryLabel } from "@/lib/countries";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PublicProfilePageProps = {
  params: Promise<{ id: string }>;
};

type PublicMessages = {
  hero: {
    label: string;
    discordId: string;
    copy: string;
    copied: string;
    member: string;
    notMember: string;
  };
  stats: {
    points: string;
    results: string;
    best: string;
    teams: string;
  };
  progress: {
    eyebrow: string;
    title: string;
    description: string;
    empty: string;
  };
  history: {
    eyebrow: string;
    title: string;
    empty: string;
    colTournament: string;
    colTeam: string;
    colPlace: string;
    colPts: string;
    colDate: string;
    pts: string;
  };
  teams: {
    eyebrow: string;
    title: string;
    empty: string;
    members: string;
    member: string;
  };
  achievements: {
    eyebrow: string;
    title: string;
    comingSoon: string;
    comingSoonDesc: string;
  };
  notFoundTitle: string;
  notFoundDesc: string;
  backToLeaderboard: string;
  privateTitle: string;
  privateDesc: string;
};

const messagesByLocale: Record<Locale, PublicMessages> = {
  en: {
    hero: {
      label: "Player profile",
      discordId: "Discord ID",
      copy: "Copy",
      copied: "Copied",
      member: "Member",
      notMember: "Not member",
    },
    stats: {
      points: "Ranking points",
      results: "Results",
      best: "Best",
      teams: "Teams",
    },
    progress: {
      eyebrow: "PERFORMANCE",
      title: "PLAYER PROGRESS",
      description: "Cumulative ranking points earned over time.",
      empty: "No ranking points recorded yet.",
    },
    history: {
      eyebrow: "FULL RECORD",
      title: "TOURNAMENT HISTORY",
      empty: "No tournament results yet.",
      colTournament: "Tournament",
      colTeam: "Team",
      colPlace: "Place",
      colPts: "PTS",
      colDate: "Date",
      pts: "pts",
    },
    teams: {
      eyebrow: "ROSTER",
      title: "TEAMS",
      empty: "Not a member of any team yet.",
      members: "members",
      member: "member",
    },
    achievements: {
      eyebrow: "PLAYER ACHIEVEMENTS",
      title: "ACHIEVEMENTS",
      comingSoon: "COMING SOON",
      comingSoonDesc: "Achievements will be unlocked as this player competes in tournaments.",
    },
    notFoundTitle: "Player not found",
    notFoundDesc: "This player profile does not exist or is no longer available.",
    backToLeaderboard: "Back to leaderboard",
    privateTitle: "This profile is private",
    privateDesc: "This player has chosen to keep their public profile hidden.",
  },
  ar: {
    hero: {
      label: "الملف الشخصي للاعب",
      discordId: "معرّف Discord",
      copy: "نسخ",
      copied: "تم النسخ",
      member: "عضو",
      notMember: "غير عضو",
    },
    stats: {
      points: "نقاط التصنيف",
      results: "النتائج",
      best: "أفضل مركز",
      teams: "الفرق",
    },
    progress: {
      eyebrow: "الأداء",
      title: "تقدّم اللاعب",
      description: "إجمالي نقاط التصنيف المكتسبة عبر الوقت.",
      empty: "لا توجد نقاط تصنيف مسجلة بعد.",
    },
    history: {
      eyebrow: "السجل الكامل",
      title: "سجل البطولات",
      empty: "لا توجد نتائج بطولات بعد.",
      colTournament: "البطولة",
      colTeam: "الفريق",
      colPlace: "المركز",
      colPts: "النقاط",
      colDate: "التاريخ",
      pts: "نقطة",
    },
    teams: {
      eyebrow: "التشكيلة",
      title: "الفرق",
      empty: "ليس عضوًا في أي فريق بعد.",
      members: "أعضاء",
      member: "عضو",
    },
    achievements: {
      eyebrow: "إنجازات اللاعب",
      title: "الإنجازات",
      comingSoon: "قريبًا",
      comingSoonDesc: "ستُفتح الإنجازات مع مشاركة هذا اللاعب في البطولات.",
    },
    notFoundTitle: "لم يتم العثور على اللاعب",
    notFoundDesc: "هذا الملف الشخصي غير موجود أو لم يعد متاحًا.",
    backToLeaderboard: "العودة إلى المتصدرين",
    privateTitle: "هذا الملف الشخصي خاص",
    privateDesc: "اختار هذا اللاعب إبقاء ملفه العام مخفيًا.",
  },
};

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { username: true, displayName: true },
  });

  if (!user) {
    return { title: "Player profile" };
  }

  const name = user.displayName?.trim() || user.username;

  return {
    title: `${name} | Ascendra`,
    description: `View ${name}'s Ascendra player profile, ranking points, and tournament history.`,
  };
}

const avatarClipPath =
  "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)";

function getAvatarInitials(username: string) {
  const trimmed = username.trim();
  return (trimmed.slice(0, 2) || "?").toUpperCase();
}

function Avatar({ username, avatar }: { username: string; avatar: string | null }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={username}
        className="asc-profile-avatar h-24 w-24 shrink-0 object-cover md:h-32 md:w-32"
        style={{ clipPath: avatarClipPath, border: "1px solid var(--asc-line-soft)" }}
      />
    );
  }

  return (
    <div
      className="asc-profile-avatar grid h-24 w-24 shrink-0 place-items-center md:h-32 md:w-32"
      style={{
        clipPath: avatarClipPath,
        background:
          "linear-gradient(135deg, rgb(232 198 106 / 0.24), rgb(156 111 51 / 0.32)), linear-gradient(145deg, var(--asc-bg-2), var(--asc-bg-1))",
        boxShadow: "inset 0 0 0 1px var(--asc-accent-border), 0 18px 44px rgb(0 0 0 / 0.34)",
      }}
    >
      <span
        className="text-3xl font-black uppercase md:text-5xl"
        style={{ color: "var(--asc-gold-bright)", fontFamily: "var(--font-display)" }}
      >
        {getAvatarInitials(username)}
      </span>
    </div>
  );
}

type PillTone = "bronze" | "green" | "gray";

const pillToneStyles: Record<PillTone, CSSProperties> = {
  bronze: {
    color: "var(--asc-accent)",
    borderColor: "var(--asc-accent-border)",
    background: "var(--asc-accent-dim)",
  },
  green: {
    color: "var(--asc-green)",
    borderColor: "var(--asc-green-border)",
    background: "var(--asc-green-bg)",
  },
  gray: {
    color: "var(--asc-fg-2)",
    borderColor: "var(--asc-line-soft)",
    background: "rgb(255 255 255 / 0.025)",
  },
};

function Pill({ label, tone = "gray" }: { label: string; tone?: PillTone }) {
  return (
    <span
      className="asc-profile-pill inline-flex min-h-7 w-fit items-center border px-3 py-1 text-[10px] font-black tracking-[0.12em]"
      style={pillToneStyles[tone]}
    >
      {label}
    </span>
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
  return <Pill label={isMember ? memberLabel : notMemberLabel} tone={isMember ? "green" : "gray"} />;
}

function HeroStat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="asc-profile-stat">
      <p className="asc-profile-stat__label">{label}</p>
      <p className={`asc-profile-stat__value tabular-nums ${accent ? "asc-profile-stat__value--accent" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="asc-profile-card">
      <div className="asc-profile-card-header">
        <p className="asc-profile-eyebrow">
          {eyebrow}
        </p>
        <h2 className="asc-profile-section-title">{title}</h2>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="asc-profile-empty asc-profile-empty--inline">
      <span aria-hidden="true" className="asc-profile-empty__mark" />
      <p className="asc-profile-empty__text">{children}</p>
    </div>
  );
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const [{ id }, locale] = await Promise.all([params, getLocale()]);
  const messages = messagesByLocale[locale];

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      country: true,
      favoriteGame: true,
      avatar: true,
      role: true,
      discordId: true,
      isGuildMember: true,
      publicProfileEnabled: true,
      showDiscordId: true,
      showTeams: true,
      showTournamentHistory: true,
    },
  });

  if (!user) {
    notFound();
  }

  // Whole profile hidden — show a calm private state, skip all other queries.
  if (!user.publicProfileEnabled) {
    return (
      <main
        className="asc-public-page asc-profile-hub asc-ambient min-h-screen overflow-hidden"
        style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
      >
        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar />
          <section className="mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-center px-6 py-24 lg:px-10">
            <div className="asc-profile-card w-full max-w-md p-8 text-center">
              <div className="flex justify-center">
                <Avatar username={user.username} avatar={user.avatar} />
              </div>
              <h1 className="mt-6 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                {messages.privateTitle}
              </h1>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
                {messages.privateDesc}
              </p>
              <Link
                href="/leaderboard"
                className="asc-profile-action asc-profile-action--ghost mt-6 px-5 py-2.5 text-xs tracking-[0.10em]"
              >
                {messages.backToLeaderboard}
              </Link>
            </div>
          </section>
          <Footer />
        </div>
      </main>
    );
  }

  const [tournamentResults, teams, rankingPointsAgg, rawPointEvents, favoriteGameRecord] = await Promise.all([
    prisma.tournamentResult.findMany({
      where: { team: { members: { some: { userId: user.id } } } },
      select: {
        id: true,
        placement: true,
        points: true,
        awardedAt: true,
        snapshotTeamName: true,
        snapshotTeamGame: true,
        team: {
          select: {
            name: true,
            game: { select: { name: true } },
          },
        },
        tournament: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { awardedAt: "desc" },
    }),

    prisma.team.findMany({
      where: {
        status: "approved",
        members: { some: { userId: user.id } },
      },
      select: {
        id: true,
        name: true,
        game: { select: { name: true } },
        members: { select: { userId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.rankingPointEvent.aggregate({
      where: { userId: user.id },
      _sum: { points: true },
    }),

    prisma.rankingPointEvent.findMany({
      where: { userId: user.id },
      select: { points: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    // Resolve favoriteGame slug to an active game name; null if invalid/inactive.
    user.favoriteGame
      ? prisma.game.findFirst({
          where: { slug: user.favoriteGame, isActive: true },
          select: { name: true },
        })
      : Promise.resolve(null),
  ]);

  const rankingPoints = rankingPointsAgg._sum.points ?? 0;

  const bestPlacement =
    tournamentResults.length > 0
      ? Math.min(...tournamentResults.map((result) => result.placement))
      : null;

  const chartData = rawPointEvents.map((event, index) => {
    const cumulative = rawPointEvents.slice(0, index + 1).reduce((sum, e) => sum + e.points, 0);
    return {
      name: event.createdAt.toLocaleDateString("en-GB", { month: "short", day: "2-digit" }),
      points: cumulative,
    };
  });

  const displayName = user.displayName?.trim() || user.username;
  const countryLabel = formatCountryLabel(user.country, locale);
  const favoriteGameName = favoriteGameRecord?.name ?? null;

  return (
    <main
      className="asc-public-page asc-profile-hub asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="asc-image-hero relative min-h-[520px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url("/images/backgrounds/profile-hero.webp")' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, rgb(12 11 9 / 0.30) 0%, rgb(12 11 9 / 0.64) 54%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, rgb(12 11 9 / 0.45) 40%, transparent 72%)",
              ].join(", "),
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-48"
            style={{ background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))" }}
          />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-32 pt-24 lg:px-10">
            <section className="asc-profile-hero-panel mt-4 p-6 md:p-8">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-center">
                  <Avatar username={user.username} avatar={user.avatar} />

                  <div className="min-w-0">
                    <p className="asc-profile-eyebrow">{messages.hero.label}</p>

                    <h1
                      className="mt-4 break-words text-4xl sm:text-5xl md:text-7xl"
                      style={{ color: "var(--asc-fg-0)" }}
                    >
                      {displayName}
                    </h1>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <GuildBadge
                        isMember={user.isGuildMember}
                        memberLabel={messages.hero.member}
                        notMemberLabel={messages.hero.notMember}
                      />
                      <Pill label={user.role} />
                      {countryLabel && (
                        <Pill label={countryLabel} />
                      )}
                      {favoriteGameName && (
                        <Pill label={favoriteGameName} tone="bronze" />
                      )}
                    </div>

                    {user.bio && (
                      <p
                        className="mt-4 max-w-prose whitespace-pre-line text-sm leading-6"
                        style={{ color: "var(--asc-fg-2)" }}
                      >
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Discord ID — calm profile identifier, gated by showDiscordId */}
                {user.showDiscordId && (
                <div className="grid gap-2 lg:justify-items-end">
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.16em]"
                    style={{ color: "var(--asc-fg-3)" }}
                  >
                    {messages.hero.discordId}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <code
                      className="border px-3 py-1.5 text-sm font-bold"
                      style={{
                        borderColor: "var(--asc-line-soft)",
                        background: "var(--asc-bg-2)",
                        color: "var(--asc-fg-1)",
                      }}
                    >
                      {user.discordId}
                    </code>
                    <CopyIdButton
                      value={user.discordId}
                      copyLabel={messages.hero.copy}
                      copiedLabel={messages.hero.copied}
                    />
                  </div>
                </div>
                )}
              </div>

              <div className="asc-profile-stat-rail asc-profile-stat-rail--4 mt-10">
                <HeroStat label={messages.stats.points} value={rankingPoints.toLocaleString()} accent />
                <HeroStat label={messages.stats.results} value={tournamentResults.length} />
                <HeroStat label={messages.stats.best} value={bestPlacement ? `#${bestPlacement}` : "—"} />
                <HeroStat label={messages.stats.teams} value={teams.length} />
              </div>
            </section>
          </div>
        </section>

        {/* Content */}
        <section className="relative z-20 -mt-16 mx-auto max-w-[1440px] px-6 pb-20 lg:px-10">
          <div className="grid gap-10">
            {/* Player Progress — gated by showTournamentHistory */}
            {user.showTournamentHistory && (
            <SectionCard
              eyebrow={messages.progress.eyebrow}
              title={messages.progress.title}
              description={messages.progress.description}
            >
              <div className="p-5">
                {chartData.length === 0 ? (
                  <EmptyState>{messages.progress.empty}</EmptyState>
                ) : (
                  <PublicProgressChart data={chartData} ptsLabel={messages.history.colPts} />
                )}
              </div>
            </SectionCard>
            )}

            {/* Tournament History — gated by showTournamentHistory */}
            {user.showTournamentHistory && (
            <SectionCard eyebrow={messages.history.eyebrow} title={messages.history.title}>
              {tournamentResults.length === 0 ? (
                <EmptyState>{messages.history.empty}</EmptyState>
              ) : (
                <>
                  <div
                    className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] md:grid md:grid-cols-[minmax(0,1fr)_130px_80px_80px_110px]"
                    style={{
                      borderBottom: "1px solid var(--asc-line-soft)",
                      background: "var(--asc-bg-2)",
                      color: "var(--asc-fg-3)",
                    }}
                  >
                    <span>{messages.history.colTournament}</span>
                    <span>{messages.history.colTeam}</span>
                    <span>{messages.history.colPlace}</span>
                    <span>{messages.history.colPts}</span>
                    <span>{messages.history.colDate}</span>
                  </div>
                  {tournamentResults.map((result) => {
                    const teamName = result.snapshotTeamName ?? result.team.name;
                    const gameName = result.snapshotTeamGame ?? result.team.game?.name ?? "—";
                    const date = new Date(result.awardedAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    });
                    return (
                      <Link
                        key={result.id}
                        href={`/tournaments/${result.tournament.id}`}
                        className="asc-profile-row grid gap-2 px-5 py-4 md:grid-cols-[minmax(0,1fr)_130px_80px_80px_110px] md:items-center"
                        style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black" style={{ color: "var(--asc-fg-0)" }}>
                            {result.tournament.title}
                          </p>
                          <p className="mt-0.5 text-xs" style={{ color: "var(--asc-fg-3)" }}>
                            {gameName}
                          </p>
                        </div>
                        <p className="truncate text-sm" style={{ color: "var(--asc-fg-2)" }}>
                          {teamName}
                        </p>
                        <Pill label={`#${result.placement}`} tone="bronze" />
                        <Pill label={`${result.points} ${messages.history.pts}`} tone="green" />
                        <p className="text-xs tabular-nums" style={{ color: "var(--asc-fg-3)" }}>
                          {date}
                        </p>
                      </Link>
                    );
                  })}
                </>
              )}
            </SectionCard>
            )}

            {/* Teams (read-only) — gated by showTeams */}
            {user.showTeams && (
            <SectionCard eyebrow={messages.teams.eyebrow} title={messages.teams.title}>
              {teams.length === 0 ? (
                <EmptyState>{messages.teams.empty}</EmptyState>
              ) : (
                <div className="grid gap-4 p-5 md:grid-cols-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="asc-profile-team-card p-5"
                    >
                      <p
                        className="truncate text-lg font-black"
                        style={{ color: "var(--asc-fg-0)", fontFamily: "var(--font-display)" }}
                      >
                        {team.name}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--asc-fg-3)" }}>
                        {team.game?.name ?? "—"} · {team.members.length}{" "}
                        {team.members.length === 1 ? messages.teams.member : messages.teams.members}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
            )}

            {/* Achievements — Coming Soon */}
            <SectionCard eyebrow={messages.achievements.eyebrow} title={messages.achievements.title}>
              <div className="asc-profile-empty asc-profile-empty--inline">
                <span aria-hidden="true" className="asc-profile-empty__mark" />
                <p className="asc-profile-empty__title" style={{ color: "var(--asc-fg-3)", opacity: 0.72 }}>
                  {messages.achievements.comingSoon}
                </p>
                <p className="asc-profile-empty__text">{messages.achievements.comingSoonDesc}</p>
              </div>
            </SectionCard>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
