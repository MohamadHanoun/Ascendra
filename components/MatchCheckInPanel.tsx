"use client";

import { useActionState } from "react";

import {
  checkInForTournamentMatch,
  type MatchActionResult,
} from "@/actions/matchActions";
import type { MatchCheckInSummary } from "@/lib/matchCheckIn";
import type { Locale } from "@/lib/i18n";

type Props = {
  matchId: string;
  locale: Locale;
  summaries: MatchCheckInSummary[];
  isLoggedIn: boolean;
  isParticipant: boolean;
  userCheckedIn: boolean;
  showAdminDetails: boolean;
};

type CheckInMessages = {
  title: string;
  description: string;
  checkedInCount: string;
  checkInButton: string;
  checkingIn: string;
  checkedIn: string;
  signInHint: string;
  notParticipant: string;
  adminDetails: string;
  noAdminDetails: string;
};

const messages: Record<Locale, CheckInMessages> = {
  en: {
    title: "Match check-in",
    description: "Confirm that you are ready before joining the FACEIT room.",
    checkedInCount: "checked in",
    checkInButton: "Check in",
    checkingIn: "Checking in...",
    checkedIn: "Checked in",
    signInHint: "Sign in to check in for this match.",
    notParticipant: "Only players in this match can check in.",
    adminDetails: "Checked-in players",
    noAdminDetails: "No players checked in yet.",
  },
  ar: {
    title: "تسجيل الحضور",
    description: "أكّد جاهزيتك قبل الدخول إلى غرفة FACEIT.",
    checkedInCount: "سجّلوا الحضور",
    checkInButton: "تسجيل الحضور",
    checkingIn: "جارٍ تسجيل الحضور...",
    checkedIn: "تم تسجيل الحضور",
    signInHint: "سجّل الدخول لتسجيل الحضور لهذه المباراة.",
    notParticipant: "يمكن للاعبي هذه المباراة فقط تسجيل الحضور.",
    adminDetails: "اللاعبون الذين سجّلوا الحضور",
    noAdminDetails: "لم يسجّل أي لاعب الحضور بعد.",
  },
};

const INITIAL: MatchActionResult = { ok: false, message: "" };

function formatReadiness(summary: MatchCheckInSummary, checkedInCount: string) {
  const count =
    summary.totalMembers === null
      ? String(summary.checkedInCount)
      : `${summary.checkedInCount} / ${summary.totalMembers}`;

  return `${count} ${checkedInCount}`;
}

export default function MatchCheckInPanel({
  matchId,
  locale,
  summaries,
  isLoggedIn,
  isParticipant,
  userCheckedIn,
  showAdminDetails,
}: Props) {
  const msgs = messages[locale];
  const [state, formAction, pending] = useActionState(
    checkInForTournamentMatch,
    INITIAL,
  );
  const checkedInNow = userCheckedIn || state.ok;
  const dateLocale = locale === "ar" ? "ar" : "en";
  const checkedInRows = summaries.flatMap((summary) =>
    summary.checkIns.map((checkIn) => ({
      ...checkIn,
      teamName: summary.name,
    })),
  );

  return (
    <section
      className="border p-4"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-2)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            className="text-[10px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {msgs.title}
          </p>
          <p className="mt-1 text-xs leading-5" style={{ color: "var(--asc-fg-3)" }}>
            {msgs.description}
          </p>
        </div>

        {isLoggedIn && isParticipant && (
          checkedInNow ? (
            <span
              className="border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.10em]"
              style={{
                color: "var(--asc-green)",
                borderColor: "var(--asc-green-border)",
                background: "var(--asc-green-bg)",
              }}
            >
              {msgs.checkedIn}
            </span>
          ) : (
            <form action={formAction}>
              <input type="hidden" name="matchId" value={matchId} />
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                disabled={pending}
                className="border px-4 py-2 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-80 disabled:opacity-40"
                style={{
                  borderColor: "var(--asc-accent-border-strong)",
                  background: "var(--asc-accent-dim)",
                  color: "var(--asc-accent)",
                }}
              >
                {pending ? msgs.checkingIn : msgs.checkInButton}
              </button>
            </form>
          )
        )}
      </div>

      <div className="mt-4 grid gap-2">
        {summaries.map((summary) => (
          <div
            key={summary.teamId}
            className="flex flex-wrap items-center justify-between gap-2 border px-3 py-2 text-xs"
            style={{
              borderColor: "var(--asc-line-soft)",
              background: "var(--asc-bg-1)",
            }}
          >
            <span
              className="font-black"
              style={{ color: "var(--asc-fg-1)" }}
            >
              {summary.name}
            </span>
            <span
              className="font-black"
              style={{ color: "var(--asc-accent)" }}
            >
              {formatReadiness(summary, msgs.checkedInCount)}
            </span>
          </div>
        ))}
      </div>

      {!isLoggedIn && (
        <p className="mt-3 text-xs" style={{ color: "var(--asc-fg-3)" }}>
          {msgs.signInHint}
        </p>
      )}

      {isLoggedIn && !isParticipant && (
        <p className="mt-3 text-xs" style={{ color: "var(--asc-fg-3)" }}>
          {msgs.notParticipant}
        </p>
      )}

      {state.message && (
        <div
          className="mt-3 border px-3 py-2 text-xs"
          style={{
            borderColor: state.ok
              ? "var(--asc-green-border)"
              : "var(--asc-live-border)",
            background: state.ok
              ? "var(--asc-green-bg)"
              : "var(--asc-live-bg)",
          }}
        >
          <p
            className="font-black"
            style={{
              color: state.ok ? "var(--asc-green)" : "var(--asc-live)",
            }}
          >
            {state.message}
          </p>
        </div>
      )}

      {showAdminDetails && (
        <div
          className="mt-4 border-t pt-3"
          style={{ borderColor: "var(--asc-line-soft)" }}
        >
          <p
            className="text-[10px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {msgs.adminDetails}
          </p>

          {checkedInRows.length > 0 ? (
            <div className="mt-2 grid gap-2">
              {checkedInRows.map((checkIn) => (
                <div
                  key={checkIn.id ?? `${checkIn.teamId}-${checkIn.userId}`}
                  className="flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <span style={{ color: "var(--asc-fg-1)" }}>
                    <span className="font-black">{checkIn.username}</span>
                    <span style={{ color: "var(--asc-fg-3)" }}>
                      {" "}
                      · {checkIn.teamName}
                    </span>
                  </span>
                  <span style={{ color: "var(--asc-fg-3)" }}>
                    {new Date(checkIn.createdAt).toLocaleString(dateLocale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs" style={{ color: "var(--asc-fg-3)" }}>
              {msgs.noAdminDetails}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
