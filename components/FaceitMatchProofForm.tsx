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
      "After the FACEIT match ends, paste the FACEIT match ID or room URL. Ascendra will store score, map, stats, and demo proof.",
    inputLabel: "FACEIT match ID or room URL",
    inputPlaceholder:
      "e.g. 1-59d69823-3169-45a8-... or faceit.com/.../room/...",
    syncButton: "Sync FACEIT proof",
    syncing: "Syncing...",
    syncHint:
      "If auto-confirm is enabled and team mapping is verified, the official result may be applied automatically.",
    notSyncedYet: "No FACEIT proof synced yet.",
    synced: "Synced",
    verified: "FACEIT verified",
    pendingReview: "Pending review",
    statusLabel: "FACEIT status",
    mapLabel: "Map",
    scoreLabel: "FACEIT score",
    demoLabel: "Demo",
    openFaceit: "Open FACEIT match",
    proofSource: "Stored FACEIT proof",
    disclaimer:
      "Proof will be stored for review. Auto-confirm applies the official result only when it is enabled and team mapping is verified.",
    disclaimerApplied:
      "This FACEIT proof applied the official result automatically.",
    connectRequired:
      "Connect your FACEIT account on your profile to sync CS2 proof.",
    autoApplied: "Official result auto-applied from FACEIT.",
    mappingMethodLabel: "Mapping method",
    mappingStrict: "Strict player match",
    mappingFactionOrder: "Faction order fallback",
    autoAppliedAt: "Auto-applied",
  },
  ar: {
    instruction:
      "بعد انتهاء مباراة FACEIT، الصق FACEIT Match ID أو رابط الغرفة. سيحفظ Ascendra النتيجة والخريطة والإحصائيات وإثبات الديمو.",
    inputLabel: "معرّف مباراة FACEIT أو رابط الغرفة",
    inputPlaceholder: "مثال: 1-59d69823-... أو faceit.com/.../room/...",
    syncButton: "مزامنة إثبات FACEIT",
    syncing: "جارٍ المزامنة...",
    syncHint:
      "إذا كان التأكيد التلقائي مفعّلًا وتم التحقق من مطابقة الفرق، يمكن اعتماد النتيجة الرسمية تلقائيًا.",
    notSyncedYet: "لم تتم مزامنة إثبات FACEIT بعد.",
    synced: "تمت المزامنة",
    verified: "موثق من FACEIT",
    pendingReview: "بانتظار المراجعة",
    statusLabel: "حالة FACEIT",
    mapLabel: "الخريطة",
    scoreLabel: "نتيجة FACEIT",
    demoLabel: "الديمو",
    openFaceit: "فتح مباراة FACEIT",
    proofSource: "إثبات FACEIT محفوظ",
    disclaimer:
      "سيُحفظ الإثبات للمراجعة. يطبّق التأكيد التلقائي النتيجة الرسمية فقط عند تفعيله والتحقق من مطابقة الفرق.",
    disclaimerApplied: "طبّق إثبات FACEIT هذا النتيجة الرسمية تلقائيًا.",
    connectRequired:
      "اربط حساب FACEIT في ملفك الشخصي لمزامنة إثبات CS2.",
    autoApplied: "تم اعتماد النتيجة الرسمية تلقائيًا من FACEIT.",
    mappingMethodLabel: "طريقة المطابقة",
    mappingStrict: "مطابقة اللاعبين",
    mappingFactionOrder: "ترتيب فرق FACEIT",
    autoAppliedAt: "تطبيق تلقائي",
  },
};

const FACEIT_STATUS_AR: Record<string, string> = {
  FINISHED: "منتهية",
  CANCELLED: "ملغاة",
  ONGOING: "جارية",
  VOTING: "تصويت",
  READY: "جاهزة",
  CONFIGURING: "جارٍ الإعداد",
  MANUAL_RESULT: "نتيجة يدوية",
};

function translateFaceitStatus(status: string, locale: Locale): { text: string; isArabic: boolean } {
  if (locale === "ar") {
    const ar = FACEIT_STATUS_AR[status.toUpperCase()];
    if (ar) return { text: ar, isArabic: true };
  }
  return { text: status, isArabic: false };
}

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
              : "oklch(0.50 0.20 285 / 0.35)",
            background: isVerified
              ? "oklch(0.25 0.12 150 / 0.10)"
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
                      borderColor: "oklch(0.55 0.14 150 / 0.5)",
                      background: "oklch(0.25 0.12 150 / 0.18)",
                    }
                  : {
                      color: "var(--asc-accent)",
                      borderColor: "oklch(0.50 0.20 285 / 0.4)",
                      background: "var(--asc-accent-dim)",
                    }
              }
            >
              {isVerified ? msgs.verified : msgs.pendingReview}
            </span>
          </div>

          <div className="grid gap-1.5 text-xs">
            {proof.faceitStatus && (() => {
              const { text: statusText, isArabic: statusIsArabic } = translateFaceitStatus(proof.faceitStatus, locale);
              return (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span style={{ color: "var(--asc-fg-3)" }}>
                    {msgs.statusLabel}
                  </span>
                  <span
                    dir={statusIsArabic ? undefined : "ltr"}
                    className="break-all text-right font-mono font-black"
                    style={{ color: "var(--asc-fg-1)" }}
                  >
                    {statusText}
                  </span>
                </div>
              );
            })()}

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
                    {msgs.autoApplied}
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

      {/* Disclaimer */}
      {proof.faceitAutoAppliedAt ? (
        <div
          className="border px-3 py-2 text-xs leading-5"
          style={{
            borderColor: "oklch(0.55 0.14 150 / 0.4)",
            background: "oklch(0.25 0.12 150 / 0.10)",
            color: "var(--asc-green)",
          }}
        >
          {msgs.disclaimerApplied}
        </div>
      ) : (
        <div
          className="border px-3 py-2 text-xs leading-5"
          style={{
            borderColor: "oklch(0.50 0.20 285 / 0.35)",
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
            <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
              {msgs.syncHint}
            </p>
          </div>
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
