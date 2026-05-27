import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import FaceitMatchProofForm from "@/components/FaceitMatchProofForm";
import Footer from "@/components/Footer";
import MatchCheckInPanel from "@/components/MatchCheckInPanel";
import MatchAdminControls from "@/components/MatchAdminControls";
import MatchRealtimeRefresh from "@/components/MatchRealtimeRefresh";
import { parseCs2Metadata } from "@/lib/gameIntegrations/steamCs2Adapter";
import { DisputeForm, MatchReportForm } from "@/components/MatchReportForm";
import DotaMatchIdForm from "@/components/DotaMatchIdForm";
import ValorantMatchIdForm from "@/components/ValorantMatchIdForm";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { isCs2Game } from "@/lib/isCs2Game";
import { isFaceitAutoConfirmEnabled } from "@/lib/faceitAutoConfirm";
import { normalizeFaceitParsedResultView } from "@/lib/faceitParsedResultView";
import {
  determineUserMatchTeam,
  summarizeMatchCheckIns,
  type MatchCheckInRecord,
  type MatchCheckInSummary,
} from "@/lib/matchCheckIn";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string; matchId: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
};

// ─── i18n ─────────────────────────────────────────────────────────────────────

type MatchStatuses = {
  scheduled: string; ready: string; room_created: string; in_progress: string;
  result_pending: string; disputed: string; confirmed: string; completed: string;
  cancelled: string; forfeit: string; bye: string;
};

type ReportStatuses = { submitted: string; confirmed: string; rejected: string; superseded: string };

type MatchDetailMessages = {
  meta: { round: string; match: string; matchDetail: string };
  breadcrumb: { tournaments: string; matchCenter: string };
  vs: { teamA: string; teamB: string; winner: string; vs: string; scheduled: string; winnerBadge: string };
  matchStatuses: MatchStatuses;
  reportStatuses: ReportStatuses;
  gameRoom: { eyebrow: string; title: string; roomCode: string; password: string; joinUrl: string };
  cs2: {
    dedicatedMode: string; manualMode: string; serverDetailsTitle: string;
    dedicatedDesc: string; manualDesc: string; warning: string;
    serverAddress: string; gotvSpectator: string; logSource: string;
  };
  lol: { title: string; desc: string };
  games: { eyebrow: string; played: string; title: string; game: string };
  reports: { eyebrow: string; title: string; declaredWinner: string; score: string; viewEvidence: string; noMatchId: string };
  submit: { eyebrow: string; title: string };
  dispute: { eyebrow: string; title: string; desc: string };
  login: { participate: string; signInDesc: string; signIn: string };
  verif: { title: string; submitMatchId: string };
  matchInfo: { title: string; round: string; match: string; format: string; status: string; type: string; byeValue: string; completed: string };
  faceit: { eyebrow: string; title: string };
  cs2PlayerMatch: {
    eyebrow: string;
    title: string;
    matchup: string;
    playedOnFaceit: string;
    joinWhenAvailable: string;
    afterMatchSync: string;
    autoConfirmEnabled: string;
    autoConfirmDisabled: string;
    openRoom: string;
    matchIdLabel: string;
    roomUnavailable: string;
  };
  faceitWorkflow: {
    eyebrow: string;
    title: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    note: string;
    teamReadiness: string;
    faceitReady: string;
    steamReady: string;
    autoConfirmEnabled: string;
    autoConfirmDisabled: string;
  };
  backLink: string;
};

