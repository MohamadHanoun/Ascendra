import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
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
    saveChangesTitle: string;
    saveChangesDescription: string;
    saveChangesConfirm: string;
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
    sendInviteTitle: string;
    sendInviteDescription: string;
    sendInviteConfirm: string;
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
      title: "Manage Team ",
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
      saveChangesTitle: "Save team changes?",
      saveChangesDescription:
        "Save the updated team name and game? This may affect team eligibility for future tournaments.",
      saveChangesConfirm: "Save changes",
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
      sendInviteTitle: "Send team invitation?",
      sendInviteDescription:
        "Send this player an invitation to join the team. They must accept it before becoming a member.",
      sendInviteConfirm: "Send invite",
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
      saveChangesTitle: "حفظ تغييرات الفريق؟",
      saveChangesDescription:
        "هل تريد حفظ اسم الفريق واللعبة المحددة؟ قد يؤثر هذا على أهلية الفريق للبطولات القادمة.",
      saveChangesConfirm: "حفظ التغييرات",
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
      sendInviteTitle: "إرسال دعوة للفريق؟",
      sendInviteDescription:
        "سيتم إرسال دعوة لهذا اللاعب للانضمام إلى الفريق. يجب أن يقبل الدعوة قبل أن يصبح عضوًا.",
      sendInviteConfirm: "إرسال الدعوة",
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

function getInitials(username: string) {
  return username
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarHue(username: string) {
  let hue = 0;

  for (const character of username) {
    hue = (hue << 5) - hue + character.charCodeAt(0);
  }

  return Math.abs(hue) % 360;
}

const inputStyle: CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

const panelClip =
  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";

const heroClip =
  "polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)";

const buttonClip =
  "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

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

function Panel({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section
      className={`relative overflow-hidden border shadow-2xl shadow-black/20 ${className}`}
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath: panelClip,
        ...style,
      }}
    >
      <CornerMark />
      {children}
    </section>
  );
}

function PanelHeader({
  label,
  title,
  meta,
}: {
  label: string;
  title: string;
  meta?: string;
}) {
  return (
    <div
      className="px-6 py-5"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <p
        className="text-xs font-black uppercase tracking-[0.18em]"
        style={{ color: "var(--asc-accent)" }}
      >
        ▲ {label}
      </p>

      <h2
        className="mt-2 text-2xl md:text-3xl"
        style={{ color: "var(--asc-fg-0)" }}
      >
        {title}
      </h2>

      {meta && (
        <p
          className="mt-2 text-sm leading-6"
          style={{ color: "var(--asc-fg-3)" }}
        >
          {meta}
        </p>
      )}
    </div>
  );
}

function Pill({
  label,
  tone = "violet",
}: {
  label: string;
  tone?: "green" | "blue" | "red" | "gray" | "violet";
}) {
  const styleMap: Record<string, CSSProperties> = {
    green: {
      color: "var(--asc-green)",
      borderColor: "var(--asc-green-border)",
      background: "var(--asc-green-bg)",
    },
    blue: {
      color: "var(--asc-blue)",
      borderColor: "var(--asc-blue-border)",
      background: "var(--asc-blue-bg)",
    },
    red: {
      color: "var(--asc-live)",
      borderColor: "var(--asc-live-border)",
      background: "var(--asc-live-bg)",
    },
    gray: {
      color: "var(--asc-fg-3)",
      borderColor: "var(--asc-line-soft)",
      background: "transparent",
    },
    violet: {
      color: "var(--asc-accent)",
      borderColor: "var(--asc-accent-border)",
      background: "var(--asc-accent-dim)",
    },
  };

  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
      style={styleMap[tone]}
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

  if (normalizedStatus === "pending") {
    return <Pill label={messages.common.pending} tone="blue" />;
  }

  if (normalizedStatus === "invited") {
    return <Pill label={messages.common.invited} tone="blue" />;
  }

  if (normalizedStatus === "locked") {
    return <Pill label={messages.common.locked} tone="blue" />;
  }

  if (normalizedStatus === "rejected") {
    return <Pill label={messages.common.rejected} tone="red" />;
  }

  return <Pill label={status} tone="gray" />;
}

