import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { redirect } from "next/navigation";

import { GameProvider } from "@prisma/client";

import { unlinkRiotAccount, unlinkSteamAccount } from "@/actions/profileAccountActions";
import { auth } from "@/auth";
import Footer from "@/components/Footer";
import LinkedAccountRow from "@/components/LinkedAccountRow";
import Navbar from "@/components/Navbar";
import ProfileIdentityActions from "@/components/ProfileIdentityActions";
import ProfileNotice from "@/components/ProfileNotice";
import ProfileRealtime from "@/components/ProfileRealtime";
import ProfileTabs from "@/components/ProfileTabs";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

type SnapshotMember = {
  userId?: string;
  username?: string;
  discordId?: string;
};

type ProfileMessages = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    label: string;
    discordId: string;
    member: string;
    notMember: string;
    teams: string;
    team: string;
    points: string;
    invites: string;
    invite: string;
  };
  sections: {
    invitations: string;
    teamInvitations: string;
    pendingInvitation: string;
    pendingInvitations: string;
    noPendingInvitations: string;
    myTeams: string;
    teamOverview: string;
    noTeamsTitle: string;
    noTeamsDescription: string;
    createTeam: string;
    startNewTeam: string;
    createTeamMeta: string;
    discordRequiredMeta: string;
    progress: string;
    tournamentHistory: string;
    noTournamentResults: string;
  };
  labels: {
    by: string;
    members: string;
    member: string;
    leader: string;
    open: string;
    accept: string;
    decline: string;
    teamName: string;
    teamNamePlaceholder: string;
    game: string;
    selectGame: string;
    teamGame: string;
    createTeam: string;
    ascendraDiscordRequired: string;
    discordRequiredDescription: string;
    results: string;
    result: string;
    best: string;
    pts: string;
  };
  statuses: {
    active: string;
    pending: string;
    rejected: string;
    member: string;
    notMember: string;
  };
};

