import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import type { ReactNode } from "react";
import { MatchStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/auth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getFaceitIntegrationStatus } from "@/lib/faceitIntegrationStatus";
import { prisma } from "@/lib/prisma";
import { isCs2Game } from "@/lib/isCs2Game";
import {
  getMatchOperationState,
  getReadinessIssues,
} from "@/lib/adminMatchOperations";
import {
  getFaceitProductionWarnings,
  getCs2ReadinessSummary,
} from "@/lib/productionReadiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FACEIT Status | Admin | Ascendra",
  description: "FACEIT integration status and webhook log.",
};

const STATUS_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  processed:    { color: "var(--asc-green)",  border: "var(--asc-green-border)", bg: "var(--asc-green-bg)" },
  skipped:      { color: "var(--asc-fg-3)",   border: "var(--asc-line-soft)",        bg: "var(--asc-bg-2)" },
  failed:       { color: "var(--asc-live)",   border: "var(--asc-live-border)",  bg: "var(--asc-live-bg)" },
  received:     { color: "var(--asc-accent)", border: "var(--asc-accent-border)", bg: "var(--asc-accent-dim)" },
  unauthorized: { color: "var(--asc-live)",   border: "var(--asc-live-border)",  bg: "var(--asc-live-bg)" },
};

type AdminFaceitWebhooksPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    event?: string | string[];
    q?: string | string[];
    limit?: string | string[];
  }>;
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "processed", label: "Processed" },
  { value: "skipped", label: "Skipped" },
  { value: "failed", label: "Failed" },
  { value: "received", label: "Received" },
  { value: "unauthorized", label: "Unauthorized" },
];

const EVENT_FILTER_OPTIONS = [
  { value: "all", label: "All events" },
  { value: "match_status_finished", label: "match_status_finished" },
  { value: "match_demo_ready", label: "match_demo_ready" },
];

const LIMIT_OPTIONS = [50, 100];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "UTC",
});

const DISPLAY_SENSITIVE_KEYS = [
  "authorization",
  "cookie",
  "header",
  "key",
  "password",
  "secret",
  "signature",
  "token",
];


function formatAdminDate(date: Date | null): string {
  if (!date) return "-";
  return `${dateFormatter.format(date)} UTC`;
}

function isSensitiveDisplayKey(key: string): boolean {
  const lower = key.toLowerCase();
  return DISPLAY_SENSITIVE_KEYS.some((pattern) => lower.includes(pattern));
}

function sanitizePayloadForDisplay(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.slice(0, 500);
  if (typeof value === "number" || typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    if (depth >= 4) return [];
    return value
      .slice(0, 20)
      .map((item) => sanitizePayloadForDisplay(item, depth + 1));
  }

  if (typeof value === "object") {
    if (depth >= 4) return {};

    const result: Record<string, unknown> = {};
    for (const [key, childValue] of Object.entries(value)) {
      if (isSensitiveDisplayKey(key)) continue;
      result[key] = sanitizePayloadForDisplay(childValue, depth + 1);
    }
    return result;
  }

  return String(value).slice(0, 500);
}

function formatPayloadPreview(payload: unknown): string | null {
  if (payload === null || payload === undefined) return null;

  const text = JSON.stringify(sanitizePayloadForDisplay(payload), null, 2);
  if (!text || text === "null") return null;

  return text.length > 1800 ? `${text.slice(0, 1800)}\n... truncated` : text;
}

function DetailItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="grid gap-1">
      <dt className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </dt>
      <dd className="break-all font-mono text-[11px]" style={{ color: "var(--asc-fg-1)" }}>
        {value ?? "-"}
      </dd>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "green" | "red" | "accent";
}) {
  const color =
    tone === "green"
      ? "var(--asc-green)"
      : tone === "red"
        ? "var(--asc-live)"
        : tone === "accent"
          ? "var(--asc-accent)"
          : "var(--asc-fg-0)";

  return (
    <div
      className="border px-5 py-4"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-black" style={{ color }}>{value}</p>
    </div>
  );
}

