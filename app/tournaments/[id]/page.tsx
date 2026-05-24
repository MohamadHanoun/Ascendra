import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfileNotice from "@/components/ProfileNotice";
import TournamentDetailsRealtime from "@/components/TournamentDetailsRealtime";
import { TournamentRegistrationPanel } from "@/components/TournamentRegistrationPanel";
import TournamentMatchesSection from "@/components/TournamentMatchesSection";
import {
  getDictionary,
  type Locale,
  type TournamentDetailsMessages,
} from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

export const dynamic = "force-dynamic";

type TournamentDetailsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string; tab?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getDictionary(locale).tournamentDetails.metadata;
  return { title: messages.title, description: messages.description };
}

// ── Design atoms ─────────────────────────────────────────────────────────────

function CornerMark() {
  return (
    <>
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, width: 8, height: 1, background: "var(--asc-accent)", opacity: 0.6 }} />
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, width: 1, height: 8, background: "var(--asc-accent)", opacity: 0.6 }} />
    </>
  );
}

function TeamAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const hue = (name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 47) % 360;
  const cut = Math.round(size * 0.18);
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      background: `linear-gradient(135deg, oklch(0.55 0.22 ${hue}), oklch(0.30 0.16 ${(hue + 40) % 360}))`,
      display: "grid", placeItems: "center",
      fontFamily: "var(--font-display)", fontWeight: 700,
      fontSize: Math.round(size * 0.36), letterSpacing: "0.04em",
      color: "oklch(0.97 0.01 290)",
      clipPath: `polygon(${cut}px 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%, 0 ${cut}px)`,
    }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── Existing helpers (preserved) ─────────────────────────────────────────────

function Pill({ children, tone = "gray" }: { children: ReactNode; tone?: "green" | "red" | "blue" | "gray" | "violet" }) {
  const styleMap: Record<string, React.CSSProperties> = {
    green:  { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
    red:    { color: "var(--asc-live)",  borderColor: "oklch(0.50 0.20 25 / 0.5)",  background: "oklch(0.25 0.18 25 / 0.18)"  },
    blue:   { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" },
    gray:   { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
    violet: { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
  };
  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={styleMap[tone]}>
      {children}
    </span>
  );
}

function getTournamentStatusLabel(status: string, messages: TournamentDetailsMessages["statuses"]) {
  const labels: Record<string, string> = {
    open: messages.open, upcoming: messages.upcoming,
    closed: messages.closed, ended: messages.ended, cancelled: messages.cancelled,
  };
  return labels[status.toLowerCase()] || status;
}

function getRegistrationStatusLabel(status: string, messages: TournamentDetailsMessages["statuses"]) {
  const labels: Record<string, string> = { open: messages.registrationOpen, closed: messages.registrationClosed };
  return labels[status.toLowerCase()] || status;
}

function getRegistrationReviewStatusLabel(status: string, messages: TournamentDetailsMessages["statuses"]) {
  const labels: Record<string, string> = {
    registered: messages.registered, approved: messages.approved,
    rejected: messages.rejected, cancelled: messages.cancelled,
  };
  return labels[status.toLowerCase()] || status;
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const n = status.toLowerCase().replace("registration ", "");
  const tone =
    n === "open" || n === "approved" ? "green"
    : n === "upcoming" || n === "pending" || n === "registered" ? "blue"
    : n === "closed" || n === "rejected" ? "red"
    : n === "ended" ? "violet" : "gray";
  return <Pill tone={tone}>{label || status}</Pill>;
}

function formatDate(date: Date, locale: Locale) {
  return date.toLocaleString(locale === "ar" ? "ar" : "en", { dateStyle: "medium", timeStyle: "short" });
}

function getSnapshotMemberCount(snapshotMembers: unknown, fallbackCount: number) {
  return Array.isArray(snapshotMembers) ? snapshotMembers.length : fallbackCount;
}

function formatTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, v), template);
}

