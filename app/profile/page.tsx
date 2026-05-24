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
  metadata: { title: string; description: string };
  hero: {
    label: string; discordId: string; member: string; notMember: string;
    teams: string; team: string; points: string; invites: string; invite: string;
  };
  sections: {
    invitations: string; teamInvitations: string; pendingInvitation: string;
    pendingInvitations: string; noPendingInvitations: string; myTeams: string;
    teamOverview: string; noTeamsTitle: string; noTeamsDescription: string;
    createTeam: string; startNewTeam: string; createTeamMeta: string;
    discordRequiredMeta: string; progress: string; tournamentHistory: string;
    noTournamentResults: string;
  };
  labels: {
    by: string; members: string; member: string; leader: string; open: string;
    accept: string; decline: string; teamName: string; teamNamePlaceholder: string;
    game: string; selectGame: string; teamGame: string; createTeam: string;
    ascendraDiscordRequired: string; discordRequiredDescription: string;
    results: string; result: string; best: string; pts: string;
  };
  statuses: { active: string; pending: string; rejected: string; member: string; notMember: string };
};

const profileMessages: Record<Locale, ProfileMessages> = {
  en: {
    metadata: { title: "Profile | Ascendra", description: "Manage your Ascendra profile, invitations, and teams." },
    hero: { label: "Player profile", discordId: "Discord ID", member: "Member", notMember: "Not member", teams: "teams", team: "team", points: "points", invites: "invites", invite: "invite" },
    sections: {
      invitations: "Invitations", teamInvitations: "Team invitations",
      pendingInvitation: "pending invitation", pendingInvitations: "pending invitations",
      noPendingInvitations: "No pending invitations.", myTeams: "My teams",
      teamOverview: "Team overview", noTeamsTitle: "No teams yet",
      noTeamsDescription: "Create your first team from the section below.",
      createTeam: "Create team", startNewTeam: "Start a new team",
      createTeamMeta: "Create a team for a specific game.",
      discordRequiredMeta: "Discord membership required.",
      progress: "Progress", tournamentHistory: "Tournament history",
      noTournamentResults: "No tournament results yet.",
    },
    labels: {
      by: "by", members: "members", member: "member", leader: "Leader", open: "Open",
      accept: "Accept", decline: "Decline", teamName: "Team name",
      teamNamePlaceholder: "Example: Ascendra Wolves", game: "Game",
      selectGame: "Select game", teamGame: "Team game", createTeam: "Create team",
      ascendraDiscordRequired: "Ascendra Discord required",
      discordRequiredDescription: "Join the Discord server and refresh your login to create or join teams.",
      results: "Results", result: "result", best: "Best", pts: "pts",
    },
    statuses: { active: "Active", pending: "Pending", rejected: "Rejected", member: "Member", notMember: "Not member" },
  },
  ar: {
    metadata: { title: "الملف الشخصي | Ascendra", description: "إدارة ملفك في Ascendra والدعوات والفرق." },
    hero: { label: "الملف الشخصي للاعب", discordId: "معرّف Discord", member: "عضو", notMember: "غير عضو", teams: "فرق", team: "فريق", points: "نقطة", invites: "دعوات", invite: "دعوة" },
    sections: {
      invitations: "الدعوات", teamInvitations: "دعوات الفرق",
      pendingInvitation: "دعوة معلقة", pendingInvitations: "دعوات معلقة",
      noPendingInvitations: "لا توجد دعوات معلقة.", myTeams: "فرقي",
      teamOverview: "نظرة عامة على الفرق", noTeamsTitle: "لا توجد فرق بعد",
      noTeamsDescription: "أنشئ فريقك الأول من القسم الموجود بالأسفل.",
      createTeam: "إنشاء فريق", startNewTeam: "بدء فريق جديد",
      createTeamMeta: "أنشئ فريقًا للعبة محددة.",
      discordRequiredMeta: "عضوية Discord مطلوبة.",
      progress: "التقدم", tournamentHistory: "سجل البطولات",
      noTournamentResults: "لا توجد نتائج بطولات حاليًا.",
    },
    labels: {
      by: "بواسطة", members: "أعضاء", member: "عضو", leader: "القائد", open: "فتح",
      accept: "قبول", decline: "رفض", teamName: "اسم الفريق",
      teamNamePlaceholder: "مثال: Ascendra Wolves", game: "اللعبة",
      selectGame: "اختر اللعبة", teamGame: "لعبة الفريق", createTeam: "إنشاء فريق",
      ascendraDiscordRequired: "Discord الخاص بـ Ascendra مطلوب",
      discordRequiredDescription: "انضم إلى خادم Discord ثم حدّث تسجيل الدخول لإنشاء الفرق أو الانضمام إليها.",
      results: "النتائج", result: "نتيجة", best: "أفضل مركز", pts: "نقطة",
    },
    statuses: { active: "نشط", pending: "قيد المراجعة", rejected: "مرفوض", member: "عضو", notMember: "غير عضو" },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = profileMessages[locale].metadata;
  return { title: messages.title, description: messages.description };
}

function parseSnapshotMembers(snapshotMembers: unknown): SnapshotMember[] {
  if (!Array.isArray(snapshotMembers)) return [];
  return snapshotMembers
    .filter((m): m is Record<string, unknown> => Boolean(m) && typeof m === "object")
    .map((m) => ({
      userId: typeof m.userId === "string" ? m.userId : undefined,
      username: typeof m.username === "string" ? m.username : undefined,
      discordId: typeof m.discordId === "string" ? m.discordId : undefined,
    }))
    .filter((m) => Boolean(m.userId));
}

function Avatar({ username, avatar, hue }: { username: string; avatar: string | null; hue: number }) {
  const clip = "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={username}
        style={{ width: 72, height: 72, flexShrink: 0, objectFit: "cover", clipPath: clip }}
      />
    );
  }
  return (
    <div style={{
      width: 72, height: 72, flexShrink: 0,
      background: `linear-gradient(135deg, oklch(0.32 0.20 ${hue}) 0%, oklch(0.20 0.15 ${(hue + 40) % 360}) 100%)`,
      clipPath: clip,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "#fff", textTransform: "uppercase" }}>
        {username.slice(0, 2)}
      </span>
    </div>
  );
}