const profileMessages: Record<Locale, ProfileMessages> = {
  en: {
    metadata: {
      title: "Profile | Ascendra",
      description: "Manage your Ascendra profile, invitations, and teams.",
    },
    hero: {
      label: "Player profile",
      discordId: "Discord ID",
      member: "Member",
      notMember: "Not member",
      teams: "teams",
      team: "team",
      points: "points",
      invites: "invites",
      invite: "invite",
    },
    sections: {
      invitations: "Invitations",
      teamInvitations: "Team invitations",
      pendingInvitation: "pending invitation",
      pendingInvitations: "pending invitations",
      noPendingInvitations: "No pending invitations.",
      myTeams: "My teams",
      teamOverview: "Team overview",
      noTeamsTitle: "No teams yet",
      noTeamsDescription: "Create your first team from the section below.",
      createTeam: "Create team",
      startNewTeam: "Start a new team",
      createTeamMeta: "Create a team for a specific game.",
      discordRequiredMeta: "Discord membership required.",
      progress: "Progress",
      tournamentHistory: "Tournament history",
      noTournamentResults: "No tournament results yet.",
    },
    labels: {
      by: "by",
      members: "members",
      member: "member",
      leader: "Leader",
      open: "Open",
      accept: "Accept",
      decline: "Decline",
      teamName: "Team name",
      teamNamePlaceholder: "Example: Ascendra Wolves",
      game: "Game",
      selectGame: "Select game",
      teamGame: "Team game",
      createTeam: "Create team",
      ascendraDiscordRequired: "Ascendra Discord required",
      discordRequiredDescription:
        "Join the Discord server and refresh your login to create or join teams.",
      results: "Results",
      result: "result",
      best: "Best",
      pts: "pts",
    },
    statuses: {
      active: "Active",
      pending: "Pending",
      rejected: "Rejected",
      member: "Member",
      notMember: "Not member",
    },
  },

  ar: {
    metadata: {
      title: "الملف الشخصي | Ascendra",
      description: "إدارة ملفك في Ascendra والدعوات والفرق.",
    },
    hero: {
      label: "الملف الشخصي للاعب",
      discordId: "معرّف Discord",
      member: "عضو",
      notMember: "غير عضو",
      teams: "فرق",
      team: "فريق",
      points: "نقطة",
      invites: "دعوات",
      invite: "دعوة",
    },
    sections: {
      invitations: "الدعوات",
      teamInvitations: "دعوات الفرق",
      pendingInvitation: "دعوة معلقة",
      pendingInvitations: "دعوات معلقة",
      noPendingInvitations: "لا توجد دعوات معلقة.",
      myTeams: "فرقي",
      teamOverview: "نظرة عامة على الفرق",
      noTeamsTitle: "لا توجد فرق بعد",
      noTeamsDescription: "أنشئ فريقك الأول من القسم الموجود بالأسفل.",
      createTeam: "إنشاء فريق",
      startNewTeam: "بدء فريق جديد",
      createTeamMeta: "أنشئ فريقًا للعبة محددة.",
      discordRequiredMeta: "عضوية Discord مطلوبة.",
      progress: "التقدم",
      tournamentHistory: "سجل البطولات",
      noTournamentResults: "لا توجد نتائج بطولات حاليًا.",
    },
    labels: {
      by: "بواسطة",
      members: "أعضاء",
      member: "عضو",
      leader: "القائد",
      open: "فتح",
      accept: "قبول",
      decline: "رفض",
      teamName: "اسم الفريق",
      teamNamePlaceholder: "مثال: Ascendra Wolves",
      game: "اللعبة",
      selectGame: "اختر اللعبة",
      teamGame: "لعبة الفريق",
      createTeam: "إنشاء فريق",
      ascendraDiscordRequired: "Discord الخاص بـ Ascendra مطلوب",
      discordRequiredDescription:
        "انضم إلى خادم Discord ثم حدّث تسجيل الدخول لإنشاء الفرق أو الانضمام إليها.",
      results: "النتائج",
      result: "نتيجة",
      best: "أفضل مركز",
      pts: "نقطة",
    },
    statuses: {
      active: "نشط",
      pending: "قيد المراجعة",
      rejected: "مرفوض",
      member: "عضو",
      notMember: "غير عضو",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = profileMessages[locale].metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

function parseSnapshotMembers(snapshotMembers: unknown): SnapshotMember[] {
  if (!Array.isArray(snapshotMembers)) {
    return [];
  }

  return snapshotMembers
    .filter((member): member is Record<string, unknown> => {
      return Boolean(member) && typeof member === "object";
    })
    .map((member) => ({
      userId: typeof member.userId === "string" ? member.userId : undefined,
      username:
        typeof member.username === "string" ? member.username : undefined,
      discordId:
        typeof member.discordId === "string" ? member.discordId : undefined,
    }))
    .filter((member) => Boolean(member.userId));
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

function Avatar({
  username,
  avatar,
}: {
  username: string;
  avatar: string | null;
}) {
  const hue = getAvatarHue(username);
  const clipPath =
    "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)";

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={username}
        className="h-24 w-24 shrink-0 object-cover md:h-32 md:w-32"
        style={{
          clipPath,
          border: "1px solid var(--asc-line-soft)",
        }}
      />
    );
  }

  return (
    <div
      className="grid h-24 w-24 shrink-0 place-items-center md:h-32 md:w-32"
      style={{
        clipPath,
        background: `linear-gradient(135deg, oklch(0.55 0.22 ${hue}), oklch(0.30 0.16 ${
          hue + 40
        }))`,
        boxShadow: `inset 0 0 0 1px oklch(0.65 0.22 ${hue} / 0.4)`,
      }}
    >
      <span
        className="text-3xl font-black uppercase md:text-5xl"
        style={{
          color: "white",
          fontFamily: "var(--font-display)",
        }}
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
    ? {
        color: "var(--asc-green)",
        borderColor: "oklch(0.55 0.14 150 / 0.5)",
        background: "oklch(0.25 0.12 150 / 0.18)",
      }
    : {
        color: "var(--asc-fg-3)",
        borderColor: "var(--asc-line-soft)",
        background: "transparent",
      };

  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
      style={style}
    >
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
    <div>
      <p
        className="text-[10px] font-black uppercase tracking-[0.16em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
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

function StatCell({
  label,
  value,
  accent,
  isLast,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
  isLast?: boolean;
}) {
  return (
    <div
      className="flex flex-col justify-center px-5 py-4"
      style={{
        borderRight: isLast ? "none" : "1px solid var(--asc-line-soft)",
      }}
    >
      <p
        className="text-[10px] font-black uppercase tracking-[0.16em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {label}
      </p>

      <p
        className="mt-1 text-2xl font-black tabular-nums"
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

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const [params, locale, session] = await Promise.all([
    searchParams,
    getLocale(),
    auth(),
  ]);

  const messages = profileMessages[locale];

  if (!session?.user?.databaseId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.databaseId,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const [teams, invitations, allTournamentResults, dbGames, linkedAccounts] = await Promise.all(
    [
      prisma.team.findMany({
        where: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
        include: {
          game: {
            select: {
              name: true,
            },
          },
          members: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.teamInvite.findMany({
        where: {
          invitedUserId: user.id,
          status: "pending",
        },
        include: {
          team: {
            include: {
              game: {
                select: {
                  name: true,
                },
              },
              members: true,
            },
          },
          invitedBy: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.tournamentResult.findMany({
        select: {
          id: true,
          placement: true,
          points: true,
          note: true,
          awardedAt: true,
          snapshotTeamName: true,
          snapshotTeamGame: true,
          snapshotMembers: true,
          team: {
            select: {
              name: true,
              game: {
                select: {
                  name: true,
                },
              },
              members: {
                select: {
                  userId: true,
                },
              },
            },
          },
          tournament: {
            select: {
              id: true,
              title: true,
              game: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          awardedAt: "desc",
        },
      }),

      prisma.game.findMany({
        where: {
          isActive: true,
        },
        select: {
          slug: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),

      prisma.playerGameAccount.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          provider: true,
          externalId: true,
          displayName: true,
          verifiedAt: true,
        },
      }),
    ],
  );

  const tournamentResults = allTournamentResults.filter((result) => {
    const snapshotMembers = parseSnapshotMembers(result.snapshotMembers);

    const resultUserIds =
      snapshotMembers.length > 0
        ? snapshotMembers
            .map((member) => member.userId)
            .filter((memberUserId): memberUserId is string =>
              Boolean(memberUserId),
            )
        : result.team.members.map((member) => member.userId);

    return resultUserIds.includes(user.id);
  });

  const tournamentPoints = tournamentResults.reduce(
    (total, result) => total + result.points,
    0,
  );

  const bestPlacement =
    tournamentResults.length > 0
      ? Math.min(...tournamentResults.map((result) => result.placement))
      : null;

  const serializedResults = tournamentResults.map((result) => ({
    ...result,
    awardedAt: result.awardedAt.toISOString(),
  }));

  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[520px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/profile-hero.webp")',
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.30) 0%, oklch(0.07 0.025 285 / 0.64) 54%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, oklch(0.07 0.025 285 / 0.45) 40%, transparent 72%)",
              ].join(", "),
            }}
          />

          <div
            className="absolute inset-x-0 bottom-0 h-48"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--asc-bg-0))",
            }}
          />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-32 pt-24 lg:px-10">
            <ProfileNotice message={params.message} error={params.error} />
            <ProfileRealtime />

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

                    <h1
                      className="mt-3 truncate text-5xl md:text-7xl"
                      style={{ color: "var(--asc-fg-0)" }}
                    >
                      {user.username}
                    </h1>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <GuildBadge
                        isMember={user.isGuildMember}
                        memberLabel={messages.statuses.member}
                        notMemberLabel={messages.statuses.notMember}
                      />

                      <span
                        className="inline-flex border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
                        style={{
                          borderColor: "var(--asc-line-soft)",
                          color: "var(--asc-fg-3)",
                        }}
                      >
                        {tournamentResults.length} {messages.labels.results}
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

                  <ProfileIdentityActions discordId={user.discordId} />
                </div>
              </div>

              <div className="mt-10 grid gap-6 sm:grid-cols-3">
                <HeroStat
                  label={messages.hero.points}
                  value={tournamentPoints.toLocaleString()}
                  accent
                />

                <HeroStat
                  label={messages.labels.results}
                  value={tournamentResults.length}
                />

                <HeroStat
                  label={messages.labels.best}
                  value={bestPlacement ? `#${bestPlacement}` : "—"}
                />
              </div>
            </section>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto max-w-[1440px] px-6 pb-20 lg:px-10">
          <div
            className="relative overflow-hidden border"
            style={{
              borderColor: "var(--asc-line-soft)",
              background: "var(--asc-bg-1)",
              clipPath:
                "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
            }}
          >
            <CornerMark />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <StatCell
                label="PTS"
                value={tournamentPoints.toLocaleString()}
                accent
              />
              <StatCell
                label={messages.labels.results}
                value={tournamentResults.length}
              />
              <StatCell
                label={messages.labels.best}
                value={bestPlacement ? `#${bestPlacement}` : "—"}
              />
              <StatCell label={messages.hero.teams} value={teams.length} />
              <StatCell
                label={messages.hero.invites}
                value={invitations.length}
              />
              <StatCell
                label="Discord"
                value={
                  user.isGuildMember
                    ? messages.statuses.member
                    : messages.statuses.notMember
                }
                isLast
              />
            </div>
          </div>

          <div className="mt-10">
            <ProfileTabs
              tournamentResults={serializedResults}
              teams={teams.map((team) => ({
                id: team.id,
                name: team.name,
                status: team.status,
                leaderId: team.leaderId,
                rejectionReason: team.rejectionReason,
                game: team.game,
                members: team.members.map((member) => ({
                  userId: member.userId,
                  role: member.role,
                })),
              }))}
              invitations={invitations.map((invitation) => ({
                id: invitation.id,
                team: {
                  name: invitation.team.name,
                  game: invitation.team.game,
                  members: invitation.team.members.map((member) => ({
                    userId: member.userId,
                  })),
                },
                invitedBy: {
                  username: invitation.invitedBy.username,
                },
              }))}
              userId={user.id}
              isGuildMember={user.isGuildMember}
              dbGames={dbGames}
              labels={messages.labels}
              sectionLabels={messages.sections}
              statuses={messages.statuses}
              heroLabels={{
                team: messages.hero.team,
                teams: messages.hero.teams,
              }}
            />
          </div>

          {/* Connected Game Accounts */}
          <div className="mt-10">
            <div className="relative overflow-hidden border" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
              <CornerMark />
              <div className="border-b px-5 py-4" style={{ borderColor: "var(--asc-line-soft)" }}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>▲ Linked Accounts</p>
                <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Connected Game Accounts</h2>
              </div>

              <div className="grid gap-px" style={{ background: "var(--asc-line-soft)" }}>
                {/* Riot (League of Legends / VALORANT) */}
                {(() => {
                  const riotAccount = linkedAccounts.find(
                    (a: { provider: string }) => a.provider === GameProvider.riot_lol,
                  );
                  return (
                    <LinkedAccountRow
                      icon="R"
                      title="Riot Account"
                      subtitle="League of Legends · VALORANT"
                      connected={Boolean(riotAccount)}
                      displayName={
                        riotAccount?.displayName ??
                        (riotAccount ? riotAccount.externalId.slice(0, 8) + "…" : null)
                      }
                      linkedDate={
                        riotAccount?.verifiedAt
                          ? riotAccount.verifiedAt.toLocaleDateString("en", { dateStyle: "medium" })
                          : null
                      }
                      connectHref="/api/auth/riot/start"
                      unlinkAction={unlinkRiotAccount}
                    />
                  );
                })()}

                {/* Steam */}
                {(() => {
                  const steamAccount = linkedAccounts.find(
                    (a: { provider: string }) => a.provider === GameProvider.steam,
                  );
                  return (
                    <LinkedAccountRow
                      icon="S"
                      title="Steam Account"
                      subtitle="Dota 2 · CS2 · and more"
                      connected={Boolean(steamAccount)}
                      displayName={
                        steamAccount?.displayName ??
                        (steamAccount ? steamAccount.externalId.slice(0, 8) + "…" : null)
                      }
                      linkedDate={
                        steamAccount?.verifiedAt
                          ? steamAccount.verifiedAt.toLocaleDateString("en", { dateStyle: "medium" })
                          : null
                      }
                      connectHref="/api/auth/steam/start"
                      unlinkAction={unlinkSteamAccount}
                    />
                  );
                })()}
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
