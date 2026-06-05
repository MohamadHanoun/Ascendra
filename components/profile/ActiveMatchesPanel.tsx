import Link from "next/link";

import { CornerMark } from "@/components/profile/shared";
import type { ProfileMessages } from "@/lib/profile/profileMessages";
import type { Locale } from "@/lib/i18n";
import { getPlayerMatchStatusLabel, type MatchHubCard } from "@/lib/playerMatchHub";

function formatScheduledAt(date: Date, locale: Locale): string {
  const dateStr = date.toLocaleString(locale === "ar" ? "ar-SA" : "en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateStr} UTC`;
}

function MatchStatusBadge({ status, locale }: { status: string; locale: Locale }) {
  const isLive = status === "in_progress" || status === "room_created" || status === "ready";
  const isWarning = status === "result_pending" || status === "disputed";

  const style: React.CSSProperties = isLive
    ? {
        color: "var(--asc-accent)",
        borderColor: "var(--asc-accent-border)",
        background: "var(--asc-accent-dim)",
      }
    : isWarning
    ? {
        color: "oklch(0.85 0.10 50)",
        borderColor: "oklch(0.55 0.16 50 / 0.40)",
        background: "oklch(0.22 0.10 50 / 0.18)",
      }
    : {
        color: "var(--asc-fg-3)",
        borderColor: "var(--asc-line-soft)",
        background: "transparent",
      };

  return (
    <span
      className="inline-flex border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.10em]"
      style={style}
    >
      {getPlayerMatchStatusLabel(status, locale)}
    </span>
  );
}

function ActiveMatchCard({
  card,
  msgs,
  locale,
}: {
  card: MatchHubCard;
  msgs: ProfileMessages["activeMatches"];
  locale: Locale;
}) {
  return (
    <div
      className="relative flex flex-col gap-4 border p-4"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p
            className="truncate text-[10px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {card.tournamentTitle}
            {card.gameName ? ` · ${card.gameName}` : ""}
          </p>
          <p className="mt-0.5 text-[10px]" style={{ color: "var(--asc-fg-3)" }}>
            {msgs.round} {card.roundNumber} · {msgs.match} {card.matchNumber}
          </p>
        </div>
        <MatchStatusBadge status={card.status} locale={locale} />
      </div>

      <div className="grid gap-2">
        <div className="flex items-start gap-2">
          <span
            className="mt-0.5 shrink-0 text-[10px] font-black uppercase tracking-[0.10em]"
            style={{ color: "var(--asc-fg-3)", minWidth: "4.5rem" }}
          >
            {msgs.yourTeam}
          </span>
          <span className="min-w-0 break-words text-sm font-black" style={{ color: "var(--asc-fg-0)" }}>
            {card.playerTeamName ?? msgs.tbd}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span
            className="mt-0.5 shrink-0 text-[10px] font-black uppercase tracking-[0.10em]"
            style={{ color: "var(--asc-fg-3)", minWidth: "4.5rem" }}
          >
            {msgs.opponent}
          </span>
          <span className="min-w-0 break-words text-sm font-black" style={{ color: "var(--asc-fg-1)" }}>
            {card.opponentTeamName ?? msgs.tbd}
          </span>
        </div>
      </div>

      {card.scheduledAt && (
        <div className="border-t pt-3" style={{ borderColor: "var(--asc-line-soft)" }}>
          <p
            className="text-[10px] font-black uppercase tracking-[0.10em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {msgs.scheduledTime}
          </p>
          <p
            className="mt-1 text-xs font-black"
            style={{ color: "var(--asc-fg-1)", direction: "ltr", textAlign: locale === "ar" ? "right" : "left" }}
          >
            {formatScheduledAt(card.scheduledAt, locale)}
          </p>
        </div>
      )}

      {card.isCs2 && (
        <div className="border-t pt-3" style={{ borderColor: "var(--asc-line-soft)" }}>
          <p
            className="text-[10px] font-black uppercase tracking-[0.10em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {msgs.faceitRoom}
          </p>
          {card.faceitMatchUrl ? (
            <a
              href={card.faceitMatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 border px-3 py-1 text-[10px] font-black uppercase tracking-[0.10em] transition hover:opacity-80"
              style={{
                color: "var(--asc-green)",
                borderColor: "oklch(0.55 0.14 150 / 0.40)",
                background: "oklch(0.22 0.10 150 / 0.14)",
                direction: "ltr",
              }}
            >
              {msgs.available} · {msgs.openFaceitRoom}
            </a>
          ) : (
            <p className="mt-1 text-xs" style={{ color: "var(--asc-fg-3)" }}>
              {msgs.notAvailableYet}
            </p>
          )}
        </div>
      )}

      <div className="border-t pt-3" style={{ borderColor: "var(--asc-line-soft)" }}>
        {card.userCheckedIn ? (
          <span
            className="inline-flex border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.10em]"
            style={{
              color: "var(--asc-green)",
              borderColor: "var(--asc-green-border)",
              background: "oklch(0.22 0.10 150 / 0.14)",
            }}
          >
            {msgs.checkedIn}
          </span>
        ) : (
          <span className="text-[10px]" style={{ color: "var(--asc-fg-3)" }}>
            {msgs.notCheckedIn}
          </span>
        )}
      </div>

      <a
        href={card.matchHref}
        className="mt-auto border px-4 py-2 text-center text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-80"
        style={{
          borderColor: "var(--asc-accent-border-strong)",
          color: "var(--asc-accent)",
          background: "var(--asc-accent-dim)",
          clipPath:
            "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)",
        }}
      >
        {msgs.openMatch}
      </a>
    </div>
  );
}

export function ActiveMatchesPanel({
  cards,
  messages,
  locale,
}: {
  cards: MatchHubCard[];
  messages: ProfileMessages["activeMatches"];
  locale: Locale;
}) {
  return (
    <div
      className="relative overflow-hidden border"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath:
          "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      }}
    >
      <CornerMark />
      <div className="border-b px-5 py-4" style={{ borderColor: "var(--asc-line-soft)" }}>
        <p
          className="text-[10px] font-black uppercase tracking-[0.16em]"
          style={{ color: "var(--asc-accent)" }}
        >
          ▲ {messages.heading}
        </p>
      </div>
      <div className="p-5">
        {cards.length === 0 ? (
          <div className="flex flex-col items-start gap-4 py-4">
            <p className="text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
              {messages.empty}
            </p>
            <Link
              href="/tournaments"
              className="inline-flex border px-5 py-2.5 text-xs font-black uppercase tracking-[0.10em] transition hover:opacity-80"
              style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
            >
              {messages.browseTournaments} →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <ActiveMatchCard key={card.matchId} card={card} msgs={messages} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
