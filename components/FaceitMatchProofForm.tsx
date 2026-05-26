"use client";

import { useActionState } from "react";

import type { MatchActionResult } from "@/actions/matchActions";
import { syncFaceitMatchProof } from "@/actions/matchActions";
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
};

type FaceitMatchProofMessages = {
  instruction: string;
  inputLabel: string;
  inputPlaceholder: string;
  syncButton: string;
  syncing: string;
  notSyncedYet: string;
  synced: string;
  verified: string;
  pendingReview: string;
  statusLabel: string;
  mapLabel: string;
  scoreLabel: string;
  demoLabel: string;
  openFaceit: string;
  proofSource: string;
  disclaimer: string;
  connectRequired: string;
};

const formMessages: Record<Locale, FaceitMatchProofMessages> = {
  en: {
    instruction:
      "Paste a FACEIT match ID or room URL to attach CS2 proof to this match.",
    inputLabel: "FACEIT Match ID or URL",
    inputPlaceholder:
      "e.g. 1-59d69823-3169-45a8-... or faceit.com/.../room/...",
    syncButton: "Sync FACEIT proof",
    syncing: "Syncing...",
    notSyncedYet: "Not synced yet",
    synced: "Synced",
    verified: "FACEIT verified",
    pendingReview: "Pending review",
    statusLabel: "FACEIT status",
    mapLabel: "Map",
    scoreLabel: "FACEIT score",
    demoLabel: "Demo",
    openFaceit: "Open FACEIT match",
    proofSource: "Proof source",
    disclaimer:
      "This proof does not change the official result automatically.",
    connectRequired:
      "Connect your FACEIT account on your profile to sync CS2 proof.",
  },
  ar: {
    instruction:
      "الصق معرّف مباراة FACEIT أو رابط الغرفة لإرفاق إثبات CS2 بهذه المباراة.",
    inputLabel: "معرّف مباراة FACEIT أو الرابط",
    inputPlaceholder: "مثال: 1-59d69823-... أو faceit.com/.../room/...",
    syncButton: "مزامنة إثبات FACEIT",
    syncing: "جارٍ المزامنة...",
    notSyncedYet: "لم تتم المزامنة بعد",
    synced: "تمت المزامنة",
    verified: "موثق من FACEIT",
    pendingReview: "بانتظار المراجعة",
    statusLabel: "حالة FACEIT",
    mapLabel: "الخريطة",
    scoreLabel: "نتيجة FACEIT",
    demoLabel: "الديمو",
    openFaceit: "فتح مباراة FACEIT",
    proofSource: "مصدر الإثبات",
    disclaimer: "هذا الإثبات لا يغيّر النتيجة الرسمية تلقائيًا.",
    connectRequired:
      "اربط حساب FACEIT في ملفك الشخصي لمزامنة إثبات CS2.",
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
};

export default function FaceitMatchProofForm({
  matchId,
  isAdmin,
  isParticipant,
  hasFaceitConnected,
  locale,
  proof,
}: Props) {
  const msgs = formMessages[locale];
  const [state, formAction, pending] = useActionState(
    syncFaceitMatchProof,
    INITIAL,
  );

  const canSync = isAdmin || (isParticipant && hasFaceitConnected);
  const showConnectHint = isParticipant && !hasFaceitConnected && !isAdmin;
  const isVerified = Boolean(proof.faceitVerifiedAt);

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
              ? "oklch(0.55 0.14 150 / 0.4)"
              : "oklch(0.65 0.14 75 / 0.4)",
            background: isVerified
              ? "oklch(0.25 0.12 150 / 0.10)"
              : "oklch(0.25 0.12 75 / 0.10)",
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
                      borderColor: "oklch(0.55 0.14 150 / 0.5)",
                      background: "oklch(0.25 0.12 150 / 0.18)",
                    }
                  : {
                      color: "var(--asc-amber)",
                      borderColor: "oklch(0.65 0.14 75 / 0.5)",
                      background: "oklch(0.25 0.12 75 / 0.18)",
                    }
              }
            >
              {isVerified ? msgs.verified : msgs.pendingReview}
            </span>
          </div>

          <div className="grid gap-1.5 text-xs">
            {proof.faceitStatus && (
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--asc-fg-3)" }}>
                  {msgs.statusLabel}
                </span>
                <span
                  className="font-mono font-black"
                  style={{ color: "var(--asc-fg-1)" }}
                >
                  {proof.faceitStatus}
                </span>
              </div>
            )}

            {proof.faceitMap && (
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--asc-fg-3)" }}>{msgs.mapLabel}</span>
                <span
                  className="font-mono font-black"
                  style={{ color: "var(--asc-fg-1)" }}
                >
                  {proof.faceitMap}
                </span>
              </div>
            )}

            {proof.faceitScoreRaw && (
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--asc-fg-3)" }}>{msgs.scoreLabel}</span>
                <span
                  className="font-mono font-black"
                  style={{ color: "var(--asc-accent)" }}
                >
                  {proof.faceitScoreRaw}
                </span>
              </div>
            )}

            {proof.faceitMatchUrl && (
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--asc-fg-3)" }}>{msgs.openFaceit}</span>
                <a
                  href={proof.faceitMatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black transition hover:opacity-75"
                  style={{ color: "var(--asc-blue)" }}
                >
                  {proof.faceitMatchId.slice(0, 14)}… →
                </a>
              </div>
            )}

            {proof.faceitDemoUrl && (
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--asc-fg-3)" }}>{msgs.demoLabel}</span>
                <a
                  href={proof.faceitDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black transition hover:opacity-75"
                  style={{ color: "var(--asc-blue)" }}
                >
                  .dem.gz →
                </a>
              </div>
            )}

            {proof.faceitSyncedAt && (
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--asc-fg-3)" }}>{msgs.synced}</span>
                <span style={{ color: "var(--asc-fg-3)" }}>
                  {new Date(proof.faceitSyncedAt).toLocaleString(dateLocale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
          {msgs.notSyncedYet}
        </p>
      )}

      {/* Disclaimer */}
      <div
        className="border px-3 py-2 text-xs leading-5"
        style={{
          borderColor: "oklch(0.65 0.14 75 / 0.4)",
          background: "oklch(0.25 0.12 75 / 0.10)",
          color: "var(--asc-amber)",
        }}
      >
        {msgs.disclaimer}
      </div>

      {/* FACEIT connect hint for non-connected participants */}
      {showConnectHint && (
        <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
          {msgs.connectRequired}
        </p>
      )}

      {/* Sync form */}
      {canSync && (
        <form action={formAction} className="grid gap-3">
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

          <button
            type="submit"
            disabled={pending}
            className="border px-5 py-2.5 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-80 disabled:opacity-40"
            style={{
              borderColor: "oklch(0.50 0.20 285 / 0.4)",
              background: "var(--asc-accent-dim)",
              color: "var(--asc-accent)",
            }}
          >
            {pending ? msgs.syncing : msgs.syncButton}
          </button>
        </form>
      )}

      {/* Action result */}
      {state.message && (
        <div
          className="border px-3 py-2 text-xs"
          style={{
            borderColor: state.ok
              ? "oklch(0.55 0.14 150 / 0.4)"
              : "oklch(0.50 0.20 25 / 0.4)",
            background: state.ok
              ? "oklch(0.25 0.12 150 / 0.12)"
              : "oklch(0.25 0.18 25 / 0.12)",
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
    </div>
  );
}
