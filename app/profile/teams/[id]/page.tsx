import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  cancelTeamInviteInline,
  deleteTeamInline,
  invitePlayerToTeamInline,
  leaveTeamInline,
  removeTeamMemberInline,
  transferTeamLeadershipInline,
  updateTeamInline,
} from "@/actions/teamInlineActions";
import { auth } from "@/auth";
import CustomSelect from "@/components/CustomSelect";
import Footer from "@/components/Footer";
import InlineTeamActionForm from "@/components/InlineTeamActionForm";
import Navbar from "@/components/Navbar";
import ProfileNotice from "@/components/ProfileNotice";
import ProfileRealtime from "@/components/ProfileRealtime";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";
import { getGameImageUrl } from "@/lib/tournamentImages";

export const dynamic = "force-dynamic";

type TeamDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

type TeamPageMessages = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    backToProfile: string;
    label: string;
    lockedWhileRegistered: string;
  };
  common: {
    member: string;
    members: string;
    invite: string;
    invites: string;
    pendingInvite: string;
    pendingInvites: string;
    points: string;
    pts: string;
    results: string;
    result: string;
    best: string;
    leader: string;
    active: string;
    pending: string;
    invited: string;
    locked: string;
    rejected: string;
    open: string;
    dash: string;
  };
  sections: {
    settings: string;
    teamSetup: string;
    lockedSettingsMeta: string;
    leaderSettingsMeta: string;
    memberSettingsMeta: string;
    invitePlayer: string;
    history: string;
    tournamentResults: string;
    roster: string;
    playersAndInvites: string;
  };
  settings: {
    saveChanges: string;
    saving: string;
    teamName: string;
    game: string;
    selectGame: string;
    teamGame: string;
    lockedDescription: string;
    onlyLeaderDescription: string;
    usernameOrDiscordId: string;
    playerPlaceholder: string;
    sendInvite: string;
    sending: string;
    leaveTeam: string;
    leaving: string;
    leaveTeamTitle: string;
    leaveTeamDescription: string;
    leaveTeamConfirm: string;
    deleteTeam: string;
    deleting: string;
    deleteTeamTitle: string;
    deleteTeamDescription: string;
    deleteTeamConfirm: string;
  };
  history: {
    noResults: string;
  };
  roster: {
    makeLeader: string;
    transferring: string;
    transferTitle: string;
    transferDescription: string;
    transferConfirm: string;
    remove: string;
    removing: string;
    removeTitle: string;
    removeDescription: string;
    removeConfirm: string;
    cancel: string;
    cancelling: string;
    cancelInviteTitle: string;
    cancelInviteDescription: string;
    cancelInviteConfirm: string;
    noPlayers: string;
  };
  modal: {
    confirmation: string;
    confirmAction: string;
    cancel: string;
  };
};

