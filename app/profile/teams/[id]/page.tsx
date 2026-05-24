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
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
};

type TeamPageMessages = {
  metadata: { title: string; description: string };
  hero: { backToProfile: string; label: string; lockedWhileRegistered: string };
  common: {
    member: string; members: string; invite: string; invites: string;
    pendingInvite: string; pendingInvites: string; points: string; pts: string;
    results: string; result: string; best: string; leader: string;
    active: string; pending: string; invited: string; locked: string;
    rejected: string; open: string; dash: string;
  };
  sections: {
    settings: string; teamSetup: string; lockedSettingsMeta: string;
    leaderSettingsMeta: string; memberSettingsMeta: string; invitePlayer: string;
    history: string; tournamentResults: string; roster: string; playersAndInvites: string;
  };
  settings: {
    saveChanges: string; saving: string; teamName: string; game: string;
    selectGame: string; teamGame: string; lockedDescription: string;
    onlyLeaderDescription: string; usernameOrDiscordId: string; playerPlaceholder: string;
    sendInvite: string; sending: string; leaveTeam: string; leaving: string;
    leaveTeamTitle: string; leaveTeamDescription: string; leaveTeamConfirm: string;
    deleteTeam: string; deleting: string; deleteTeamTitle: string;
    deleteTeamDescription: string; deleteTeamConfirm: string;
  };
  history: { noResults: string };
  roster: {
    makeLeader: string; transferring: string; transferTitle: string; transferDescription: string;
    transferConfirm: string; remove: string; removing: string; removeTitle: string;
    removeDescription: string; removeConfirm: string; cancel: string; cancelling: string;
    cancelInviteTitle: string; cancelInviteDescription: string; cancelInviteConfirm: string;
    noPlayers: string;
  };
  modal: { confirmation: string; confirmAction: string; cancel: string };
};

