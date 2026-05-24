"use client";

import Link from "next/link";
import React, { useState } from "react";

export type TournamentItem = {
  id: string;
  title: string;
  game: string | null;
  startsAt: string | null;
  prize: string | null;
  maxTeams: number;
  teamSize: number;
  status: string;
  registrationStatus: string;
  approvedSlots: number;
  applications: number;
  remainingSlots: number;
  imageUrl: string;
  resultsCount: number;
};

type Props = {
  tournaments: TournamentItem[];
  statusLabels: {
    tournamentOpen: string;
    upcoming: string;
    tournamentClosed: string;
    ended: string;
    cancelled: string;
    registrationOpen: string;
    registrationClosed: string;
  };
  detailsLabel: string;
  approvedLabel: string;
};

// ── Atoms ─────────────────────────────────────────────────────────────────────

function CornerMark() {
  return <div aria-hidden="true" className="asc-corner-mark" />;
}

function StatusChip({ status, registrationStatus, statusLabels }: { status: string; registrationStatus: string; statusLabels: Props["statusLabels"] }) {
  const isLive = status === "open";
  const isRegistration = registrationStatus === "open" && !["ended", "cancelled"].includes(status);
  const isEnded = status === "ended";
  const isCancelled = status === "cancelled";

  if (isLive) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", fontFamily: "var(--font-mono, monospace)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--asc-live)", border: "1px solid oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" }}>
        <span style={{ width: 5, height: 5, borderRadius: 9999, background: "var(--asc-live)", display: "inline-block" }} />
        LIVE
      </span>
    );
  }
  if (isRegistration) {
    return (
      <span style={{ padding: "3px 9px", fontFamily: "var(--font-mono, monospace)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--asc-green)", border: "1px solid oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" }}>
        REGISTRATION
      </span>
    );
  }
  if (isEnded) {
    return (
      <span style={{ padding: "3px 9px", fontFamily: "var(--font-mono, monospace)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--asc-fg-3)", border: "1px solid var(--asc-line-soft)", background: "transparent" }}>
        ENDED
      </span>
    );
  }
  if (isCancelled) {
    return (
      <span style={{ padding: "3px 9px", fontFamily: "var(--font-mono, monospace)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--asc-fg-3)", border: "1px solid var(--asc-line-soft)", background: "transparent" }}>
        CANCELLED
      </span>
    );
  }
  return (
    <span style={{ padding: "3px 9px", fontFamily: "var(--font-mono, monospace)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--asc-blue)", border: "1px solid oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" }}>
      {statusLabels.upcoming}
    </span>
  );
}

function FilterGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ display: "flex", gap: 3 }}>
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} style={{
            background: value === o ? "var(--asc-accent)" : "var(--asc-bg-2)",
            color: value === o ? "oklch(0.10 0.02 285)" : "var(--asc-fg-2)",
            border: `1px solid ${value === o ? "var(--asc-accent)" : "var(--asc-line-soft)"}`,
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 10, padding: "4px 10px",
            letterSpacing: "0.12em", textTransform: "uppercase",
            cursor: "pointer",
            clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)",
            whiteSpace: "nowrap",
          }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function FeaturedCard({ t, detailsLabel }: { t: TournamentItem; detailsLabel: string }) {
  const startsDate = t.startsAt ? new Date(t.startsAt) : null;
  const startsLabel = startsDate
    ? startsDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()
    : "TBD";

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: 220, background: "var(--asc-bg-1)", border: "1px solid var(--asc-line-soft)" }}>
      <CornerMark />
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url("${t.imageUrl}")`, backgroundSize: "cover", backgroundPosition: "center right" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, oklch(0.06 0.02 285 / 0.96) 0%, oklch(0.06 0.02 285 / 0.6) 50%, transparent 100%)" }} />
      <div style={{
        position: "relative",
        display: "grid", gridTemplateColumns: "1.5fr 1fr",
        padding: "28px 32px", minHeight: 220, alignItems: "center", gap: 24,
      }}>
        {/* Left */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <StatusChip status={t.status} registrationStatus={t.registrationStatus} statusLabels={{ tournamentOpen: "", upcoming: "UPCOMING", tournamentClosed: "", ended: "", cancelled: "", registrationOpen: "", registrationClosed: "" }} />
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", letterSpacing: "0.10em", textTransform: "uppercase" }}>
              {t.game?.toUpperCase() ?? "—"} · {t.teamSize}v{t.teamSize}
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 36, textTransform: "uppercase", color: "var(--asc-fg-0)", lineHeight: 1.0, marginBottom: 10 }}>
            {t.title}
          </div>
          <div style={{ color: "var(--asc-fg-2)", fontSize: 15, marginBottom: 22 }}>
            {t.game ?? "—"} · Season 7 · {t.maxTeams} teams
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href={`/tournaments/${t.id}`} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 20px", fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 12, letterSpacing: "0.10em", textTransform: "uppercase",
              background: "var(--asc-accent)", color: "oklch(0.10 0.02 285)",
              textDecoration: "none",
              clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
            }}>
              Register
            </Link>
            <Link href={`/tournaments/${t.id}`} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 20px", fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 12, letterSpacing: "0.10em", textTransform: "uppercase",
              background: "transparent", color: "var(--asc-fg-1)",
              border: "1px solid var(--asc-line)", textDecoration: "none",
              clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
            }}>
              {detailsLabel} ›
            </Link>
          </div>
        </div>

        {/* Right — stat panels */}
        <div style={{ display: "flex", alignItems: "stretch", justifyContent: "flex-end", gap: 0 }}>
          {[
            { k: "PRIZE", v: t.prize ?? "TBD", accent: true },
            { k: "TEAMS", v: `${t.approvedSlots}/${t.maxTeams}`, accent: false },
            { k: "STARTS", v: startsLabel, accent: false },
          ].map((stat) => (
            <div key={stat.k} style={{ padding: "14px 18px", background: "oklch(0.10 0.04 285 / 0.7)", borderLeft: "1px solid var(--asc-line-soft)" }}>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 9, color: "var(--asc-fg-3)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
                {stat.k}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, lineHeight: 1, color: stat.accent ? "var(--asc-accent)" : "var(--asc-fg-0)", whiteSpace: "nowrap" }}>
                {stat.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TournamentTableRow({ t, idx, statusLabels }: { t: TournamentItem; idx: number; statusLabels: Props["statusLabels"] }) {
  const startsDate = t.startsAt ? new Date(t.startsAt) : null;
  const startsLabel = startsDate
    ? startsDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()
    : "TBD";
  const startsTime = startsDate
    ? startsDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "";

  return (
    <div
      onClick={(e) => { e.currentTarget.querySelector<HTMLAnchorElement>("a")?.click(); }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "oklch(0.20 0.10 285 / 0.06)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
      style={{
        display: "flex", alignItems: "center", gap: 0,
        padding: "14px 18px",
        borderTop: idx > 0 ? "1px solid var(--asc-line-soft)" : "none",
        cursor: "pointer", background: "transparent",
        transition: "background 120ms ease",
      }}
    >
      {/* Event: name + tagline — flex 2 */}
      <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{
          width: 44, height: 44, flexShrink: 0,
          backgroundImage: `url("${t.imageUrl}")`,
          backgroundSize: "cover", backgroundPosition: "center",
          clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
          border: "1px solid var(--asc-line-soft)",
        }} />
        <div style={{ minWidth: 0 }}>
          <Link href={`/tournaments/${t.id}`} style={{
            display: "block", fontFamily: "var(--font-display)", fontWeight: 600,
            fontSize: 14, letterSpacing: "0.04em", lineHeight: 1.2,
            color: "var(--asc-fg-0)", textDecoration: "none",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            textTransform: "uppercase",
          }}>
            {t.title}
          </Link>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {t.game ?? "—"} · {t.teamSize}v{t.teamSize}
          </div>
        </div>
      </div>

      {/* Game — flex 1 */}
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--asc-fg-1)" }}>{t.game ?? "—"}</span>
      </div>

      {/* Format — flex 1 */}
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--asc-fg-2)" }}>{t.teamSize}v{t.teamSize}</span>
      </div>

      {/* Region — flex 1 */}
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--asc-fg-2)" }}>Global</span>
      </div>

      {/* Teams — flex 1 */}
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--asc-fg-0)" }}>
          {t.approvedSlots}
          <span style={{ color: "var(--asc-fg-3)", fontWeight: 400 }}>/{t.maxTeams}</span>
        </span>
      </div>

      {/* Prize — flex 1 */}
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--asc-accent)" }}>
          {t.prize ?? "—"}
        </span>
      </div>

      {/* Starts — flex 1 */}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--asc-fg-0)" }}>{startsLabel}</div>
        {startsTime && <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 9, color: "var(--asc-fg-3)", marginTop: 2 }}>{startsTime} UTC</div>}
      </div>

      {/* Status — flex 1.2 */}
      <div style={{ flex: 1.2 }}>
        <StatusChip status={t.status} registrationStatus={t.registrationStatus} statusLabels={statusLabels} />
      </div>

      {/* Arrow — flex 0.4 */}
      <div style={{ flex: 0.4, textAlign: "right", color: "var(--asc-fg-3)", fontSize: 16 }}>›</div>
    </div>
  );
}

const TABLE_COLS = ["Event", "Game", "Format", "Region", "Teams", "Prize", "Starts", "Status", ""] as const;
const TABLE_FLEX = [2, 1, 1, 1, 1, 1, 1, 1.2, 0.4] as const;

// ── Main export ───────────────────────────────────────────────────────────────

export default function TournamentsPageClient({ tournaments, statusLabels, detailsLabel, approvedLabel }: Props) {
  const [filterGame, setFilterGame] = useState("All");
  const [filterRegion, setFilterRegion] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const gameOptions = ["All", ...Array.from(new Set(tournaments.map((t) => t.game).filter((g): g is string => Boolean(g))))];
  const regionOptions = ["All", "Global", "NA", "EU", "APAC"];
  const statusOptions = ["All", "Live", "Registration"];

  const activeTournaments = tournaments.filter((t) => !["ended", "cancelled"].includes(t.status));
  const archivedTournaments = tournaments.filter((t) => ["ended", "cancelled"].includes(t.status));

  const filtered = activeTournaments.filter((t) => {
    const gameMatch = filterGame === "All" || t.game === filterGame;
    const statusMatch =
      filterStatus === "All" ||
      (filterStatus === "Live" && t.status === "open") ||
      (filterStatus === "Registration" && t.registrationStatus === "open" && !["ended", "cancelled"].includes(t.status));
    return gameMatch && statusMatch;
  });

  const featured = activeTournaments.find((t) => t.status === "open") ?? activeTournaments[0] ?? tournaments[0];

  return (
    <div style={{ maxWidth: 1680, margin: "0 auto", padding: "0 40px 80px" }}>

      {/* Filter bar */}
      <div style={{ position: "relative", background: "var(--asc-bg-1)", border: "1px solid var(--asc-line-soft)", padding: "14px 18px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 32 }}>
        <CornerMark />
        <span style={{ fontSize: 12, color: "var(--asc-accent)" }}>⊟</span>
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", letterSpacing: "0.18em", textTransform: "uppercase", marginRight: 4 }}>FILTER</span>
        <FilterGroup label="Game" options={gameOptions} value={filterGame} onChange={setFilterGame} />
        <div style={{ width: 1, height: 24, background: "var(--asc-line-soft)", flexShrink: 0 }} />
        <FilterGroup label="Region" options={regionOptions} value={filterRegion} onChange={setFilterRegion} />
        <div style={{ width: 1, height: 24, background: "var(--asc-line-soft)", flexShrink: 0 }} />
        <FilterGroup label="Status" options={statusOptions} value={filterStatus} onChange={setFilterStatus} />
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--asc-fg-2)" }}>
          {filtered.length} results
        </span>
      </div>

      {/* Featured row */}
      {featured && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 16 }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", letterSpacing: "0.18em", textTransform: "uppercase" }}>▲ FEATURED</span>
            <div style={{ flex: 1, height: 1, background: "var(--asc-line-soft)" }} />
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, textTransform: "uppercase", color: "var(--asc-fg-0)" }}>Marquee event</div>
            <div style={{ flex: 1, height: 1, background: "var(--asc-line-soft)" }} />
            <Link href={`/tournaments/${featured.id}`} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase",
              background: "transparent", color: "var(--asc-fg-2)",
              border: "1px solid var(--asc-line-soft)", textDecoration: "none",
            }}>
              Open event ›
            </Link>
          </div>
          <FeaturedCard t={featured} detailsLabel={detailsLabel} />
        </div>
      )}

      {/* Directory table */}
      {filtered.length > 0 && (
        <div style={{ marginBottom: archivedTournaments.length > 0 ? 48 : 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 16 }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", letterSpacing: "0.18em", textTransform: "uppercase" }}>▲ ALL EVENTS</span>
            <div style={{ flex: 1, height: 1, background: "var(--asc-line-soft)" }} />
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, textTransform: "uppercase", color: "var(--asc-fg-0)" }}>Tournament directory</div>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", letterSpacing: "0.14em" }}>
              {String(filtered.length).padStart(2, "0")}
            </span>
          </div>
          <div style={{ position: "relative", background: "var(--asc-bg-1)", border: "1px solid var(--asc-line-soft)" }}>
            <CornerMark />
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center",
              padding: "10px 18px",
              borderBottom: "1px solid var(--asc-line-soft)",
              background: "oklch(0.08 0.03 285)",
            }}>
              {TABLE_COLS.map((h, i) => (
                <div key={i} style={{
                  flex: TABLE_FLEX[i],
                  fontFamily: "var(--font-mono, monospace)", fontSize: 10,
                  color: "var(--asc-fg-3)", letterSpacing: "0.16em", textTransform: "uppercase",
                  textAlign: i === TABLE_COLS.length - 1 ? "right" : "left",
                }}>
                  {h}
                </div>
              ))}
            </div>
            {/* Rows */}
            {filtered.map((t, i) => (
              <TournamentTableRow key={t.id} t={t} idx={i} statusLabels={statusLabels} />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && activeTournaments.length > 0 && (
        <div style={{ padding: "60px 0", textAlign: "center", fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: "var(--asc-fg-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
          No tournaments match the current filters
        </div>
      )}

      {/* Archived */}
      {archivedTournaments.length > 0 && (
        <details>
          <summary style={{
            display: "flex", alignItems: "center", gap: 16, cursor: "pointer", listStyle: "none",
            padding: "16px 20px", background: "var(--asc-bg-1)", border: "1px solid var(--asc-line-soft)",
          }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", letterSpacing: "0.18em", textTransform: "uppercase" }}>▲ ARCHIVED EVENTS</span>
            <div style={{ flex: 1, height: 1, background: "var(--asc-line-soft)" }} />
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-fg-3)", letterSpacing: "0.14em" }}>
              {String(archivedTournaments.length).padStart(2, "0")} ENDED
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--asc-fg-3)" }}>+</span>
          </summary>
          <div style={{ marginTop: 16, position: "relative", background: "var(--asc-bg-1)", border: "1px solid var(--asc-line-soft)" }}>
            <CornerMark />
            <div style={{
              display: "flex", alignItems: "center",
              padding: "10px 18px",
              borderBottom: "1px solid var(--asc-line-soft)",
              background: "oklch(0.08 0.03 285)",
            }}>
              {TABLE_COLS.map((h, i) => (
                <div key={i} style={{
                  flex: TABLE_FLEX[i],
                  fontFamily: "var(--font-mono, monospace)", fontSize: 10,
                  color: "var(--asc-fg-3)", letterSpacing: "0.16em", textTransform: "uppercase",
                  textAlign: i === TABLE_COLS.length - 1 ? "right" : "left",
                }}>
                  {h}
                </div>
              ))}
            </div>
            {archivedTournaments.map((t, i) => (
              <TournamentTableRow key={t.id} t={t} idx={i} statusLabels={statusLabels} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