const matchDetailMessages: Record<Locale, MatchDetailMessages> = {
  en: {
    meta: { round: "Round", match: "Match", matchDetail: "Match Detail" },
    breadcrumb: { tournaments: "Tournaments", matchCenter: "Match Center" },
    vs: { teamA: "Team A", teamB: "Team B", winner: "Winner", vs: "vs", scheduled: "Scheduled", winnerBadge: "✓ Winner" },
    matchStatuses: {
      scheduled: "Scheduled", ready: "Ready", room_created: "Room Created",
      in_progress: "Live", result_pending: "Awaiting Result", disputed: "Disputed",
      confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled",
      forfeit: "Forfeit", bye: "Bye",
    },
    reportStatuses: { submitted: "Pending review", confirmed: "Confirmed", rejected: "Rejected", superseded: "Superseded" },
    gameRoom: { eyebrow: "Game Room", title: "Room Details", roomCode: "Room Code", password: "Password", joinUrl: "Join URL" },
    cs2: {
      dedicatedMode: "Dedicated Server", manualMode: "Manual Lobby",
      serverDetailsTitle: "Server Details",
      dedicatedDesc: "Connect using the details below. Result reporting via SRCDS log ingestion — submit manually if automation is unavailable.",
      manualDesc: "Connect using the details below. After the match, submit your result via the Match Report form with a screenshot as evidence.",
      warning: "After the match ends, submit your result using the Match Report form with a screenshot as evidence. Both teams must report — if they agree, the result is confirmed automatically.",
      serverAddress: "Server Address", gotvSpectator: "GOTV Spectator", logSource: "Log Source",
    },
    lol: {
      title: "Tournament Codes",
      desc: "Paste the code in the League client → Play → Tournament. The result is reported automatically when the game ends.",
    },
    games: { eyebrow: "Games", played: "played", title: "Game-by-Game", game: "Game" },
    reports: { eyebrow: "Reports", title: "Submitted Reports", declaredWinner: "Declared winner", score: "Score", viewEvidence: "View evidence →", noMatchId: "No match ID submitted" },
    submit: { eyebrow: "Match Report", title: "Submit Result" },
    dispute: { eyebrow: "Dispute", title: "Open a Dispute", desc: "If there is a problem with the submitted result, describe it below. Admins will review both reports and resolve the match." },
    login: { participate: "Participate", signInDesc: "Sign in to submit your team's match result or open a dispute.", signIn: "Sign In ›" },
    verif: { title: "Game Status", submitMatchId: "Submit Match ID" },
    matchInfo: { title: "Match Info", round: "Round", match: "Match", format: "Best of", status: "Status", type: "Type", byeValue: "Bye (Auto-advance)", completed: "Completed" },
    faceit: { eyebrow: "FACEIT CS2", title: "FACEIT CS2 Proof" },
    cs2PlayerMatch: {
      eyebrow: "FACEIT CS2",
      title: "Your CS2 match",
      matchup: "Matchup",
      playedOnFaceit: "This match is played on FACEIT.",
      joinWhenAvailable: "Join the FACEIT room when the link is available.",
      afterMatchSync: "After the match ends, Ascendra can sync the score, map, and stats from FACEIT.",
      autoConfirmEnabled: "Auto-confirm is enabled. The official result may be applied automatically.",
      autoConfirmDisabled: "Auto-confirm is disabled. Proof will be stored for admin review.",
      openRoom: "Open FACEIT room",
      matchIdLabel: "FACEIT Match ID",
      roomUnavailable:
        "FACEIT room link is not available yet. Wait for an admin or tournament organizer to add it.",
    },
    faceitWorkflow: {
      eyebrow: "FACEIT CS2",
      title: "CS2 FACEIT workflow",
      step1: "Play the CS2 match on FACEIT with the correct teams.",
      step2: "After the match ends, copy the FACEIT match ID or room URL.",
      step3: "An admin or authorized participant adds the FACEIT match ID below.",
      step4: "Ascendra syncs the score, map, stats, demo link, and match status.",
      step5: "If auto-confirm is enabled and team mapping is verified, Ascendra can apply the official result automatically.",
      note: "When auto-confirm is disabled, FACEIT proof is stored for review and the official result remains manual.",
      teamReadiness: "Team readiness",
      faceitReady: "FACEIT ready",
      steamReady: "Steam ready",
      autoConfirmEnabled: "Auto-confirm is enabled",
      autoConfirmDisabled: "Auto-confirm is disabled",
    },
    backLink: "All Matches",
  },
  ar: {
    meta: { round: "الجولة", match: "المباراة", matchDetail: "تفاصيل المباراة" },
    breadcrumb: { tournaments: "البطولات", matchCenter: "مركز المباريات" },
    vs: { teamA: "الفريق أ", teamB: "الفريق ب", winner: "الفائز", vs: "مقابل", scheduled: "موعد مجدول", winnerBadge: "✓ الفائز" },
    matchStatuses: {
      scheduled: "مجدولة", ready: "جاهزة", room_created: "الغرفة منشأة",
      in_progress: "جارية", result_pending: "في انتظار النتيجة", disputed: "متنازع عليها",
      confirmed: "مؤكدة", completed: "مكتملة", cancelled: "ملغاة",
      forfeit: "خسارة بالتخلف", bye: "تأهل تلقائي",
    },
    reportStatuses: { submitted: "قيد المراجعة", confirmed: "مؤكد", rejected: "مرفوض", superseded: "مُستبدل" },
    gameRoom: { eyebrow: "غرفة اللعب", title: "تفاصيل الغرفة", roomCode: "رمز الغرفة", password: "كلمة المرور", joinUrl: "رابط الانضمام" },
    cs2: {
      dedicatedMode: "خادم مخصص", manualMode: "صالة يدوية",
      serverDetailsTitle: "تفاصيل الخادم",
      dedicatedDesc: "الاتصال باستخدام التفاصيل أدناه. يتم الإبلاغ عن النتيجة عبر استيعاب سجلات SRCDS — قدّمها يدويًا إذا لم تكن الأتمتة متاحة.",
      manualDesc: "الاتصال باستخدام التفاصيل أدناه. بعد المباراة، قدّم نتيجتك عبر نموذج تقرير المباراة مع لقطة شاشة كدليل.",
      warning: "بعد انتهاء المباراة، قدّم نتيجتك باستخدام نموذج تقرير المباراة مع لقطة شاشة كدليل. يجب أن يُقدّم كلا الفريقين تقريرًا — وإذا اتفقا، تُؤكّد النتيجة تلقائيًا.",
      serverAddress: "عنوان الخادم", gotvSpectator: "مراقب GOTV", logSource: "مصدر السجلات",
    },
    lol: {
      title: "رموز البطولة",
      desc: "الصق الرمز في عميل League (Play > Tournament). تُبلَّغ النتيجة تلقائيًا عند انتهاء اللعبة.",
    },
    games: { eyebrow: "المباريات", played: "ملعوبة", title: "لعبة بلعبة", game: "لعبة" },
    reports: { eyebrow: "التقارير", title: "التقارير المقدمة", declaredWinner: "الفائز المُعلن", score: "النتيجة", viewEvidence: "عرض الدليل ←", noMatchId: "لم يُقدم معرف مباراة" },
    submit: { eyebrow: "تقرير المباراة", title: "تقديم النتيجة" },
    dispute: { eyebrow: "اعتراض", title: "تقديم اعتراض", desc: "إذا كانت هناك مشكلة في النتيجة المُقدمة، صفها أدناه. سيراجع المشرفون كلا التقريرين ويُحسمون المباراة." },
    login: { participate: "المشاركة", signInDesc: "سجّل دخولك لتقديم نتيجة فريقك أو تقديم اعتراض.", signIn: "تسجيل الدخول ←" },
    verif: { title: "حالة اللعبة", submitMatchId: "تقديم معرف المباراة" },
    matchInfo: { title: "معلومات المباراة", round: "الجولة", match: "المباراة", format: "الأفضل من", status: "الحالة", type: "النوع", byeValue: "تأهل تلقائي", completed: "اكتملت" },
    faceit: { eyebrow: "FACEIT CS2", title: "إثبات FACEIT لـ CS2" },
    cs2PlayerMatch: {
      eyebrow: "FACEIT CS2",
      title: "مباراتك في CS2",
      matchup: "المواجهة",
      playedOnFaceit: "تُلعب هذه المباراة على FACEIT.",
      joinWhenAvailable: "ادخل إلى غرفة FACEIT عند توفر الرابط.",
      afterMatchSync: "بعد انتهاء المباراة، يمكن لـ Ascendra مزامنة النتيجة والخريطة والإحصائيات من FACEIT.",
      autoConfirmEnabled: "التأكيد التلقائي مفعّل. يمكن اعتماد النتيجة الرسمية تلقائيًا.",
      autoConfirmDisabled: "التأكيد التلقائي غير مفعّل. سيُحفظ الإثبات لمراجعة المسؤولين.",
      openRoom: "فتح غرفة FACEIT",
      matchIdLabel: "FACEIT Match ID",
      roomUnavailable:
        "رابط غرفة FACEIT غير متوفر بعد. انتظر حتى يضيفه المسؤول أو منظّم البطولة.",
    },
    faceitWorkflow: {
      eyebrow: "FACEIT CS2",
      title: "سير عمل FACEIT لـ CS2",
      step1: "العب مباراة CS2 على FACEIT باستخدام الفرق الصحيحة.",
      step2: "بعد انتهاء المباراة، انسخ FACEIT Match ID أو رابط الغرفة.",
      step3: "يضيف المشرف أو اللاعب المخوّل FACEIT Match ID في الأسفل.",
      step4: "سيقوم Ascendra بمزامنة النتيجة والخريطة والإحصائيات ورابط الديمو وحالة المباراة.",
      step5: "إذا كان التأكيد التلقائي مفعّلًا وتم التحقق من مطابقة الفرق، يمكن اعتماد النتيجة الرسمية تلقائيًا.",
      note: "عند تعطيل التأكيد التلقائي، يُحفظ إثبات FACEIT للمراجعة وتبقى النتيجة الرسمية يدوية.",
      teamReadiness: "جاهزية الفريق",
      faceitReady: "جاهز لـ FACEIT",
      steamReady: "جاهز لـ Steam",
      autoConfirmEnabled: "التأكيد التلقائي مفعّل",
      autoConfirmDisabled: "التأكيد التلقائي غير مفعّل",
    },
    backLink: "كل المباريات",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Tone = "blue" | "green" | "live" | "amber" | "red" | "violet" | "gray";

function matchStatusInfo(status: string, statuses: MatchStatuses): { label: string; tone: Tone } {
  const map: Record<string, { label: string; tone: Tone }> = {
    scheduled: { label: statuses.scheduled, tone: "blue" },
    ready: { label: statuses.ready, tone: "green" },
    room_created: { label: statuses.room_created, tone: "blue" },
    in_progress: { label: statuses.in_progress, tone: "live" },
    result_pending: { label: statuses.result_pending, tone: "amber" },
    disputed: { label: statuses.disputed, tone: "red" },
    confirmed: { label: statuses.confirmed, tone: "green" },
    completed: { label: statuses.completed, tone: "violet" },
    cancelled: { label: statuses.cancelled, tone: "red" },
    forfeit: { label: statuses.forfeit, tone: "red" },
    bye: { label: statuses.bye, tone: "gray" },
  };
  return map[status] ?? { label: status, tone: "gray" };
}

function tonedStyle(tone: Tone): CSSProperties {
  const styles: Record<Tone, CSSProperties> = {
    blue: { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" },
    green: { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
    live: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
    amber: { color: "var(--asc-amber)", borderColor: "oklch(0.65 0.14 75 / 0.5)", background: "oklch(0.25 0.12 75 / 0.18)" },
    red: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
    violet: { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
    gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
  };
  return styles[tone];
}

function reportStatusInfo(status: string, statuses: ReportStatuses): { label: string; tone: Tone } {
  const map: Record<string, { label: string; tone: Tone }> = {
    submitted: { label: statuses.submitted, tone: "amber" },
    confirmed: { label: statuses.confirmed, tone: "green" },
    rejected: { label: statuses.rejected, tone: "red" },
    superseded: { label: statuses.superseded, tone: "gray" },
  };
  return map[status] ?? { label: status, tone: "gray" };
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden border"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
      >
        <p
          className="text-[10px] font-black uppercase tracking-[0.16em]"
          style={{ color: "var(--asc-accent)" }}
        >
          ▲ {eyebrow}
        </p>
        <h2 className="mt-1 text-xl" style={{ color: "var(--asc-fg-0)" }}>
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { matchId } = await params;
  const [match, locale] = await Promise.all([
    prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { roundNumber: true, matchNumber: true },
    }),
    getLocale(),
  ]);
  const msgs = matchDetailMessages[locale];
  return {
    title: match
      ? `${msgs.meta.round} ${match.roundNumber} · ${msgs.meta.match} ${match.matchNumber}`
      : msgs.meta.matchDetail,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MatchDetailPage({ params }: PageProps) {
  const { id: tournamentId, matchId } = await params;

  const [session, tournament, match, locale] = await Promise.all([
    auth(),
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, title: true, game: { select: { name: true, slug: true } } },
    }),
    prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      include: {
        games: { orderBy: { gameNumber: "asc" } },
        reports: {
          include: { submittedBy: { select: { id: true, username: true } } },
          orderBy: { createdAt: "desc" },
        },
        room: true,
      },
    }),
    getLocale(),
  ]);

  if (!tournament || !match || match.tournamentId !== tournamentId) notFound();

  const msgs = matchDetailMessages[locale];
  const dateLocale = locale === "ar" ? "ar" : "en";

  // Load team names
  const teamIds = [match.teamAId, match.teamBId, match.winnerTeamId].filter(
    (x): x is string => Boolean(x),
  );
  const matchTeamIds = [match.teamAId, match.teamBId].filter(
    (x): x is string => Boolean(x),
  );
  const teamRows =
    teamIds.length > 0
      ? await prisma.team.findMany({
          where: { id: { in: teamIds } },
          select: {
            id: true,
            name: true,
            leaderId: true,
            members: { select: { userId: true } },
          },
        })
      : [];
  const teamName = new Map(teamRows.map((t) => [t.id, t.name]));

  const teamA = match.teamAId
    ? { id: match.teamAId, name: teamName.get(match.teamAId) ?? "TBD" }
    : null;
  const teamB = match.teamBId
    ? { id: match.teamBId, name: teamName.get(match.teamBId) ?? "TBD" }
    : null;
  const winnerName = match.winnerTeamId
    ? (teamName.get(match.winnerTeamId) ?? null)
    : null;

  const sessionUser = session?.user as
    | { databaseId?: string; isAdmin?: boolean }
    | undefined;
  const isAdmin = Boolean(sessionUser?.isAdmin);
  const currentUserId = sessionUser?.databaseId ?? null;

  const matchTeamSides = matchTeamIds.map((teamId) => {
    const team = teamRows.find((row) => row.id === teamId);
    return {
      teamId,
      name: teamName.get(teamId) ?? "TBD",
      leaderUserId: team?.leaderId ?? null,
      memberUserIds: team?.members.map((member) => member.userId) ?? [],
    };
  });

  const userTeamId = currentUserId
    ? determineUserMatchTeam({
        userId: currentUserId,
        teams: matchTeamSides,
      })
    : null;

  const isValorant =
    tournament.game?.slug?.toLowerCase().includes("valorant") ||
    tournament.game?.name?.toLowerCase().includes("valorant");
  const isDota =
    tournament.game?.slug?.toLowerCase().includes("dota") ||
    tournament.game?.name?.toLowerCase().includes("dota");
  const isCs2 = isCs2Game(tournament.game?.slug, tournament.game?.name);

  // Check if the current user has FACEIT connected (needed for CS2 proof panel).
  let faceitConnected = false;
  if (isCs2 && currentUserId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { faceitPlayerId: true },
    });
    faceitConnected = Boolean(dbUser?.faceitPlayerId);
  }

  // Serialize FACEIT proof fields for the client component.
  const faceitProof = {
    faceitMatchId: match.faceitMatchId ?? null,
    faceitMatchUrl: match.faceitMatchUrl ?? null,
    faceitStatus: match.faceitStatus ?? null,
    faceitDemoUrl: match.faceitDemoUrl ?? null,
    faceitMap: match.faceitMap ?? null,
    faceitScoreRaw: match.faceitScoreRaw ?? null,
    faceitSyncedAt: match.faceitSyncedAt?.toISOString() ?? null,
    faceitVerifiedAt: match.faceitVerifiedAt?.toISOString() ?? null,
    faceitAutoAppliedAt: match.faceitAutoAppliedAt?.toISOString() ?? null,
    faceitAutoApplyMethod: match.faceitAutoApplyMethod ?? null,
  };
  const faceitParsedResultView = normalizeFaceitParsedResultView(
    match.faceitParsedResult,
  );

  const cs2Meta =
    match.room?.provider === "steam_cs2"
      ? parseCs2Metadata(match.room.metadata)
      : null;

  // CS2-only: team member readiness and auto-confirm status
  type TeamReadinessSummary = {
    teamId: string;
    name: string;
    faceitCount: number;
    total: number;
  };
  let teamReadinessSummary: TeamReadinessSummary[] | null = null;
  let checkInSummaries: MatchCheckInSummary[] = [];
  let currentUserCheckedIn = false;
  let faceitAutoConfirmEnabled = false;

  if (isCs2) {
    faceitAutoConfirmEnabled = isFaceitAutoConfirmEnabled();

    if (matchTeamIds.length > 0) {
      const cs2Members = await prisma.teamMember.findMany({
        where: { teamId: { in: matchTeamIds } },
        select: {
          teamId: true,
          user: { select: { faceitPlayerId: true } },
        },
      });
      teamReadinessSummary = matchTeamIds.map((tid) => {
        const members = cs2Members.filter((m) => m.teamId === tid);
        return {
          teamId: tid,
          name: teamName.get(tid) ?? "TBD",
          faceitCount: members.filter((m) => m.user.faceitPlayerId).length,
          total: members.length,
        };
      });

      const checkIns = await prisma.tournamentMatchCheckIn.findMany({
        where: { matchId: match.id },
        include: { user: { select: { username: true } } },
        orderBy: { createdAt: "asc" },
      });
      const checkInRecords: MatchCheckInRecord[] = checkIns.map((checkIn) => ({
        id: checkIn.id,
        userId: checkIn.userId,
        teamId: checkIn.teamId,
        username: checkIn.user.username,
        createdAt: checkIn.createdAt.toISOString(),
      }));

      checkInSummaries = summarizeMatchCheckIns({
        teams: matchTeamSides,
        checkIns: checkInRecords,
      });
      currentUserCheckedIn = currentUserId
        ? checkIns.some((checkIn) => checkIn.userId === currentUserId)
        : false;
    }
  }

  const { label: statusLabel, tone: statusTone } = matchStatusInfo(match.status, msgs.matchStatuses);
  const isTerminal = ["completed", "confirmed", "forfeit", "bye", "cancelled"].includes(match.status);
  const shouldRefreshRealtime = !["completed", "cancelled", "forfeit", "bye"].includes(match.status);
  const canSubmitReport =
    !isTerminal &&
    match.status !== "disputed" &&
    userTeamId !== null &&
    match.teamAId !== null &&
    match.teamBId !== null;
  const canDispute =
    ["in_progress", "result_pending"].includes(match.status) &&
    userTeamId !== null;
  const userHasReport = match.reports.some(
    (r) => r.teamId === userTeamId && r.status === "submitted",
  );

  const roundLabel =
    match.roundNumber === 1 && match.matchNumber === 1 ? null : null;
  void roundLabel;

  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />
        {shouldRefreshRealtime && (
          <MatchRealtimeRefresh
            tournamentId={tournamentId}
            matchId={match.id}
            listenToAdminEvents={isAdmin}
          />
        )}

        {/* Breadcrumb */}
        <header className="mx-auto max-w-[1680px] px-6 pb-6 pt-10 lg:px-10 2xl:px-14">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em]">
            <Link href="/tournaments" className="transition hover:opacity-75" style={{ color: "var(--asc-fg-3)" }}>
              {msgs.breadcrumb.tournaments}
            </Link>
            <span style={{ color: "var(--asc-fg-3)" }}>·</span>
            <Link href={`/tournaments/${tournamentId}`} className="transition hover:opacity-75" style={{ color: "var(--asc-fg-3)" }}>
              {tournament.title}
            </Link>
            <span style={{ color: "var(--asc-fg-3)" }}>·</span>
            <Link href={`/tournaments/${tournamentId}/matches`} className="transition hover:opacity-75" style={{ color: "var(--asc-fg-3)" }}>
              {msgs.breadcrumb.matchCenter}
            </Link>
            <span style={{ color: "var(--asc-fg-3)" }}>·</span>
            <span style={{ color: "var(--asc-fg-1)" }}>
              R{match.roundNumber}·M{match.matchNumber}
            </span>
          </div>
        </header>

        {/* Match VS hero card */}
        <section className="mx-auto max-w-[1680px] px-6 pb-6 lg:px-10 2xl:px-14">
          <div
            className="relative overflow-hidden border"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <div aria-hidden className="asc-corner-mark" />

            <div
              className="flex flex-wrap items-center gap-3 px-5 py-3"
              style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
            >
              <p
                className="text-[10px] font-black uppercase tracking-[0.16em]"
                style={{ color: "var(--asc-accent)" }}
              >
                ▲ {tournament.game?.name ?? "Match"} · R{match.roundNumber} ·
                M{match.matchNumber} · BO{match.bestOf}
              </p>
              <span
                className="inline-flex items-center gap-1.5 border px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.10em]"
                style={tonedStyle(statusTone)}
              >
                {statusTone === "live" && <span className="asc-live-dot" />}
                {statusLabel}
              </span>
              {isAdmin && (
                <span
                  className="ml-auto inline-flex border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.10em]"
                  style={tonedStyle("amber")}
                >
                  Admin View
                </span>
              )}
            </div>

            {/* VS layout */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 px-6 py-8 md:gap-10 md:px-10">
              {/* Team A */}
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                  {msgs.vs.teamA}
                </p>
                <p
                  className="mt-2 text-2xl font-black md:text-4xl"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: isTerminal && match.winnerTeamId === match.teamAId ? "var(--asc-green)" : "var(--asc-fg-0)",
                  }}
                >
                  {teamA?.name ?? "TBD"}
                </p>
                {isTerminal && match.winnerTeamId === match.teamAId && (
                  <p className="mt-1 text-xs font-black uppercase tracking-widest" style={{ color: "var(--asc-green)" }}>
                    {msgs.vs.winnerBadge}
                  </p>
                )}
              </div>

              {/* Centre */}
              <div className="flex flex-col items-center gap-2">
                {winnerName ? (
                  <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                    {msgs.vs.winner}
                  </p>
                ) : (
                  <p className="text-xl font-black uppercase tracking-[0.2em]" style={{ color: "var(--asc-fg-3)" }}>
                    {msgs.vs.vs}
                  </p>
                )}
                {winnerName && (
                  <p className="text-sm font-black" style={{ color: "var(--asc-green)", fontFamily: "var(--font-display)" }}>
                    {winnerName}
                  </p>
                )}
              </div>

              {/* Team B */}
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                  {msgs.vs.teamB}
                </p>
                <p
                  className="mt-2 text-2xl font-black md:text-4xl"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: isTerminal && match.winnerTeamId === match.teamBId ? "var(--asc-green)" : "var(--asc-fg-0)",
                  }}
                >
                  {teamB?.name ?? "TBD"}
                </p>
                {isTerminal && match.winnerTeamId === match.teamBId && (
                  <p className="mt-1 text-xs font-black uppercase tracking-widest" style={{ color: "var(--asc-green)" }}>
                    {msgs.vs.winnerBadge}
                  </p>
                )}
              </div>
            </div>

            {/* Schedule footer */}
            {match.scheduledAt && (
              <div
                className="flex flex-wrap items-center gap-4 px-5 py-3 text-xs"
                style={{ borderTop: "1px solid var(--asc-line-soft)", color: "var(--asc-fg-3)" }}
              >
                <span className="font-bold">{msgs.vs.scheduled}</span>
                <span>
                  {match.scheduledAt.toLocaleString(dateLocale, {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Content grid */}
        <div className="mx-auto grid max-w-[1680px] gap-6 px-6 pb-20 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-10 2xl:px-14">
          {/* Left column */}
          <div className="grid gap-6">
            {/* Game room */}
            {match.room && (
              <Panel eyebrow={msgs.gameRoom.eyebrow} title={msgs.gameRoom.title}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {match.room.roomCode && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                        {msgs.gameRoom.roomCode}
                      </p>
                      <p className="mt-1 font-mono text-xl font-black" style={{ color: "var(--asc-accent)" }}>
                        {match.room.roomCode}
                      </p>
                    </div>
                  )}
                  {match.room.password && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                        {msgs.gameRoom.password}
                      </p>
                      <p className="mt-1 font-mono text-base font-black" style={{ color: "var(--asc-fg-0)" }}>
                        {match.room.password}
                      </p>
                    </div>
                  )}
                  {match.room.joinUrl && (
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                        {msgs.gameRoom.joinUrl}
                      </p>
                      <a
                        href={match.room.joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block break-all text-sm font-bold transition hover:opacity-75"
                        style={{ color: "var(--asc-blue)" }}
                      >
                        {match.room.joinUrl}
                      </a>
                    </div>
                  )}
                </div>
              </Panel>
            )}

            {/* Player-facing CS2 FACEIT instructions */}
            {isCs2 && (
              <Panel
                eyebrow={msgs.cs2PlayerMatch.eyebrow}
                title={msgs.cs2PlayerMatch.title}
              >
                <div className="grid gap-4">
                  <div
                    className="border p-3"
                    style={{
                      borderColor: "var(--asc-line-soft)",
                      background: "var(--asc-bg-2)",
                    }}
                  >
                    <p
                      className="text-[10px] font-black uppercase tracking-[0.14em]"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      {msgs.cs2PlayerMatch.matchup}
                    </p>
                    <p
                      className="mt-1 break-words text-lg font-black"
                      style={{ color: "var(--asc-fg-0)" }}
                    >
                      {teamA?.name ?? msgs.vs.teamA}{" "}
                      <span style={{ color: "var(--asc-fg-3)" }}>
                        {msgs.vs.vs}
                      </span>{" "}
                      {teamB?.name ?? msgs.vs.teamB}
                    </p>
                  </div>

                  <div className="grid gap-2 text-sm leading-6">
                    {[
                      msgs.cs2PlayerMatch.playedOnFaceit,
                      msgs.cs2PlayerMatch.joinWhenAvailable,
                      msgs.cs2PlayerMatch.afterMatchSync,
                      faceitAutoConfirmEnabled
                        ? msgs.cs2PlayerMatch.autoConfirmEnabled
                        : msgs.cs2PlayerMatch.autoConfirmDisabled,
                    ].map((line) => (
                      <p key={line} style={{ color: "var(--asc-fg-2)" }}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {faceitProof.faceitMatchUrl ? (
                    <div className="grid gap-2">
                      <a
                        href={faceitProof.faceitMatchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center justify-center border px-5 py-3 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-80"
                        style={{
                          borderColor: "oklch(0.50 0.20 285 / 0.45)",
                          background: "var(--asc-accent-dim)",
                          color: "var(--asc-accent)",
                          clipPath:
                            "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)",
                        }}
                      >
                        {msgs.cs2PlayerMatch.openRoom}
                      </a>
                      <p
                        dir="ltr"
                        title={faceitProof.faceitMatchUrl}
                        className="break-all font-mono text-xs"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        {faceitProof.faceitMatchUrl}
                      </p>
                    </div>
                  ) : faceitProof.faceitMatchId ? (
                    <div
                      className="border p-3"
                      style={{
                        borderColor: "oklch(0.50 0.20 285 / 0.35)",
                        background: "var(--asc-accent-dim)",
                      }}
                    >
                      <p
                        className="text-[10px] font-black uppercase tracking-[0.14em]"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        {msgs.cs2PlayerMatch.matchIdLabel}
                      </p>
                      <p
                        dir="ltr"
                        title={faceitProof.faceitMatchId}
                        className="mt-1 break-all font-mono text-sm font-black"
                        style={{ color: "var(--asc-accent)" }}
                      >
                        {faceitProof.faceitMatchId}
                      </p>
                    </div>
                  ) : (
                    <div
                      className="border px-3 py-2 text-xs leading-5"
                      style={{
                        borderColor: "oklch(0.50 0.20 285 / 0.35)",
                        background: "var(--asc-accent-dim)",
                        color: "var(--asc-accent)",
                      }}
                    >
                      {msgs.cs2PlayerMatch.roomUnavailable}
                    </div>
                  )}

                  <MatchCheckInPanel
                    matchId={match.id}
                    locale={locale}
                    summaries={checkInSummaries}
                    isLoggedIn={Boolean(currentUserId)}
                    isParticipant={userTeamId !== null}
                    userCheckedIn={currentUserCheckedIn}
                    showAdminDetails={isAdmin}
                  />
                </div>
              </Panel>
            )}

            {/* CS2 server details */}
            {cs2Meta && (
              <Panel
                eyebrow={`CS2 · ${cs2Meta.mode === "dedicated_server" ? msgs.cs2.dedicatedMode : msgs.cs2.manualMode}`}
                title={msgs.cs2.serverDetailsTitle}
              >
                <div className="grid gap-4">
                  <p className="text-xs leading-5" style={{ color: "var(--asc-fg-3)" }}>
                    {cs2Meta.mode === "dedicated_server" ? msgs.cs2.dedicatedDesc : msgs.cs2.manualDesc}
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {cs2Meta.serverIp && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                          {msgs.cs2.serverAddress}
                        </p>
                        <p className="mt-1 font-mono text-base font-black" style={{ color: "var(--asc-accent)" }}>
                          {cs2Meta.serverIp}{cs2Meta.serverPort ? `:${cs2Meta.serverPort}` : ""}
                        </p>
                        <p className="mt-0.5 text-[10px]" style={{ color: "var(--asc-fg-3)" }}>
                          connect {cs2Meta.serverIp}{cs2Meta.serverPort ? `:${cs2Meta.serverPort}` : ""}
                          {cs2Meta.password ? `; password ${cs2Meta.password}` : ""}
                        </p>
                      </div>
                    )}
                    {cs2Meta.password && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                          {msgs.gameRoom.password}
                        </p>
                        <p className="mt-1 font-mono text-base font-black" style={{ color: "var(--asc-fg-0)" }}>
                          {cs2Meta.password}
                        </p>
                      </div>
                    )}
                    {cs2Meta.gotvUrl && (
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                          {msgs.cs2.gotvSpectator}
                        </p>
                        <p className="mt-1 font-mono text-sm" style={{ color: "var(--asc-blue)" }}>
                          {cs2Meta.gotvUrl}
                        </p>
                      </div>
                    )}
                    {cs2Meta.mode === "dedicated_server" && cs2Meta.logSource && (
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                          {msgs.cs2.logSource}
                        </p>
                        <p className="mt-1 font-mono text-xs" style={{ color: "var(--asc-fg-3)" }}>
                          {cs2Meta.logSource}
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    className="border px-3 py-2 text-xs leading-5"
                    style={{ borderColor: "oklch(0.65 0.14 75 / 0.4)", background: "oklch(0.25 0.12 75 / 0.10)", color: "var(--asc-amber)" }}
                  >
                    {msgs.cs2.warning}
                  </div>
                </div>
              </Panel>
            )}

            {/* CS2 FACEIT workflow guide */}
            {isCs2 && (
              <Panel
                eyebrow={msgs.faceitWorkflow.eyebrow}
                title={msgs.faceitWorkflow.title}
              >
                <div className="grid gap-5">
                  {/* Numbered steps */}
                  <ol className="grid gap-2">
                    {[
                      msgs.faceitWorkflow.step1,
                      msgs.faceitWorkflow.step2,
                      msgs.faceitWorkflow.step3,
                      msgs.faceitWorkflow.step4,
                      msgs.faceitWorkflow.step5,
                    ].map((step, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-sm leading-6"
                        style={{ color: "var(--asc-fg-2)" }}
                      >
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border text-[10px] font-black"
                          style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", color: "var(--asc-accent)", background: "var(--asc-accent-dim)" }}
                        >
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>

                  {/* Team readiness summary */}
                  {teamReadinessSummary && teamReadinessSummary.length > 0 && (
                    <div
                      className="border p-3"
                      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
                    >
                      <p
                        className="mb-2 text-[10px] font-black uppercase tracking-[0.14em]"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        {msgs.faceitWorkflow.teamReadiness}
                      </p>
                      <div className="grid gap-2">
                        {teamReadinessSummary.map((team) => {
                          const allReady = team.total > 0 && team.faceitCount === team.total;
                          return (
                            <div
                              key={team.teamId}
                              className="flex items-center justify-between gap-3 text-xs"
                            >
                              <span className="font-black" style={{ color: "var(--asc-fg-1)" }}>
                                {team.name}
                              </span>
                              <span
                                className="font-black"
                                style={{ color: allReady ? "var(--asc-green)" : "var(--asc-live)" }}
                              >
                                {team.faceitCount}/{team.total} {msgs.faceitWorkflow.faceitReady}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Auto-confirm status */}
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: faceitAutoConfirmEnabled ? "var(--asc-green)" : "var(--asc-fg-3)" }}
                  >
                    <span className="font-black">
                      {faceitAutoConfirmEnabled
                        ? msgs.faceitWorkflow.autoConfirmEnabled
                        : msgs.faceitWorkflow.autoConfirmDisabled}
                    </span>
                  </div>

                  {/* Note */}
                  <div
                    className="border px-3 py-2 text-xs leading-5"
                    style={{
                      borderColor: "oklch(0.50 0.20 285 / 0.3)",
                      background: "var(--asc-accent-dim)",
                      color: "var(--asc-accent)",
                    }}
                  >
                    {msgs.faceitWorkflow.note}
                  </div>
                </div>
              </Panel>
            )}

            {/* League of Legends tournament codes */}
            {match.room?.provider === "riot_lol" && match.games.some((g) => g.externalRoomId) && (
              <Panel eyebrow="League of Legends" title={msgs.lol.title}>
                <p className="mb-3 text-xs" style={{ color: "var(--asc-fg-3)" }}>
                  {msgs.lol.desc}
                </p>
                <div className="grid gap-2">
                  {match.games
                    .filter((g) => g.externalRoomId)
                    .map((g) => (
                      <div
                        key={g.id}
                        className="flex flex-wrap items-center justify-between gap-3 border px-4 py-3"
                        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--asc-fg-3)" }}>
                          {msgs.games.game} {g.gameNumber}
                        </span>
                        <span className="font-mono text-base font-black" style={{ color: "var(--asc-accent)" }}>
                          {g.externalRoomId}
                        </span>
                        <span
                          className="text-[10px] font-black uppercase tracking-widest"
                          style={{ color: g.status === "completed" ? "var(--asc-green)" : "var(--asc-fg-3)" }}
                        >
                          {g.status}
                        </span>
                      </div>
                    ))}
                </div>
              </Panel>
            )}

            {/* Per-game breakdown */}
            {match.games.length > 0 && (
              <Panel
                eyebrow={`${msgs.games.eyebrow} · ${match.games.length} ${msgs.games.played}`}
                title={msgs.games.title}
              >
                <div className="grid gap-2">
                  {match.games.map((game) => {
                    const gameWinnerName = game.winnerTeamId
                      ? (teamName.get(game.winnerTeamId) ?? "Unknown")
                      : null;
                    return (
                      <div
                        key={game.id}
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-3 border px-4 py-3"
                        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--asc-fg-3)" }}>
                          G{game.gameNumber}
                        </span>
                        <span
                          className="text-right font-black"
                          style={{ color: game.winnerTeamId === match.teamAId ? "var(--asc-green)" : "var(--asc-fg-0)" }}
                        >
                          {teamA?.name ?? "TBD"}
                        </span>
                        <span className="text-center font-mono font-black tabular-nums" style={{ color: "var(--asc-fg-0)" }}>
                          {game.teamAScore} — {game.teamBScore}
                        </span>
                        <span
                          className="font-black"
                          style={{ color: game.winnerTeamId === match.teamBId ? "var(--asc-green)" : "var(--asc-fg-0)" }}
                        >
                          {teamB?.name ?? "TBD"}
                        </span>
                        <span
                          className="text-[10px] font-black uppercase tracking-widest"
                          style={{ color: game.status === "completed" ? "var(--asc-green)" : "var(--asc-fg-3)" }}
                        >
                          {gameWinnerName ? "✓" : game.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* Reports */}
            {match.reports.length > 0 && (
              <Panel
                eyebrow={`${msgs.reports.eyebrow} · ${match.reports.length}`}
                title={msgs.reports.title}
              >
                <div className="grid gap-3">
                  {match.reports.map((report) => {
                    const { label: rLabel, tone: rTone } = reportStatusInfo(report.status, msgs.reportStatuses);
                    const reportTeamName = teamName.get(report.teamId) ?? "Unknown team";
                    const reportWinnerName = teamName.get(report.winnerTeamId) ?? "Unknown";
                    return (
                      <div
                        key={report.id}
                        className="border p-4"
                        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black" style={{ color: "var(--asc-fg-1)" }}>
                              {reportTeamName}
                            </span>
                            <span className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
                              · {report.submittedBy.username}
                            </span>
                          </div>
                          <span
                            className="inline-flex border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.10em]"
                            style={tonedStyle(rTone)}
                          >
                            {rLabel}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-1 text-sm" style={{ color: "var(--asc-fg-2)" }}>
                          <p>
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--asc-fg-3)" }}>
                              {msgs.reports.declaredWinner}
                            </span>{" "}
                            <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>
                              {reportWinnerName}
                            </span>
                          </p>
                          <p>
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--asc-fg-3)" }}>
                              {msgs.reports.score}
                            </span>{" "}
                            <span className="font-mono font-black" style={{ color: "var(--asc-fg-0)" }}>
                              {report.teamAScore} — {report.teamBScore}
                            </span>
                          </p>
                          {report.note && (
                            <p className="mt-1 text-xs leading-5" style={{ color: "var(--asc-fg-3)" }}>
                              {report.note}
                            </p>
                          )}
                          {report.evidenceUrl && (
                            <a
                              href={report.evidenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-block text-xs font-bold transition hover:opacity-75"
                              style={{ color: "var(--asc-blue)" }}
                            >
                              {msgs.reports.viewEvidence}
                            </a>
                          )}
                        </div>

                        <p className="mt-3 text-[10px]" style={{ color: "var(--asc-fg-3)" }}>
                          {new Date(report.createdAt).toLocaleString(dateLocale, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}
          </div>

          {/* Right column */}
          <div className="grid gap-6" style={{ alignContent: "start" }}>
            {/* Submit result */}
            {canSubmitReport && teamA && teamB && userTeamId && (
              <Panel eyebrow={msgs.submit.eyebrow} title={msgs.submit.title}>
                <MatchReportForm
                  matchId={match.id}
                  userTeamId={userTeamId}
                  teamA={teamA}
                  teamB={teamB}
                  hasExistingReport={userHasReport}
                  locale={locale}
                />
              </Panel>
            )}

            {/* VALORANT match ID */}
            {isValorant && !isTerminal && teamA && teamB && (
              <Panel eyebrow="VALORANT" title={msgs.verif.submitMatchId}>
                <ValorantMatchIdForm
                  matchId={match.id}
                  gameNumber={match.games.length > 0 ? match.games[match.games.length - 1].gameNumber + 1 : 1}
                  isAdmin={isAdmin}
                  isParticipant={userTeamId !== null}
                  locale={locale}
                  currentExternalMatchId={match.games.find((g) => g.externalMatchId)?.externalMatchId ?? null}
                />
              </Panel>
            )}

            {/* VALORANT verification */}
            {isValorant && match.games.length > 0 && (
              <Panel eyebrow="VALORANT Verification" title={msgs.verif.title}>
                <div className="grid gap-2">
                  {match.games.map((g) => {
                    const hasId = Boolean(g.externalMatchId);
                    return (
                      <div
                        key={g.id}
                        className="flex flex-wrap items-center justify-between gap-2 border px-3 py-2 text-xs"
                        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
                      >
                        <span className="font-black uppercase tracking-widest" style={{ color: "var(--asc-fg-3)" }}>
                          {msgs.games.game} {g.gameNumber}
                        </span>
                        {hasId ? (
                          <span className="font-mono" style={{ color: "var(--asc-fg-2)" }}>
                            {g.externalMatchId}
                          </span>
                        ) : (
                          <span style={{ color: "var(--asc-fg-3)" }}>{msgs.reports.noMatchId}</span>
                        )}
                        <span
                          className="font-black uppercase tracking-widest"
                          style={{
                            color: g.status === "completed" ? "var(--asc-green)"
                              : g.status === "cancelled" ? "var(--asc-live)"
                              : "var(--asc-fg-3)",
                          }}
                        >
                          {g.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* Dota 2 match ID */}
            {isDota && !isTerminal && teamA && teamB && (
              <Panel eyebrow="Dota 2" title={msgs.verif.submitMatchId}>
                <DotaMatchIdForm
                  matchId={match.id}
                  gameNumber={match.games.length > 0 ? match.games[match.games.length - 1].gameNumber + 1 : 1}
                  isAdmin={isAdmin}
                  isParticipant={userTeamId !== null}
                  locale={locale}
                  currentExternalMatchId={match.games.find((g) => g.externalMatchId)?.externalMatchId ?? null}
                />
              </Panel>
            )}

            {/* Dota 2 verification */}
            {isDota && match.games.length > 0 && (
              <Panel eyebrow="Dota 2 Verification" title={msgs.verif.title}>
                <div className="grid gap-2">
                  {match.games.map((g) => {
                    const hasId = Boolean(g.externalMatchId);
                    return (
                      <div
                        key={g.id}
                        className="flex flex-wrap items-center justify-between gap-2 border px-3 py-2 text-xs"
                        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
                      >
                        <span className="font-black uppercase tracking-widest" style={{ color: "var(--asc-fg-3)" }}>
                          {msgs.games.game} {g.gameNumber}
                        </span>
                        {hasId ? (
                          <span className="font-mono" style={{ color: "var(--asc-fg-2)" }}>
                            {g.externalMatchId}
                          </span>
                        ) : (
                          <span style={{ color: "var(--asc-fg-3)" }}>{msgs.reports.noMatchId}</span>
                        )}
                        <span
                          className="font-black uppercase tracking-widest"
                          style={{
                            color: g.status === "completed" ? "var(--asc-green)"
                              : g.status === "cancelled" ? "var(--asc-live)"
                              : "var(--asc-fg-3)",
                          }}
                        >
                          {g.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* FACEIT CS2 proof */}
            {isCs2 && (
              <Panel eyebrow={msgs.faceit.eyebrow} title={msgs.faceit.title}>
                <FaceitMatchProofForm
                  matchId={match.id}
                  isAdmin={isAdmin}
                  isParticipant={userTeamId !== null}
                  hasFaceitConnected={faceitConnected}
                  locale={locale}
                  proof={faceitProof}
                  parsedResult={faceitParsedResultView}
                />
              </Panel>
            )}

            {/* Dispute */}
            {canDispute && (
              <Panel eyebrow={msgs.dispute.eyebrow} title={msgs.dispute.title}>
                <p className="mb-4 text-sm leading-6" style={{ color: "var(--asc-fg-2)" }}>
                  {msgs.dispute.desc}
                </p>
                <DisputeForm matchId={match.id} locale={locale} />
              </Panel>
            )}

            {/* Login prompt */}
            {!currentUserId && !isTerminal && (
              <div
                className="relative border p-5"
                style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
              >
                <div aria-hidden className="asc-corner-mark" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-fg-3)" }}>
                  {msgs.login.participate}
                </p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-2)" }}>
                  {msgs.login.signInDesc}
                </p>
                <Link
                  href="/login"
                  className="mt-4 inline-flex px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:opacity-90"
                  style={{
                    background: "var(--asc-accent-2)",
                    clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)",
                  }}
                >
                  {msgs.login.signIn}
                </Link>
              </div>
            )}

            {/* Admin controls — NOT translated */}
            {isAdmin && teamA && teamB && (
              <div
                className="relative overflow-hidden border"
                style={{ borderColor: "oklch(0.65 0.14 75 / 0.3)", background: "oklch(0.25 0.12 75 / 0.06)" }}
              >
                <div
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: "1px solid oklch(0.65 0.14 75 / 0.2)" }}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-amber)" }}>
                    ▲ Admin Controls
                  </p>
                  <span
                    className="border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]"
                    style={tonedStyle("amber")}
                  >
                    Staff Only
                  </span>
                </div>
                <div className="p-5">
                  <MatchAdminControls
                    matchId={match.id}
                    teamA={teamA}
                    teamB={teamB}
                    status={match.status}
                  />
                </div>
              </div>
            )}

            {/* Match metadata */}
            <div
              className="relative border"
              style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
            >
              <div aria-hidden className="asc-corner-mark" />
              <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-fg-3)" }}>
                  {msgs.matchInfo.title}
                </p>
              </div>
              <div className="grid gap-3 p-5">
                {[
                  { label: msgs.matchInfo.round, value: `${msgs.matchInfo.round} ${match.roundNumber}` },
                  { label: msgs.matchInfo.match, value: `#${match.matchNumber}` },
                  { label: msgs.matchInfo.format, value: `${msgs.matchInfo.format} ${match.bestOf}` },
                  { label: msgs.matchInfo.status, value: statusLabel, style: tonedStyle(statusTone) },
                  match.isBye ? { label: msgs.matchInfo.type, value: msgs.matchInfo.byeValue } : null,
                  match.completedAt
                    ? {
                        label: msgs.matchInfo.completed,
                        value: new Date(match.completedAt).toLocaleDateString(dateLocale, { dateStyle: "medium" }),
                      }
                    : null,
                ]
                  .filter(Boolean)
                  .map((item) => (
                    <div key={item!.label}>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                        {item!.label}
                      </p>
                      <p className="mt-0.5 text-sm font-bold" style={item!.style ?? { color: "var(--asc-fg-1)" }}>
                        {item!.value}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Back navigation */}
            <Link
              href={`/tournaments/${tournamentId}/matches`}
              className="inline-flex items-center justify-center border px-5 py-3 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-75"
              style={{
                borderColor: "var(--asc-line-soft)",
                color: "var(--asc-fg-2)",
                clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)",
              }}
            >
              {locale === "ar" ? "→" : "←"} {msgs.backLink}
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    </main>
  );
}