const teamPageMessages: Record<Locale, TeamPageMessages> = {
  en: {
    metadata: {
      title: "Manage Team | Ascendra",
      description: "Manage your Ascendra team.",
    },
    hero: {
      backToProfile: "Back to profile",
      label: "Team management",
      lockedWhileRegistered: "Locked while registered for",
    },
    common: {
      member: "member",
      members: "members",
      invite: "invite",
      invites: "invites",
      pendingInvite: "pending invite",
      pendingInvites: "pending invites",
      points: "points",
      pts: "pts",
      results: "Results",
      result: "result",
      best: "Best",
      leader: "Leader",
      active: "Active",
      pending: "Pending",
      invited: "Invited",
      locked: "Locked",
      rejected: "Rejected",
      open: "Open",
      dash: "—",
    },
    sections: {
      settings: "Settings",
      teamSetup: "Team setup",
      lockedSettingsMeta: "Locked while registered in an active tournament.",
      leaderSettingsMeta: "Edit team name, game, invites, and team actions.",
      memberSettingsMeta: "Only the leader can edit team settings.",
      invitePlayer: "Invite player",
      history: "History",
      tournamentResults: "Tournament results",
      roster: "Roster",
      playersAndInvites: "Players and invites",
    },
    settings: {
      saveChanges: "Save changes",
      saving: "Saving...",
      teamName: "Team name",
      game: "Game",
      selectGame: "Select game",
      teamGame: "Team game",
      lockedDescription:
        "Settings are locked while this team is registered in an active tournament. They unlock after the tournament ends or the registration is cancelled.",
      onlyLeaderDescription: "Only the team leader can edit settings.",
      usernameOrDiscordId: "Username or Discord ID",
      playerPlaceholder: "Example: AscendraPlayer or 615...",
      sendInvite: "Send invite",
      sending: "Sending...",
      leaveTeam: "Leave team",
      leaving: "Leaving...",
      leaveTeamTitle: "Leave team?",
      leaveTeamDescription: "Are you sure you want to leave {teamName}?",
      leaveTeamConfirm: "Leave team",
      deleteTeam: "Delete team",
      deleting: "Deleting...",
      deleteTeamTitle: "Delete team?",
      deleteTeamDescription:
        "Are you sure you want to delete {teamName}? This cannot be undone.",
      deleteTeamConfirm: "Delete permanently",
    },
    history: {
      noResults: "No tournament results yet.",
    },
    roster: {
      makeLeader: "Make leader",
      transferring: "Transferring...",
      transferTitle: "Transfer leadership?",
      transferDescription: "Make {username} the new team leader?",
      transferConfirm: "Transfer",
      remove: "Remove",
      removing: "Removing...",
      removeTitle: "Remove player?",
      removeDescription: "Remove {username} from this team?",
      removeConfirm: "Remove",
      cancel: "Cancel",
      cancelling: "Cancelling...",
      cancelInviteTitle: "Cancel invitation?",
      cancelInviteDescription: "Cancel the invitation sent to {username}?",
      cancelInviteConfirm: "Cancel invite",
      noPlayers: "No players in this team yet.",
    },
    modal: {
      confirmation: "Confirmation",
      confirmAction: "Confirm action",
      cancel: "Cancel",
    },
  },

  ar: {
    metadata: {
      title: "إدارة الفريق | Ascendra",
      description: "إدارة فريقك في Ascendra.",
    },
    hero: {
      backToProfile: "العودة إلى الملف الشخصي",
      label: "إدارة الفريق",
      lockedWhileRegistered: "مقفل أثناء التسجيل في",
    },
    common: {
      member: "عضو",
      members: "أعضاء",
      invite: "دعوة",
      invites: "دعوات",
      pendingInvite: "دعوة معلقة",
      pendingInvites: "دعوات معلقة",
      points: "نقطة",
      pts: "نقطة",
      results: "النتائج",
      result: "نتيجة",
      best: "أفضل مركز",
      leader: "القائد",
      active: "نشط",
      pending: "قيد المراجعة",
      invited: "تمت الدعوة",
      locked: "مقفل",
      rejected: "مرفوض",
      open: "فتح",
      dash: "—",
    },
    sections: {
      settings: "الإعدادات",
      teamSetup: "إعداد الفريق",
      lockedSettingsMeta: "مقفل أثناء تسجيل الفريق في بطولة نشطة.",
      leaderSettingsMeta: "تعديل اسم الفريق واللعبة والدعوات وإجراءات الفريق.",
      memberSettingsMeta: "يمكن لقائد الفريق فقط تعديل الإعدادات.",
      invitePlayer: "دعوة لاعب",
      history: "السجل",
      tournamentResults: "نتائج البطولات",
      roster: "القائمة",
      playersAndInvites: "اللاعبون والدعوات",
    },
    settings: {
      saveChanges: "حفظ التغييرات",
      saving: "جارٍ الحفظ...",
      teamName: "اسم الفريق",
      game: "اللعبة",
      selectGame: "اختر اللعبة",
      teamGame: "لعبة الفريق",
      lockedDescription:
        "إعدادات الفريق مقفلة أثناء تسجيله في بطولة نشطة. سيتم فتحها بعد انتهاء البطولة أو إلغاء التسجيل.",
      onlyLeaderDescription: "يمكن لقائد الفريق فقط تعديل الإعدادات.",
      usernameOrDiscordId: "اسم المستخدم أو معرّف Discord",
      playerPlaceholder: "مثال: AscendraPlayer أو 615...",
      sendInvite: "إرسال الدعوة",
      sending: "جارٍ الإرسال...",
      leaveTeam: "مغادرة الفريق",
      leaving: "جارٍ المغادرة...",
      leaveTeamTitle: "مغادرة الفريق؟",
      leaveTeamDescription: "هل أنت متأكد أنك تريد مغادرة فريق {teamName}؟",
      leaveTeamConfirm: "مغادرة الفريق",
      deleteTeam: "حذف الفريق",
      deleting: "جارٍ الحذف...",
      deleteTeamTitle: "حذف الفريق؟",
      deleteTeamDescription:
        "هل أنت متأكد أنك تريد حذف فريق {teamName}؟ لا يمكن التراجع عن هذا الإجراء.",
      deleteTeamConfirm: "حذف نهائي",
    },
    history: {
      noResults: "لا توجد نتائج بطولات حاليًا.",
    },
    roster: {
      makeLeader: "جعله قائدًا",
      transferring: "جارٍ نقل القيادة...",
      transferTitle: "نقل قيادة الفريق؟",
      transferDescription: "هل تريد جعل {username} القائد الجديد للفريق؟",
      transferConfirm: "نقل القيادة",
      remove: "إزالة",
      removing: "جارٍ الإزالة...",
      removeTitle: "إزالة اللاعب؟",
      removeDescription: "هل تريد إزالة {username} من هذا الفريق؟",
      removeConfirm: "إزالة",
      cancel: "إلغاء",
      cancelling: "جارٍ الإلغاء...",
      cancelInviteTitle: "إلغاء الدعوة؟",
      cancelInviteDescription: "هل تريد إلغاء الدعوة المرسلة إلى {username}؟",
      cancelInviteConfirm: "إلغاء الدعوة",
      noPlayers: "لا يوجد لاعبون في هذا الفريق حاليًا.",
    },
    modal: {
      confirmation: "تأكيد",
      confirmAction: "تأكيد الإجراء",
      cancel: "إلغاء",
    },
  },
};

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = teamPageMessages[locale].metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

function formatTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
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
  messages: TeamPageMessages;
}) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "approved") {
    return <Pill label={messages.common.active} tone="green" />;
  }

  if (normalizedStatus === "leader") {
    return <Pill label={messages.common.leader} tone="green" />;
  }

  if (normalizedStatus === "member") {
    return <Pill label={messages.common.member} tone="violet" />;
  }

  if (normalizedStatus === "pending" || normalizedStatus === "invited") {
    return (
      <Pill
        label={
          normalizedStatus === "pending"
            ? messages.common.pending
            : messages.common.invited
        }
        tone="blue"
      />
    );
  }

  if (normalizedStatus === "locked") {
    return <Pill label={messages.common.locked} tone="blue" />;
  }

  if (normalizedStatus === "rejected") {
    return <Pill label={messages.common.rejected} tone="red" />;
  }

  return <Pill label={status} tone="gray" />;
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

export default async function TeamDetailsPage({
  params,
  searchParams,
}: TeamDetailsPageProps) {
  const [{ id }, noticeParams, session, locale] = await Promise.all([
    params,
    searchParams,
    auth(),
    getLocale(),
  ]);

  const messages = teamPageMessages[locale];

  if (!session?.user?.databaseId) {
    redirect("/login");
  }

  const team = await prisma.team.findUnique({
    where: {
      id,
    },
    include: {
      leader: true,
      members: {
        include: {
          user: true,
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
      invites: {
        where: {
          status: "pending",
        },
        include: {
          invitedUser: true,
          invitedBy: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      results: {
        include: {
          tournament: {
            select: {
              id: true,
              title: true,
              game: true,
              date: true,
            },
          },
        },
        orderBy: [
          {
            awardedAt: "desc",
          },
        ],
      },
      registrations: {
        where: {
          status: {
            in: ["registered", "approved"],
          },
          tournament: {
            status: {
              notIn: ["ended", "cancelled"],
            },
          },
        },
        include: {
          tournament: {
            select: {
              id: true,
              title: true,
              status: true,
              registrationStatus: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!team) {
    notFound();
  }

  const currentMembership = team.members.find(
    (member) => member.userId === session.user.databaseId,
  );

  const isLeader = team.leaderId === session.user.databaseId;
  const canManage = Boolean(currentMembership);
  const activeRegistration = team.registrations[0] || null;
  const isTeamLocked = Boolean(activeRegistration);

  if (!canManage) {
    redirect("/profile");
  }

  const totalTeamPoints = team.results.reduce(
    (total, result) => total + result.points,
    0,
  );

  const bestPlacement =
    team.results.length > 0
      ? Math.min(...team.results.map((result) => result.placement))
      : null;

  const teamImage = getGameImageUrl(team.game);

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[500px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("${teamImage}")`,
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.62)_48%,rgba(7,8,17,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-28 pt-16 lg:px-10">
            <ProfileNotice
              message={noticeParams.message}
              error={noticeParams.error}
            />
            <ProfileRealtime />

            <Link
              href="/profile"
              className="mt-4 inline-flex rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              {locale === "ar" ? "→" : "←"} {messages.hero.backToProfile}
            </Link>

            <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                    {messages.hero.label}
                  </p>

                  <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
                    {team.name}
                  </h1>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge status={team.status} messages={messages} />
                    <Pill label={team.game} />
                    <Pill
                      label={`${team.members.length} ${getCountLabel(
                        team.members.length,
                        messages.common.member,
                        messages.common.members,
                      )}`}
                    />
                    <Pill
                      label={`${totalTeamPoints} ${messages.common.points}`}
                      tone="green"
                    />
                    {isTeamLocked && (
                      <StatusBadge status="Locked" messages={messages} />
                    )}
                    {team.invites.length > 0 && (
                      <Pill
                        label={`${team.invites.length} ${getCountLabel(
                          team.invites.length,
                          messages.common.pendingInvite,
                          messages.common.pendingInvites,
                        )}`}
                        tone="blue"
                      />
                    )}
                  </div>

                  {activeRegistration && (
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-300">
                      {messages.hero.lockedWhileRegistered}{" "}
                      <Link
                        href={`/tournaments/${activeRegistration.tournament.id}`}
                        className="font-black text-white transition hover:text-violet-300"
                      >
                        {activeRegistration.tournament.title}
                      </Link>
                      .
                    </p>
                  )}

                  {team.rejectionReason && (
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-red-300">
                      {team.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-5 lg:text-right">
                  <Stat
                    label={messages.common.leader}
                    value={team.leader.username}
                  />
                  <Stat
                    label={messages.common.results}
                    value={team.results.length}
                  />
                  <Stat
                    label={messages.common.best}
                    value={bestPlacement ? `#${bestPlacement}` : "-"}
                  />
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-10">
          <div className="grid content-start gap-5">
            <CollapsibleSection
              label={messages.sections.settings}
              title={messages.sections.teamSetup}
              meta={
                isTeamLocked
                  ? messages.sections.lockedSettingsMeta
                  : isLeader
                    ? messages.sections.leaderSettingsMeta
                    : messages.sections.memberSettingsMeta
              }
              defaultOpen={!isTeamLocked}
            >
              <div className="grid gap-6 p-5">
                {isLeader && !isTeamLocked ? (
                  <InlineTeamActionForm
                    action={updateTeamInline}
                    buttonLabel={messages.settings.saveChanges}
                    pendingLabel={messages.settings.saving}
                    confirmEyebrow={messages.modal.confirmation}
                    confirmFallbackTitle={messages.modal.confirmAction}
                    cancelLabel={messages.modal.cancel}
                  >
                    <input type="hidden" name="teamId" value={team.id} />

                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-gray-200">
                          {messages.settings.teamName}
                        </span>

                        <input
                          name="name"
                          required
                          defaultValue={team.name}
                          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-gray-200">
                          {messages.settings.game}
                        </span>

                        <CustomSelect
                          name="game"
                          required
                          placeholder={messages.settings.selectGame}
                          defaultValue={team.game}
                          options={games.map((game) => ({
                            value: game,
                            label: game,
                            description: messages.settings.teamGame,
                          }))}
                        />
                      </label>
                    </div>
                  </InlineTeamActionForm>
                ) : (
                  <p className="text-sm leading-6 text-gray-400">
                    {isTeamLocked
                      ? messages.settings.lockedDescription
                      : messages.settings.onlyLeaderDescription}
                  </p>
                )}

                {isLeader && !isTeamLocked && (
                  <div className="border-t border-white/10 pt-5">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                      {messages.sections.invitePlayer}
                    </p>

                    <InlineTeamActionForm
                      action={invitePlayerToTeamInline}
                      buttonLabel={messages.settings.sendInvite}
                      pendingLabel={messages.settings.sending}
                      confirmEyebrow={messages.modal.confirmation}
                      confirmFallbackTitle={messages.modal.confirmAction}
                      cancelLabel={messages.modal.cancel}
                    >
                      <input type="hidden" name="teamId" value={team.id} />

                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-gray-200">
                          {messages.settings.usernameOrDiscordId}
                        </span>

                        <input
                          name="player"
                          required
                          placeholder={messages.settings.playerPlaceholder}
                          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400"
                        />
                      </label>
                    </InlineTeamActionForm>
                  </div>
                )}

                {!isLeader && !isTeamLocked && (
                  <div className="border-t border-white/10 pt-5">
                    <InlineTeamActionForm
                      action={leaveTeamInline}
                      buttonLabel={messages.settings.leaveTeam}
                      pendingLabel={messages.settings.leaving}
                      variant="danger"
                      confirmEyebrow={messages.modal.confirmation}
                      confirmTitle={messages.settings.leaveTeamTitle}
                      confirmDescription={formatTemplate(
                        messages.settings.leaveTeamDescription,
                        {
                          teamName: team.name,
                        },
                      )}
                      confirmLabel={messages.settings.leaveTeamConfirm}
                      cancelLabel={messages.modal.cancel}
                    >
                      <input type="hidden" name="teamId" value={team.id} />
                    </InlineTeamActionForm>
                  </div>
                )}

                {isLeader && !isTeamLocked && (
                  <div className="border-t border-red-500/20 pt-5">
                    <InlineTeamActionForm
                      action={deleteTeamInline}
                      buttonLabel={messages.settings.deleteTeam}
                      pendingLabel={messages.settings.deleting}
                      variant="danger"
                      confirmEyebrow={messages.modal.confirmation}
                      confirmTitle={messages.settings.deleteTeamTitle}
                      confirmDescription={formatTemplate(
                        messages.settings.deleteTeamDescription,
                        {
                          teamName: team.name,
                        },
                      )}
                      confirmLabel={messages.settings.deleteTeamConfirm}
                      cancelLabel={messages.modal.cancel}
                    >
                      <input type="hidden" name="teamId" value={team.id} />
                    </InlineTeamActionForm>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              label={messages.sections.history}
              title={messages.sections.tournamentResults}
              meta={`${team.results.length} ${getCountLabel(
                team.results.length,
                messages.common.result,
                messages.common.results,
              )} · ${totalTeamPoints} ${messages.common.points}`}
              defaultOpen={team.results.length > 0}
            >
              <div className="grid grid-cols-3 gap-5 border-b border-white/10 p-5">
                <Stat label={messages.common.points} value={totalTeamPoints} />
                <Stat
                  label={messages.common.results}
                  value={team.results.length}
                />
                <Stat
                  label={messages.common.best}
                  value={bestPlacement ? `#${bestPlacement}` : "-"}
                />
              </div>

              {team.results.length === 0 ? (
                <div className="p-5 text-sm text-gray-400">
                  {messages.history.noResults}
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {team.results.map((result) => (
                    <article
                      key={result.id}
                      className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_100px_100px] md:items-center"
                    >
                      <div>
                        <Link
                          href={`/tournaments/${result.tournament.id}`}
                          className="font-black text-white transition hover:text-violet-300"
                        >
                          {result.tournament.title}
                        </Link>

                        <p className="mt-1 text-sm text-gray-400">
                          {result.tournament.game} · {result.tournament.date}
                        </p>

                        {result.note && (
                          <p className="mt-2 text-sm text-gray-500">
                            {result.note}
                          </p>
                        )}
                      </div>

                      <Pill label={`#${result.placement}`} tone="blue" />
                      <Pill
                        label={`${result.points} ${messages.common.pts}`}
                        tone="green"
                      />
                    </article>
                  ))}
                </div>
              )}
            </CollapsibleSection>
          </div>

          <aside>
            <CollapsibleSection
              label={messages.sections.roster}
              title={messages.sections.playersAndInvites}
              meta={`${team.members.length} ${getCountLabel(
                team.members.length,
                messages.common.member,
                messages.common.members,
              )} · ${team.invites.length} ${getCountLabel(
                team.invites.length,
                messages.common.invite,
                messages.common.invites,
              )}`}
              defaultOpen
            >
              <div className="divide-y divide-white/10">
                {team.members.map((member) => {
                  const isMemberLeader = member.userId === team.leaderId;

                  return (
                    <div key={member.id} className="grid gap-3 px-5 py-4">
                      <div>
                        <p className="font-black text-white">
                          {member.user.username}
                        </p>

                        <p className="mt-1 break-all text-xs text-gray-500">
                          {member.user.discordId}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <StatusBadge
                          status={isMemberLeader ? "Leader" : "Member"}
                          messages={messages}
                        />

                        {isLeader && !isMemberLeader && !isTeamLocked ? (
                          <div className="flex flex-wrap gap-2">
                            <InlineTeamActionForm
                              action={transferTeamLeadershipInline}
                              buttonLabel={messages.roster.makeLeader}
                              pendingLabel={messages.roster.transferring}
                              variant="secondary"
                              confirmEyebrow={messages.modal.confirmation}
                              confirmTitle={messages.roster.transferTitle}
                              confirmDescription={formatTemplate(
                                messages.roster.transferDescription,
                                {
                                  username: member.user.username,
                                },
                              )}
                              confirmLabel={messages.roster.transferConfirm}
                              cancelLabel={messages.modal.cancel}
                            >
                              <input
                                type="hidden"
                                name="teamId"
                                value={team.id}
                              />
                              <input
                                type="hidden"
                                name="memberId"
                                value={member.id}
                              />
                            </InlineTeamActionForm>

                            <InlineTeamActionForm
                              action={removeTeamMemberInline}
                              buttonLabel={messages.roster.remove}
                              pendingLabel={messages.roster.removing}
                              variant="danger"
                              confirmEyebrow={messages.modal.confirmation}
                              confirmTitle={messages.roster.removeTitle}
                              confirmDescription={formatTemplate(
                                messages.roster.removeDescription,
                                {
                                  username: member.user.username,
                                },
                              )}
                              confirmLabel={messages.roster.removeConfirm}
                              cancelLabel={messages.modal.cancel}
                            >
                              <input
                                type="hidden"
                                name="teamId"
                                value={team.id}
                              />
                              <input
                                type="hidden"
                                name="memberId"
                                value={member.id}
                              />
                            </InlineTeamActionForm>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {messages.common.dash}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {team.invites.map((invite) => (
                  <div key={invite.id} className="grid gap-3 px-5 py-4">
                    <div>
                      <p className="font-black text-white">
                        {invite.invitedUser.username}
                      </p>

                      <p className="mt-1 break-all text-xs text-gray-500">
                        {invite.invitedUser.discordId}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <StatusBadge status="Invited" messages={messages} />

                      {isLeader && !isTeamLocked ? (
                        <InlineTeamActionForm
                          action={cancelTeamInviteInline}
                          buttonLabel={messages.roster.cancel}
                          pendingLabel={messages.roster.cancelling}
                          variant="secondary"
                          confirmEyebrow={messages.modal.confirmation}
                          confirmTitle={messages.roster.cancelInviteTitle}
                          confirmDescription={formatTemplate(
                            messages.roster.cancelInviteDescription,
                            {
                              username: invite.invitedUser.username,
                            },
                          )}
                          confirmLabel={messages.roster.cancelInviteConfirm}
                          cancelLabel={messages.modal.cancel}
                        >
                          <input type="hidden" name="teamId" value={team.id} />
                          <input
                            type="hidden"
                            name="inviteId"
                            value={invite.id}
                          />
                        </InlineTeamActionForm>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {messages.common.dash}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {team.members.length === 0 && team.invites.length === 0 && (
                  <div className="p-5 text-gray-300">
                    {messages.roster.noPlayers}
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </aside>
        </section>

        <Footer />
      </div>
    </main>
  );
}
