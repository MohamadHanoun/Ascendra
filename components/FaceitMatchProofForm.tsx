"use client";

import { useActionState } from "react";

import type { MatchActionResult } from "@/actions/matchActions";
import {
  setFaceitMatchLinkForPlayers,
  syncFaceitMatchProof,
} from "@/actions/matchActions";
import {
  hasFaceitPlayerRows,
  type FaceitParsedResultView,
} from "@/lib/faceitParsedResultView";
import type { Locale } from "@/lib/i18n";

type FaceitProof = {
  faceitMatchId: string | null;
  faceitMatchUrl: string | null;
  faceitStatus: string | null;
  faceitDemoUrl: string | null;
  faceitMap: string | null;
  faceitScoreRaw: string | null;
  faceitSyncedAt: string | null;
  faceitVerifiedAt: string | null;
  faceitAutoAppliedAt: string | null;
  faceitAutoApplyMethod: string | null; // "strict" | "faction_order"
};

type FaceitMatchProofMessages = {
  instruction: string;
  inputLabel: string;
  inputPlaceholder: string;
  syncButton: string;
  syncing: string;
  syncHint: string;
  roomLinkTitle: string;
  roomLinkLabel: string;
  roomLinkPlaceholder: string;
  roomLinkButton: string;
  roomLinkSaving: string;
  roomLinkHint: string;
  notSyncedYet: string;
  synced: string;
  matchIdLabel: string;
  verified: string;
  verifiedAtLabel: string;
  pendingReview: string;
  statusLabel: string;
  mapLabel: string;
  scoreLabel: string;
  demoLabel: string;
  openFaceit: string;
  proofSource: string;
  playerStatsTitle: string;
  playerLabel: string;
  killsLabel: string;
  deathsLabel: string;
  assistsLabel: string;
  adrLabel: string;
  hsLabel: string;
  mvpLabel: string;
  kdLabel: string;
  teamFallback: string;
  winnerLabel: string;
  disclaimer: string;
  disclaimerApplied: string;
  connectRequired: string;
  // Phase 4 — auto-confirm display
  autoApplied: string;
  mappingMethodLabel: string;
  mappingStrict: string;
  mappingFactionOrder: string;
  autoAppliedAt: string;
};

