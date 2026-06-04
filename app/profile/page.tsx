import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GameProvider } from "@prisma/client";

import { connectFaceitAccount, unlinkFaceitAccount, unlinkRiotAccount, unlinkSteamAccount } from "@/actions/profileAccountActions";
import { auth, signOut } from "@/auth";
import FaceitConnectRow from "@/components/FaceitConnectRow";
import Footer from "@/components/Footer";
import LinkedAccountRow from "@/components/LinkedAccountRow";
import Navbar from "@/components/Navbar";
import ProfileIdentityActions from "@/components/ProfileIdentityActions";
import ProfileNotice from "@/components/ProfileNotice";
import ProfileRealtime from "@/components/ProfileRealtime";
import ProfileTabs from "@/components/ProfileTabs";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import {
  getActiveMatchesForUser,
  getPlayerMatchStatusLabel,
  type MatchHubCard,
} from "@/lib/playerMatchHub";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
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
  tabLabels: {
    overview: string;
    teams: string;
    history: string;
    matches: string;
    achievements: string;
    account: string;
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
    performanceEyebrow: string;
    pointHistoryTitle: string;
    noTournamentData: string;
    recentMatchesEyebrow: string;
    matchHistoryTitle: string;
    noResultsYet: string;
    fullRecordEyebrow: string;
    tournamentHistoryTitle: string;
    achievementsEyebrow: string;
    achievementsTitle: string;
    comingSoon: string;
    comingSoonDesc: string;
    tableColTournament: string;
    tableColTeam: string;
    tableColPlace: string;
    tableColPts: string;
    tableColDate: string;
    noActivityDesc: string;
    browseTournaments: string;
    accountTitle: string;
    connectedAccountsDesc: string;
    discordAccountTitle: string;
    discordSubtitle: string;
    privacyTitle: string;
    privacyDesc: string;
    preferencesTitle: string;
    preferencesDesc: string;
    securityTitle: string;
    signOutDesc: string;
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
    ptsLabel: string;
    discord: string;
    linkedAccounts: string;
    connectedGameAccounts: string;
    riotAccount: string;
    steamAccount: string;
    steamSubtitle: string;
    linked: string;
    connected: string;
    connect: string;
    unlink: string;
    unlinking: string;
    unlinkAccountConfirmTitle: string;
    unlinkAccountConfirmDescription: string;
    unlinkAccountConfirmButton: string;
    confirmationEyebrow: string;
    cancelLabel: string;
    faceitAccount: string;
    faceitSubtitle: string;
    faceitHelp: string;
    faceitConnectedHelp: string;
    faceitConnecting: string;
    faceitSkillLevel: string;
    faceitNicknamePlaceholder: string;
    acceptTitle: string;
    declineTitle: string;
    joinTeamTemplate: string;
    declineTeamTemplate: string;
    acceptingLabel: string;
    decliningLabel: string;
    creatingLabel: string;
    createTeamDialogTitle: string;
    createTeamDialogDesc: string;
    signOut: string;
  };
  statuses: {
    active: string;
    pending: string;
    rejected: string;
    member: string;
    notMember: string;
  };
  activeMatches: {
    heading: string;
    empty: string;
    tournament: string;
    yourTeam: string;
    opponent: string;
    scheduledTime: string;
    faceitRoom: string;
    available: string;
    notAvailableYet: string;
    checkedIn: string;
    notCheckedIn: string;
    openMatch: string;
    openFaceitRoom: string;
    tbd: string;
    round: string;
    match: string;
    browseTournaments: string;
  };
};