function getUnavailableTeamReason({
  teamGame, tournamentGame, memberCount, teamSize, pendingInvites, messages,
}: {
  teamGame: string; tournamentGame: string; memberCount: number; teamSize: number;
  pendingInvites: number; messages: TournamentDetailsMessages["labels"]["unavailableReasons"];
}) {
  if (teamGame !== tournamentGame) return messages.wrongGame;
  if (memberCount < teamSize) {
    const missing = teamSize - memberCount;
    return missing === 1 ? messages.needsMorePlayer : formatTemplate(messages.needsMorePlayers, { count: String(missing) });
  }
  if (pendingInvites > 0) return messages.pendingInvites;
  return messages.notEligible;
}

function getPlayerLabel(count: number, messages: TournamentDetailsMessages["labels"]) {
  return count === 1 ? messages.player : messages.players;
}

// ── Placeholder data ──────────────────────────────────────────────────────────

const SCHEDULE_PHASES = [
  { phase: "Open Qualifiers", status: "open" as const, date: "Phase 1", desc: "Open bracket — all registered teams compete for advancement slots." },
  { phase: "Group Stage",     status: "soon" as const, date: "Phase 2", desc: "Top qualifiers divided into groups. Double round-robin, best-of-three." },
  { phase: "Grand Finals",    status: "soon" as const, date: "Phase 3", desc: "Championship bracket. Best-of-five from semi-finals on." },
];

const RULES_CONTENT = [
  { n: 1, h: "Roster requirements",  t: "A registered roster of five players plus up to one substitute. All players must have a verified publisher account linked before match day." },
  { n: 2, h: "Match format",         t: "Group stage matches are best-of-three. Quarter-finals and above are best-of-five. Results pull directly from the publisher API." },
  { n: 3, h: "Anti-cheat policy",    t: "Third-party tools that modify game memory or network traffic are prohibited. Confirmed violations result in immediate disqualification and a season ban." },
  { n: 4, h: "Dispute resolution",   t: "Open a /dispute ticket in the tournament's Discord channel within 15 minutes of match end. Average resolution time: 4 minutes." },
];

const PRIZE_PLACEHOLDERS = [
  { place: "1ST",      label: "Champion",         pct: 50, color: "oklch(0.84 0.14 85)" },
  { place: "2ND",      label: "Runner-up",        pct: 25, color: "oklch(0.78 0.04 290)" },
  { place: "3RD–4TH",  label: "Semi-finalists",   pct: 15, color: "oklch(0.62 0.10 50)" },
  { place: "5TH–8TH",  label: "Quarter-finalists", pct: 10, color: "var(--asc-fg-2)" },
];

// ── Shared sub-components ─────────────────────────────────────────────────────

function RuleDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: "var(--asc-line-soft)" }} />
      <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--asc-fg-3)", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--asc-line-soft)" }} />
    </div>
  );
}

