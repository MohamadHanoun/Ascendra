import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfileNotice from "@/components/ProfileNotice";
import TournamentsPageClient, { type TournamentItem } from "@/components/TournamentsPageClient";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

export const dynamic = "force-dynamic";

type TournamentsPageProps = {
  searchParams: Promise<{ message?: string; error?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getDictionary(locale).tournaments.metadata;
  return { title: messages.title, description: messages.description };
}


export default async function TournamentsPage({ searchParams }: TournamentsPageProps) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const messages = getDictionary(locale).tournaments;

  const raw = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      game: { select: { name: true, slug: true } },
      startsAt: true,
      prize: true,
      imageUrl: true,
      maxTeams: true,
      teamSize: true,
      status: true,
      registrationStatus: true,
      registrations: {
        where: { status: { in: ["registered", "approved", "rejected"] } },
        select: { id: true, status: true },
      },
      results: { select: { id: true } },
    },
  });

  // Sort: open → upcoming → closed → ended → cancelled, then alpha
  const sorted = [...raw].sort((a, b) => {
    const p: Record<string, number> = { open: 0, upcoming: 1, closed: 2, ended: 3, cancelled: 4 };
    const diff = (p[a.status] ?? 10) - (p[b.status] ?? 10);
    return diff !== 0 ? diff : a.title.localeCompare(b.title);
  });

  const tournaments: TournamentItem[] = sorted.map((t) => {
    const approvedSlots = t.registrations.filter((r) => r.status === "approved").length;
    const applications = t.registrations.length;
    return {
      id: t.id,
      title: t.title,
      game: t.game?.name ?? null,
      startsAt: t.startsAt ? t.startsAt.toISOString() : null,
      prize: t.prize,
      maxTeams: t.maxTeams,
      teamSize: t.teamSize,
      status: t.status,
      registrationStatus: t.registrationStatus,
      approvedSlots,
      applications,
      remainingSlots: Math.max(t.maxTeams - approvedSlots, 0),
      imageUrl: getTournamentImageUrl(t.game?.slug ?? null, t.imageUrl),
      resultsCount: t.results.length,
    };
  });

  const activeCount = tournaments.filter((t) => !["ended", "cancelled"].includes(t.status)).length;

  return (
    <main style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)", minHeight: "100vh" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: 320, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: 'url("/images/backgrounds/tournaments-hero.webp")',
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.35) 0%, oklch(0.07 0.025 285 / 0.65) 50%, var(--asc-bg-0) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, var(--asc-bg-0) 0%, transparent 55%)" }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: 1680, margin: "0 auto", padding: "80px 40px 56px" }}>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--asc-accent)", marginBottom: 16 }}>
            ▲ COMPETITIVE EVENTS · {activeCount} ACTIVE
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(36px, 4vw, 60px)", lineHeight: 0.95,
            textTransform: "uppercase", letterSpacing: "-0.01em",
            color: "var(--asc-fg-0)", marginBottom: 16,
          }}>
            Tournaments
          </h1>
          <p style={{ color: "var(--asc-fg-2)", maxWidth: 540, fontSize: 15, lineHeight: 1.55 }}>
            Live broadcasts, open qualifiers, sponsored majors. Filter by game, region, and stage — register or watch.
          </p>
        </div>
      </section>

      {/* ── BODY ── */}
      <div style={{ marginTop: "calc(-1 * 24px)", position: "relative", zIndex: 3 }}>
        <div style={{ maxWidth: 1680, margin: "0 auto", padding: "0 40px 24px" }}>
          <ProfileNotice message={params.message} error={params.error} />
        </div>

        {tournaments.length === 0 ? (
          <div style={{ maxWidth: 1680, margin: "0 auto", padding: "60px 40px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, textTransform: "uppercase", color: "var(--asc-fg-2)" }}>
              No tournaments yet
            </div>
            <p style={{ color: "var(--asc-fg-3)", marginTop: 12, fontSize: 14 }}>
              Check back soon or{" "}
              <Link href="/community" style={{ color: "var(--asc-accent)", textDecoration: "none" }}>
                join the Discord
              </Link>{" "}
              for announcements.
            </p>
          </div>
        ) : (
          <TournamentsPageClient
            tournaments={tournaments}
            statusLabels={messages.statuses}
            detailsLabel={messages.labels.details}
            approvedLabel={messages.labels.approved}
          />
        )}
      </div>

      <Footer />
    </main>
  );
}