const formMessages: Record<Locale, FaceitMatchProofMessages> = {
  en: {
    instruction:
      "Paste the FACEIT match ID or room URL to sync score, map, and stats.",
    inputLabel: "FACEIT match ID or room URL",
    inputPlaceholder:
      "e.g. 1-59d69823-3169-45a8-... or faceit.com/.../room/...",
    syncButton: "Sync FACEIT proof",
    syncing: "Syncing...",
    syncHint:
      "Auto-confirm applies the result when team mapping is verified.",
    roomLinkTitle: "FACEIT room link",
    roomLinkLabel: "FACEIT match link or Match ID",
    roomLinkPlaceholder:
      "https://www.faceit.com/en/cs2/room/1-... or 1-...",
    roomLinkButton: "Save FACEIT room",
    roomLinkSaving: "Saving...",
    roomLinkHint:
      "Players see this link on the match page.",
    notSyncedYet: "No FACEIT proof synced yet.",
    synced: "Synced",
    matchIdLabel: "FACEIT match ID",
    verified: "FACEIT verified",
    verifiedAtLabel: "Verified",
    pendingReview: "Pending review",
    statusLabel: "Status",
    mapLabel: "Map",
    scoreLabel: "Score",
    demoLabel: "Demo",
    openFaceit: "Open FACEIT match",
    proofSource: "FACEIT proof",
    playerStatsTitle: "Player stats",
    playerLabel: "Player",
    killsLabel: "K",
    deathsLabel: "D",
    assistsLabel: "A",
    adrLabel: "ADR",
    hsLabel: "HS%",
    mvpLabel: "MVP",
    kdLabel: "KD",
    teamFallback: "FACEIT team",
    winnerLabel: "Winner",
    disclaimer:
      "Proof stored for review. Auto-confirm applies the result when team mapping is verified.",
    disclaimerApplied:
      "This FACEIT proof applied the official result automatically.",
    connectRequired:
      "Connect FACEIT on your profile to sync proof.",
    autoApplied: "Official result auto-applied from FACEIT.",
    mappingMethodLabel: "Mapping method",
    mappingStrict: "Strict player match",
    mappingFactionOrder: "Faction order fallback",
    autoAppliedAt: "Auto-applied",
  },
  ar: {
    instruction:
      "الصق FACEIT Match ID أو رابط الغرفة لمزامنة النتيجة والخريطة والإحصائيات.",
    inputLabel: "معرّف مباراة FACEIT أو رابط الغرفة",
    inputPlaceholder: "مثال: 1-59d69823-... أو faceit.com/.../room/...",
    syncButton: "مزامنة إثبات FACEIT",
    syncing: "جارٍ المزامنة...",
    syncHint:
      "يطبّق التأكيد التلقائي النتيجة عند التحقق من مطابقة الفرق.",
    roomLinkTitle: "رابط غرفة FACEIT",
    roomLinkLabel: "رابط مباراة FACEIT أو Match ID",
    roomLinkPlaceholder:
      "https://www.faceit.com/ar/cs2/room/1-... أو 1-...",
    roomLinkButton: "حفظ غرفة FACEIT",
    roomLinkSaving: "جارٍ الحفظ...",
    roomLinkHint:
      "يظهر هذا الرابط للاعبين في صفحة المباراة.",
    notSyncedYet: "لم تتم مزامنة إثبات FACEIT بعد.",
    synced: "تمت المزامنة",
    matchIdLabel: "FACEIT Match ID",
    verified: "موثق من FACEIT",
    verifiedAtLabel: "تم التحقق",
    pendingReview: "بانتظار المراجعة",
    statusLabel: "الحالة",
    mapLabel: "الخريطة",
    scoreLabel: "النتيجة",
    demoLabel: "العرض التجريبي",
    openFaceit: "فتح مباراة FACEIT",
    proofSource: "إثبات FACEIT",
    playerStatsTitle: "إحصائيات اللاعبين",
    playerLabel: "اللاعب",
    killsLabel: "K",
    deathsLabel: "D",
    assistsLabel: "A",
    adrLabel: "ADR",
    hsLabel: "HS%",
    mvpLabel: "MVP",
    kdLabel: "KD",
    teamFallback: "فريق FACEIT",
    winnerLabel: "الفائز",
    disclaimer:
      "الإثبات محفوظ للمراجعة. يطبّق التأكيد التلقائي النتيجة عند التحقق من مطابقة الفرق.",
    disclaimerApplied: "طبّق إثبات FACEIT هذا النتيجة الرسمية تلقائيًا.",
    connectRequired:
      "اربط FACEIT في ملفك الشخصي لمزامنة الإثبات.",
    autoApplied: "تم اعتماد النتيجة الرسمية تلقائيًا من FACEIT.",
    mappingMethodLabel: "طريقة المطابقة",
    mappingStrict: "مطابقة اللاعبين",
    mappingFactionOrder: "ترتيب فرق FACEIT",
    autoAppliedAt: "تطبيق تلقائي",
  },
};

const INITIAL: MatchActionResult = { ok: false, message: "" };

type Props = {
  matchId: string;
  isAdmin: boolean;
  isParticipant: boolean;
  hasFaceitConnected: boolean;
  locale: Locale;
  proof: FaceitProof;
  parsedResult: FaceitParsedResultView;
};

function formatStat(value: number | undefined, digits = 0): string {
  if (value === undefined) {
    return "—";
  }

  return digits > 0 ? value.toFixed(digits) : String(value);
}

function formatOptionalScore(value: number | undefined): string | null {
  return value === undefined ? null : String(value);
}

