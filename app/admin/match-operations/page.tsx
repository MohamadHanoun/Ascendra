import type { Metadata } from "next";
import { MatchStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/auth";
import AdminMatchOperationsRealtime from "@/components/AdminMatchOperationsRealtime";
import AdminShell from "@/components/AdminShell";
import { prisma } from "@/lib/prisma";
import {
  normalizeAdminMatchOperationCard,
  type AdminMatchOperationCard,
  type ReadinessIssue,
} from "@/lib/adminMatchOperations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Match Operations | Admin | Ascendra",
  description: "Operational overview of all active tournament matches.",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES: MatchStatus[] = [
  MatchStatus.scheduled,
  MatchStatus.ready,
  MatchStatus.room_created,
  MatchStatus.in_progress,
  MatchStatus.result_pending,
  MatchStatus.disputed,
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "ready", label: "Ready" },
  { value: "room_created", label: "Room created" },
  { value: "in_progress", label: "In progress" },
  { value: "result_pending", label: "Result pending" },
  { value: "disputed", label: "Disputed" },
];

const GAME_FILTER_OPTIONS = [
  { value: "all", label: "All games" },
  { value: "cs2", label: "CS2" },
  { value: "other", label: "Other" },
];

const READINESS_FILTER_OPTIONS = [
  { value: "all", label: "All readiness" },
  { value: "missing_schedule", label: "Missing schedule" },
  { value: "missing_room", label: "Missing FACEIT room" },
  { value: "missing_proof", label: "Missing proof" },
  { value: "needs_checkin", label: "Needs check-in" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

function fmt(date: Date | null): string {
  if (!date) return "—";
  return `${dateFormatter.format(date)} UTC`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "accent" | "red";
}) {
  const color =
    tone === "accent"
      ? "var(--asc-accent)"
      : tone === "red"
        ? "var(--asc-live)"
        : "var(--asc-fg-0)";

  return (
    <div
      className="border px-5 py-4"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <p
        className="text-[11px] font-black uppercase tracking-[0.14em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {label}
      </p>
      <p className="mt-2 text-2xl font-black" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function IssueBadge({ issue }: { issue: ReadinessIssue }) {
  const label: Record<ReadinessIssue, string> = {
    missing_schedule: "No schedule",
    missing_room: "No room",
    missing_proof: "No proof",
    needs_checkin: "Check-in",
  };

  return (
    <span
      className="inline-flex border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em]"
      style={{
        borderColor: "var(--asc-live-border)",
        background: "var(--asc-live-bg)",
        color: "var(--asc-live)",
      }}
    >
      {label[issue]}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "disputed"
      ? {
          borderColor: "var(--asc-live-border)",
          background: "var(--asc-live-bg)",
          color: "var(--asc-live)",
        }
      : status === "in_progress"
        ? {
            borderColor: "var(--asc-green-border)",
            background: "var(--asc-green-bg)",
            color: "var(--asc-green)",
          }
        : status === "room_created"
          ? {
              borderColor: "var(--asc-accent-border)",
              background: "var(--asc-accent-dim)",
              color: "var(--asc-accent)",
            }
          : {
              borderColor: "var(--asc-line-soft)",
              background: "var(--asc-bg-2)",
              color: "var(--asc-fg-2)",
            };

  const label: Record<string, string> = {
    scheduled: "Scheduled",
    ready: "Ready",
    room_created: "Room created",
    in_progress: "In progress",
    result_pending: "Result pending",
    disputed: "Disputed",
  };

  return (
    <span
      className="inline-flex border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] whitespace-nowrap"
      style={style}
    >
      {label[status] ?? status}
    </span>
  );
}

function BoolCell({ value, trueLabel = "Yes", falseLabel = "No" }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
  return (
    <span
      className="text-xs font-black"
      style={{ color: value ? "var(--asc-green)" : "var(--asc-fg-3)" }}
    >
      {value ? trueLabel : falseLabel}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type PageProps = {
  searchParams: Promise<{
    status?: string | string[];
    game?: string | string[];
    readiness?: string | string[];
  }>;
};

export default async function AdminMatchOperationsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.isAdmin) redirect("/admin");

  const params = await searchParams;
  const statusFilter = typeof params.status === "string" ? params.status : "all";
  const gameFilter = typeof params.game === "string" ? params.game : "all";
  const readinessFilter = typeof params.readiness === "string" ? params.readiness : "all";

  // ── Prisma query (status filter applied server-side) ──────────────────────

  const validStatuses = ACTIVE_STATUSES.filter((s) => s === statusFilter);
  const statusIn: MatchStatus[] = validStatuses.length > 0 ? validStatuses : ACTIVE_STATUSES;
  const statusWhere = { status: { in: statusIn } };

  const matchRows = await prisma.tournamentMatch.findMany({
    where: { isBye: false, ...statusWhere },
    select: {
      id: true,
      tournamentId: true,
      roundNumber: true,
      matchNumber: true,
      status: true,
      teamAId: true,
      teamBId: true,
      scheduledAt: true,
      playerInstructions: true,
      faceitMatchId: true,
      faceitMatchUrl: true,
      faceitSyncedAt: true,
      faceitAutoAppliedAt: true,
      tournament: {
        select: {
          title: true,
          game: { select: { slug: true, name: true } },
        },
      },
      checkIns: {
        select: { id: true, teamId: true },
      },
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  // ── Fetch team names ──────────────────────────────────────────────────────

  const teamIdSet = new Set<string>();
  for (const m of matchRows) {
    if (m.teamAId) teamIdSet.add(m.teamAId);
    if (m.teamBId) teamIdSet.add(m.teamBId);
  }

  const teamRows = await prisma.team.findMany({
    where: { id: { in: [...teamIdSet] } },
    select: { id: true, name: true },
  });

  const teamMap = new Map(teamRows.map((t) => [t.id, t]));

  // ── Normalize ─────────────────────────────────────────────────────────────

  let cards: AdminMatchOperationCard[] = matchRows.map((m) =>
    normalizeAdminMatchOperationCard(m, teamMap),
  );

  // ── In-memory filters (game + readiness) ─────────────────────────────────

  if (gameFilter === "cs2") {
    cards = cards.filter((c) => c.isCs2);
  } else if (gameFilter === "other") {
    cards = cards.filter((c) => !c.isCs2);
  }

  if (readinessFilter !== "all") {
    cards = cards.filter((c) =>
      c.readinessIssues.includes(readinessFilter as ReadinessIssue),
    );
  }

  cards = cards.slice(0, 50);

  // ── Summary stats (computed from unsliced cards before filter) ────────────

  const allCards: AdminMatchOperationCard[] = matchRows.map((m) =>
    normalizeAdminMatchOperationCard(m, teamMap),
  );

  const totalActive = allCards.length;
  const missingSchedule = allCards.filter((c) =>
    c.readinessIssues.includes("missing_schedule"),
  ).length;
  const missingRoom = allCards.filter((c) =>
    c.readinessIssues.includes("missing_room"),
  ).length;
  const missingProof = allCards.filter((c) =>
    c.readinessIssues.includes("missing_proof"),
  ).length;
  const needsCheckin = allCards.filter((c) =>
    c.readinessIssues.includes("needs_checkin"),
  ).length;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AdminShell
      userName={session.user.name}
      title="Match Operations"
      description="Live match control across schedules, rooms, check-ins, proofs, and results."
      headerMeta={
        <span
          className="border px-3 py-1 font-bold"
          style={{
            borderColor: "var(--asc-line-soft)",
            background: "var(--asc-bg-2)",
            color: "var(--asc-fg-3)",
          }}
        >
          {totalActive} active match{totalActive !== 1 ? "es" : ""}
        </span>
      }
    >

      {/* Hero */}
      <section className="hidden">
        

        <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-24 pt-20 lg:px-10">
          <Link
            href="/admin"
            className="mb-6 inline-flex items-center gap-2 text-sm font-black transition hover:opacity-90"
            style={{ color: "var(--asc-fg-3)" }}
          >
            ← Back to admin
          </Link>

          <p
            className="mb-4 text-sm font-black uppercase tracking-[0.22em]"
            style={{ color: "var(--asc-accent)" }}
          >
            Ascendra admin panel
          </p>

          <h1
            className="max-w-5xl text-5xl font-black uppercase leading-[1.04] tracking-tight md:text-6xl"
            style={{ color: "var(--asc-fg-0)" }}
          >
            Match Operations.
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7" style={{ color: "var(--asc-fg-2)" }}>
            Live match control across schedules, rooms, check-ins, proofs, and results.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span
              className="border px-3 py-1 font-black"
              style={{
                borderColor: "var(--asc-green-border)",
                background: "var(--asc-green-bg)",
                color: "var(--asc-green)",
              }}
            >
              Admin
            </span>
            <span
              className="border px-3 py-1 font-bold"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-2)",
                color: "var(--asc-fg-2)",
              }}
            >
              {session.user.name}
            </span>
            <span
              className="border px-3 py-1 font-bold"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-2)",
                color: "var(--asc-fg-3)",
              }}
            >
              {totalActive} active match{totalActive !== 1 ? "es" : ""}
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-[1440px] px-6 pb-16 lg:px-10">

        {/* Summary stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryStat label="Total active" value={totalActive} tone="neutral" />
          <SummaryStat label="Missing schedule" value={missingSchedule} tone={missingSchedule > 0 ? "red" : "neutral"} />
          <SummaryStat label="Missing FACEIT room" value={missingRoom} tone={missingRoom > 0 ? "red" : "neutral"} />
          <SummaryStat label="Missing proof" value={missingProof} tone={missingProof > 0 ? "red" : "neutral"} />
          <SummaryStat label="Needs check-in" value={needsCheckin} tone={needsCheckin > 0 ? "red" : "neutral"} />
        </div>

        {/* Filters */}
        <form
          action="/admin/match-operations"
          method="GET"
          className="mb-6 flex flex-wrap gap-3"
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filter-game"
              className="text-[11px] font-black uppercase tracking-[0.12em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              Game
            </label>
            <select
              id="filter-game"
              name="game"
              defaultValue={gameFilter}
              className="border px-3 py-2 text-sm font-black"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
                color: "var(--asc-fg-1)",
              }}
            >
              {GAME_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="filter-status"
              className="text-[11px] font-black uppercase tracking-[0.12em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              Status
            </label>
            <select
              id="filter-status"
              name="status"
              defaultValue={statusFilter}
              className="border px-3 py-2 text-sm font-black"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
                color: "var(--asc-fg-1)",
              }}
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="filter-readiness"
              className="text-[11px] font-black uppercase tracking-[0.12em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              Readiness
            </label>
            <select
              id="filter-readiness"
              name="readiness"
              defaultValue={readinessFilter}
              className="border px-3 py-2 text-sm font-black"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
                color: "var(--asc-fg-1)",
              }}
            >
              {READINESS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="border px-5 py-2 text-sm font-black transition hover:opacity-90"
              style={{
                borderColor: "var(--asc-accent-border)",
                background: "var(--asc-accent-dim)",
                color: "var(--asc-accent)",
              }}
            >
              Apply
            </button>
          </div>
        </form>

        {/* Table */}
        {cards.length === 0 ? (
          <div
            className="border px-6 py-12 text-center"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <p className="text-sm font-black" style={{ color: "var(--asc-fg-3)" }}>
              {totalActive === 0 && statusFilter === "all" && gameFilter === "all" && readinessFilter === "all"
                ? "No active matches need attention."
                : "No active matches match the selected filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border" style={{ borderColor: "var(--asc-line-soft)" }}>
            <table className="w-full min-w-[1100px] text-xs">
              <thead>
                <tr style={{ background: "var(--asc-bg-2)", borderBottom: "1px solid var(--asc-line-soft)" }}>
                  {[
                    "Tournament / Match",
                    "Teams",
                    "Status",
                    "Schedule",
                    "Instructions",
                    "FACEIT Room",
                    "Check-in (A/B)",
                    "Proof",
                    "Auto Result",
                    "Issues",
                    "Open",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em]"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cards.map((card, i) => (
                  <tr
                    key={card.matchId}
                    style={{
                      background: i % 2 === 0 ? "var(--asc-bg-1)" : "var(--asc-bg-2)",
                      borderBottom: "1px solid var(--asc-line-soft)",
                    }}
                  >
                    {/* Tournament / Match */}
                    <td className="px-3 py-3">
                      <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
                        {card.tournamentTitle}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px]" style={{ color: "var(--asc-fg-3)" }}>
                        R{card.roundNumber} M{card.matchNumber}
                        {card.isCs2 && (
                          <span
                            className="ml-1.5 border px-1 py-0.5 text-[9px] font-black uppercase"
                            style={{
                              borderColor: "var(--asc-accent-border)",
                              background: "var(--asc-accent-dim)",
                              color: "var(--asc-accent)",
                            }}
                          >
                            CS2
                          </span>
                        )}
                      </p>
                    </td>

                    {/* Teams */}
                    <td className="px-3 py-3">
                      <p style={{ color: "var(--asc-fg-1)" }}>{card.teamAName ?? <span style={{ color: "var(--asc-fg-3)" }}>TBD</span>}</p>
                      <p className="mt-0.5" style={{ color: "var(--asc-fg-3)" }}>vs</p>
                      <p style={{ color: "var(--asc-fg-1)" }}>{card.teamBName ?? <span style={{ color: "var(--asc-fg-3)" }}>TBD</span>}</p>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <StatusBadge status={card.status} />
                    </td>

                    {/* Schedule */}
                    <td className="px-3 py-3 whitespace-nowrap" style={{ color: card.scheduledAt ? "var(--asc-fg-1)" : "var(--asc-fg-3)" }}>
                      {fmt(card.scheduledAt)}
                    </td>

                    {/* Instructions */}
                    <td className="px-3 py-3">
                      <BoolCell value={card.hasInstructions} />
                    </td>

                    {/* FACEIT Room */}
                    <td className="px-3 py-3">
                      {card.hasFaceitRoom && card.faceitMatchUrl ? (
                        <a
                          href={card.faceitMatchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-black underline transition hover:opacity-80"
                          style={{ color: "var(--asc-accent)" }}
                        >
                          Open
                        </a>
                      ) : (
                        <BoolCell value={card.hasFaceitRoom} trueLabel="Linked" falseLabel="—" />
                      )}
                    </td>

                    {/* Check-in */}
                    <td className="px-3 py-3 whitespace-nowrap font-mono" style={{ color: "var(--asc-fg-1)" }}>
                      {card.isCs2 ? (
                        <span
                          style={{
                            color:
                              card.teamACheckIns > 0 && card.teamBCheckIns > 0
                                ? "var(--asc-green)"
                                : "var(--asc-live)",
                          }}
                        >
                          {card.teamACheckIns} / {card.teamBCheckIns}
                        </span>
                      ) : (
                        <span style={{ color: "var(--asc-fg-3)" }}>—</span>
                      )}
                    </td>

                    {/* Proof */}
                    <td className="px-3 py-3">
                      {card.isCs2 ? (
                        <BoolCell value={card.hasFaceitProof} trueLabel="Synced" falseLabel="—" />
                      ) : (
                        <span style={{ color: "var(--asc-fg-3)" }}>—</span>
                      )}
                    </td>

                    {/* Auto Result */}
                    <td className="px-3 py-3">
                      {card.hasAutoApplied ? (
                        <span className="text-xs font-black" style={{ color: "var(--asc-green)" }}>
                          Applied
                        </span>
                      ) : (
                        <span style={{ color: "var(--asc-fg-3)" }}>—</span>
                      )}
                    </td>

                    {/* Issues */}
                    <td className="px-3 py-3">
                      {card.readinessIssues.length === 0 ? (
                        <span className="text-xs font-black" style={{ color: "var(--asc-green)" }}>
                          Ready
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {card.readinessIssues.map((issue) => (
                            <IssueBadge key={issue} issue={issue} />
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Open */}
                    <td className="px-3 py-3">
                      <Link
                        href={card.matchHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-black underline transition hover:opacity-80"
                        style={{ color: "var(--asc-accent)" }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {cards.length === 50 && (
          <p className="mt-3 text-xs" style={{ color: "var(--asc-fg-3)" }}>
            Showing first 50 results. Use filters to narrow down.
          </p>
        )}

      </section>

      <AdminMatchOperationsRealtime />
    </AdminShell>
  );
}
