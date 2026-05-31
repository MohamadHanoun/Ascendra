"use client";

import Link from "next/link";
import { useState } from "react";

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

export type TournamentsClientMessages = {
  filterLabel: string;
  gameLabel: string;
  regionLabel: string;
  statusLabel: string;
  resultsLabel: string;
  featuredEyebrow: string;
  featuredTitle: string;
  openEvent: string;
  register: string;
  allEventsEyebrow: string;
  directoryTitle: string;
  archivedEventsEyebrow: string;
  endedSuffix: string;
  noMatch: string;
  prize: string;
  teams: string;
  starts: string;
  tableCols: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  statusFilterLabels: { all: string; live: string; registration: string };
  regionFilterLabels: {
    all: string;
    global: string;
    na: string;
    eu: string;
    apac: string;
  };
};

type StatusLabels = {
  tournamentOpen: string;
  upcoming: string;
  tournamentClosed: string;
  ended: string;
  cancelled: string;
  registrationOpen: string;
  registrationClosed: string;
  live: string;
};

type Props = {
  tournaments: TournamentItem[];
  statusLabels: StatusLabels;
  detailsLabel: string;
  approvedLabel: string;
  messages: TournamentsClientMessages;
};

// ── Atoms ─────────────────────────────────────────────────────────────────────

function CornerMark() {
  return <div aria-hidden="true" className="asc-corner-mark" />;
}