const profileMessages: Record<Locale, ProfileMessages> = {
  en: {
    metadata: {
      title: "Profile ",
      description: "Manage your Ascendra profile, invitations, and teams.",
    },
    hero: {
      label: "Player profile",
      discordId: "Discord ID",
      member: "Member",
      notMember: "Not member",
      teams: "teams",
      team: "team",
      points: "Ranking points",
      invites: "invites",
      invite: "invite",
    },
    tabLabels: {
      overview: "Overview",
      teams: "Teams",
      history: "History",
      matches: "Matches",
      achievements: "Achievements",
      account: "Account",
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
      performanceEyebrow: "PERFORMANCE",
      pointHistoryTitle: "POINT HISTORY",
      noTournamentData: "No tournament data yet.",
      recentMatchesEyebrow: "RECENT MATCHES",
      matchHistoryTitle: "MATCH HISTORY",
      noResultsYet: "No results yet.",
      fullRecordEyebrow: "FULL RECORD",
      tournamentHistoryTitle: "TOURNAMENT HISTORY",
      achievementsEyebrow: "PLAYER ACHIEVEMENTS",
      achievementsTitle: "ACHIEVEMENTS",
      comingSoon: "COMING SOON",
      comingSoonDesc: "Achievements will be unlocked as you compete in tournaments.",
      tableColTournament: "Tournament",
      tableColTeam: "Team",
      tableColPlace: "Place",
      tableColPts: "PTS",
      tableColDate: "Date",
      noActivityDesc: "Compete in a tournament to start building your record.",
      browseTournaments: "Browse tournaments",
      accountTitle: "Account & Settings",
      connectedAccountsDesc: "Connect your gaming platforms to your Ascendra account.",
      discordAccountTitle: "Discord",
      discordSubtitle: "Login provider · Ascendra community",
      privacyTitle: "Privacy & Visibility",
      privacyDesc: "Control who can see your profile data.",
      preferencesTitle: "Preferences",
      preferencesDesc: "Appearance, language, and notification settings.",
      securityTitle: "Security",
      signOutDesc: "You are currently signed in on this device.",
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
      ptsLabel: "PTS",
      discord: "Discord",
      linkedAccounts: "Linked Accounts",
      connectedGameAccounts: "Connected Game Accounts",
      riotAccount: "Riot Account",
      steamAccount: "Steam Account",
      steamSubtitle: "Dota 2 · Counter-Strike 2 · and more",
      linked: "Linked",
      connected: "Connected",
      connect: "Connect",
      unlink: "Unlink",
      unlinking: "Unlinking...",
      unlinkAccountConfirmTitle: "Unlink account?",
      unlinkAccountConfirmDescription:
        "Are you sure you want to unlink your {provider} account?",
      unlinkAccountConfirmButton: "Unlink account",
      confirmationEyebrow: "Confirmation",
      cancelLabel: "Cancel",
      faceitAccount: "FACEIT Account",
      faceitSubtitle: "Counter-Strike 2 account verification",
      faceitHelp:
        "Connect Steam first. FACEIT must belong to the same Steam account.",
      faceitConnectedHelp:
        "FACEIT is linked and verified against your Steam account.",
      faceitConnecting: "Connecting...",
      faceitSkillLevel: "Skill Level",
      faceitNicknamePlaceholder: "FACEIT nickname",
      acceptTitle: "Accept team invitation?",
      declineTitle: "Decline team invitation?",
      joinTeamTemplate: "Join {team}? You will become a member of this team.",
      declineTeamTemplate: "Decline the invitation to join {team}?",
      acceptingLabel: "Accepting...",
      decliningLabel: "Declining...",
      creatingLabel: "Creating...",
      createTeamDialogTitle: "Create team?",
      createTeamDialogDesc: "Create this team with the selected game. You will become the team leader.",
      signOut: "Sign out",
    },
    statuses: {
      active: "Active",
      pending: "Pending",
      rejected: "Rejected",
      member: "Member",
      notMember: "Not member",
    },
    activeMatches: {
      heading: "My active matches",
      empty: "You do not have active tournament matches yet.",
      tournament: "Tournament",
      yourTeam: "Your team",
      opponent: "Opponent",
      scheduledTime: "Scheduled time",
      faceitRoom: "FACEIT room",
      available: "Available",
      notAvailableYet: "Not available yet",
      checkedIn: "Checked in",
      notCheckedIn: "Not checked in",
      openMatch: "Open match",
      openFaceitRoom: "Open FACEIT room",
      tbd: "TBD",
      round: "Round",
      match: "Match",
      browseTournaments: "Browse tournaments",
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
      points: "نقاط التصنيف",
      invites: "دعوات",
      invite: "دعوة",
    },
    tabLabels: {
      overview: "نظرة عامة",
      teams: "الفرق",
      history: "السجل",
      matches: "المباريات",
      achievements: "الإنجازات",
      account: "الحساب",
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
      performanceEyebrow: "الأداء",
      pointHistoryTitle: "سجل النقاط",
      noTournamentData: "لا توجد بيانات بطولات بعد.",
      recentMatchesEyebrow: "المباريات الأخيرة",
      matchHistoryTitle: "سجل المباريات",
      noResultsYet: "لا توجد نتائج بعد.",
      fullRecordEyebrow: "السجل الكامل",
      tournamentHistoryTitle: "سجل البطولات",
      achievementsEyebrow: "إنجازات اللاعب",
      achievementsTitle: "الإنجازات",
      comingSoon: "قريبًا",
      comingSoonDesc: "ستُفتح الإنجازات مع مشاركتك في البطولات.",
      tableColTournament: "البطولة",
      tableColTeam: "الفريق",
      tableColPlace: "المركز",
      tableColPts: "النقاط",
      tableColDate: "التاريخ",
      noActivityDesc: "شارك في بطولة لبدء بناء سجلك.",
      browseTournaments: "تصفح البطولات",
      accountTitle: "الحساب والإعدادات",
      connectedAccountsDesc: "اربط منصات الألعاب بحسابك في Ascendra.",
      discordAccountTitle: "Discord",
      discordSubtitle: "مزود تسجيل الدخول · مجتمع Ascendra",
      privacyTitle: "الخصوصية والظهور",
      privacyDesc: "تحكم في من يمكنه رؤية بيانات ملفك الشخصي.",
      preferencesTitle: "التفضيلات",
      preferencesDesc: "إعدادات المظهر واللغة والإشعارات.",
      securityTitle: "الأمان",
      signOutDesc: "أنت مسجل الدخول حاليًا على هذا الجهاز.",
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
      ptsLabel: "نقطة",
      discord: "Discord",
      linkedAccounts: "الحسابات المرتبطة",
      connectedGameAccounts: "حسابات الألعاب المرتبطة",
      riotAccount: "حساب Riot",
      steamAccount: "حساب Steam",
      steamSubtitle: "Dota 2 · Counter-Strike 2 · والمزيد",
      linked: "تم الربط",
      connected: "مرتبط",
      connect: "ربط",
      unlink: "إلغاء الربط",
      unlinking: "جارٍ إلغاء الربط...",
      unlinkAccountConfirmTitle: "إلغاء ربط الحساب؟",
      unlinkAccountConfirmDescription:
        "هل أنت متأكد من إلغاء ربط حساب {provider}؟",
      unlinkAccountConfirmButton: "إلغاء الربط",
      confirmationEyebrow: "تأكيد",
      cancelLabel: "إلغاء",
      faceitAccount: "حساب FACEIT",
      faceitSubtitle: "التحقق من حساب Counter-Strike 2",
      faceitHelp:
        "اربط Steam أولًا قبل ربط FACEIT. يجب أن يكون حساب FACEIT مرتبطًا بنفس حساب Steam.",
      faceitConnectedHelp:
        "تم ربط FACEIT والتحقق من مطابقته مع حساب Steam.",
      faceitConnecting: "جارٍ الربط...",
      faceitSkillLevel: "المستوى",
      faceitNicknamePlaceholder: "اسم مستخدم FACEIT",
      acceptTitle: "قبول دعوة الفريق؟",
      declineTitle: "رفض دعوة الفريق؟",
      joinTeamTemplate: "الانضمام إلى {team}؟ ستصبح عضوًا في هذا الفريق.",
      declineTeamTemplate: "رفض دعوة الانضمام إلى {team}؟",
      acceptingLabel: "جارٍ القبول...",
      decliningLabel: "جارٍ الرفض...",
      creatingLabel: "جارٍ الإنشاء...",
      createTeamDialogTitle: "إنشاء فريق؟",
      createTeamDialogDesc: "إنشاء هذا الفريق مع اللعبة المختارة. ستصبح قائد الفريق.",
      signOut: "تسجيل الخروج",
    },
    statuses: {
      active: "نشط",
      pending: "قيد المراجعة",
      rejected: "مرفوض",
      member: "عضو",
      notMember: "غير عضو",
    },
    activeMatches: {
      heading: "مبارياتي النشطة",
      empty: "لا توجد لديك مباريات نشطة حاليًا.",
      tournament: "البطولة",
      yourTeam: "فريقك",
      opponent: "الخصم",
      scheduledTime: "وقت المباراة",
      faceitRoom: "غرفة FACEIT",
      available: "متوفرة",
      notAvailableYet: "غير متوفرة بعد",
      checkedIn: "تم تسجيل الحضور",
      notCheckedIn: "لم يتم تسجيل الحضور",
      openMatch: "فتح المباراة",
      openFaceitRoom: "فتح غرفة FACEIT",
      tbd: "غير محدد",
      round: "جولة",
      match: "مباراة",
      browseTournaments: "تصفح البطولات",
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
        borderColor: "var(--asc-green-border)",
        background: "var(--asc-green-bg)",
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

function formatScheduledAt(date: Date, locale: Locale): string {
  const dateStr = date.toLocaleString(locale === "ar" ? "ar-SA" : "en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateStr} UTC`;
}

function MatchStatusBadge({ status, locale }: { status: string; locale: Locale }) {
  const isLive = status === "in_progress" || status === "room_created" || status === "ready";
  const isWarning = status === "result_pending" || status === "disputed";

  const style: React.CSSProperties = isLive
    ? {
        color: "var(--asc-accent)",
        borderColor: "var(--asc-accent-border)",
        background: "var(--asc-accent-dim)",
      }
    : isWarning
    ? {
        color: "oklch(0.85 0.10 50)",
        borderColor: "oklch(0.55 0.16 50 / 0.40)",
        background: "oklch(0.22 0.10 50 / 0.18)",
      }
    : {
        color: "var(--asc-fg-3)",
        borderColor: "var(--asc-line-soft)",
        background: "transparent",
      };

  return (
    <span
      className="inline-flex border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.10em]"
      style={style}
    >
      {getPlayerMatchStatusLabel(status, locale)}
    </span>
  );
}

function ActiveMatchCard({
  card,
  msgs,
  locale,
}: {
  card: MatchHubCard;
  msgs: ProfileMessages["activeMatches"];
  locale: Locale;
}) {
  return (
    <div
      className="relative flex flex-col gap-4 border p-4"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-2)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p
            className="truncate text-[10px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {card.tournamentTitle}
            {card.gameName ? ` · ${card.gameName}` : ""}
          </p>
          <p
            className="mt-0.5 text-[10px]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {msgs.round} {card.roundNumber} · {msgs.match} {card.matchNumber}
          </p>
        </div>
        <MatchStatusBadge status={card.status} locale={locale} />
      </div>

      <div className="grid gap-2">
        <div className="flex items-start gap-2">
          <span
            className="mt-0.5 shrink-0 text-[10px] font-black uppercase tracking-[0.10em]"
            style={{ color: "var(--asc-fg-3)", minWidth: "4.5rem" }}
          >
            {msgs.yourTeam}
          </span>
          <span
            className="min-w-0 break-words text-sm font-black"
            style={{ color: "var(--asc-fg-0)" }}
          >
            {card.playerTeamName ?? msgs.tbd}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span
            className="mt-0.5 shrink-0 text-[10px] font-black uppercase tracking-[0.10em]"
            style={{ color: "var(--asc-fg-3)", minWidth: "4.5rem" }}
          >
            {msgs.opponent}
          </span>
          <span
            className="min-w-0 break-words text-sm font-black"
            style={{ color: "var(--asc-fg-1)" }}
          >
            {card.opponentTeamName ?? msgs.tbd}
          </span>
        </div>
      </div>

      {card.scheduledAt && (
        <div
          className="border-t pt-3"
          style={{ borderColor: "var(--asc-line-soft)" }}
        >
          <p
            className="text-[10px] font-black uppercase tracking-[0.10em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {msgs.scheduledTime}
          </p>
          <p
            className="mt-1 text-xs font-black"
            style={{ color: "var(--asc-fg-1)", direction: "ltr", textAlign: locale === "ar" ? "right" : "left" }}
          >
            {formatScheduledAt(card.scheduledAt, locale)}
          </p>
        </div>
      )}

      {card.isCs2 && (
        <div
          className="border-t pt-3"
          style={{ borderColor: "var(--asc-line-soft)" }}
        >
          <p
            className="text-[10px] font-black uppercase tracking-[0.10em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {msgs.faceitRoom}
          </p>
          {card.faceitMatchUrl ? (
            <a
              href={card.faceitMatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 border px-3 py-1 text-[10px] font-black uppercase tracking-[0.10em] transition hover:opacity-80"
              style={{
                color: "var(--asc-green)",
                borderColor: "oklch(0.55 0.14 150 / 0.40)",
                background: "oklch(0.22 0.10 150 / 0.14)",
                direction: "ltr",
              }}
            >
              {msgs.available} · {msgs.openFaceitRoom}
            </a>
          ) : (
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {msgs.notAvailableYet}
            </p>
          )}
        </div>
      )}

      <div
        className="border-t pt-3"
        style={{ borderColor: "var(--asc-line-soft)" }}
      >
        {card.userCheckedIn ? (
          <span
            className="inline-flex border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.10em]"
            style={{
              color: "var(--asc-green)",
              borderColor: "var(--asc-green-border)",
              background: "oklch(0.22 0.10 150 / 0.14)",
            }}
          >
            {msgs.checkedIn}
          </span>
        ) : (
          <span
            className="text-[10px]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {msgs.notCheckedIn}
          </span>
        )}
      </div>

      <a
        href={card.matchHref}
        className="mt-auto border px-4 py-2 text-center text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-80"
        style={{
          borderColor: "var(--asc-accent-border-strong)",
          color: "var(--asc-accent)",
          background: "var(--asc-accent-dim)",
          clipPath:
            "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)",
        }}
      >
        {msgs.openMatch}
      </a>
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

  const [teams, invitations, tournamentResults, dbGames, linkedAccounts, activeMatches, rankingPointsAgg] = await Promise.all(
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
        where: {
          team: {
            members: { some: { userId: user.id } },
          },
        },
        select: {
          id: true,
          placement: true,
          points: true,
          note: true,
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
              game: { select: { name: true } },
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

      getActiveMatchesForUser(user.id),

      prisma.rankingPointEvent.aggregate({
        where: { userId: user.id },
        _sum: { points: true },
      }),
    ],
  );

  const rankingPoints = rankingPointsAgg._sum.points ?? 0;

  const bestPlacement =
    tournamentResults.length > 0
      ? Math.min(...tournamentResults.map((result) => result.placement))
      : null;

  const serializedResults = tournamentResults.map((result) => ({
    ...result,
    awardedAt: result.awardedAt.toISOString(),
  }));

  const riotAccount = linkedAccounts.find(
    (a: { provider: string }) => a.provider === GameProvider.riot_lol,
  );
  const steamAccount = linkedAccounts.find(
    (a: { provider: string }) => a.provider === GameProvider.steam,
  );

  const matchesNode = (
    <div
      className="relative overflow-hidden border"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath:
          "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      }}
    >
      <CornerMark />
      <div className="border-b px-5 py-4" style={{ borderColor: "var(--asc-line-soft)" }}>
        <p
          className="text-[10px] font-black uppercase tracking-[0.16em]"
          style={{ color: "var(--asc-accent)" }}
        >
          ▲ {messages.activeMatches.heading}
        </p>
      </div>
      <div className="p-5">
        {activeMatches.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
              {messages.activeMatches.empty}
            </p>
            <Link
              href="/tournaments"
              className="inline-flex w-fit border px-4 py-2 text-sm font-black transition hover:opacity-90"
              style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
            >
              {messages.activeMatches.browseTournaments}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeMatches.map((card) => (
              <ActiveMatchCard
                key={card.matchId}
                card={card}
                msgs={messages.activeMatches}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const accountNode = (
    <div className="grid gap-6">
      <div>
        <p
          className="text-[10px] font-black uppercase tracking-[0.16em]"
          style={{ color: "var(--asc-accent)" }}
        >
          ▲ {messages.sections.accountTitle}
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
          {messages.sections.connectedAccountsDesc}
        </p>
      </div>

      {/* Connected accounts */}
      <div
        className="relative overflow-hidden border"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <CornerMark />
        <div className="border-b px-5 py-4" style={{ borderColor: "var(--asc-line-soft)" }}>
          <p
            className="text-[10px] font-black uppercase tracking-[0.16em]"
            style={{ color: "var(--asc-accent)" }}
          >
            ▲ {messages.labels.linkedAccounts}
          </p>
          <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>
            {messages.labels.connectedGameAccounts}
          </h2>
        </div>

        <div className="grid gap-px" style={{ background: "var(--asc-line-soft)" }}>
          {/* Discord — always connected (auth provider) */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--asc-bg-1)] px-5 py-4">
            <div className="flex items-center gap-4">
              <div
                className="grid h-10 w-10 shrink-0 place-items-center border text-xs font-black"
                style={{
                  borderColor: "var(--asc-green-border)",
                  background: "var(--asc-green-bg)",
                  color: "var(--asc-green)",
                }}
              >
                D
              </div>
              <div>
                <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
                  {messages.sections.discordAccountTitle}
                </p>
                <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
                  {messages.sections.discordSubtitle}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {user.isGuildMember && (
                <span
                  className="border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.10em]"
                  style={{
                    borderColor: "var(--asc-green-border)",
                    background: "var(--asc-green-bg)",
                    color: "var(--asc-green)",
                  }}
                >
                  {messages.statuses.member}
                </span>
              )}
              <span
                className="border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.10em]"
                style={{
                  borderColor: "var(--asc-green-border)",
                  background: "var(--asc-green-bg)",
                  color: "var(--asc-green)",
                }}
              >
                {messages.labels.connected}
              </span>
            </div>
          </div>

          <LinkedAccountRow
            icon="R"
            title={messages.labels.riotAccount}
            providerName="Riot"
            subtitle="League of Legends · VALORANT"
            connected={Boolean(riotAccount)}
            displayName={
              riotAccount?.displayName ??
              (riotAccount ? riotAccount.externalId.slice(0, 8) + "…" : null)
            }
            linkedDate={
              riotAccount?.verifiedAt
                ? riotAccount.verifiedAt.toLocaleDateString(locale, { dateStyle: "medium" })
                : null
            }
            connectHref="/api/auth/riot/start"
            unlinkAction={unlinkRiotAccount}
            labels={{
              linked: messages.labels.linked,
              connected: messages.labels.connected,
              connect: messages.labels.connect,
              unlink: messages.labels.unlink,
              unlinking: messages.labels.unlinking,
              confirmationEyebrow: messages.labels.confirmationEyebrow,
              unlinkAccountConfirmTitle: messages.labels.unlinkAccountConfirmTitle,
              unlinkAccountConfirmDescription: messages.labels.unlinkAccountConfirmDescription,
              unlinkAccountConfirmButton: messages.labels.unlinkAccountConfirmButton,
              cancel: messages.labels.cancelLabel,
            }}
          />

          <LinkedAccountRow
            icon="S"
            title={messages.labels.steamAccount}
            providerName="Steam"
            subtitle={messages.labels.steamSubtitle}
            connected={Boolean(steamAccount)}
            displayName={
              steamAccount?.displayName ??
              (steamAccount ? steamAccount.externalId.slice(0, 8) + "…" : null)
            }
            linkedDate={
              steamAccount?.verifiedAt
                ? steamAccount.verifiedAt.toLocaleDateString(locale, { dateStyle: "medium" })
                : null
            }
            connectHref="/api/auth/steam/start"
            unlinkAction={unlinkSteamAccount}
            labels={{
              linked: messages.labels.linked,
              connected: messages.labels.connected,
              connect: messages.labels.connect,
              unlink: messages.labels.unlink,
              unlinking: messages.labels.unlinking,
              confirmationEyebrow: messages.labels.confirmationEyebrow,
              unlinkAccountConfirmTitle: messages.labels.unlinkAccountConfirmTitle,
              unlinkAccountConfirmDescription: messages.labels.unlinkAccountConfirmDescription,
              unlinkAccountConfirmButton: messages.labels.unlinkAccountConfirmButton,
              cancel: messages.labels.cancelLabel,
            }}
          />

          <FaceitConnectRow
            connected={Boolean(user.faceitPlayerId)}
            faceitNickname={user.faceitNickname ?? null}
            faceitSkillLevel={user.faceitSkillLevelCs2 ?? null}
            faceitLinkedAt={
              user.faceitLinkedAt
                ? user.faceitLinkedAt.toLocaleDateString(locale, { dateStyle: "medium" })
                : null
            }
            connectAction={connectFaceitAccount}
            unlinkAction={unlinkFaceitAccount}
            labels={{
              title: messages.labels.faceitAccount,
              subtitle: messages.labels.faceitSubtitle,
              help: messages.labels.faceitHelp,
              connectedHelp: messages.labels.faceitConnectedHelp,
              connected: messages.labels.connected,
              connect: messages.labels.connect,
              connecting: messages.labels.faceitConnecting,
              unlink: messages.labels.unlink,
              unlinking: messages.labels.unlinking,
              linked: messages.labels.linked,
              skillLevel: messages.labels.faceitSkillLevel,
              nicknamePlaceholder: messages.labels.faceitNicknamePlaceholder,
              confirmationEyebrow: messages.labels.confirmationEyebrow,
              unlinkAccountConfirmTitle: messages.labels.unlinkAccountConfirmTitle,
              unlinkAccountConfirmDescription: messages.labels.unlinkAccountConfirmDescription.replace("{provider}", "FACEIT"),
              unlinkAccountConfirmButton: messages.labels.unlinkAccountConfirmButton,
              cancel: messages.labels.cancelLabel,
            }}
          />
        </div>
      </div>

      {/* Privacy placeholder */}
      <div
        className="border px-5 py-5"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
              {messages.sections.privacyTitle}
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
              {messages.sections.privacyDesc}
            </p>
          </div>
          <span
            className="shrink-0 border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.10em]"
            style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-3)" }}
          >
            {messages.sections.comingSoon}
          </span>
        </div>
      </div>

      {/* Preferences placeholder */}
      <div
        className="border px-5 py-5"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
              {messages.sections.preferencesTitle}
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
              {messages.sections.preferencesDesc}
            </p>
          </div>
          <span
            className="shrink-0 border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.10em]"
            style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-3)" }}
          >
            {messages.sections.comingSoon}
          </span>
        </div>
      </div>

      {/* Security / sign out */}
      <div
        className="border"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: "var(--asc-line-soft)" }}>
          <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
            {messages.sections.securityTitle}
          </p>
        </div>
        <div className="px-5 py-5">
          <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
            {messages.sections.signOutDesc}
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
            className="mt-4"
          >
            <button
              type="submit"
              className="border px-5 py-2.5 text-sm font-black uppercase tracking-[0.10em] transition hover:opacity-80"
              style={{
                borderColor: "var(--asc-live-border)",
                color: "var(--asc-live)",
                background: "transparent",
              }}
            >
              {messages.labels.signOut}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        <section className="asc-image-hero relative min-h-[520px] overflow-hidden">
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
                "linear-gradient(180deg, rgb(12 11 9 / 0.30) 0%, rgb(12 11 9 / 0.64) 54%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, rgb(12 11 9 / 0.45) 40%, transparent 72%)",
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
                  value={rankingPoints.toLocaleString()}
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

        <section className="relative z-20 -mt-16 mx-auto max-w-[1440px] px-6 pb-20 lg:px-10">
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
            tabLabels={messages.tabLabels}
            labels={messages.labels}
            sectionLabels={messages.sections}
            statuses={messages.statuses}
            heroLabels={{
              team: messages.hero.team,
              teams: messages.hero.teams,
            }}
            matchesNode={matchesNode}
            accountNode={accountNode}
            rankingPoints={rankingPoints}
            bestPlacement={bestPlacement}
          />
        </section>

        <Footer />
      </div>
    </main>
  );
}
