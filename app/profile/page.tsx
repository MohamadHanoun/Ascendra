import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import Footer from "@/components/Footer";
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

function getCountLabel(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function Avatar({
  username,
  avatar,
}: {
  username: string;
  avatar: string | null;
}) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={username}
        className="h-20 w-20 shrink-0 object-cover"
      />
    );
  }

  return (
    <div
      className="grid h-20 w-20 shrink-0 place-items-center"
      style={{ border: "1px solid oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" }}
    >
      <span className="text-xl font-black uppercase" style={{ color: "var(--asc-accent)" }}>
        {username.slice(0, 2)}
      </span>
    </div>
  );
}

function StatCell({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div
      className="flex flex-col justify-center px-5 py-4"
      style={{ borderRight: "1px solid var(--asc-line-soft)" }}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-fg-3)" }}>{label}</p>
      <p
        className="mt-1 text-2xl font-black tabular-nums"
        style={{ color: accent ? "var(--asc-accent)" : "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {value}
      </p>
    </div>
  );
}

function GuildBadge({ isMember, memberLabel, notMemberLabel }: { isMember: boolean; memberLabel: string; notMemberLabel: string }) {
  const style: React.CSSProperties = isMember
    ? { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" }
    : { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" };
  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={style}>
      {isMember ? memberLabel : notMemberLabel}
    </span>
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

  const [teams, invitations, allTournamentResults, dbGames] = await Promise.all([
    prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        game: { select: { name: true } },
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
            game: { select: { name: true } },
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
            game: { select: { name: true } },
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
            game: { select: { name: true } },
          },
        },
      },
      orderBy: {
        awardedAt: "desc",
      },
    }),

    prisma.game.findMany({
      where: { isActive: true },
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

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

  const serializedResults = tournamentResults.map((r) => ({
    ...r,
    awardedAt: r.awardedAt.toISOString(),
  }));

  return (
    <main className="asc-ambient min-h-screen overflow-hidden text-white" style={{ background: "var(--asc-bg-0)" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-[380px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/images/backgrounds/profile-hero.webp")' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: [
              "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.35) 0%, oklch(0.07 0.025 285 / 0.60) 45%, var(--asc-bg-0) 100%)",
              "linear-gradient(90deg, var(--asc-bg-0) 0%, oklch(0.07 0.025 285 / 0.40) 35%, transparent 70%)",
            ].join(", "),
          }}
        />

        <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-16 pt-14 lg:px-10">
          <ProfileNotice message={params.message} error={params.error} />
          <ProfileRealtime />

          <section
            className="relative mt-4 overflow-hidden border p-6 shadow-2xl backdrop-blur"
            style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.09 0.035 287 / 0.75)" }}
          >
            <div aria-hidden="true" style={{ position: "absolute", top: -1, left: -1, width: 14, height: 14, borderTop: "1px solid var(--asc-accent)", borderLeft: "1px solid var(--asc-accent)", opacity: 0.6 }} />

            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                <Avatar username={user.username} avatar={user.avatar} />

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
                    {messages.hero.label}
                  </p>
                  <h1
                    className="mt-2 truncate text-4xl font-black uppercase tracking-tight md:text-5xl"
                    style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {user.username}
                  </h1>
                  <div className="mt-3">
                    <GuildBadge
                      isMember={user.isGuildMember}
                      memberLabel={messages.statuses.member}
                      notMemberLabel={messages.statuses.notMember}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2 lg:justify-items-end">
                <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-fg-3)" }}>
                  {messages.hero.discordId}
                </p>
                <ProfileIdentityActions discordId={user.discordId} />
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* ── Stat bar ── */}
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div
          className="relative overflow-hidden border"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", borderTop: "none" }}
        >
          <div className="grid grid-cols-3 md:grid-cols-6">
            <StatCell label="PTS" value={tournamentPoints.toLocaleString()} accent />
            <StatCell label={messages.labels.results} value={tournamentResults.length} />
            <StatCell label={messages.labels.best} value={bestPlacement ? `#${bestPlacement}` : "—"} />
            <StatCell label="Teams" value={teams.length} />
            <StatCell label="Invites" value={invitations.length} />
            <StatCell
              label="Discord"
              value={user.isGuildMember ? messages.statuses.member : messages.statuses.notMember}
            />
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
        <ProfileTabs
          tournamentResults={serializedResults}
          teams={teams.map((t) => ({
            id: t.id,
            name: t.name,
            status: t.status,
            leaderId: t.leaderId,
            rejectionReason: t.rejectionReason,
            game: t.game,
            members: t.members.map((m) => ({ userId: m.userId, role: m.role })),
          }))}
          invitations={invitations.map((inv) => ({
            id: inv.id,
            team: {
              name: inv.team.name,
              game: inv.team.game,
              members: inv.team.members.map((m) => ({ userId: m.userId })),
            },
            invitedBy: { username: inv.invitedBy.username },
          }))}
          userId={user.id}
          isGuildMember={user.isGuildMember}
          dbGames={dbGames}
          labels={messages.labels}
          sectionLabels={messages.sections}
          statuses={messages.statuses}
          heroLabels={{ team: messages.hero.team, teams: messages.hero.teams }}
        />
      </div>

      <Footer />
    </main>
  );
}
