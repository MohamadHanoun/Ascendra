import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { CopyIdButton, PublicProgressChart } from "@/components/PublicProfileClient";
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
    select: { username: true },
  });

  if (!user) {
    return { title: "Player profile" };
  }

  return {
    title: `${user.username} | Ascendra`,
    description: `View ${user.username}'s Ascendra player profile, ranking points, and tournament history.`,
  };
}

function getAvatarHue(username: string) {
  let hue = 0;
  for (const character of username) {
    hue = (hue << 5) - hue + character.charCodeAt(0);
  }
  return Math.abs(hue) % 360;
}

function CornerMark() {
  return (
    <div
      aria-hidden="true"
      className="asc-corner-mark"
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        width: 12,
        height: 12,
        borderTop: "1.5px solid var(--asc-accent)",
        borderLeft: "1.5px solid var(--asc-accent)",
        opacity: 0.9,
        pointerEvents: "none",
        zIndex: 30,
      }}
    />
  );
}

function Avatar({ username, avatar }: { username: string; avatar: string | null }) {
  const hue = getAvatarHue(username);
  const clipPath =
    "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)";

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={username}
        className="h-24 w-24 shrink-0 object-cover md:h-32 md:w-32"
        style={{ clipPath, border: "1px solid var(--asc-line-soft)" }}
      />
    );
  }

  return (
    <div
      className="grid h-24 w-24 shrink-0 place-items-center md:h-32 md:w-32"
      style={{
        clipPath,
        background: `linear-gradient(135deg, oklch(0.55 0.22 ${hue}), oklch(0.30 0.16 ${hue + 40}))`,
        boxShadow: `inset 0 0 0 1px oklch(0.65 0.22 ${hue} / 0.4)`,
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
    <span
      className="inline-flex w-fit border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
      style={style}
    >
      {isMember ? memberLabel : notMemberLabel}
    </span>
  );
}

function HeroStat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </p>
      <p
        className="mt-1 text-4xl font-black tabular-nums md:text-5xl"
        style={{
          color: accent ? "var(--asc-accent)" : "var(--asc-fg-0)",
          fontFamily: "var(--font-display)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Pill({ label, tone }: { label: string; tone: "blue" | "green" }) {
  const styleMap: Record<string, CSSProperties> = {
    blue: { color: "var(--asc-blue)", borderColor: "var(--asc-blue-border)", background: "var(--asc-blue-bg)" },
    green: { color: "var(--asc-green)", borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)" },
  };
  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={styleMap[tone]}>
      {label}
    </span>
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
    <div
      className="relative overflow-hidden border"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <CornerMark />
      <div className="border-b px-5 py-4" style={{ borderColor: "var(--asc-line-soft)" }}>
        <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
          ▲ {eyebrow}
        </p>
        <h2
          className="mt-1 text-xl font-black uppercase"
          style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
            {description}
          </p>
        )}
      </div>
      {children}
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
        className="asc-public-page asc-ambient min-h-screen overflow-hidden"
        style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
      >
        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar />
          <section className="mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-center px-6 py-24 lg:px-10">
            <div
              className="relative w-full max-w-md border p-8 text-center"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
                clipPath:
                  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
              }}
            >
              <CornerMark />
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
                className="mt-6 inline-flex border px-5 py-2.5 text-xs font-black uppercase tracking-[0.10em] transition hover:opacity-80"
                style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-2)", background: "transparent" }}
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

  const [tournamentResults, teams, rankingPointsAgg, rawPointEvents] = await Promise.all([
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

  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
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
            <section
              className="relative mt-4 overflow-hidden border p-6 shadow-2xl shadow-black/20 md:p-8"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-card)",
                backdropFilter: "blur(16px)",
                clipPath:
                  "polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)",
              }}
            >
              <CornerMark />

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-center">
                  <Avatar username={user.username} avatar={user.avatar} />

                  <div className="min-w-0">
                    <p
                      className="text-xs font-black uppercase tracking-[0.2em]"
                      style={{ color: "var(--asc-accent)" }}
                    >
                      ▲ {messages.hero.label}
                    </p>

                    <h1 className="mt-3 truncate text-5xl md:text-7xl" style={{ color: "var(--asc-fg-0)" }}>
                      {user.username}
                    </h1>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <GuildBadge
                        isMember={user.isGuildMember}
                        memberLabel={messages.hero.member}
                        notMemberLabel={messages.hero.notMember}
                      />
                      <span
                        className="inline-flex border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
                        style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-3)" }}
                      >
                        {user.role}
                      </span>
                    </div>
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

              <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
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
                  <p className="py-8 text-center text-sm" style={{ color: "var(--asc-fg-3)" }}>
                    {messages.progress.empty}
                  </p>
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
                <p className="p-5 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                  {messages.history.empty}
                </p>
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
                        className="grid gap-2 px-5 py-4 transition hover:bg-white/[0.02] md:grid-cols-[minmax(0,1fr)_130px_80px_80px_110px] md:items-center"
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
                        <Pill label={`#${result.placement}`} tone="blue" />
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
                <p className="p-5 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                  {messages.teams.empty}
                </p>
              ) : (
                <div className="grid md:grid-cols-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="border-b p-5 md:odd:border-r"
                      style={{ borderColor: "var(--asc-line-soft)" }}
                    >
                      <p
                        className="truncate font-black"
                        style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18 }}
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
              <div className="px-6 py-14 text-center">
                <p
                  className="text-xs font-black uppercase tracking-[0.18em]"
                  style={{ color: "var(--asc-fg-3)", opacity: 0.45 }}
                >
                  {messages.achievements.comingSoon}
                </p>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
                  {messages.achievements.comingSoonDesc}
                </p>
              </div>
            </SectionCard>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