function ConfigBadge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "red" | "neutral";
}) {
  const style =
    tone === "green"
      ? {
          borderColor: "var(--asc-green-border)",
          background: "var(--asc-green-bg)",
          color: "var(--asc-green)",
        }
      : tone === "red"
        ? {
            borderColor: "var(--asc-live-border)",
            background: "var(--asc-live-bg)",
            color: "var(--asc-live)",
          }
        : {
            borderColor: "var(--asc-line-soft)",
            background: "var(--asc-bg-2)",
            color: "var(--asc-fg-3)",
          };

  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-xs font-black uppercase tracking-[0.10em]"
      style={style}
    >
      {label}
    </span>
  );
}

function StatusPanelItem({
  label,
  value,
  badge,
}: {
  label: string;
  value?: string;
  badge?: ReactNode;
}) {
  return (
    <div
      className="grid gap-3 border px-5 py-4"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </p>
      {badge ?? (
        <p className="font-mono text-sm font-bold" style={{ color: "var(--asc-fg-1)" }}>
          {value}
        </p>
      )}
    </div>
  );
}


function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.skipped;
  return (
    <span
      className="border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.10em] whitespace-nowrap"
      style={{ color: style.color, borderColor: style.border, background: style.bg }}
    >
      {status}
    </span>
  );
}