function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
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
        className="mt-2 text-3xl font-black tabular-nums md:text-4xl"
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

function MiniStat({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string | number;
  isLast?: boolean;
}) {
  return (
    <div
      className="px-5 py-4"
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
          color: "var(--asc-fg-0)",
          fontFamily: "var(--font-display)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function AvatarBadge({
  username,
  avatar,
}: {
  username: string;
  avatar: string | null;
}) {
  const hue = getAvatarHue(username);
  const clipPath =
    "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={username}
        className="h-12 w-12 shrink-0 object-cover"
        style={{
          clipPath,
          border: "1px solid var(--asc-line-soft)",
        }}
      />
    );
  }

  return (
    <div
      className="grid h-12 w-12 shrink-0 place-items-center"
      style={{
        clipPath,
        background: `linear-gradient(135deg, oklch(0.55 0.22 ${hue}), oklch(0.30 0.16 ${
          hue + 40
        }))`,
      }}
    >
      <span
        className="text-sm font-black uppercase"
        style={{ color: "white", fontFamily: "var(--font-display)" }}
      >
        {getInitials(username)}
      </span>
    </div>
  );
}

function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit border px-4 py-2 text-sm font-black transition hover:opacity-80"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-2)",
        color: "var(--asc-fg-2)",
        clipPath: buttonClip,
      }}
    >
      {children}
    </Link>
  );
}