function StatusChip({
  status,
  registrationStatus,
  statusLabels,
}: {
  status: string;
  registrationStatus: string;
  statusLabels: StatusLabels;
}) {
  const isLive = status === "open";
  const isRegistration =
    registrationStatus === "open" &&
    !["ended", "cancelled"].includes(status);
  const isEnded = status === "ended";
  const isCancelled = status === "cancelled";

  if (isLive) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 9px",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 9,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--asc-live)",
          border: "1px solid var(--asc-live-border)",
          background: "var(--asc-live-bg)",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 9999,
            background: "var(--asc-live)",
            display: "inline-block",
          }}
        />
        {statusLabels.live}
      </span>
    );
  }
  if (isRegistration) {
    return (
      <span
        style={{
          padding: "3px 9px",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 9,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--asc-green)",
          border: "1px solid var(--asc-green-border)",
          background: "var(--asc-green-bg)",
        }}
      >
        {statusLabels.registrationOpen}
      </span>
    );
  }
  if (isEnded) {
    return (
      <span
        style={{
          padding: "3px 9px",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 9,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--asc-fg-3)",
          border: "1px solid var(--asc-line-soft)",
          background: "transparent",
        }}
      >
        {statusLabels.ended}
      </span>
    );
  }
  if (isCancelled) {
    return (
      <span
        style={{
          padding: "3px 9px",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 9,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--asc-fg-3)",
          border: "1px solid var(--asc-line-soft)",
          background: "transparent",
        }}
      >
        {statusLabels.cancelled}
      </span>
    );
  }
  return (
    <span
      style={{
        padding: "3px 9px",
        fontFamily: "var(--font-mono, monospace)",
        fontSize: 9,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--asc-blue)",
        border: "1px solid var(--asc-blue-border)",
        background: "var(--asc-blue-bg)",
      }}
    >
      {statusLabels.upcoming}
    </span>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 10,
          color: "var(--asc-fg-3)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", gap: 3 }}>
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              background:
                value === o.value ? "var(--asc-accent)" : "var(--asc-bg-2)",
              color:
                value === o.value
                  ? "var(--asc-on-accent)"
                  : "var(--asc-fg-2)",
              border: `1px solid ${value === o.value ? "var(--asc-accent)" : "var(--asc-line-soft)"}`,
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 10,
              padding: "4px 10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              clipPath:
                "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)",
              whiteSpace: "nowrap",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FeaturedCard({
  t,
  detailsLabel,
  statusLabels,
  messages,
}: {
  t: TournamentItem;
  detailsLabel: string;
  statusLabels: StatusLabels;
  messages: TournamentsClientMessages;
}) {
  const startsDate = t.startsAt ? new Date(t.startsAt) : null;
  const startsLabel = startsDate
    ? startsDate
        .toLocaleDateString("en-US", { month: "short", day: "numeric" })
        .toUpperCase()
    : "TBD";

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: 220,
        background: "var(--asc-bg-1)",
        border: "1px solid var(--asc-line-soft)",
      }}
    >
      <CornerMark />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${t.imageUrl}")`,
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgb(12 11 9 / 0.96) 0%, rgb(12 11 9 / 0.6) 50%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          padding: "28px 32px",
          minHeight: 220,
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* Left */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <StatusChip
              status={t.status}
              registrationStatus={t.registrationStatus}
              statusLabels={statusLabels}
            />
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 10,
                color: "var(--asc-fg-3)",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
              }}
            >
              {t.game?.toUpperCase() ?? "—"} · {t.teamSize}v{t.teamSize}
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 36,
              textTransform: "uppercase",
              color: "var(--asc-fg-0)",
              lineHeight: 1.0,
              marginBottom: 10,
            }}
          >
            {t.title}
          </div>
          <div
            style={{ color: "var(--asc-fg-2)", fontSize: 15, marginBottom: 22 }}
          >
            {t.game ?? "—"} · {t.maxTeams} {messages.teams.toLowerCase()}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href={`/tournaments/${t.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                background: "var(--asc-accent)",
                color: "var(--asc-on-accent)",
                textDecoration: "none",
                clipPath:
                  "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
              }}
            >
              {messages.register}
            </Link>
            <Link
              href={`/tournaments/${t.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                background: "transparent",
                color: "var(--asc-fg-1)",
                border: "1px solid var(--asc-line)",
                textDecoration: "none",
                clipPath:
                  "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
              }}
            >
              {detailsLabel} ›
            </Link>
          </div>
        </div>

        {/* Right — stat panels */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            justifyContent: "flex-end",
            gap: 0,
          }}
        >
          {[
            { k: messages.prize, v: t.prize ?? "TBD", accent: true },
            {
              k: messages.teams,
              v: `${t.approvedSlots}/${t.maxTeams}`,
              accent: false,
            },
            { k: messages.starts, v: startsLabel, accent: false },
          ].map((stat) => (
            <div
              key={stat.k}
              style={{
                padding: "14px 18px",
                background: "var(--asc-card-muted)",
                borderLeft: "1px solid var(--asc-line-soft)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 9,
                  color: "var(--asc-fg-3)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                {stat.k}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 26,
                  lineHeight: 1,
                  color: stat.accent ? "var(--asc-accent)" : "var(--asc-fg-0)",
                  whiteSpace: "nowrap",
                }}
              >
                {stat.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TournamentTableRow({
  t,
  idx,
  statusLabels,
}: {
  t: TournamentItem;
  idx: number;
  statusLabels: StatusLabels;
}) {
  const startsDate = t.startsAt ? new Date(t.startsAt) : null;
  const startsLabel = startsDate
    ? startsDate
        .toLocaleDateString("en-US", { month: "short", day: "numeric" })
        .toUpperCase()
    : "TBD";
  const startsTime = startsDate
    ? startsDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

  return (
    <div
      onClick={(e) => {
        e.currentTarget.querySelector<HTMLAnchorElement>("a")?.click();
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background =
          "var(--asc-hover-soft)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        padding: "14px 18px",
        borderTop: idx > 0 ? "1px solid var(--asc-line-soft)" : "none",
        cursor: "pointer",
        background: "transparent",
        transition: "background 120ms ease",
      }}
    >
      {/* Event: name + tagline — flex 2 */}
      <div
        style={{ flex: 2, display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            backgroundImage: `url("${t.imageUrl}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            clipPath:
              "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
            border: "1px solid var(--asc-line-soft)",
          }}
        />
        <div style={{ minWidth: 0 }}>
          <Link
            href={`/tournaments/${t.id}`}
            style={{
              display: "block",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: "0.04em",
              lineHeight: 1.2,
              color: "var(--asc-fg-0)",
              textDecoration: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
            }}
          >
            {t.title}
          </Link>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 10,
              color: "var(--asc-fg-3)",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {t.game ?? "—"} · {t.teamSize}v{t.teamSize}
          </div>
        </div>
      </div>

      {/* Game — flex 1 */}
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            color: "var(--asc-fg-1)",
          }}
        >
          {t.game ?? "—"}
        </span>
      </div>

      {/* Format — flex 1 */}
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            color: "var(--asc-fg-2)",
          }}
        >
          {t.teamSize}v{t.teamSize}
        </span>
      </div>

      {/* Region — flex 1 */}
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            color: "var(--asc-fg-2)",
          }}
        >
          Global
        </span>
      </div>

      {/* Teams — flex 1 */}
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 14,
            color: "var(--asc-fg-0)",
          }}
        >
          {t.approvedSlots}
          <span style={{ color: "var(--asc-fg-3)", fontWeight: 400 }}>
            /{t.maxTeams}
          </span>
        </span>
      </div>

      {/* Prize — flex 1 */}
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 14,
            color: "var(--asc-accent)",
          }}
        >
          {t.prize ?? "—"}
        </span>
      </div>

      {/* Starts — flex 1 */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            color: "var(--asc-fg-0)",
          }}
        >
          {startsLabel}
        </div>
        {startsTime && (
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 9,
              color: "var(--asc-fg-3)",
              marginTop: 2,
            }}
          >
            {startsTime} UTC
          </div>
        )}
      </div>

      {/* Status — flex 1.2 */}
      <div style={{ flex: 1.2 }}>
        <StatusChip
          status={t.status}
          registrationStatus={t.registrationStatus}
          statusLabels={statusLabels}
        />
      </div>

      {/* Arrow — flex 0.4 */}
      <div
        style={{ flex: 0.4, textAlign: "right", color: "var(--asc-fg-3)", fontSize: 16 }}
      >
        ›
      </div>
    </div>
  );
}

const TABLE_FLEX = [2, 1, 1, 1, 1, 1, 1, 1.2, 0.4] as const;

// ── Main export ───────────────────────────────────────────────────────────────

export default function TournamentsPageClient({
  tournaments,
  statusLabels,
  detailsLabel,
  approvedLabel: _approvedLabel,
  messages,
}: Props) {
  const [filterGame, setFilterGame] = useState("All");
  const [filterRegion, setFilterRegion] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const gameOptions: Array<{ value: string; label: string }> = [
    "All",
    ...Array.from(
      new Set(
        tournaments.map((t) => t.game).filter((g): g is string => Boolean(g)),
      ),
    ),
  ].map((g) => ({
    value: g,
    label: g === "All" ? messages.statusFilterLabels.all : g,
  }));

  const regionOptions: Array<{ value: string; label: string }> = [
    { value: "All", label: messages.regionFilterLabels.all },
    { value: "Global", label: messages.regionFilterLabels.global },
    { value: "NA", label: messages.regionFilterLabels.na },
    { value: "EU", label: messages.regionFilterLabels.eu },
    { value: "APAC", label: messages.regionFilterLabels.apac },
  ];

  const statusOptions: Array<{ value: string; label: string }> = [
    { value: "All", label: messages.statusFilterLabels.all },
    { value: "Live", label: messages.statusFilterLabels.live },
    { value: "Registration", label: messages.statusFilterLabels.registration },
  ];

  const activeTournaments = tournaments.filter(
    (t) => !["ended", "cancelled"].includes(t.status),
  );
  const archivedTournaments = tournaments.filter((t) =>
    ["ended", "cancelled"].includes(t.status),
  );

  const filtered = activeTournaments.filter((t) => {
    const gameMatch = filterGame === "All" || t.game === filterGame;
    const statusMatch =
      filterStatus === "All" ||
      (filterStatus === "Live" && t.status === "open") ||
      (filterStatus === "Registration" &&
        t.registrationStatus === "open" &&
        !["ended", "cancelled"].includes(t.status));
    return gameMatch && statusMatch;
  });

  const featured =
    activeTournaments.find((t) => t.status === "open") ??
    activeTournaments[0] ??
    tournaments[0];

  return (
    <div style={{ maxWidth: 1680, margin: "0 auto", padding: "0 40px 80px" }}>
      {/* Filter bar */}
      <div
        style={{
          position: "relative",
          background: "var(--asc-bg-1)",
          border: "1px solid var(--asc-line-soft)",
          padding: "14px 18px",
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 32,
        }}
      >
        <CornerMark />
        <span style={{ fontSize: 12, color: "var(--asc-accent)" }}>⊟</span>
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 10,
            color: "var(--asc-fg-3)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginRight: 4,
          }}
        >
          {messages.filterLabel}
        </span>
        <FilterGroup
          label={messages.gameLabel}
          options={gameOptions}
          value={filterGame}
          onChange={setFilterGame}
        />
        <div
          style={{
            width: 1,
            height: 24,
            background: "var(--asc-line-soft)",
            flexShrink: 0,
          }}
        />
        <FilterGroup
          label={messages.regionLabel}
          options={regionOptions}
          value={filterRegion}
          onChange={setFilterRegion}
        />
        <div
          style={{
            width: 1,
            height: 24,
            background: "var(--asc-line-soft)",
            flexShrink: 0,
          }}
        />
        <FilterGroup
          label={messages.statusLabel}
          options={statusOptions}
          value={filterStatus}
          onChange={setFilterStatus}
        />
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            color: "var(--asc-fg-2)",
          }}
        >
          {filtered.length} {messages.resultsLabel}
        </span>
      </div>

      {/* Featured row */}
      {featured && (
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 10,
                color: "var(--asc-fg-3)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {messages.featuredEyebrow}
            </span>
            <div
              style={{ flex: 1, height: 1, background: "var(--asc-line-soft)" }}
            />
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 20,
                textTransform: "uppercase",
                color: "var(--asc-fg-0)",
              }}
            >
              {messages.featuredTitle}
            </div>
            <div
              style={{ flex: 1, height: 1, background: "var(--asc-line-soft)" }}
            />
            <Link
              href={`/tournaments/${featured.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                background: "transparent",
                color: "var(--asc-fg-2)",
                border: "1px solid var(--asc-line-soft)",
                textDecoration: "none",
              }}
            >
              {messages.openEvent}
            </Link>
          </div>
          <FeaturedCard
            t={featured}
            detailsLabel={detailsLabel}
            statusLabels={statusLabels}
            messages={messages}
          />
        </div>
      )}

      {/* Directory table */}
      {filtered.length > 0 && (
        <div
          style={{ marginBottom: archivedTournaments.length > 0 ? 48 : 0 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 10,
                color: "var(--asc-fg-3)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {messages.allEventsEyebrow}
            </span>
            <div
              style={{ flex: 1, height: 1, background: "var(--asc-line-soft)" }}
            />
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 20,
                textTransform: "uppercase",
                color: "var(--asc-fg-0)",
              }}
            >
              {messages.directoryTitle}
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 10,
                color: "var(--asc-fg-3)",
                letterSpacing: "0.14em",
              }}
            >
              {String(filtered.length).padStart(2, "0")}
            </span>
          </div>
          <div
            style={{
              position: "relative",
              background: "var(--asc-bg-1)",
              border: "1px solid var(--asc-line-soft)",
            }}
          >
            <CornerMark />
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 18px",
                borderBottom: "1px solid var(--asc-line-soft)",
                background: "var(--asc-table-head-bg)",
              }}
            >
              {messages.tableCols.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: TABLE_FLEX[i],
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 10,
                    color: "var(--asc-fg-3)",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    textAlign:
                      i === messages.tableCols.length - 1 ? "right" : "left",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
            {/* Rows */}
            {filtered.map((t, i) => (
              <TournamentTableRow
                key={t.id}
                t={t}
                idx={i}
                statusLabels={statusLabels}
              />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && activeTournaments.length > 0 && (
        <div
          style={{
            padding: "60px 0",
            textAlign: "center",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 12,
            color: "var(--asc-fg-3)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {messages.noMatch}
        </div>
      )}

      {/* Archived */}
      {archivedTournaments.length > 0 && (
        <details>
          <summary
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              cursor: "pointer",
              listStyle: "none",
              padding: "16px 20px",
              background: "var(--asc-bg-1)",
              border: "1px solid var(--asc-line-soft)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 10,
                color: "var(--asc-fg-3)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {messages.archivedEventsEyebrow}
            </span>
            <div
              style={{ flex: 1, height: 1, background: "var(--asc-line-soft)" }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 10,
                color: "var(--asc-fg-3)",
                letterSpacing: "0.14em",
              }}
            >
              {String(archivedTournaments.length).padStart(2, "0")}{" "}
              {messages.endedSuffix}
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 18,
                color: "var(--asc-fg-3)",
              }}
            >
              +
            </span>
          </summary>
          <div
            style={{
              marginTop: 16,
              position: "relative",
              background: "var(--asc-bg-1)",
              border: "1px solid var(--asc-line-soft)",
            }}
          >
            <CornerMark />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 18px",
                borderBottom: "1px solid var(--asc-line-soft)",
                background: "var(--asc-table-head-bg)",
              }}
            >
              {messages.tableCols.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: TABLE_FLEX[i],
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 10,
                    color: "var(--asc-fg-3)",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    textAlign:
                      i === messages.tableCols.length - 1 ? "right" : "left",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
            {archivedTournaments.map((t, i) => (
              <TournamentTableRow
                key={t.id}
                t={t}
                idx={i}
                statusLabels={statusLabels}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