function ScheduleCard({ phase, status, date, desc, index }: { phase: string; status: "open" | "soon"; date: string; desc: string; index: number }) {
  return (
    <div style={{ position: "relative", background: "var(--asc-bg-1)", border: "1px solid var(--asc-line-soft)", padding: "18px 22px", display: "flex", alignItems: "center", gap: 24 }}>
      <CornerMark />
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--asc-accent)", minWidth: 36, lineHeight: 1 }}>
        0{index}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, textTransform: "uppercase", color: "var(--asc-fg-0)" }}>{phase}</span>
          {status === "open" && (
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 9, letterSpacing: "0.16em", padding: "2px 8px", color: "var(--asc-green)", border: "1px solid oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" }}>
              ACTIVE
            </span>
          )}
        </div>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{date}</div>
        <p style={{ color: "var(--asc-fg-2)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{desc}</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default async function TournamentDetailsPage({ params, searchParams }: TournamentDetailsPageProps) {
  const [{ id }, sp, session, locale] = await Promise.all([params, searchParams, auth(), getLocale()]);

  const activeTab = sp.tab || "overview";
  const messages = getDictionary(locale).tournamentDetails;

  const currentUser = session?.user?.databaseId
    ? await prisma.user.findUnique({
        where: { id: session.user.databaseId },
        include: {
          ownedTeams: {
            include: {
              members: true,
              invites: { where: { status: "pending" }, select: { id: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      })
    : null;

  const [tournament, matches] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        game: { select: { name: true, slug: true } },
        gameId: true,
        description: true,
        startsAt: true,
        prize: true,
        imageUrl: true,
        maxTeams: true,
        teamSize: true,
        status: true,
        registrationStatus: true,
        results: {
          select: {
            id: true, placement: true, points: true, note: true,
            snapshotTeamName: true, snapshotTeamGame: true, snapshotMembers: true,
            team: {
              select: {
                id: true, name: true, gameId: true,
                members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
              },
            },
          },
          orderBy: [{ placement: "asc" }, { awardedAt: "desc" }],
        },
        registrations: {
          where: { status: { in: ["registered", "approved", "rejected"] } },
          select: {
            id: true, status: true, teamId: true, createdAt: true,
            snapshotTeamName: true, snapshotTeamGame: true, snapshotMembers: true,
            team: {
              select: {
                id: true, name: true, gameId: true,
                members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.match.findMany({
      where: { tournamentId: id },
      include: {
        teamA: { select: { id: true, name: true } },
        teamB: { select: { id: true, name: true } },
      },
      orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
    }),
  ]);

  if (!tournament) notFound();

  const tournamentImage = getTournamentImageUrl(tournament.game?.slug ?? null, tournament.imageUrl);

  const ownedTeamIds = currentUser?.ownedTeams.map((t) => t.id) || [];
  const userTournamentRegistrations =
    currentUser && ownedTeamIds.length > 0
      ? await prisma.tournamentRegistration.findMany({
          where: { tournamentId: tournament.id, teamId: { in: ownedTeamIds } },
          include: { team: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const approvedRegistrations = tournament.registrations.filter((r) => r.status === "approved");
  const submittedRegistrations = tournament.registrations.filter((r) =>
    ["registered", "approved", "rejected"].includes(r.status),
  );

  const approvedSlots = approvedRegistrations.length;
  const totalApplications = submittedRegistrations.length;
  const remainingSlots = Math.max(tournament.maxTeams - approvedSlots, 0);

  const openRegistrationTeamIds = new Set(
    userTournamentRegistrations
      .filter((r) => ["registered", "approved"].includes(r.status))
      .map((r) => r.teamId),
  );

  const registerableOwnedTeams = currentUser?.ownedTeams.filter((t) => !openRegistrationTeamIds.has(t.id)) || [];

  const availableTeams = registerableOwnedTeams
    .filter((t) => t.gameId === tournament.gameId && t.members.length >= tournament.teamSize && t.invites.length === 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ id: t.id, name: t.name, game: tournament.game?.name ?? null, memberCount: t.members.length }));

  const unavailableTeams = registerableOwnedTeams
    .filter((t) => !(t.gameId === tournament.gameId && t.members.length >= tournament.teamSize && t.invites.length === 0))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({
      id: t.id, name: t.name, game: tournament.game?.name ?? null, memberCount: t.members.length,
      reason: getUnavailableTeamReason({
        teamGame: t.gameId ?? "", tournamentGame: tournament.gameId ?? "",
        memberCount: t.members.length, teamSize: tournament.teamSize,
        pendingInvites: t.invites.length, messages: messages.labels.unavailableReasons,
      }),
    }));

  const activeRegistrations = userTournamentRegistrations
    .filter((r) => r.status !== "cancelled")
    .map((r) => ({
      id: r.id, status: r.status, teamName: r.team.name,
      rejectionReason: r.rejectionReason,
    }));

  const daysUntil = tournament.startsAt
    ? Math.max(0, Math.floor((tournament.startsAt.getTime() - Date.now()) / 86400000))
    : null;

  const fillPct = tournament.maxTeams > 0 ? Math.min((approvedSlots / tournament.maxTeams) * 100, 100) : 0;

  const TABS = ["overview", "schedule", "teams", "prizes", "rules"] as const;

  return (
    <main style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)", minHeight: "100vh" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: 560, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url("${tournamentImage}")`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.4) 0%, oklch(0.07 0.025 285 / 0.80) 55%, var(--asc-bg-0) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, var(--asc-bg-0) 0%, transparent 55%)" }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: 1680, margin: "0 auto", padding: "80px 40px 100px" }}>
          {/* Breadcrumb */}
          <Link href="/tournaments" style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28,
            fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.16em",
            textTransform: "uppercase", color: "var(--asc-fg-2)", textDecoration: "none",
          }}>
            ← TOURNAMENTS / {tournament.title.toUpperCase()}
          </Link>

          {/* Status chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            <StatusBadge status={tournament.status} label={getTournamentStatusLabel(tournament.status, messages.statuses)} />
            <StatusBadge status={`Registration ${tournament.registrationStatus}`} label={getRegistrationStatusLabel(tournament.registrationStatus, messages.statuses)} />
            {tournament.game && <Pill tone="violet">{tournament.game.name}</Pill>}
            <Pill tone="gray">{tournament.teamSize}v{tournament.teamSize}</Pill>
            <Pill tone="gray">Global</Pill>
          </div>

          {/* H1 */}
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(48px, 6vw, 96px)", lineHeight: 0.95,
            letterSpacing: "-0.01em", textTransform: "uppercase",
            color: "var(--asc-fg-0)", maxWidth: 900, marginBottom: 20,
          }}>
            {tournament.title}
          </h1>

          {tournament.description && (
            <p style={{ color: "var(--asc-fg-1)", fontSize: 17, maxWidth: 620, lineHeight: 1.55, marginBottom: 36 }}>
              {tournament.description}
            </p>
          )}

          {/* Key stats */}
          <div style={{ display: "flex", gap: 52, marginBottom: 36, flexWrap: "wrap" }}>
            {tournament.prize && (
              <div>
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>Prize Pool</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 56, lineHeight: 1, color: "var(--asc-accent)" }}>
                  {tournament.prize}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>Teams</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 56, lineHeight: 1, color: "var(--asc-fg-0)" }}>
                {approvedSlots}<span style={{ fontSize: 22, color: "var(--asc-fg-3)", marginLeft: 4 }}>/{tournament.maxTeams}</span>
              </div>
            </div>
            {daysUntil !== null && (
              <div>
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>Starts In</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 56, lineHeight: 1, color: "var(--asc-fg-0)" }}>
                  {daysUntil}<span style={{ fontSize: 22, color: "var(--asc-fg-3)", marginLeft: 8 }}>days</span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="?tab=overview" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase",
              background: "var(--asc-accent)", color: "oklch(0.10 0.02 285)",
              textDecoration: "none",
              clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
              boxShadow: "0 0 24px var(--asc-accent-glow)",
            }}>
              Register team →
            </Link>
            <Link href="?tab=schedule" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 24px", fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase",
              background: "transparent", color: "var(--asc-fg-1)",
              border: "1px solid var(--asc-line)", textDecoration: "none",
              clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
            }}>
              ▷ View bracket
            </Link>
          </div>
        </div>
      </section>

      {/* ── STICKY TABS ── */}
      <div style={{
        position: "sticky", top: 52, zIndex: 20,
        background: "oklch(0.08 0.025 285 / 0.88)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--asc-line-soft)",
      }}>
        <div style={{ maxWidth: 1680, margin: "0 auto", padding: "0 40px", display: "flex", alignItems: "stretch" }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Link key={tab} href={`?tab=${tab}`} style={{
                padding: "14px 18px",
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
                color: isActive ? "var(--asc-fg-0)" : "var(--asc-fg-3)",
                textDecoration: "none",
                borderBottom: isActive ? "2px solid var(--asc-accent)" : "2px solid transparent",
                marginBottom: -1,
                whiteSpace: "nowrap",
              }}>
                {tab}
              </Link>
            );
          })}
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", letterSpacing: "0.14em" }}>
              <span style={{ color: "var(--asc-accent)" }}>●</span>
              {" "}{approvedSlots}/{tournament.maxTeams} TEAMS LOCKED
            </span>
          </div>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div style={{ maxWidth: 1680, margin: "0 auto", padding: "48px 40px 80px" }}>
        <ProfileNotice message={sp.message} error={sp.error} />
        <TournamentDetailsRealtime tournamentId={tournament.id} />

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 32 }}>

            {/* Left */}
            <div>
              <div style={{ marginBottom: 28 }}>
                <RuleDivider label="▲ The Major · summary" />
              </div>
              <h2 style={{
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26,
                lineHeight: 1.1, marginBottom: 18, color: "var(--asc-fg-0)", textTransform: "uppercase",
              }}>
                Three weeks of qualifying. One weekend of finals.{" "}
                <span style={{ color: "var(--asc-fg-2)" }}>One crown.</span>
              </h2>
              <p style={{ color: "var(--asc-fg-1)", fontSize: 15, lineHeight: 1.65, maxWidth: 620, marginBottom: 14 }}>
                {tournament.description ||
                  `The ${tournament.title} brings together the top competitors for a ${tournament.prize ?? "prized"} season finale. Registered teams compete through a structured bracket — every result verified automatically.`}
              </p>
              <p style={{ color: "var(--asc-fg-1)", fontSize: 15, lineHeight: 1.65, maxWidth: 620 }}>
                Match results are verified automatically through the publisher API. No disputed scoreboards, no screenshot wars. What you see on the bracket is what really happened on the server.
              </p>

              {/* Timeline */}
              <div style={{ marginTop: 40 }}>
                <div style={{ marginBottom: 20 }}>
                  <RuleDivider label="▲ Timeline" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {SCHEDULE_PHASES.map((s, i) => (
                    <ScheduleCard key={i} index={i + 1} phase={s.phase} status={s.status} date={s.date} desc={s.desc} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right rail */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Registration card */}
              <div style={{ position: "relative", background: "var(--asc-bg-1)", border: "1px solid var(--asc-line-soft)", padding: 24 }}>
                <CornerMark />
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--asc-accent)", marginBottom: 8 }}>
                  ▲ REGISTRATION · {remainingSlots} SLOTS LEFT
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, textTransform: "uppercase", color: "var(--asc-fg-0)", marginBottom: 14 }}>
                  Get your team in
                </div>
                <div style={{ height: 4, background: "var(--asc-bg-2)", overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ height: "100%", width: `${fillPct}%`, background: "linear-gradient(90deg, var(--asc-accent), oklch(0.85 0.10 245))" }} />
                </div>
                <div style={{ display: "flex", fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", letterSpacing: "0.12em", marginBottom: 20 }}>
                  <span>{approvedSlots}/{tournament.maxTeams} LOCKED</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ color: "var(--asc-accent)" }}>{Math.round(fillPct)}%</span>
                </div>
                <TournamentRegistrationPanel
                  tournamentId={tournament.id}
                  tournamentStatus={tournament.status}
                  tournamentStatusLabel={getTournamentStatusLabel(tournament.status, messages.statuses)}
                  registrationStatus={tournament.registrationStatus}
                  slotsRemaining={remainingSlots}
                  teamSize={tournament.teamSize}
                  isLoggedIn={Boolean(currentUser)}
                  isGuildMember={Boolean(currentUser?.isGuildMember)}
                  availableTeams={availableTeams}
                  unavailableTeams={unavailableTeams}
                  activeRegistrations={activeRegistrations}
                  messages={messages.panel}
                  statusLabels={messages.statuses}
                  playerLabel={messages.labels.player}
                  playersLabel={messages.labels.players}
                />
              </div>

              {/* Champion's purse */}
              {tournament.prize && (
                <div style={{
                  position: "relative", padding: 24,
                  background: "linear-gradient(180deg, oklch(0.18 0.10 285 / 0.5) 0%, oklch(0.11 0.04 285) 100%)",
                  border: "1px solid var(--asc-line-soft)",
                }}>
                  <CornerMark />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ color: "oklch(0.84 0.14 85)", fontSize: 16 }}>♛</span>
                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "oklch(0.84 0.14 85)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                      Champion&apos;s Purse
                    </span>
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 56, lineHeight: 1, color: "var(--asc-fg-0)" }}>
                    {tournament.prize}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--asc-fg-2)", margin: "12px 0 0", lineHeight: 1.55 }}>
                    Winner&apos;s share of the total prize pool. Includes automatic seeding in next season.
                  </p>
                </div>
              )}

              {/* Stream embed / game art */}
              <div style={{ position: "relative", overflow: "hidden", aspectRatio: "16/10" }}>
                <CornerMark />
                <div style={{ position: "absolute", inset: 0, backgroundImage: `url("${tournamentImage}")`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.55 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, oklch(0.07 0.025 285 / 0.95) 100%)" }} />
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                  <div style={{
                    width: 64, height: 64, background: "var(--asc-accent)", display: "grid", placeItems: "center",
                    clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
                    boxShadow: "0 0 32px var(--asc-accent-glow)",
                  }}>
                    <span style={{ fontSize: 24, color: "oklch(0.10 0.02 285)", lineHeight: 1 }}>▶</span>
                  </div>
                </div>
                <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", fontSize: 10, fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--asc-live)", border: "1px solid oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--asc-live)", display: "inline-block" }} />
                    LIVE QUALIFIER
                  </span>
                  <div style={{ color: "var(--asc-fg-0)", fontSize: 14, fontWeight: 600, marginTop: 8, fontFamily: "var(--font-display)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
                    {tournament.title} · Qualifier Match
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SCHEDULE ── */}
        {activeTab === "schedule" && (
          <div style={{ maxWidth: 920 }}>
            <div style={{ marginBottom: 32 }}>
              <RuleDivider label="▲ Full schedule" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
              {SCHEDULE_PHASES.map((s, i) => (
                <ScheduleCard key={i} index={i + 1} phase={s.phase} status={s.status} date={s.date} desc={s.desc} />
              ))}
            </div>
            <TournamentMatchesSection matches={matches} locale={locale} />
          </div>
        )}

        {/* ── TEAMS ── */}
        {activeTab === "teams" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--asc-fg-3)" }}>
                ▲ ACCEPTED TEAMS
              </span>
              <div style={{ flex: 1 }} />
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--asc-fg-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                {approvedSlots} ACCEPTED · {submittedRegistrations.filter((r) => r.status === "registered").length} PENDING
              </span>
            </div>

            {approvedRegistrations.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {approvedRegistrations.map((reg, i) => {
                  const teamName = reg.snapshotTeamName || reg.team.name;
                  return (
                    <div key={reg.id} style={{ position: "relative", background: "var(--asc-bg-1)", border: "1px solid var(--asc-line-soft)", padding: "18px 20px" }}>
                      <CornerMark />
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                        <TeamAvatar name={teamName} size={48} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, textTransform: "uppercase", color: "var(--asc-fg-0)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {teamName}
                          </div>
                          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", marginTop: 4, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                            {teamName.slice(0, 3).toUpperCase()} · Global
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 9, color: "var(--asc-fg-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>SEED</div>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--asc-accent)", marginTop: 2 }}>
                            {String(i + 1).padStart(2, "0")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "var(--asc-fg-3)", padding: "60px 0", textAlign: "center", fontFamily: "var(--font-mono, monospace)", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                No teams accepted yet
              </div>
            )}

            {/* Pending */}
            {submittedRegistrations.filter((r) => r.status === "registered").length > 0 && (
              <div style={{ marginTop: 40 }}>
                <div style={{ marginBottom: 20 }}>
                  <RuleDivider label="▲ Pending review" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {submittedRegistrations.filter((r) => r.status === "registered").map((reg) => {
                    const teamName = reg.snapshotTeamName || reg.team.name;
                    return (
                      <div key={reg.id} style={{ position: "relative", background: "var(--asc-bg-1)", border: "1px dashed var(--asc-line-soft)", padding: "18px 20px", opacity: 0.6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 48, height: 48, background: "var(--asc-bg-2)", border: "1px dashed var(--asc-line)", clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)", flexShrink: 0 }} />
                          <div>
                            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, textTransform: "uppercase", color: "var(--asc-fg-2)" }}>{teamName}</div>
                            <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", marginTop: 4, letterSpacing: "0.12em", textTransform: "uppercase" }}>Awaiting verification</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All registrations table */}
            {tournament.registrations.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <div style={{ marginBottom: 20 }}>
                  <RuleDivider label="▲ All applications" />
                </div>
                <div style={{ background: "var(--asc-bg-1)", border: "1px solid var(--asc-line-soft)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 150px", padding: "10px 20px", borderBottom: "1px solid var(--asc-line-soft)" }}>
                    {["TEAM", "GAME", "STATUS", "DATE"].map((col) => (
                      <div key={col} style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--asc-fg-3)" }}>{col}</div>
                    ))}
                  </div>
                  {tournament.registrations.map((reg) => {
                    const teamName = reg.snapshotTeamName || reg.team.name;
                    const teamGame = reg.snapshotTeamGame ?? tournament.game?.name ?? "—";
                    const memberCount = getSnapshotMemberCount(reg.snapshotMembers, reg.team.members.length);
                    return (
                      <div key={reg.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 150px", padding: "14px 20px", borderBottom: "1px solid var(--asc-line-soft)", alignItems: "center" }}>
                        <div>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, textTransform: "uppercase", color: "var(--asc-fg-0)" }}>{teamName}</div>
                          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", marginTop: 2 }}>
                            {memberCount}/{tournament.teamSize} {getPlayerLabel(memberCount, messages.labels)}
                          </div>
                        </div>
                        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--asc-fg-2)", textTransform: "uppercase" }}>{teamGame}</div>
                        <StatusBadge status={reg.status} label={getRegistrationReviewStatusLabel(reg.status, messages.statuses)} />
                        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)" }}>{formatDate(reg.createdAt, locale)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Also show totalApplications info */}
            {totalApplications > 0 && (
              <p style={{ marginTop: 16, fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--asc-fg-3)", letterSpacing: "0.10em" }}>
                {totalApplications} {totalApplications === 1 ? messages.labels.applicationSubmitted : messages.labels.applicationsSubmitted}
              </p>
            )}
          </div>
        )}

        {/* ── PRIZES ── */}
        {activeTab === "prizes" && (
          <div style={{ maxWidth: 920 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
              <div style={{ flex: 1 }}>
                <RuleDivider label="▲ Prize distribution" />
              </div>
              {tournament.prize && (
                <div style={{ marginLeft: 24, textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--asc-fg-3)" }}>Pool</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 38, color: "var(--asc-accent)" }}>{tournament.prize}</div>
                </div>
              )}
            </div>

            {tournament.results.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tournament.results.map((result, i) => {
                  const teamName = result.snapshotTeamName || result.team.name;
                  const pct = i === 0 ? 50 : i === 1 ? 25 : i === 2 ? 15 : 10;
                  const placeColor = i === 0 ? "oklch(0.84 0.14 85)" : i === 1 ? "oklch(0.78 0.04 290)" : i === 2 ? "oklch(0.62 0.10 50)" : "var(--asc-fg-2)";
                  return (
                    <div key={result.id} style={{ position: "relative", background: "var(--asc-bg-1)", border: "1px solid var(--asc-line-soft)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 24 }}>
                      <CornerMark />
                      <div style={{ width: 72, textAlign: "center" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 36, lineHeight: 1, color: placeColor }}>
                          #{result.placement}
                        </div>
                        {i === 0 && <div style={{ fontSize: 16, color: placeColor, marginTop: 4 }}>♛</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, textTransform: "uppercase", color: "var(--asc-fg-0)" }}>{teamName}</div>
                        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", marginTop: 4, letterSpacing: "0.12em" }}>{pct.toFixed(1)}% OF POOL</div>
                        <div style={{ height: 3, background: "var(--asc-bg-2)", marginTop: 10, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? placeColor : "var(--asc-accent)" }} />
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "var(--asc-fg-0)" }}>{result.points} pts</div>
                        {result.note && <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", marginTop: 4 }}>{result.note}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {PRIZE_PLACEHOLDERS.map((p, i) => (
                    <div key={i} style={{ position: "relative", background: "var(--asc-bg-1)", border: "1px solid var(--asc-line-soft)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 24 }}>
                      <CornerMark />
                      <div style={{ width: 80, textAlign: "center" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, lineHeight: 1, color: p.color }}>{p.place}</div>
                        {i === 0 && <div style={{ fontSize: 16, color: p.color, marginTop: 4 }}>♛</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, textTransform: "uppercase", color: "var(--asc-fg-0)" }}>{p.label}</div>
                        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", marginTop: 4, letterSpacing: "0.12em" }}>{p.pct.toFixed(1)}% OF POOL</div>
                        <div style={{ height: 3, background: "var(--asc-bg-2)", marginTop: 10, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${p.pct}%`, background: i === 0 ? p.color : "var(--asc-accent)" }} />
                        </div>
                      </div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, color: "var(--asc-fg-0)" }}>
                        {tournament.prize ?? "TBD"}
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 24, fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--asc-fg-3)", letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center" }}>
                  Tournament in progress · Final results pending
                </p>
              </>
            )}
          </div>
        )}

        {/* ── RULES ── */}
        {activeTab === "rules" && (
          <div style={{ maxWidth: 820 }}>
            <div style={{ marginBottom: 40 }}>
              <RuleDivider label="▲ Competitive ruleset · Season 7" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {RULES_CONTENT.map((r) => (
                <div key={r.n} style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 24, paddingBottom: 36, marginBottom: 36, borderBottom: "1px solid var(--asc-line-soft)" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 40, lineHeight: 1, color: "var(--asc-accent)" }}>0{r.n}</div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, textTransform: "uppercase", color: "var(--asc-fg-0)", marginBottom: 10 }}>{r.h}</div>
                    <p style={{ color: "var(--asc-fg-1)", fontSize: 14, lineHeight: 1.65, margin: 0 }}>{r.t}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, padding: 24, background: "oklch(0.20 0.10 285 / 0.10)", border: "1px solid var(--asc-accent-dim)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 20, color: "var(--asc-accent)" }}>⛨</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, textTransform: "uppercase", color: "var(--asc-fg-0)", marginBottom: 4 }}>Full code of conduct</div>
                  <div style={{ fontSize: 13, color: "var(--asc-fg-2)" }}>Read the complete ruleset, anti-cheat policy, and broadcast guidelines.</div>
                </div>
                <button style={{
                  padding: "8px 18px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12,
                  letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--asc-fg-1)",
                  background: "transparent", border: "1px solid var(--asc-line)", cursor: "pointer",
                }}>
                  Open document
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