function EmptyMessage({ children }: { children: ReactNode }) {
  return (
    <p className="p-6 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
      {children}
    </p>
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
      game: {
        select: {
          name: true,
          slug: true,
        },
      },
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
              game: {
                select: {
                  name: true,
                },
              },
              startsAt: true,
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

  const dbGames = await prisma.game.findMany({
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
  });

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

  const teamImage = getGameImageUrl(team.game?.slug ?? null);

  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[540px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${teamImage}")` }}
          />

          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, rgb(12 11 9 / 0.28) 0%, rgb(12 11 9 / 0.68) 54%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, rgb(12 11 9 / 0.45) 42%, transparent 74%)",
              ].join(", "),
            }}
          />

          <div
            className="absolute inset-x-0 bottom-0 h-52"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--asc-bg-0))",
            }}
          />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-32 pt-20 lg:px-10">
            <ProfileNotice
              message={noticeParams.message}
              error={noticeParams.error}
            />
            <ProfileRealtime />

            <BackLink href="/profile">
              {locale === "ar" ? "→" : "←"} {messages.hero.backToProfile}
            </BackLink>

            <section
              className="relative mt-8 overflow-hidden border p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-card)",
                clipPath: heroClip,
              }}
            >
              <CornerMark />

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                <div className="min-w-0">
                  <p
                    className="text-xs font-black uppercase tracking-[0.2em]"
                    style={{ color: "var(--asc-accent)" }}
                  >
                    ▲ {messages.hero.label}
                  </p>

                  <h1
                    className="mt-3 text-5xl md:text-7xl"
                    style={{ color: "var(--asc-fg-0)" }}
                  >
                    {team.name}
                  </h1>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <StatusBadge status={team.status} messages={messages} />
                    <Pill label={team.game?.name ?? "—"} />
                    <Pill
                      label={`${team.members.length} ${getCountLabel(
                        team.members.length,
                        messages.common.member,
                        messages.common.members,
                      )}`}
                      tone="gray"
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
                    <p
                      className="mt-5 max-w-3xl text-sm leading-6"
                      style={{ color: "var(--asc-blue)" }}
                    >
                      {messages.hero.lockedWhileRegistered}{" "}
                      <Link
                        href={`/tournaments/${activeRegistration.tournament.id}`}
                        className="font-black transition hover:opacity-80"
                        style={{ color: "var(--asc-fg-0)" }}
                      >
                        {activeRegistration.tournament.title}
                      </Link>
                      .
                    </p>
                  )}

                  {team.rejectionReason && (
                    <p
                      className="mt-5 max-w-3xl text-sm leading-6"
                      style={{ color: "var(--asc-live)" }}
                    >
                      {team.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1 lg:text-right">
                  <StatBlock
                    label={messages.common.leader}
                    value={team.leader.username}
                  />
                  <StatBlock
                    label={messages.common.results}
                    value={team.results.length}
                  />
                  <StatBlock
                    label={messages.common.best}
                    value={bestPlacement ? `#${bestPlacement}` : "—"}
                    accent
                  />
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto max-w-[1440px] px-6 pb-20 lg:px-10">
          <Panel>
            <div className="grid grid-cols-2 md:grid-cols-4">
              <MiniStat
                label={messages.common.members}
                value={team.members.length}
              />
              <MiniStat
                label={messages.common.invites}
                value={team.invites.length}
              />
              <MiniStat
                label={messages.common.points}
                value={totalTeamPoints}
              />
              <MiniStat
                label={messages.common.best}
                value={bestPlacement ? `#${bestPlacement}` : "—"}
                isLast
              />
            </div>
          </Panel>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="grid content-start gap-8">
              <Panel>
                <PanelHeader
                  label={messages.sections.settings}
                  title={messages.sections.teamSetup}
                  meta={
                    isTeamLocked
                      ? messages.sections.lockedSettingsMeta
                      : isLeader
                        ? messages.sections.leaderSettingsMeta
                        : messages.sections.memberSettingsMeta
                  }
                />

                <div className="grid gap-6 p-6">
                  {isLeader && !isTeamLocked ? (
                    <InlineTeamActionForm
                      action={updateTeamInline}
                      buttonLabel={messages.settings.saveChanges}
                      pendingLabel={messages.settings.saving}
                      confirmEyebrow={messages.modal.confirmation}
                      confirmTitle={messages.settings.saveChangesTitle}
                      confirmDescription={
                        messages.settings.saveChangesDescription
                      }
                      confirmLabel={messages.settings.saveChangesConfirm}
                      confirmFallbackTitle={messages.modal.confirmAction}
                      cancelLabel={messages.modal.cancel}
                    >
                      <input type="hidden" name="teamId" value={team.id} />

                      <div className="grid gap-5 md:grid-cols-2">
                        <label className="grid gap-2">
                          <span
                            className="text-xs font-black uppercase tracking-[0.12em]"
                            style={{ color: "var(--asc-fg-3)" }}
                          >
                            {messages.settings.teamName}
                          </span>

                          <input
                            name="name"
                            required
                            defaultValue={team.name}
                            className="border px-4 py-3 outline-none transition"
                            style={inputStyle}
                          />
                        </label>

                        <label className="grid gap-2">
                          <span
                            className="text-xs font-black uppercase tracking-[0.12em]"
                            style={{ color: "var(--asc-fg-3)" }}
                          >
                            {messages.settings.game}
                          </span>

                          <CustomSelect
                            name="gameSlug"
                            required
                            placeholder={messages.settings.selectGame}
                            defaultValue={team.game?.slug ?? ""}
                            options={dbGames.map((game) => ({
                              value: game.slug,
                              label: game.name,
                              description: messages.settings.teamGame,
                            }))}
                          />
                        </label>
                      </div>
                    </InlineTeamActionForm>
                  ) : (
                    <p
                      className="text-sm leading-6"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      {isTeamLocked
                        ? messages.settings.lockedDescription
                        : messages.settings.onlyLeaderDescription}
                    </p>
                  )}

                  {isLeader && !isTeamLocked && (
                    <div
                      className="pt-6"
                      style={{ borderTop: "1px solid var(--asc-line-soft)" }}
                    >
                      <p
                        className="mb-3 text-xs font-black uppercase tracking-[0.14em]"
                        style={{ color: "var(--asc-accent)" }}
                      >
                        ▲ {messages.sections.invitePlayer}
                      </p>

                      <InlineTeamActionForm
                        action={invitePlayerToTeamInline}
                        buttonLabel={messages.settings.sendInvite}
                        pendingLabel={messages.settings.sending}
                        confirmEyebrow={messages.modal.confirmation}
                        confirmTitle={messages.settings.sendInviteTitle}
                        confirmDescription={
                          messages.settings.sendInviteDescription
                        }
                        confirmLabel={messages.settings.sendInviteConfirm}
                        confirmFallbackTitle={messages.modal.confirmAction}
                        cancelLabel={messages.modal.cancel}
                      >
                        <input type="hidden" name="teamId" value={team.id} />

                        <label className="grid gap-2">
                          <span
                            className="text-xs font-black uppercase tracking-[0.12em]"
                            style={{ color: "var(--asc-fg-3)" }}
                          >
                            {messages.settings.usernameOrDiscordId}
                          </span>

                          <input
                            name="player"
                            required
                            placeholder={messages.settings.playerPlaceholder}
                            className="border px-4 py-3 outline-none transition"
                            style={inputStyle}
                          />
                        </label>
                      </InlineTeamActionForm>
                    </div>
                  )}

                  {!isLeader && !isTeamLocked && (
                    <div
                      className="pt-6"
                      style={{ borderTop: "1px solid var(--asc-line-soft)" }}
                    >
                      <InlineTeamActionForm
                        action={leaveTeamInline}
                        buttonLabel={messages.settings.leaveTeam}
                        pendingLabel={messages.settings.leaving}
                        variant="danger"
                        confirmEyebrow={messages.modal.confirmation}
                        confirmTitle={messages.settings.leaveTeamTitle}
                        confirmDescription={formatTemplate(
                          messages.settings.leaveTeamDescription,
                          { teamName: team.name },
                        )}
                        confirmLabel={messages.settings.leaveTeamConfirm}
                        cancelLabel={messages.modal.cancel}
                      >
                        <input type="hidden" name="teamId" value={team.id} />
                      </InlineTeamActionForm>
                    </div>
                  )}

                  {isLeader && !isTeamLocked && (
                    <div
                      className="pt-6"
                      style={{
                        borderTop: "1px solid oklch(0.50 0.20 25 / 0.30)",
                      }}
                    >
                      <InlineTeamActionForm
                        action={deleteTeamInline}
                        buttonLabel={messages.settings.deleteTeam}
                        pendingLabel={messages.settings.deleting}
                        variant="danger"
                        confirmEyebrow={messages.modal.confirmation}
                        confirmTitle={messages.settings.deleteTeamTitle}
                        confirmDescription={formatTemplate(
                          messages.settings.deleteTeamDescription,
                          { teamName: team.name },
                        )}
                        confirmLabel={messages.settings.deleteTeamConfirm}
                        cancelLabel={messages.modal.cancel}
                      >
                        <input type="hidden" name="teamId" value={team.id} />
                      </InlineTeamActionForm>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel>
                <PanelHeader
                  label={messages.sections.history}
                  title={messages.sections.tournamentResults}
                  meta={`${team.results.length} ${getCountLabel(
                    team.results.length,
                    messages.common.result,
                    messages.common.results,
                  )} · ${totalTeamPoints} ${messages.common.points}`}
                />

                {team.results.length === 0 ? (
                  <EmptyMessage>{messages.history.noResults}</EmptyMessage>
                ) : (
                  <div>
                    {team.results.map((result, index) => (
                      <article
                        key={result.id}
                        className="grid gap-4 px-6 py-5 md:grid-cols-[minmax(0,1fr)_90px_100px] md:items-center"
                        style={
                          index < team.results.length - 1
                            ? { borderBottom: "1px solid var(--asc-line-soft)" }
                            : {}
                        }
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/tournaments/${result.tournament.id}`}
                            className="font-black transition hover:opacity-80"
                            style={{ color: "var(--asc-fg-0)" }}
                          >
                            {result.tournament.title}
                          </Link>

                          <p
                            className="mt-1 text-sm"
                            style={{ color: "var(--asc-fg-3)" }}
                          >
                            {result.tournament.game?.name ?? "—"} ·{" "}
                            {result.tournament.startsAt?.toLocaleDateString() ??
                              "—"}
                          </p>

                          {result.note && (
                            <p
                              className="mt-2 text-sm"
                              style={{ color: "var(--asc-fg-3)" }}
                            >
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
              </Panel>
            </div>

            <aside className="grid content-start gap-8">
              <Panel>
                <PanelHeader
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
                />

                <div>
                  {team.members.map((member, index) => {
                    const isMemberLeader = member.userId === team.leaderId;

                    return (
                      <div
                        key={member.id}
                        className="grid gap-4 px-6 py-5"
                        style={{
                          borderBottom:
                            index < team.members.length - 1 ||
                            team.invites.length > 0
                              ? "1px solid var(--asc-line-soft)"
                              : "none",
                        }}
                      >
                        <Link
                          href={`/players/${member.user.id}`}
                          className="flex items-center gap-4 transition hover:opacity-80"
                        >
                          <AvatarBadge
                            username={member.user.username}
                            avatar={member.user.avatar}
                          />

                          <div className="min-w-0">
                            <p
                              className="truncate font-black"
                              style={{ color: "var(--asc-fg-0)" }}
                            >
                              {member.user.username}
                            </p>

                            <p
                              className="mt-1 break-all text-xs"
                              style={{ color: "var(--asc-fg-3)" }}
                            >
                              {member.user.discordId ?? "—"}
                            </p>
                          </div>
                        </Link>

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
                                  { username: member.user.username },
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
                                  { username: member.user.username },
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
                            <span
                              className="text-sm"
                              style={{ color: "var(--asc-fg-3)" }}
                            >
                              {messages.common.dash}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {team.invites.map((invite, index) => (
                    <div
                      key={invite.id}
                      className="grid gap-4 px-6 py-5"
                      style={{
                        borderBottom:
                          index < team.invites.length - 1
                            ? "1px solid var(--asc-line-soft)"
                            : "none",
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <AvatarBadge
                          username={invite.invitedUser.username}
                          avatar={invite.invitedUser.avatar}
                        />

                        <div className="min-w-0">
                          <p
                            className="truncate font-black"
                            style={{ color: "var(--asc-fg-0)" }}
                          >
                            {invite.invitedUser.username}
                          </p>

                          <p
                            className="mt-1 break-all text-xs"
                            style={{ color: "var(--asc-fg-3)" }}
                          >
                            {invite.invitedUser.discordId ?? "—"}
                          </p>
                        </div>
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
                              { username: invite.invitedUser.username },
                            )}
                            confirmLabel={messages.roster.cancelInviteConfirm}
                            cancelLabel={messages.modal.cancel}
                          >
                            <input
                              type="hidden"
                              name="teamId"
                              value={team.id}
                            />
                            <input
                              type="hidden"
                              name="inviteId"
                              value={invite.id}
                            />
                          </InlineTeamActionForm>
                        ) : (
                          <span
                            className="text-sm"
                            style={{ color: "var(--asc-fg-3)" }}
                          >
                            {messages.common.dash}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {team.members.length === 0 && team.invites.length === 0 && (
                    <EmptyMessage>{messages.roster.noPlayers}</EmptyMessage>
                  )}
                </div>
              </Panel>
            </aside>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
