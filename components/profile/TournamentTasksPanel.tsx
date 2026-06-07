import Link from "next/link";

import { Card, Pill } from "@/components/profile/shared";
import type { Locale } from "@/lib/i18n";
import type { MatchHubCard } from "@/lib/playerMatchHub";
import type { ProfileMessages } from "@/lib/profile/profileMessages";

export type ProfileTournamentRegistrationTask = {
  id: string;
  status: string;
  tournamentId: string;
  tournamentTitle: string;
  tournamentStatus: string;
  teamName: string;
  rejectionReason: string | null;
  tournamentHref: string;
  matchHref: string | null;
};

type TaskTone = "green" | "bronze" | "red" | "gray" | "accent";

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

function getMatchTaskTone(card: MatchHubCard): TaskTone {
  if (card.nextActionKey === "adminReview") return "red";
  if (card.nextActionKey === "completed") return "green";
  if (card.nextActionKey === "cancelled") return "gray";
  if (
    card.nextActionKey === "submitResult" ||
    card.nextActionKey === "waitingOpponentReport" ||
    card.nextActionKey === "waitingSchedule" ||
    card.nextActionKey === "waitingOpponent"
  ) {
    return "bronze";
  }
  return "accent";
}

function getRegistrationTone(task: ProfileTournamentRegistrationTask): TaskTone {
  if (task.status === "rejected") return "red";
  if (task.status === "cancelled") return "gray";
  if (task.status === "registered") return "bronze";
  if (task.matchHref) return "green";
  return "bronze";
}

function getRegistrationLabel(
  task: ProfileTournamentRegistrationTask,
  messages: ProfileMessages["tournamentTasks"],
) {
  if (task.status === "approved" && task.matchHref) return messages.matchReady;
  if (task.status === "approved") return messages.approvedWaitingForBracket;
  if (task.status === "registered") return messages.registrationPending;
  if (task.status === "rejected") return messages.rejected;
  if (task.status === "cancelled") return messages.cancelled;
  return task.status;
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="border p-3"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-2)",
      }}
    >
      <p
        className="text-[10px] font-black uppercase tracking-[0.12em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-black tabular-nums"
        style={{ color: "var(--asc-fg-0)", fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
    </div>
  );
}

export function TournamentTasksPanel({
  activeMatches,
  registrations,
  messages,
  activeMatchMessages,
  locale,
}: {
  activeMatches: MatchHubCard[];
  registrations: ProfileTournamentRegistrationTask[];
  messages: ProfileMessages["tournamentTasks"];
  activeMatchMessages: ProfileMessages["activeMatches"];
  locale: Locale;
}) {
  const resultPendingMatches = activeMatches.filter(
    (card) => card.status === "result_pending",
  ).length;
  const adminReviewMatches = activeMatches.filter(
    (card) => card.status === "disputed",
  ).length;
  const pendingRegistrations = registrations.filter(
    (task) => task.status === "registered",
  ).length;
  const approvedWaitingRegistrations = registrations.filter(
    (task) =>
      task.status === "approved" &&
      !task.matchHref &&
      !["ended", "cancelled"].includes(task.tournamentStatus),
  ).length;
  const upcomingScheduledMatches = activeMatches.filter(
    (card) =>
      Boolean(card.scheduledAt) &&
      ["scheduled", "ready", "room_created"].includes(card.status),
  ).length;
  const hasTasks = activeMatches.length > 0 || registrations.length > 0;

  return (
    <Card>
      <div className="asc-profile-card-header">
        <p className="asc-profile-eyebrow">{messages.heading}</p>
        <h3 className="asc-profile-section-title">{messages.nextUp}</h3>
        <p className="mt-1 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
          {messages.description}
        </p>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <StatTile label={messages.activeMatches} value={activeMatches.length} />
          <StatTile label={messages.resultPending} value={resultPendingMatches} />
          <StatTile label={messages.adminReview} value={adminReviewMatches} />
          <StatTile label={messages.pendingRegistrations} value={pendingRegistrations} />
          <StatTile label={messages.approvedWaiting} value={approvedWaitingRegistrations} />
          <StatTile label={messages.upcomingScheduled} value={upcomingScheduledMatches} />
        </div>

        {!hasTasks ? (
          <div className="asc-profile-empty asc-profile-empty--inline">
            <span className="asc-profile-empty__mark" aria-hidden="true">
              00
            </span>
            <p className="asc-profile-empty__title">{messages.noTasksTitle}</p>
            <p className="asc-profile-empty__text">{messages.noTasksDescription}</p>
            <Link
              href="/tournaments"
              className="asc-profile-action mt-5 px-5 py-2.5 text-xs tracking-[0.10em]"
            >
              {messages.browseTournaments}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {activeMatches.slice(0, 4).map((card) => (
              <article
                key={card.matchId}
                className="border p-4"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  background: "var(--asc-bg-2)",
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-black"
                      style={{
                        color: "var(--asc-fg-0)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {card.tournamentTitle}
                    </p>
                    <p
                      className="mt-1 text-[10px] font-black uppercase tracking-[0.12em]"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      {activeMatchMessages.round} {card.roundNumber} /{" "}
                      {activeMatchMessages.match} {card.matchNumber}
                    </p>
                  </div>
                  <Pill
                    label={activeMatchMessages.nextActions[card.nextActionKey]}
                    tone={getMatchTaskTone(card)}
                  />
                </div>

                <div className="mt-4 grid gap-2 text-sm">
                  <p style={{ color: "var(--asc-fg-2)" }}>
                    <span className="font-black">{activeMatchMessages.opponent}: </span>
                    {card.opponentTeamName ?? activeMatchMessages.tbd}
                  </p>
                  <p style={{ color: "var(--asc-fg-3)" }}>
                    <span className="font-black">
                      {activeMatchMessages.scheduledTime}:{" "}
                    </span>
                    {card.scheduledAt
                      ? formatScheduledAt(card.scheduledAt, locale)
                      : activeMatchMessages.waitingSchedule}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={card.matchHref}
                    className="asc-profile-action px-4 py-2 text-xs tracking-[0.08em]"
                  >
                    {messages.viewMatch}
                  </Link>
                  <Link
                    href={`/tournaments/${card.tournamentId}`}
                    className="asc-profile-action asc-profile-action--ghost px-4 py-2 text-xs tracking-[0.08em]"
                  >
                    {messages.viewTournament}
                  </Link>
                </div>
              </article>
            ))}

            {registrations.slice(0, 6).map((task) => (
              <article
                key={task.id}
                className="border p-4"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  background: "var(--asc-bg-2)",
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-black"
                      style={{
                        color: "var(--asc-fg-0)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {task.tournamentTitle}
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      {messages.team}: {task.teamName}
                    </p>
                  </div>
                  <Pill
                    label={getRegistrationLabel(task, messages)}
                    tone={getRegistrationTone(task)}
                  />
                </div>

                {task.rejectionReason && (
                  <p className="mt-3 text-xs leading-5" style={{ color: "var(--asc-live)" }}>
                    {task.rejectionReason}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={task.matchHref ?? task.tournamentHref}
                    className="asc-profile-action px-4 py-2 text-xs tracking-[0.08em]"
                  >
                    {task.matchHref ? messages.viewMatch : messages.viewTournament}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