export default function FaceitMatchProofForm({
  matchId,
  isAdmin,
  isParticipant,
  hasFaceitConnected,
  locale,
  proof,
  parsedResult,
}: Props) {
  const msgs = formMessages[locale];
  const [syncState, syncFormAction, syncPending] = useActionState(
    syncFaceitMatchProof,
    INITIAL,
  );
  const [roomLinkState, roomLinkFormAction, roomLinkPending] = useActionState(
    setFaceitMatchLinkForPlayers,
    INITIAL,
  );

  const canSync = isAdmin || (isParticipant && hasFaceitConnected);
  const showConnectHint = isParticipant && !hasFaceitConnected && !isAdmin;
  const isVerified = Boolean(proof.faceitVerifiedAt);
  const hasPlayerStats = hasFaceitPlayerRows(parsedResult);

  const dateLocale = locale === "ar" ? "ar" : "en";

  return (
    <div className="grid gap-4">
      {/* Instruction */}
      <p className="text-xs leading-5" style={{ color: "var(--asc-fg-3)" }}>
        {msgs.instruction}
      </p>

      {/* Existing proof */}
      {proof.faceitMatchId ? (
        <div
          className="border p-4"
          style={{
            borderColor: isVerified
              ? "var(--asc-green-border)"
              : "var(--asc-accent-border)",
            background: isVerified
              ? "var(--asc-green-bg)"
              : "var(--asc-accent-dim)",
          }}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p
              className="text-[10px] font-black uppercase tracking-[0.14em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {msgs.proofSource}
            </p>
            <span
              className="border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.10em]"
              style={
                isVerified
                  ? {
                      color: "var(--asc-green)",
                      borderColor: "var(--asc-green-border)",
                      background: "var(--asc-green-bg)",
                    }
                  : {
                      color: "var(--asc-accent)",
                      borderColor: "var(--asc-accent-border)",
                      background: "var(--asc-accent-dim)",
                    }
              }
            >
              {isVerified ? msgs.verified : msgs.pendingReview}
            </span>
          </div>

          <div className="grid gap-1.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span style={{ color: "var(--asc-fg-3)" }}>
                {msgs.matchIdLabel}
              </span>
              <span
                dir="ltr"
                title={proof.faceitMatchId}
                className="break-all text-right font-mono font-black"
                style={{ color: "var(--asc-fg-1)" }}
              >
                {proof.faceitMatchId}
              </span>
            </div>

            {proof.faceitStatus && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span style={{ color: "var(--asc-fg-3)" }}>
                  {msgs.statusLabel}
                </span>
                <span
                  dir="ltr"
                  title={proof.faceitStatus}
                  className="break-all text-right font-mono font-black"
                  style={{ color: "var(--asc-fg-1)" }}
                >
                  {proof.faceitStatus}
                </span>
              </div>
            )}

            {proof.faceitMap && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span style={{ color: "var(--asc-fg-3)" }}>{msgs.mapLabel}</span>
                <span
                  dir="ltr"
                  className="break-all text-right font-mono font-black"
                  style={{ color: "var(--asc-fg-1)" }}
                >
                  {proof.faceitMap}
                </span>
              </div>
            )}

            {proof.faceitScoreRaw && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span style={{ color: "var(--asc-fg-3)" }}>{msgs.scoreLabel}</span>
                <span
                  dir="ltr"
                  className="break-all text-right font-mono font-black"
                  style={{ color: "var(--asc-accent)" }}
                >
                  {proof.faceitScoreRaw}
                </span>
              </div>
            )}

            {proof.faceitMatchUrl && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span style={{ color: "var(--asc-fg-3)" }}>{msgs.openFaceit}</span>
                <a
                  dir="ltr"
                  href={proof.faceitMatchUrl}
                  title={proof.faceitMatchId}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-right font-black transition hover:opacity-75"
                  style={{ color: "var(--asc-blue)" }}
                >
                  {proof.faceitMatchId.slice(0, 14)}… →
                </a>
              </div>
            )}

            {proof.faceitDemoUrl && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span style={{ color: "var(--asc-fg-3)" }}>{msgs.demoLabel}</span>
                <a
                  dir="ltr"
                  href={proof.faceitDemoUrl}
                  title={proof.faceitDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-right font-black transition hover:opacity-75"
                  style={{ color: "var(--asc-blue)" }}
                >
                  .dem.gz →
                </a>
              </div>
            )}

            {proof.faceitSyncedAt && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span style={{ color: "var(--asc-fg-3)" }}>{msgs.synced}</span>
                <span className="text-right" style={{ color: "var(--asc-fg-3)" }}>
                  {new Date(proof.faceitSyncedAt).toLocaleString(dateLocale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            )}

            {proof.faceitVerifiedAt && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span style={{ color: "var(--asc-fg-3)" }}>
                  {msgs.verifiedAtLabel}
                </span>
                <span className="text-right" style={{ color: "var(--asc-fg-3)" }}>
                  {new Date(proof.faceitVerifiedAt).toLocaleString(dateLocale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            )}

            {proof.faceitAutoAppliedAt && (
              <>
                <div
                  className="my-1 border-t"
                  style={{ borderColor: "oklch(0.55 0.14 150 / 0.25)" }}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className="font-black"
                    style={{ color: "var(--asc-green)" }}
                  >
                    {msgs.autoAppliedAt}
                  </span>
                  <span className="text-right" style={{ color: "var(--asc-fg-3)" }}>
                    {new Date(proof.faceitAutoAppliedAt).toLocaleString(dateLocale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                {proof.faceitAutoApplyMethod && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span style={{ color: "var(--asc-fg-3)" }}>
                      {msgs.mappingMethodLabel}
                    </span>
                    <span
                      className="text-right font-black"
                      style={{ color: "var(--asc-fg-1)" }}
                    >
                      {proof.faceitAutoApplyMethod === "strict"
                        ? msgs.mappingStrict
                        : msgs.mappingFactionOrder}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
          {msgs.notSyncedYet}
        </p>
      )}

      {hasPlayerStats && (
        <div className="grid gap-3">
          <p
            className="text-[10px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {msgs.playerStatsTitle}
          </p>

          {parsedResult.teams.map((team, teamIndex) => {
            if (team.players.length === 0) {
              return null;
            }

            const teamScore = formatOptionalScore(team.finalScore);
            const teamName =
              team.name ?? `${msgs.teamFallback} ${teamIndex + 1}`;

            return (
              <div
                key={team.faceitTeamId ?? `${teamName}-${teamIndex}`}
                className="overflow-hidden border"
                style={{
                  borderColor: team.won
                    ? "oklch(0.55 0.14 150 / 0.35)"
                    : "var(--asc-line-soft)",
                  background: "var(--asc-bg-2)",
                }}
              >
                <div
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                  style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span
                      dir="ltr"
                      title={team.faceitTeamId ?? teamName}
                      className="max-w-full truncate font-mono text-xs font-black"
                      style={{ color: "var(--asc-fg-1)" }}
                    >
                      {teamName}
                    </span>
                    {team.won && (
                      <span
                        className="border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.10em]"
                        style={{
                          color: "var(--asc-green)",
                          borderColor: "var(--asc-green-border)",
                          background: "var(--asc-green-bg)",
                        }}
                      >
                        {msgs.winnerLabel}
                      </span>
                    )}
                  </div>
                  {teamScore && (
                    <span
                      dir="ltr"
                      className="font-mono text-xs font-black"
                      style={{ color: "var(--asc-accent)" }}
                    >
                      {teamScore}
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-xs">
                    <thead>
                      <tr style={{ color: "var(--asc-fg-3)" }}>
                        <th className="px-3 py-2 text-left font-black">
                          {msgs.playerLabel}
                        </th>
                        <th className="px-2 py-2 text-right font-black">
                          {msgs.killsLabel}
                        </th>
                        <th className="px-2 py-2 text-right font-black">
                          {msgs.deathsLabel}
                        </th>
                        <th className="px-2 py-2 text-right font-black">
                          {msgs.assistsLabel}
                        </th>
                        <th className="px-2 py-2 text-right font-black">
                          {msgs.adrLabel}
                        </th>
                        <th className="px-2 py-2 text-right font-black">
                          {msgs.hsLabel}
                        </th>
                        <th className="px-2 py-2 text-right font-black">
                          {msgs.mvpLabel}
                        </th>
                        <th className="px-3 py-2 text-right font-black">
                          {msgs.kdLabel}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.players.map((player, playerIndex) => (
                        <tr
                          key={
                            player.faceitPlayerId ??
                            `${player.nickname}-${playerIndex}`
                          }
                          style={{
                            borderTop: "1px solid var(--asc-line-soft)",
                            color: "var(--asc-fg-1)",
                          }}
                        >
                          <td className="px-3 py-2">
                            <span
                              dir="ltr"
                              title={player.faceitPlayerId ?? player.nickname}
                              className="block max-w-[14rem] truncate font-mono font-black"
                            >
                              {player.nickname}
                            </span>
                          </td>
                          <td dir="ltr" className="px-2 py-2 text-right font-mono">
                            {formatStat(player.kills)}
                          </td>
                          <td dir="ltr" className="px-2 py-2 text-right font-mono">
                            {formatStat(player.deaths)}
                          </td>
                          <td dir="ltr" className="px-2 py-2 text-right font-mono">
                            {formatStat(player.assists)}
                          </td>
                          <td dir="ltr" className="px-2 py-2 text-right font-mono">
                            {formatStat(player.adr, 1)}
                          </td>
                          <td dir="ltr" className="px-2 py-2 text-right font-mono">
                            {formatStat(player.headshotsPercent)}
                          </td>
                          <td dir="ltr" className="px-2 py-2 text-right font-mono">
                            {formatStat(player.mvps)}
                          </td>
                          <td dir="ltr" className="px-3 py-2 text-right font-mono">
                            {formatStat(player.kdRatio, 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      {proof.faceitAutoAppliedAt ? (
        <div
          className="border px-3 py-2 text-xs leading-5"
          style={{
            borderColor: "var(--asc-green-border)",
            background: "var(--asc-green-bg)",
            color: "var(--asc-green)",
          }}
        >
          {msgs.disclaimerApplied}
        </div>
      ) : (
        <div
          className="border px-3 py-2 text-xs leading-5"
          style={{
            borderColor: "var(--asc-accent-border)",
            background: "var(--asc-accent-dim)",
            color: "var(--asc-accent)",
          }}
        >
          {msgs.disclaimer}
        </div>
      )}

      {/* FACEIT connect hint for non-connected participants */}
      {showConnectHint && (
        <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
          {msgs.connectRequired}
        </p>
      )}

      {/* Admin-only room link form */}
      {isAdmin && (
        <form
          action={roomLinkFormAction}
          className="grid gap-3 border p-4"
          style={{
            borderColor: "var(--asc-line-soft)",
            background: "var(--asc-bg-2)",
          }}
        >
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="locale" value={locale} />

          <div>
            <p
              className="mb-2 text-[10px] font-black uppercase tracking-[0.14em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {msgs.roomLinkTitle}
            </p>
            <label
              htmlFor={`faceit-room-link-input-${matchId}`}
              className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {msgs.roomLinkLabel}
            </label>
            <input
              id={`faceit-room-link-input-${matchId}`}
              name="faceitRoomInput"
              type="text"
              dir="ltr"
              placeholder={msgs.roomLinkPlaceholder}
              defaultValue={proof.faceitMatchUrl ?? proof.faceitMatchId ?? ""}
              className="w-full border bg-transparent px-3 py-2 font-mono text-sm"
              style={{
                borderColor: "var(--asc-line-soft)",
                color: "var(--asc-fg-0)",
                outline: "none",
              }}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="grid gap-2">
            <button
              type="submit"
              disabled={roomLinkPending}
              className="border px-5 py-2.5 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-80 disabled:opacity-40"
              style={{
                borderColor: "var(--asc-accent-border)",
                background: "var(--asc-accent-dim)",
                color: "var(--asc-accent)",
              }}
            >
              {roomLinkPending ? msgs.roomLinkSaving : msgs.roomLinkButton}
            </button>
            <p className="text-xs leading-5" style={{ color: "var(--asc-fg-3)" }}>
              {msgs.roomLinkHint}
            </p>
          </div>

          {roomLinkState.message && (
            <div
              className="border px-3 py-2 text-xs"
              style={{
                borderColor: roomLinkState.ok
                  ? "var(--asc-green-border)"
                  : "var(--asc-live-border)",
                background: roomLinkState.ok
                  ? "var(--asc-green-bg)"
                  : "var(--asc-live-bg)",
              }}
            >
              <p
                className="font-black"
                style={{
                  color: roomLinkState.ok
                    ? "var(--asc-green)"
                    : "var(--asc-live)",
                }}
              >
                {roomLinkState.message}
              </p>
            </div>
          )}
        </form>
      )}

      {/* Sync form */}
      {canSync && (
        <form action={syncFormAction} className="grid gap-3">
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="locale" value={locale} />

          <div>
            <label
              htmlFor={`faceit-proof-input-${matchId}`}
              className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {msgs.inputLabel}
            </label>
            <input
              id={`faceit-proof-input-${matchId}`}
              name="faceitMatchInput"
              type="text"
              dir="ltr"
              placeholder={msgs.inputPlaceholder}
              defaultValue={proof.faceitMatchId ?? ""}
              className="w-full border bg-transparent px-3 py-2 font-mono text-sm"
              style={{
                borderColor: "var(--asc-line-soft)",
                color: "var(--asc-fg-0)",
                outline: "none",
              }}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="grid gap-2">
            <button
              type="submit"
              disabled={syncPending}
              className="border px-5 py-2.5 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-80 disabled:opacity-40"
              style={{
                borderColor: "var(--asc-accent-border)",
                background: "var(--asc-accent-dim)",
                color: "var(--asc-accent)",
              }}
            >
              {syncPending ? msgs.syncing : msgs.syncButton}
            </button>
            <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
              {msgs.syncHint}
            </p>
          </div>
        </form>
      )}

      {/* Action result */}
      {syncState.message && (
        <div
          className="border px-3 py-2 text-xs"
          style={{
            borderColor: syncState.ok
              ? "var(--asc-green-border)"
              : "var(--asc-live-border)",
            background: syncState.ok
              ? "var(--asc-green-bg)"
              : "var(--asc-live-bg)",
          }}
        >
          <p
            className="font-black"
            style={{
              color: syncState.ok ? "var(--asc-green)" : "var(--asc-live)",
            }}
          >
            {syncState.message}
          </p>
        </div>
      )}
    </div>
  );
}