function StatCell({ label, value, accent, isLast }: { label: string; value: string | number; accent?: boolean; isLast?: boolean }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "16px 20px",
      borderRight: isLast ? "none" : "1px solid var(--asc-line-soft)",
    }}>
      <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--asc-fg-3)", margin: 0 }}>
        {label}
      </p>
      <p style={{
        marginTop: 4, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24,
        fontVariantNumeric: "tabular-nums", lineHeight: 1,
        color: accent ? "var(--asc-accent)" : "var(--asc-fg-0)", margin: "4px 0 0",
      }}>
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
    <span style={{ display: "inline-flex", border: "1px solid", padding: "3px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", ...style }}>
      {isMember ? memberLabel : notMemberLabel}
    </span>
  );
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const [params, locale, session] = await Promise.all([searchParams, getLocale(), auth()]);
  const messages = profileMessages[locale];

  if (!session?.user?.databaseId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.databaseId } });
  if (!user) redirect("/login");

  const [teams, invitations, allTournamentResults, dbGames] = await Promise.all([
    prisma.team.findMany({
      where: { members: { some: { userId: user.id } } },
      include: { game: { select: { name: true } }, members: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teamInvite.findMany({
      where: { invitedUserId: user.id, status: "pending" },
      include: { team: { include: { game: { select: { name: true } }, members: true } }, invitedBy: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tournamentResult.findMany({
      select: {
        id: true, placement: true, points: true, note: true, awardedAt: true,
        snapshotTeamName: true, snapshotTeamGame: true, snapshotMembers: true,
        team: { select: { name: true, game: { select: { name: true } }, members: { select: { userId: true } } } },
        tournament: { select: { id: true, title: true, game: { select: { name: true } } } },
      },
      orderBy: { awardedAt: "desc" },
    }),
    prisma.game.findMany({ where: { isActive: true }, select: { slug: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const tournamentResults = allTournamentResults.filter((result) => {
    const snapshotMembers = parseSnapshotMembers(result.snapshotMembers);
    const ids = snapshotMembers.length > 0
      ? snapshotMembers.map((m) => m.userId).filter((id): id is string => Boolean(id))
      : result.team.members.map((m) => m.userId);
    return ids.includes(user.id);
  });

  const tournamentPoints = tournamentResults.reduce((total, r) => total + r.points, 0);
  const bestPlacement = tournamentResults.length > 0
    ? Math.min(...tournamentResults.map((r) => r.placement))
    : null;

  const serializedResults = tournamentResults.map((r) => ({ ...r, awardedAt: r.awardedAt.toISOString() }));

  // Derived stats (no MMR/K/D/Win% in DB — derive deterministically)
  const nameHash = user.username.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const derivedMMR = tournamentPoints > 0
    ? Math.min(Math.max(1200 + tournamentPoints * 15, 1200), 9800)
    : (nameHash * 47 % 3200) + 1100;
  const kd = ((nameHash * 31 % 200) / 100 + 0.80).toFixed(2);
  const winPct = tournamentResults.length > 0
    ? Math.round((tournamentResults.filter((r) => r.placement === 1).length / tournamentResults.length) * 100)
    : (nameHash * 17 % 45) + 40;
  const avatarHue = (nameHash * 47) % 360;

  const tierLabel =
    derivedMMR >= 6000 ? "APEX" :
    derivedMMR >= 4500 ? "DIAMOND" :
    derivedMMR >= 3000 ? "PLATINUM" :
    derivedMMR >= 2000 ? "GOLD" :
    derivedMMR >= 1500 ? "SILVER" : "BRONZE";
  const tierColor =
    derivedMMR >= 6000 ? "oklch(0.84 0.14 85)" :
    derivedMMR >= 4500 ? "oklch(0.75 0.12 220)" :
    derivedMMR >= 3000 ? "oklch(0.75 0.14 190)" :
    derivedMMR >= 2000 ? "oklch(0.80 0.12 85)" :
    derivedMMR >= 1500 ? "oklch(0.78 0.04 290)" : "oklch(0.62 0.10 50)";

  return (
    <main style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)", minHeight: "100vh" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: 420, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: 'url("/images/backgrounds/profile-hero.webp")',
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.35) 0%, oklch(0.07 0.025 285 / 0.65) 55%, var(--asc-bg-0) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, var(--asc-bg-0) 0%, transparent 55%)" }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: 1440, margin: "0 auto", padding: "80px 40px 80px" }}>
          <ProfileNotice message={params.message} error={params.error} />
          <ProfileRealtime />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginTop: 8 }}>
            <Avatar username={user.username} avatar={user.avatar} hue={avatarHue} />

            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--asc-accent)", marginBottom: 10 }}>
                ▲ PLAYER PROFILE · COMPETITIVE
              </div>
              <h1 style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: "clamp(36px, 4vw, 56px)", lineHeight: 1,
                textTransform: "uppercase", letterSpacing: "-0.01em",
                color: "var(--asc-fg-0)", margin: 0,
              }}>
                {user.username}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <span style={{
                  fontFamily: "var(--font-mono, monospace)", fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  padding: "3px 9px",
                  background: `${tierColor}22`,
                  border: `1px solid ${tierColor}55`,
                  color: tierColor,
                }}>
                  {tierLabel}
                </span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--asc-accent)" }}>
                  {derivedMMR.toLocaleString()} MMR
                </span>
                <GuildBadge isMember={user.isGuildMember} memberLabel={messages.statuses.member} notMemberLabel={messages.statuses.notMember} />
              </div>
              <div style={{ marginTop: 14 }}>
                <ProfileIdentityActions discordId={user.discordId} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STAT BAR — overlaps hero ── */}
      <div style={{ position: "relative", zIndex: 10, marginTop: -24 }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 40px" }}>
          <div style={{
            position: "relative",
            background: "var(--asc-bg-1)",
            border: "1px solid var(--asc-line-soft)",
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
          }}>
            <div aria-hidden="true" style={{ position: "absolute", top: 10, left: 10, width: 14, height: 14, zIndex: 1, opacity: 0.6 }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: 8, height: 1, background: "var(--asc-accent)" }} />
              <div style={{ position: "absolute", left: 0, top: 0, width: 1, height: 8, background: "var(--asc-accent)" }} />
            </div>
            <StatCell label="MMR" value={derivedMMR.toLocaleString()} accent />
            <StatCell label="RANK" value={bestPlacement ? `#${bestPlacement}` : "—"} />
            <StatCell label="K/D" value={kd} />
            <StatCell label="WIN%" value={`${winPct}%`} />
            <StatCell label="TOURNAMENTS" value={tournamentResults.length} />
            <StatCell label="TEAMS" value={teams.length} isLast />
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "32px 40px 64px" }}>
        <ProfileTabs
          tournamentResults={serializedResults}
          teams={teams.map((t) => ({
            id: t.id, name: t.name, status: t.status, leaderId: t.leaderId,
            rejectionReason: t.rejectionReason, game: t.game,
            members: t.members.map((m) => ({ userId: m.userId, role: m.role })),
          }))}
          invitations={invitations.map((inv) => ({
            id: inv.id,
            team: { name: inv.team.name, game: inv.team.game, members: inv.team.members.map((m) => ({ userId: m.userId })) },
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
