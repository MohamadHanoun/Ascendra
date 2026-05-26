import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/auth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FACEIT Webhooks | Admin | Ascendra",
  description: "Debug log of incoming FACEIT webhook events.",
};

const STATUS_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  processed:    { color: "var(--asc-green)",  border: "oklch(0.55 0.14 150 / 0.5)", bg: "oklch(0.25 0.12 150 / 0.18)" },
  skipped:      { color: "var(--asc-fg-3)",   border: "var(--asc-line-soft)",        bg: "var(--asc-bg-2)" },
  failed:       { color: "var(--asc-live)",   border: "oklch(0.50 0.20 25 / 0.5)",  bg: "oklch(0.25 0.18 25 / 0.18)" },
  received:     { color: "var(--asc-accent)", border: "oklch(0.50 0.20 285 / 0.4)", bg: "var(--asc-accent-dim)" },
  unauthorized: { color: "var(--asc-amber)",  border: "oklch(0.65 0.14 75 / 0.5)",  bg: "oklch(0.25 0.12 75 / 0.18)" },
};

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

export default async function AdminFaceitWebhooksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isAdmin) {
    redirect("/admin");
  }

  const logs = await prisma.faceitWebhookLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
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
    },
  });

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

  return (
    <main className="asc-ambient min-h-screen overflow-hidden text-white" style={{ background: "var(--asc-bg-0)" }}>
      <Navbar />

      <section className="relative min-h-[430px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/images/backgrounds/admin-hero.webp")' }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,oklch(0.06 0.03 287 / 0.92) 0%,oklch(0.06 0.03 287 / 0.66) 44%,oklch(0.06 0.03 287 / 0.82) 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 h-44" style={{ background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))" }} />

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
            FACEIT Webhooks.
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7" style={{ color: "var(--asc-fg-2)" }}>
            Last 50 incoming FACEIT webhook events. Sensitive fields are stripped before storage.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span
              className="border px-3 py-1 font-black"
              style={{ borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" }}
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
              {logs.length} entries
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-16 lg:px-10">
        {logs.length === 0 ? (
          <div
            className="border px-6 py-10 text-center text-sm"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-3)" }}
          >
            No webhook events logged yet.
          </div>
        ) : (
          <div
            className="overflow-x-auto border"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <table className="w-full min-w-[900px] text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
                  {["Created", "Status", "Event", "FACEIT Match ID", "Ascendra Match", "Reason"].map((h) => (
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
                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: "1px solid var(--asc-line-soft)",
                        background: isEven ? "transparent" : "oklch(1 0 0 / 0.025)",
                      }}
                    >
                      {/* Created */}
                      <td
                        className="whitespace-nowrap px-4 py-3 font-mono"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        {log.createdAt.toISOString().replace("T", " ").slice(0, 19)}
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