export default async function AdminFaceitWebhooksPage({
  searchParams,
}: AdminFaceitWebhooksPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isAdmin) {
    redirect("/admin");
  }

  const rawStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const rawEvent = Array.isArray(params.event) ? params.event[0] : params.event;
  const rawLimit = Array.isArray(params.limit) ? params.limit[0] : params.limit;
  const rawSearch = Array.isArray(params.q) ? params.q[0] : params.q;
  const searchQuery = (rawSearch ?? "").trim().slice(0, 120);
  const selectedStatus = STATUS_FILTER_OPTIONS.some((option) => option.value === rawStatus)
    ? rawStatus ?? "all"
    : "all";
  const selectedEvent = EVENT_FILTER_OPTIONS.some((option) => option.value === rawEvent)
    ? rawEvent ?? "all"
    : "all";
  const selectedLimit = rawLimit === "100" ? 100 : 50;

  const whereParts: Prisma.FaceitWebhookLogWhereInput[] = [];
  if (selectedStatus !== "all") {
    whereParts.push({ status: selectedStatus });
  }
  if (selectedEvent !== "all") {
    whereParts.push({ eventType: selectedEvent });
  }
  if (searchQuery) {
    whereParts.push({
      OR: [
        { faceitMatchId: { contains: searchQuery, mode: "insensitive" } },
        { tournamentMatchId: { contains: searchQuery, mode: "insensitive" } },
        { reason: { contains: searchQuery, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.FaceitWebhookLogWhereInput =
    whereParts.length > 0 ? { AND: whereParts } : {};

  const currentSearchParams = new URLSearchParams();
  if (selectedStatus !== "all") currentSearchParams.set("status", selectedStatus);
  if (selectedEvent !== "all") currentSearchParams.set("event", selectedEvent);
  if (searchQuery) currentSearchParams.set("q", searchQuery);
  if (selectedLimit !== 50) currentSearchParams.set("limit", String(selectedLimit));
  const currentQuery = currentSearchParams.toString();
  const currentHref = currentQuery
    ? `/admin/faceit-webhooks?${currentQuery}`
    : "/admin/faceit-webhooks";

  const integrationStatus = getFaceitIntegrationStatus();

  const [
    logs,
    totalCount,
    statusGroups,
    lastWebhook,
    lastProcessedWebhook,
    recentWebhookStatuses,
  ] = await Promise.all([
    prisma.faceitWebhookLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: selectedLimit,
      select: {
        id: true,
        eventType: true,
        faceitMatchId: true,
        tournamentMatchId: true,
        status: true,
        reason: true,
        httpStatus: true,
        processedAt: true,
        createdAt: true,
        payload: true,
      },
    }),
    prisma.faceitWebhookLog.count({ where }),
    prisma.faceitWebhookLog.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    prisma.faceitWebhookLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.faceitWebhookLog.findFirst({
      where: { status: "processed", processedAt: { not: null } },
      orderBy: [{ processedAt: "desc" }, { createdAt: "desc" }],
      select: { processedAt: true },
    }),
    prisma.faceitWebhookLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { status: true },
    }),
  ]);

  const statusCounts = new Map(
    statusGroups.map((group) => [group.status, group._count._all]),
  );
  const recentFailedCount = recentWebhookStatuses.filter(
    (log) => log.status === "failed",
  ).length;
  const recentSkippedCount = recentWebhookStatuses.filter(
    (log) => log.status === "skipped",
  ).length;

  // Resolve tournament IDs for match links in one query.
  const tournamentMatchIds = logs
    .map((l) => l.tournamentMatchId)
    .filter((id): id is string => id != null);

  const matchLinks = new Map<string, string>();
  if (tournamentMatchIds.length > 0) {
    const matches = await prisma.tournamentMatch.findMany({
      where: { id: { in: tournamentMatchIds } },
      select: { id: true, tournamentId: true },
    });
    for (const m of matches) {
      matchLinks.set(m.id, `/tournaments/${m.tournamentId}/matches/${m.id}`);
    }
  }

  // Active CS2 match readiness stats.
  const activeStatuses: MatchStatus[] = [
    MatchStatus.scheduled,
    MatchStatus.ready,
    MatchStatus.room_created,
    MatchStatus.in_progress,
    MatchStatus.result_pending,
    MatchStatus.disputed,
  ];

  const cs2QueryRows = await prisma.tournamentMatch.findMany({
    where: { isBye: false, status: { in: activeStatuses } },
    select: {
      teamAId: true,
      teamBId: true,
      scheduledAt: true,
      playerInstructions: true,
      faceitMatchId: true,
      faceitMatchUrl: true,
      faceitSyncedAt: true,
      faceitAutoAppliedAt: true,
      checkIns: { select: { teamId: true } },
      tournament: { select: { game: { select: { slug: true, name: true } } } },
    },
    take: 200,
  });

  const cs2Summary = getCs2ReadinessSummary(
    cs2QueryRows.map((m) => {
      const gameSlug = m.tournament.game?.slug ?? null;
      const gameName = m.tournament.game?.name ?? null;
      const isCs2 = isCs2Game(gameSlug, gameName);
      const state = getMatchOperationState(m);
      return { isCs2, readinessIssues: getReadinessIssues(state, isCs2) };
    }),
  );

  const productionWarnings = getFaceitProductionWarnings(integrationStatus);

  return (
    <main className="asc-admin-page asc-ambient min-h-screen overflow-hidden" style={{ background: "var(--asc-bg-0)" }}>
      <Navbar />

      <section className="relative min-h-[430px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/images/backgrounds/admin-hero.webp")' }}
        />
        <div className="absolute inset-0" style={{ background: "var(--asc-admin-hero-overlay)" }} />
        <div className="absolute inset-x-0 bottom-0 h-44" style={{ background: "var(--asc-admin-hero-bottom)" }} />

        <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-24 pt-20 lg:px-10">
          <Link
            href="/admin"
            className="mb-6 inline-flex items-center gap-2 text-sm font-black transition hover:opacity-90"
            style={{ color: "var(--asc-fg-3)" }}
          >
            ← Back to admin
          </Link>

          <p className="mb-4 text-sm font-black uppercase tracking-[0.22em]" style={{ color: "var(--asc-accent)" }}>
            Ascendra admin panel
          </p>

          <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.04] tracking-tight md:text-6xl" style={{ color: "var(--asc-fg-0)" }}>
            FACEIT Status.
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7" style={{ color: "var(--asc-fg-2)" }}>
            FACEIT integration status and incoming webhook log. Secrets are never displayed.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span
              className="border px-3 py-1 font-black"
              style={{ borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }}
            >
              Admin
            </span>
            <span
              className="border px-3 py-1 font-bold"
              style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-2)" }}
            >
              {session.user.name}
            </span>
            <span
              className="border px-3 py-1 font-bold"
              style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
            >
              {logs.length} shown of {totalCount} matching
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-6 px-6 pb-8 lg:px-10">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
            FACEIT production status
          </p>
          <h2 className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>
            Integration safety
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            Secrets are never displayed.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatusPanelItem
            label="FACEIT API key"
            badge={
              <ConfigBadge
                label={integrationStatus.apiKeyConfigured ? "Configured" : "Missing"}
                tone={integrationStatus.apiKeyConfigured ? "green" : "red"}
              />
            }
          />
          <StatusPanelItem
            label="FACEIT webhook secret"
            badge={
              <ConfigBadge
                label={integrationStatus.webhookSecretConfigured ? "Configured" : "Missing"}
                tone={integrationStatus.webhookSecretConfigured ? "green" : "red"}
              />
            }
          />
          <StatusPanelItem
            label="Auto-confirm"
            badge={
              <ConfigBadge
                label={integrationStatus.autoConfirmEnabled ? "Enabled" : "Disabled"}
                tone={integrationStatus.autoConfirmEnabled ? "green" : "neutral"}
              />
            }
          />
          <StatusPanelItem
            label="Faction-order fallback"
            badge={
              <ConfigBadge
                label={integrationStatus.factionOrderFallbackEnabled ? "Enabled" : "Disabled"}
                tone={integrationStatus.factionOrderFallbackEnabled ? "red" : "green"}
              />
            }
          />
          <StatusPanelItem
            label="Last webhook received"
            value={lastWebhook ? formatAdminDate(lastWebhook.createdAt) : "No webhooks yet"}
          />
          <StatusPanelItem
            label="Last processed webhook"
            value={lastProcessedWebhook?.processedAt ? formatAdminDate(lastProcessedWebhook.processedAt) : "None processed yet"}
          />
          <StatusPanelItem label="Recent failed webhooks" value={`${recentFailedCount} of latest 50`} />
          <StatusPanelItem label="Recent skipped webhooks" value={`${recentSkippedCount} of latest 50`} />
        </div>

        <div
          className="border px-5 py-4"
          style={
            integrationStatus.factionOrderFallbackEnabled
              ? {
                  borderColor: "var(--asc-live-border)",
                  background: "var(--asc-live-bg)",
                  color: "var(--asc-live)",
                }
              : integrationStatus.autoConfirmEnabled
                ? {
                    borderColor: "var(--asc-green-border)",
                    background: "var(--asc-green-bg)",
                    color: "var(--asc-green)",
                  }
                : {
                    borderColor: "var(--asc-line-soft)",
                    background: "var(--asc-bg-1)",
                    color: "var(--asc-fg-3)",
                  }
          }
        >
          <p className="text-sm font-black">
            {integrationStatus.factionOrderFallbackEnabled
              ? "Faction-order fallback is enabled. Disable it before public tournaments."
              : integrationStatus.autoConfirmEnabled
                ? "Auto-confirm is using safer matching only."
                : "Auto-confirm is disabled. FACEIT proof will not apply official results automatically."}
          </p>
        </div>

      </section>

      {/* ── Active CS2 match readiness ──────────────────────────────────── */}
      <section className="mx-auto grid max-w-[1440px] gap-6 px-6 pb-8 lg:px-10">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
            Active match readiness
          </p>
          <h2 className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>
            CS2 match status
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            Counts from all active CS2 tournament matches. Open{" "}
            <Link href="/admin/match-operations" className="underline transition hover:opacity-80" style={{ color: "var(--asc-accent)" }}>
              Match Operations
            </Link>{" "}
            for the full table.
          </p>
        </div>

        {cs2Summary.totalCs2Active === 0 ? (
          <p className="text-sm font-black" style={{ color: "var(--asc-fg-3)" }}>
            No active CS2 matches.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <SummaryStat label="Active CS2 matches" value={cs2Summary.totalCs2Active} />
            <SummaryStat
              label="Missing schedule"
              value={cs2Summary.missingSchedule}
              tone={cs2Summary.missingSchedule > 0 ? "red" : "neutral"}
            />
            <SummaryStat
              label="Missing FACEIT room"
              value={cs2Summary.missingRoom}
              tone={cs2Summary.missingRoom > 0 ? "red" : "neutral"}
            />
            <SummaryStat
              label="Missing proof"
              value={cs2Summary.missingProof}
              tone={cs2Summary.missingProof > 0 ? "red" : "neutral"}
            />
            <SummaryStat
              label="Needs check-in"
              value={cs2Summary.needsCheckin}
              tone={cs2Summary.needsCheckin > 0 ? "red" : "neutral"}
            />
          </div>
        )}

        {productionWarnings.length > 0 && (
          <div className="grid gap-2">
            {productionWarnings.map((w) => (
              <div
                key={w.key}
                className="border px-5 py-3"
                style={
                  w.severity === "error"
                    ? {
                        borderColor: "var(--asc-live-border)",
                        background: "var(--asc-live-bg)",
                        color: "var(--asc-live)",
                      }
                    : {
                        borderColor: "var(--asc-amber-border)",
                        background: "var(--asc-amber-bg)",
                        color: "var(--asc-amber)",
                      }
                }
              >
                <p className="text-sm font-black">{w.message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/match-operations"
            className="inline-flex border px-5 py-2 text-sm font-black transition hover:opacity-90"
            style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
          >
            Match Operations →
          </Link>
          <a
            href="#webhook-log"
            className="inline-flex border px-5 py-2 text-sm font-black transition hover:opacity-90"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-2)" }}
          >
            Webhook Logs ↓
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-3 px-6 pb-6 lg:grid-cols-5 lg:px-10">
        <SummaryStat label="Total" value={totalCount} />
        <SummaryStat label="Processed" value={statusCounts.get("processed") ?? 0} tone="green" />
        <SummaryStat label="Skipped" value={statusCounts.get("skipped") ?? 0} />
        <SummaryStat label="Failed" value={statusCounts.get("failed") ?? 0} tone="red" />
        <SummaryStat label="Unauthorized" value={statusCounts.get("unauthorized") ?? 0} tone="red" />
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-6 lg:px-10">
        <div
          className="border p-5"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
        >
          <form
            action="/admin/faceit-webhooks"
            className="grid gap-4 xl:grid-cols-[190px_240px_minmax(260px,1fr)_150px_auto_auto_auto] xl:items-end"
          >
            <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
              Status
              <select
                name="status"
                defaultValue={selectedStatus}
                className="border px-3 py-3 text-sm font-bold normal-case tracking-normal outline-none"
                style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-1)" }}
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
              Event
              <select
                name="event"
                defaultValue={selectedEvent}
                className="border px-3 py-3 text-sm font-bold normal-case tracking-normal outline-none"
                style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-1)" }}
              >
                {EVENT_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
              Search match IDs or reason
              <input
                name="q"
                defaultValue={searchQuery}
                placeholder="FACEIT match ID, Ascendra match ID, or reason"
                className="border px-3 py-3 text-sm font-bold normal-case tracking-normal outline-none placeholder:font-medium"
                style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-1)" }}
              />
            </label>

            <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
              Limit
              <select
                name="limit"
                defaultValue={String(selectedLimit)}
                className="border px-3 py-3 text-sm font-bold normal-case tracking-normal outline-none"
                style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-1)" }}
              >
                {LIMIT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="border px-5 py-3 text-sm font-black transition hover:opacity-90"
              style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
            >
              Apply filters
            </button>

            <Link
              href="/admin/faceit-webhooks"
              className="border px-5 py-3 text-center text-sm font-black transition hover:opacity-90"
              style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
            >
              Reset
            </Link>

            <a
              href={currentHref}
              className="border px-5 py-3 text-center text-sm font-black transition hover:opacity-90"
              style={{ borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }}
            >
              Refresh logs
            </a>
          </form>
        </div>
      </section>

      <section id="webhook-log" className="mx-auto max-w-[1440px] px-6 pb-16 lg:px-10">
        {logs.length === 0 ? (
          <div
            className="border px-6 py-10 text-center text-sm"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-3)" }}
          >
            No FACEIT webhook events match these filters.
          </div>
        ) : (
          <div
            className="overflow-x-auto border"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <table className="w-full min-w-[1320px] text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
                  {["Created", "Status", "Event", "FACEIT Match ID", "Ascendra Match", "Reason", "Processed At", "Details"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-black uppercase tracking-[0.12em]"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const matchHref = log.tournamentMatchId
                    ? matchLinks.get(log.tournamentMatchId)
                    : undefined;
                  const isEven = i % 2 === 0;
                  const payloadPreview = formatPayloadPreview(log.payload);
                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: "1px solid var(--asc-line-soft)",
                        background: isEven ? "transparent" : "var(--asc-row-alt)",
                      }}
                    >
                      {/* Created */}
                      <td
                        className="whitespace-nowrap px-4 py-3 font-mono"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        <time dateTime={log.createdAt.toISOString()} title={log.createdAt.toISOString()}>
                          {formatAdminDate(log.createdAt)}
                        </time>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status} />
                      </td>

                      {/* Event */}
                      <td
                        className="px-4 py-3 font-mono"
                        style={{ color: "var(--asc-fg-1)" }}
                      >
                        {log.eventType ?? <span style={{ color: "var(--asc-fg-3)" }}>—</span>}
                      </td>

                      {/* FACEIT Match ID */}
                      <td
                        className="px-4 py-3 font-mono"
                        style={{ color: "var(--asc-fg-2)" }}
                      >
                        {log.faceitMatchId ? (
                          <span title={log.faceitMatchId}>
                            {log.faceitMatchId.length > 20
                              ? `${log.faceitMatchId.slice(0, 20)}…`
                              : log.faceitMatchId}
                          </span>
                        ) : (
                          <span style={{ color: "var(--asc-fg-3)" }}>—</span>
                        )}
                      </td>

                      {/* Ascendra Match */}
                      <td className="px-4 py-3 font-mono">
                        {log.tournamentMatchId ? (
                          matchHref ? (
                            <Link
                              href={matchHref}
                              className="font-black transition hover:opacity-75"
                              style={{ color: "var(--asc-blue)" }}
                            >
                              {log.tournamentMatchId.slice(0, 14)}… →
                            </Link>
                          ) : (
                            <span style={{ color: "var(--asc-fg-3)" }} title={log.tournamentMatchId}>
                              {log.tournamentMatchId.slice(0, 14)}…
                            </span>
                          )
                        ) : (
                          <span style={{ color: "var(--asc-fg-3)" }}>—</span>
                        )}
                      </td>

                      {/* Reason */}
                      <td
                        className="px-4 py-3 font-mono"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        {log.reason ?? <span>—</span>}
                      </td>

                      {/* Processed At */}
                      <td
                        className="whitespace-nowrap px-4 py-3 font-mono"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        {log.processedAt ? (
                          <time dateTime={log.processedAt.toISOString()} title={log.processedAt.toISOString()}>
                            {formatAdminDate(log.processedAt)}
                          </time>
                        ) : (
                          <span>-</span>
                        )}
                      </td>

                      {/* Details */}
                      <td className="px-4 py-3 align-top">
                        <details className="min-w-[360px]">
                          <summary
                            className="cursor-pointer text-sm font-black transition hover:opacity-80"
                            style={{ color: "var(--asc-accent)" }}
                          >
                            View details
                          </summary>

                          <div
                            className="mt-3 grid gap-4 border p-4"
                            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
                          >
                            <dl className="grid gap-3 md:grid-cols-2">
                              <DetailItem label="Log ID" value={log.id} />
                              <DetailItem label="Event type" value={log.eventType} />
                              <DetailItem label="FACEIT match ID" value={log.faceitMatchId} />
                              <DetailItem label="Tournament match ID" value={log.tournamentMatchId} />
                              <DetailItem label="Status" value={log.status} />
                              <DetailItem label="Reason" value={log.reason} />
                              <DetailItem label="HTTP status" value={log.httpStatus} />
                              <DetailItem label="Created at" value={formatAdminDate(log.createdAt)} />
                              <DetailItem label="Processed at" value={formatAdminDate(log.processedAt)} />
                            </dl>

                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
                                Sanitized payload preview
                              </p>
                              {payloadPreview ? (
                                <pre
                                  className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words border p-3 text-[11px] leading-5"
                                  style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-0)", color: "var(--asc-fg-2)" }}
                                >
                                  {payloadPreview}
                                </pre>
                              ) : (
                                <p className="mt-2 font-mono text-[11px]" style={{ color: "var(--asc-fg-3)" }}>
                                  -
                                </p>
                              )}
                            </div>
                          </div>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
