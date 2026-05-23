import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createTeam, respondToTeamInvite } from "@/actions/teamActions";
import { auth } from "@/auth";
import CustomSelect from "@/components/CustomSelect";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfileIdentityActions from "@/components/ProfileIdentityActions";
import ProfileNotice from "@/components/ProfileNotice";
import ProfileRealtime from "@/components/ProfileRealtime";
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

function Pill({
  label,
  tone = "violet",
}: {
  label: string;
  tone?: "green" | "blue" | "red" | "gray" | "violet";
}) {
  const styles = {
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    blue: "border-blue-400/25 bg-blue-500/10 text-blue-300",
    red: "border-red-400/25 bg-red-500/10 text-red-300",
    gray: "border-white/10 bg-white/5 text-gray-300",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

function StatusBadge({
  status,
  messages,
}: {
  status: string;
  messages: ProfileMessages;
}) {
  const normalizedStatus = status.toLowerCase();

  const tone =
    normalizedStatus === "approved" || normalizedStatus === "member"
      ? "green"
      : normalizedStatus === "pending"
        ? "blue"
        : normalizedStatus === "rejected" || normalizedStatus === "not member"
          ? "red"
          : "gray";

  const labels: Record<string, string> = {
    approved: messages.statuses.active,
    pending: messages.statuses.pending,
    rejected: messages.statuses.rejected,
    member: messages.statuses.member,
    "not member": messages.statuses.notMember,
  };

  return <Pill label={labels[normalizedStatus] || status} tone={tone} />;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
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
        className="h-20 w-20 shrink-0 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-violet-400/25 bg-violet-500/10">
      <span className="text-xl font-black uppercase text-white">
        {username.slice(0, 2)}
      </span>
    </div>
  );
}

function CollapsibleSection({
  label,
  title,
  meta,
  children,
  defaultOpen = false,
}: {
  label: string;
  title: string;
  meta?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[0.035]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
            {label}
          </p>

          <h2 className="mt-1 text-xl font-black text-white">{title}</h2>

          {meta && <p className="mt-1 text-sm text-gray-500">{meta}</p>}
        </div>

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/25 text-lg font-black text-gray-300 transition group-open:rotate-45 group-hover:border-violet-400/30 group-hover:text-white">
          +
        </span>
      </summary>

      <div className="border-t border-white/10">{children}</div>
    </details>
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

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[400px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/profile-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.66)_48%,rgba(7,8,17,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-24 pt-14 lg:px-10">
            <ProfileNotice message={params.message} error={params.error} />
            <ProfileRealtime />

            <section className="mt-4 rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                  <Avatar username={user.username} avatar={user.avatar} />

                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                      {messages.hero.label}
                    </p>

                    <h1 className="mt-2 truncate text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
                      {user.username}
                    </h1>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {user.isGuildMember ? (
                        <StatusBadge status="Member" messages={messages} />
                      ) : (
                        <StatusBadge status="Not member" messages={messages} />
                      )}

                      <Pill
                        label={`${teams.length} ${getCountLabel(
                          teams.length,
                          messages.hero.team,
                          messages.hero.teams,
                        )}`}
                      />
                      <Pill
                        label={`${tournamentPoints} ${messages.hero.points}`}
                        tone="green"
                      />
                      <Pill
                        label={`${invitations.length} ${getCountLabel(
                          invitations.length,
                          messages.hero.invite,
                          messages.hero.invites,
                        )}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 lg:justify-items-end">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    {messages.hero.discordId}
                  </p>

                  <ProfileIdentityActions discordId={user.discordId} />
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="relative -mt-14 mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10">
          <div className="grid min-w-0 content-start gap-5">
            <CollapsibleSection
              label={messages.sections.invitations}
              title={messages.sections.teamInvitations}
              meta={`${invitations.length} ${getCountLabel(
                invitations.length,
                messages.sections.pendingInvitation,
                messages.sections.pendingInvitations,
              )}`}
              defaultOpen={invitations.length > 0}
            >
              {invitations.length === 0 ? (
                <div className="p-5 text-sm text-gray-400">
                  {messages.sections.noPendingInvitations}
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {invitations.map((invite) => (
                    <div
                      key={invite.id}
                      className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center"
                    >
                      <div>
                        <p className="font-black text-white">
                          {invite.team.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          {invite.team.game?.name ?? "—"} · {invite.team.members.length}{" "}
                          {getCountLabel(
                            invite.team.members.length,
                            messages.labels.member,
                            messages.labels.members,
                          )}{" "}
                          · {messages.labels.by} {invite.invitedBy.username}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <form action={respondToTeamInvite}>
                          <input
                            type="hidden"
                            name="inviteId"
                            value={invite.id}
                          />
                          <input
                            type="hidden"
                            name="response"
                            value="accepted"
                          />

                          <button
                            type="submit"
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-400"
                          >
                            {messages.labels.accept}
                          </button>
                        </form>

                        <form action={respondToTeamInvite}>
                          <input
                            type="hidden"
                            name="inviteId"
                            value={invite.id}
                          />
                          <input
                            type="hidden"
                            name="response"
                            value="rejected"
                          />

                          <button
                            type="submit"
                            className="rounded-xl border border-red-500/20 px-4 py-2 text-sm font-black text-red-300 transition hover:bg-red-500/10"
                          >
                            {messages.labels.decline}
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              label={messages.sections.myTeams}
              title={messages.sections.teamOverview}
              meta={`${teams.length} ${getCountLabel(
                teams.length,
                messages.hero.team,
                messages.hero.teams,
              )}`}
              defaultOpen
            >
              {teams.length === 0 ? (
                <div className="p-5">
                  <p className="font-black text-white">
                    {messages.sections.noTeamsTitle}
                  </p>
                  <p className="mt-2 text-sm text-gray-400">
                    {messages.sections.noTeamsDescription}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {teams.map((team) => {
                    const membership = team.members.find(
                      (member) => member.userId === user.id,
                    );

                    const isLeader = team.leaderId === user.id;

                    return (
                      <article
                        key={team.id}
                        className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035] md:grid-cols-[minmax(0,1fr)_130px_110px_90px] md:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-black text-white">
                            {team.name}
                          </p>

                          <p className="mt-1 text-sm text-gray-400">
                            {team.game?.name ?? "—"} · {team.members.length}{" "}
                            {getCountLabel(
                              team.members.length,
                              messages.labels.member,
                              messages.labels.members,
                            )}
                          </p>

                          {team.rejectionReason && (
                            <p className="mt-1 text-sm text-red-300">
                              {team.rejectionReason}
                            </p>
                          )}
                        </div>

                        <StatusBadge status={team.status} messages={messages} />

                        <p className="text-sm font-bold text-gray-400">
                          {isLeader
                            ? messages.labels.leader
                            : membership?.role || messages.statuses.member}
                        </p>

                        <Link
                          href={`/profile/teams/${team.id}`}
                          className="rounded-xl bg-violet-600 px-4 py-2 text-center text-sm font-black text-white transition hover:bg-violet-500"
                        >
                          {messages.labels.open}
                        </Link>
                      </article>
                    );
                  })}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              label={messages.sections.createTeam}
              title={messages.sections.startNewTeam}
              meta={
                user.isGuildMember
                  ? messages.sections.createTeamMeta
                  : messages.sections.discordRequiredMeta
              }
            >
              {user.isGuildMember ? (
                <form action={createTeam} className="grid gap-5 p-5">
                  <div className="relative z-50 grid gap-5 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-200">
                        {messages.labels.teamName}
                      </span>

                      <input
                        name="name"
                        required
                        placeholder={messages.labels.teamNamePlaceholder}
                        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-200">
                        {messages.labels.game}
                      </span>

                      <CustomSelect
                        name="gameSlug"
                        required
                        placeholder={messages.labels.selectGame}
                        options={dbGames.map((g) => ({
                          value: g.slug,
                          label: g.name,
                          description: messages.labels.teamGame,
                        }))}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-fit rounded-xl bg-violet-600 px-5 py-3 font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
                  >
                    {messages.labels.createTeam}
                  </button>
                </form>
              ) : (
                <div className="p-5">
                  <div className="rounded-2xl border border-violet-400/25 bg-violet-500/10 p-4">
                    <p className="font-black text-violet-200">
                      {messages.labels.ascendraDiscordRequired}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      {messages.labels.discordRequiredDescription}
                    </p>
                  </div>
                </div>
              )}
            </CollapsibleSection>
          </div>

          <aside>
            <CollapsibleSection
              label={messages.sections.progress}
              title={messages.sections.tournamentHistory}
              meta={`${tournamentResults.length} ${getCountLabel(
                tournamentResults.length,
                messages.labels.result,
                messages.labels.results,
              )} · ${tournamentPoints} ${messages.hero.points}`}
              defaultOpen
            >
              <div className="grid grid-cols-3 gap-5 border-b border-white/10 p-5">
                <Stat label={messages.hero.points} value={tournamentPoints} />
                <Stat
                  label={messages.labels.results}
                  value={tournamentResults.length}
                />
                <Stat
                  label={messages.labels.best}
                  value={bestPlacement ? `#${bestPlacement}` : "-"}
                />
              </div>

              {tournamentResults.length === 0 ? (
                <div className="p-5 text-sm text-gray-400">
                  {messages.sections.noTournamentResults}
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {tournamentResults.slice(0, 6).map((result) => {
                    const teamName =
                      result.snapshotTeamName || result.team.name;
                    const teamGame =
                      (result.snapshotTeamGame || result.team.game?.name) ?? null;

                    return (
                      <Link
                        key={result.id}
                        href={`/tournaments/${result.tournament.id}`}
                        className="block px-5 py-4 transition hover:bg-white/[0.035]"
                      >
                        <p className="truncate font-black text-white">
                          {result.tournament.title}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {teamName} · {teamGame}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Pill label={`#${result.placement}`} tone="blue" />
                          <Pill
                            label={`${result.points} ${messages.labels.pts}`}
                            tone="green"
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CollapsibleSection>
          </aside>
        </section>

        <Footer />
      </div>
    </main>
  );
}