const teamPageMessages: Record<Locale, TeamPageMessages> = {
  en: {
    metadata: { title: "Manage Team | Ascendra", description: "Manage your Ascendra team." },
    hero: { backToProfile: "Back to profile", label: "Team management", lockedWhileRegistered: "Locked while registered for" },
    common: {
      member: "member", members: "members", invite: "invite", invites: "invites",
      pendingInvite: "pending invite", pendingInvites: "pending invites", points: "points", pts: "pts",
      results: "Results", result: "result", best: "Best", leader: "Leader",
      active: "Active", pending: "Pending", invited: "Invited", locked: "Locked",
      rejected: "Rejected", open: "Open", dash: "—",
    },
    sections: {
      settings: "Settings", teamSetup: "Team setup",
      lockedSettingsMeta: "Locked while registered in an active tournament.",
      leaderSettingsMeta: "Edit team name, game, invites, and team actions.",
      memberSettingsMeta: "Only the leader can edit team settings.",
      invitePlayer: "Invite player", history: "History",
      tournamentResults: "Tournament results", roster: "Roster", playersAndInvites: "Players and invites",
    },
    settings: {
      saveChanges: "Save changes", saving: "Saving...", teamName: "Team name", game: "Game",
      selectGame: "Select game", teamGame: "Team game",
      lockedDescription: "Settings are locked while this team is registered in an active tournament. They unlock after the tournament ends or the registration is cancelled.",
      onlyLeaderDescription: "Only the team leader can edit settings.",
      usernameOrDiscordId: "Username or Discord ID", playerPlaceholder: "Example: AscendraPlayer or 615...",
      sendInvite: "Send invite", sending: "Sending...", leaveTeam: "Leave team", leaving: "Leaving...",
      leaveTeamTitle: "Leave team?", leaveTeamDescription: "Are you sure you want to leave {teamName}?",
      leaveTeamConfirm: "Leave team", deleteTeam: "Delete team", deleting: "Deleting...",
      deleteTeamTitle: "Delete team?",
      deleteTeamDescription: "Are you sure you want to delete {teamName}? This cannot be undone.",
      deleteTeamConfirm: "Delete permanently",
    },
    history: { noResults: "No tournament results yet." },
    roster: {
      makeLeader: "Make leader", transferring: "Transferring...", transferTitle: "Transfer leadership?",
      transferDescription: "Make {username} the new team leader?", transferConfirm: "Transfer",
      remove: "Remove", removing: "Removing...", removeTitle: "Remove player?",
      removeDescription: "Remove {username} from this team?", removeConfirm: "Remove",
      cancel: "Cancel", cancelling: "Cancelling...", cancelInviteTitle: "Cancel invitation?",
      cancelInviteDescription: "Cancel the invitation sent to {username}?", cancelInviteConfirm: "Cancel invite",
      noPlayers: "No players in this team yet.",
    },
    modal: { confirmation: "Confirmation", confirmAction: "Confirm action", cancel: "Cancel" },
  },
  ar: {
    metadata: { title: "إدارة الفريق | Ascendra", description: "إدارة فريقك في Ascendra." },
    hero: { backToProfile: "العودة إلى الملف الشخصي", label: "إدارة الفريق", lockedWhileRegistered: "مقفل أثناء التسجيل في" },
    common: {
      member: "عضو", members: "أعضاء", invite: "دعوة", invites: "دعوات",
      pendingInvite: "دعوة معلقة", pendingInvites: "دعوات معلقة", points: "نقطة", pts: "نقطة",
      results: "النتائج", result: "نتيجة", best: "أفضل مركز", leader: "القائد",
      active: "نشط", pending: "قيد المراجعة", invited: "تمت الدعوة", locked: "مقفل",
      rejected: "مرفوض", open: "فتح", dash: "—",
    },
    sections: {
      settings: "الإعدادات", teamSetup: "إعداد الفريق",
      lockedSettingsMeta: "مقفل أثناء تسجيل الفريق في بطولة نشطة.",
      leaderSettingsMeta: "تعديل اسم الفريق واللعبة والدعوات وإجراءات الفريق.",
      memberSettingsMeta: "يمكن لقائد الفريق فقط تعديل الإعدادات.",
      invitePlayer: "دعوة لاعب", history: "السجل",
      tournamentResults: "نتائج البطولات", roster: "القائمة", playersAndInvites: "اللاعبون والدعوات",
    },
    settings: {
      saveChanges: "حفظ التغييرات", saving: "جارٍ الحفظ...", teamName: "اسم الفريق", game: "اللعبة",
      selectGame: "اختر اللعبة", teamGame: "لعبة الفريق",
      lockedDescription: "إعدادات الفريق مقفلة أثناء تسجيله في بطولة نشطة. سيتم فتحها بعد انتهاء البطولة أو إلغاء التسجيل.",
      onlyLeaderDescription: "يمكن لقائد الفريق فقط تعديل الإعدادات.",
      usernameOrDiscordId: "اسم المستخدم أو معرّف Discord", playerPlaceholder: "مثال: AscendraPlayer أو 615...",
      sendInvite: "إرسال الدعوة", sending: "جارٍ الإرسال...", leaveTeam: "مغادرة الفريق", leaving: "جارٍ المغادرة...",
      leaveTeamTitle: "مغادرة الفريق؟", leaveTeamDescription: "هل أنت متأكد أنك تريد مغادرة فريق {teamName}؟",
      leaveTeamConfirm: "مغادرة الفريق", deleteTeam: "حذف الفريق", deleting: "جارٍ الحذف...",
      deleteTeamTitle: "حذف الفريق؟",
      deleteTeamDescription: "هل أنت متأكد أنك تريد حذف فريق {teamName}؟ لا يمكن التراجع عن هذا الإجراء.",
      deleteTeamConfirm: "حذف نهائي",
    },
    history: { noResults: "لا توجد نتائج بطولات حاليًا." },
    roster: {
      makeLeader: "جعله قائدًا", transferring: "جارٍ نقل القيادة...", transferTitle: "نقل قيادة الفريق؟",
      transferDescription: "هل تريد جعل {username} القائد الجديد للفريق؟", transferConfirm: "نقل القيادة",
      remove: "إزالة", removing: "جارٍ الإزالة...", removeTitle: "إزالة اللاعب؟",
      removeDescription: "هل تريد إزالة {username} من هذا الفريق؟", removeConfirm: "إزالة",
      cancel: "إلغاء", cancelling: "جارٍ الإلغاء...", cancelInviteTitle: "إلغاء الدعوة؟",
      cancelInviteDescription: "هل تريد إلغاء الدعوة المرسلة إلى {username}؟", cancelInviteConfirm: "إلغاء الدعوة",
      noPlayers: "لا يوجد لاعبون في هذا الفريق حاليًا.",
    },
    modal: { confirmation: "تأكيد", confirmAction: "تأكيد الإجراء", cancel: "إلغاء" },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = teamPageMessages[locale].metadata;
  return { title: messages.title, description: messages.description };
}

function formatTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

function getCountLabel(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

const pillStyleMap: Record<string, React.CSSProperties> = {
  green: { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
  blue: { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" },
  red: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
  gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
  violet: { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
};

function Pill({ label, tone = "violet" }: { label: string; tone?: "green" | "blue" | "red" | "gray" | "violet" }) {
  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={pillStyleMap[tone]}>
      {label}
    </span>
  );
}

function StatusBadge({ status, messages }: { status: string; messages: TeamPageMessages }) {
  const s = status.toLowerCase();
  if (s === "approved") return <Pill label={messages.common.active} tone="green" />;
  if (s === "leader") return <Pill label={messages.common.leader} tone="green" />;
  if (s === "member") return <Pill label={messages.common.member} tone="violet" />;
  if (s === "pending") return <Pill label={messages.common.pending} tone="blue" />;
  if (s === "invited") return <Pill label={messages.common.invited} tone="blue" />;
  if (s === "locked") return <Pill label={messages.common.locked} tone="blue" />;
  if (s === "rejected") return <Pill label={messages.common.rejected} tone="red" />;
  return <Pill label={status} tone="gray" />;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>{label}</p>
      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

const inputStyle: React.CSSProperties = { borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-0)" };

function CollapsibleSection({ label, title, meta, children, defaultOpen = false }: {
  label: string; title: string; meta?: string; children: ReactNode; defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden border shadow-2xl shadow-black/20"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>{label}</p>
          <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{title}</h2>
          {meta && <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>{meta}</p>}
        </div>
        <span
          className="grid h-10 w-10 shrink-0 place-items-center border text-lg font-black transition group-open:rotate-45"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-2)" }}
        >+</span>
      </summary>
      <div style={{ borderTop: "1px solid var(--asc-line-soft)" }}>{children}</div>
    </details>
  );
}

export default async function TeamDetailsPage({ params, searchParams }: TeamDetailsPageProps) {
  const [{ id }, noticeParams, session, locale] = await Promise.all([params, searchParams, auth(), getLocale()]);
  const messages = teamPageMessages[locale];

  if (!session?.user?.databaseId) redirect("/login");

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      leader: true,
      game: { select: { name: true, slug: true } },
      members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
      invites: {
        where: { status: "pending" },
        include: { invitedUser: true, invitedBy: true },
        orderBy: { createdAt: "desc" },
      },
      results: {
        include: {
          tournament: { select: { id: true, title: true, game: { select: { name: true } }, startsAt: true } },
        },
        orderBy: [{ awardedAt: "desc" }],
      },
      registrations: {
        where: {
          status: { in: ["registered", "approved"] },
          tournament: { status: { notIn: ["ended", "cancelled"] } },
        },
        include: { tournament: { select: { id: true, title: true, status: true, registrationStatus: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!team) notFound();

  const dbGames = await prisma.game.findMany({
    where: { isActive: true },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  const currentMembership = team.members.find((m) => m.userId === session.user.databaseId);
  const isLeader = team.leaderId === session.user.databaseId;
  const canManage = Boolean(currentMembership);
  const activeRegistration = team.registrations[0] || null;
  const isTeamLocked = Boolean(activeRegistration);

  if (!canManage) redirect("/profile");

  const totalTeamPoints = team.results.reduce((total, r) => total + r.points, 0);
  const bestPlacement = team.results.length > 0 ? Math.min(...team.results.map((r) => r.placement)) : null;
  const teamImage = getGameImageUrl(team.game?.slug ?? null);

  return (
    <main className="min-h-screen overflow-hidden" style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}>
      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[500px] overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${teamImage}")` }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,oklch(0.06 0.03 287 / 0.92) 0%,oklch(0.06 0.03 287 / 0.62) 48%,oklch(0.06 0.03 287 / 0.82) 100%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-52" style={{ background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))" }} />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-28 pt-16 lg:px-10">
            <ProfileNotice message={noticeParams.message} error={noticeParams.error} />
            <ProfileRealtime />

            <Link
              href="/profile"
              className="mt-4 inline-flex border px-4 py-2 text-sm font-black transition hover:opacity-90"
              style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-2)" }}
            >
              {locale === "ar" ? "→" : "←"} {messages.hero.backToProfile}
            </Link>

            <section className="mt-8 border p-6 shadow-2xl shadow-black/30 backdrop-blur" style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.09 0.035 287 / 0.75)" }}>
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>{messages.hero.label}</p>
                  <h1 className="mt-2 text-4xl font-black uppercase tracking-tight md:text-6xl" style={{ color: "var(--asc-fg-0)" }}>{team.name}</h1>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge status={team.status} messages={messages} />
                    <Pill label={team.game?.name ?? "—"} />
                    <Pill label={`${team.members.length} ${getCountLabel(team.members.length, messages.common.member, messages.common.members)}`} />
                    <Pill label={`${totalTeamPoints} ${messages.common.points}`} tone="green" />
                    {isTeamLocked && <StatusBadge status="Locked" messages={messages} />}
                    {team.invites.length > 0 && (
                      <Pill label={`${team.invites.length} ${getCountLabel(team.invites.length, messages.common.pendingInvite, messages.common.pendingInvites)}`} tone="blue" />
                    )}
                  </div>
                  {activeRegistration && (
                    <p className="mt-4 max-w-2xl text-sm leading-6" style={{ color: "var(--asc-blue)" }}>
                      {messages.hero.lockedWhileRegistered}{" "}
                      <Link href={`/tournaments/${activeRegistration.tournament.id}`} className="font-black transition hover:opacity-80" style={{ color: "var(--asc-fg-0)" }}>
                        {activeRegistration.tournament.title}
                      </Link>.
                    </p>
                  )}
                  {team.rejectionReason && (
                    <p className="mt-4 max-w-2xl text-sm leading-6" style={{ color: "var(--asc-live)" }}>{team.rejectionReason}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-5 lg:text-right">
                  <Stat label={messages.common.leader} value={team.leader.username} />
                  <Stat label={messages.common.results} value={team.results.length} />
                  <Stat label={messages.common.best} value={bestPlacement ? `#${bestPlacement}` : "-"} />
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
              meta={isTeamLocked ? messages.sections.lockedSettingsMeta : isLeader ? messages.sections.leaderSettingsMeta : messages.sections.memberSettingsMeta}
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
                        <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>{messages.settings.teamName}</span>
                        <input name="name" required defaultValue={team.name} className="border px-4 py-3 outline-none transition" style={inputStyle} />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>{messages.settings.game}</span>
                        <CustomSelect name="gameSlug" required placeholder={messages.settings.selectGame} defaultValue={team.game?.slug ?? ""} options={dbGames.map((g) => ({ value: g.slug, label: g.name, description: messages.settings.teamGame }))} />
                      </label>
                    </div>
                  </InlineTeamActionForm>
                ) : (
                  <p className="text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
                    {isTeamLocked ? messages.settings.lockedDescription : messages.settings.onlyLeaderDescription}
                  </p>
                )}

                {isLeader && !isTeamLocked && (
                  <div className="pt-5" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>{messages.sections.invitePlayer}</p>
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
                        <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>{messages.settings.usernameOrDiscordId}</span>
                        <input name="player" required placeholder={messages.settings.playerPlaceholder} className="border px-4 py-3 outline-none transition" style={inputStyle} />
                      </label>
                    </InlineTeamActionForm>
                  </div>
                )}

                {!isLeader && !isTeamLocked && (
                  <div className="pt-5" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
                    <InlineTeamActionForm
                      action={leaveTeamInline}
                      buttonLabel={messages.settings.leaveTeam}
                      pendingLabel={messages.settings.leaving}
                      variant="danger"
                      confirmEyebrow={messages.modal.confirmation}
                      confirmTitle={messages.settings.leaveTeamTitle}
                      confirmDescription={formatTemplate(messages.settings.leaveTeamDescription, { teamName: team.name })}
                      confirmLabel={messages.settings.leaveTeamConfirm}
                      cancelLabel={messages.modal.cancel}
                    >
                      <input type="hidden" name="teamId" value={team.id} />
                    </InlineTeamActionForm>
                  </div>
                )}

                {isLeader && !isTeamLocked && (
                  <div className="pt-5" style={{ borderTop: "1px solid oklch(0.50 0.20 25 / 0.3)" }}>
                    <InlineTeamActionForm
                      action={deleteTeamInline}
                      buttonLabel={messages.settings.deleteTeam}
                      pendingLabel={messages.settings.deleting}
                      variant="danger"
                      confirmEyebrow={messages.modal.confirmation}
                      confirmTitle={messages.settings.deleteTeamTitle}
                      confirmDescription={formatTemplate(messages.settings.deleteTeamDescription, { teamName: team.name })}
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
              meta={`${team.results.length} ${getCountLabel(team.results.length, messages.common.result, messages.common.results)} · ${totalTeamPoints} ${messages.common.points}`}
              defaultOpen={team.results.length > 0}
            >
              <div className="grid grid-cols-3 gap-5 p-5" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
                <Stat label={messages.common.points} value={totalTeamPoints} />
                <Stat label={messages.common.results} value={team.results.length} />
                <Stat label={messages.common.best} value={bestPlacement ? `#${bestPlacement}` : "-"} />
              </div>

              {team.results.length === 0 ? (
                <div className="p-5 text-sm" style={{ color: "var(--asc-fg-3)" }}>{messages.history.noResults}</div>
              ) : (
                <div>
                  {team.results.map((result, idx) => (
                    <article
                      key={result.id}
                      className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_100px_100px] md:items-center"
                      style={idx < team.results.length - 1 ? { borderBottom: "1px solid var(--asc-line-soft)" } : {}}
                    >
                      <div>
                        <Link href={`/tournaments/${result.tournament.id}`} className="font-black transition hover:opacity-80" style={{ color: "var(--asc-fg-0)" }}>
                          {result.tournament.title}
                        </Link>
                        <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                          {result.tournament.game?.name ?? "—"} · {result.tournament.startsAt?.toLocaleDateString() ?? "—"}
                        </p>
                        {result.note && <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>{result.note}</p>}
                      </div>
                      <Pill label={`#${result.placement}`} tone="blue" />
                      <Pill label={`${result.points} ${messages.common.pts}`} tone="green" />
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
              meta={`${team.members.length} ${getCountLabel(team.members.length, messages.common.member, messages.common.members)} · ${team.invites.length} ${getCountLabel(team.invites.length, messages.common.invite, messages.common.invites)}`}
              defaultOpen
            >
              <div>
                {team.members.map((member, idx) => {
                  const isMemberLeader = member.userId === team.leaderId;
                  return (
                    <div
                      key={member.id}
                      className="grid gap-3 px-5 py-4"
                      style={idx < team.members.length - 1 || team.invites.length > 0 ? { borderBottom: "1px solid var(--asc-line-soft)" } : {}}
                    >
                      <div>
                        <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>{member.user.username}</p>
                        <p className="mt-1 break-all text-xs" style={{ color: "var(--asc-fg-3)" }}>{member.user.discordId}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <StatusBadge status={isMemberLeader ? "Leader" : "Member"} messages={messages} />
                        {isLeader && !isMemberLeader && !isTeamLocked ? (
                          <div className="flex flex-wrap gap-2">
                            <InlineTeamActionForm
                              action={transferTeamLeadershipInline}
                              buttonLabel={messages.roster.makeLeader}
                              pendingLabel={messages.roster.transferring}
                              variant="secondary"
                              confirmEyebrow={messages.modal.confirmation}
                              confirmTitle={messages.roster.transferTitle}
                              confirmDescription={formatTemplate(messages.roster.transferDescription, { username: member.user.username })}
                              confirmLabel={messages.roster.transferConfirm}
                              cancelLabel={messages.modal.cancel}
                            >
                              <input type="hidden" name="teamId" value={team.id} />
                              <input type="hidden" name="memberId" value={member.id} />
                            </InlineTeamActionForm>
                            <InlineTeamActionForm
                              action={removeTeamMemberInline}
                              buttonLabel={messages.roster.remove}
                              pendingLabel={messages.roster.removing}
                              variant="danger"
                              confirmEyebrow={messages.modal.confirmation}
                              confirmTitle={messages.roster.removeTitle}
                              confirmDescription={formatTemplate(messages.roster.removeDescription, { username: member.user.username })}
                              confirmLabel={messages.roster.removeConfirm}
                              cancelLabel={messages.modal.cancel}
                            >
                              <input type="hidden" name="teamId" value={team.id} />
                              <input type="hidden" name="memberId" value={member.id} />
                            </InlineTeamActionForm>
                          </div>
                        ) : (
                          <span className="text-sm" style={{ color: "var(--asc-fg-3)" }}>{messages.common.dash}</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {team.invites.map((invite, idx) => (
                  <div
                    key={invite.id}
                    className="grid gap-3 px-5 py-4"
                    style={idx < team.invites.length - 1 ? { borderBottom: "1px solid var(--asc-line-soft)" } : {}}
                  >
                    <div>
                      <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>{invite.invitedUser.username}</p>
                      <p className="mt-1 break-all text-xs" style={{ color: "var(--asc-fg-3)" }}>{invite.invitedUser.discordId}</p>
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
                          confirmDescription={formatTemplate(messages.roster.cancelInviteDescription, { username: invite.invitedUser.username })}
                          confirmLabel={messages.roster.cancelInviteConfirm}
                          cancelLabel={messages.modal.cancel}
                        >
                          <input type="hidden" name="teamId" value={team.id} />
                          <input type="hidden" name="inviteId" value={invite.id} />
                        </InlineTeamActionForm>
                      ) : (
                        <span className="text-sm" style={{ color: "var(--asc-fg-3)" }}>{messages.common.dash}</span>
                      )}
                    </div>
                  </div>
                ))}

                {team.members.length === 0 && team.invites.length === 0 && (
                  <div className="p-5" style={{ color: "var(--asc-fg-3)" }}>{messages.roster.noPlayers}</div>
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
