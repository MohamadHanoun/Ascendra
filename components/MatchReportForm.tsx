"use client";

import { useActionState, useRef, useState, useTransition } from "react";

import {
  disputeMatchResult,
  submitMatchReport,
  type MatchActionResult,
} from "@/actions/matchActions";
import ConfirmDialogPortal from "@/components/ConfirmDialogPortal";
import type { Locale } from "@/lib/i18n";

type Team = { id: string; name: string };

type MatchReportFormProps = {
  matchId: string;
  userTeamId: string;
  teamA: Team;
  teamB: Team;
  hasExistingReport: boolean;
  locale: Locale;
};

const initialState: MatchActionResult = { ok: false, message: "" };

type MatchReportFormMessages = {
  existingReport: string;
  declareWinner: string;
  selectWinner: string;
  scoreLabel: string;
  evidenceUrl: string;
  noteOptional: string;
  notePlaceholder: string;
  submitting: string;
  submitResult: string;
  confirmation: string;
  submitTitle: string;
  submitDescription: string;
  submitConfirm: string;
  cancel: string;
  disputeReason: string;
  disputePlaceholder: string;
  filingDispute: string;
  fileDispute: string;
  disputeTitle: string;
  disputeDescription: string;
  disputeConfirm: string;
};

const matchReportFormMessages: Record<Locale, MatchReportFormMessages> = {
  en: {
    existingReport:
      "You already submitted a report. Submitting again will replace your previous one.",
    declareWinner: "Declare Winner",
    selectWinner: "— Select winner —",
    scoreLabel: "{team} score",
    evidenceUrl: "Evidence URL (screenshot / VOD)",
    noteOptional: "Note (optional)",
    notePlaceholder: "Any extra context for the admin...",
    submitting: "Submitting...",
    submitResult: "Submit Result ›",
    confirmation: "Confirmation",
    submitTitle: "Submit match result?",
    submitDescription:
      "Submit this result for {teamA} vs {teamB}. Admins may review it if the opponent disputes it.",
    submitConfirm: "Submit result",
    cancel: "Cancel",
    disputeReason: "Reason for dispute",
    disputePlaceholder:
      "Describe the problem clearly. Admins will review both sides.",
    filingDispute: "Filing dispute...",
    fileDispute: "File Dispute",
    disputeTitle: "File dispute?",
    disputeDescription:
      "Submit this dispute for admin review. Use this only when the reported result is incorrect or incomplete.",
    disputeConfirm: "File dispute",
  },
  ar: {
    existingReport:
      "لقد أرسلت تقريرًا من قبل. سيؤدي الإرسال مرة أخرى إلى استبدال التقرير السابق.",
    declareWinner: "تحديد الفائز",
    selectWinner: "- اختر الفائز -",
    scoreLabel: "نتيجة {team}",
    evidenceUrl: "رابط الدليل (لقطة شاشة / VOD)",
    noteOptional: "ملاحظة (اختياري)",
    notePlaceholder: "أي سياق إضافي للمشرف...",
    submitting: "جارٍ الإرسال...",
    submitResult: "إرسال النتيجة ›",
    confirmation: "تأكيد",
    submitTitle: "إرسال نتيجة المباراة؟",
    submitDescription:
      "أرسل هذه النتيجة لمباراة {teamA} ضد {teamB}. قد يراجعها المشرفون إذا اعترض الفريق الآخر.",
    submitConfirm: "إرسال النتيجة",
    cancel: "إلغاء",
    disputeReason: "سبب الاعتراض",
    disputePlaceholder:
      "اشرح المشكلة بوضوح. سيراجع المشرفون الطرفين.",
    filingDispute: "جارٍ إرسال الاعتراض...",
    fileDispute: "إرسال اعتراض",
    disputeTitle: "إرسال اعتراض؟",
    disputeDescription:
      "أرسل هذا الاعتراض لمراجعة المشرفين. استخدمه فقط عندما تكون النتيجة المبلغ عنها غير صحيحة أو غير مكتملة.",
    disputeConfirm: "إرسال الاعتراض",
  },
};

function formatMessage(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, value),
    template,
  );
}

function inputStyle(): React.CSSProperties {
  return {
    background: "var(--asc-bg-2)",
    border: "1px solid var(--asc-line-soft)",
    color: "var(--asc-fg-0)",
    padding: "0.5rem 0.75rem",
    fontFamily: "var(--font-body)",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
  };
}

function labelStyle(): React.CSSProperties {
  return {
    display: "block",
    fontSize: "0.625rem",
    fontWeight: 900,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--asc-fg-3)",
    marginBottom: "0.35rem",
  };
}

function ActionFeedback({ result }: { result: MatchActionResult }) {
  if (!result.message) return null;

  return (
    <div
      className="p-4"
      style={
        result.ok
          ? {
              background: "var(--asc-green-bg)",
              border: "1px solid var(--asc-green-border)",
              color: "var(--asc-green)",
            }
          : {
              background: "var(--asc-live-bg)",
              border: "1px solid var(--asc-live-border)",
              color: "var(--asc-live)",
            }
      }
    >
      <p className="text-sm leading-6">{result.message}</p>
    </div>
  );
}

export function MatchReportForm({
  matchId,
  userTeamId,
  teamA,
  teamB,
  hasExistingReport,
  locale,
}: MatchReportFormProps) {
  const messages = matchReportFormMessages[locale];
  const reportFormRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [reportState, reportAction, reportPending] = useActionState(
    submitMatchReport,
    initialState,
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmOpen(true);
  }

  function runReportAction() {
    const form = reportFormRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);

    setConfirmOpen(false);

    startTransition(() => {
      reportAction(formData);
    });
  }

  return (
    <div className="grid gap-5">
      {hasExistingReport && (
        <div
          className="px-4 py-3 text-xs font-bold"
          style={{
            background: "oklch(0.82 0.16 75 / 0.08)",
            border: "1px solid var(--asc-amber-border)",
            color: "var(--asc-amber)",
          }}
        >
          {messages.existingReport}
        </div>
      )}

      <ActionFeedback result={reportState} />

      {!reportState.ok && (
        <form
          ref={reportFormRef}
          onSubmit={handleSubmit}
          className="grid gap-5"
        >
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="teamId" value={userTeamId} />
          <input type="hidden" name="locale" value={locale} />

          <div>
            <label style={labelStyle()}>{messages.declareWinner}</label>
            <select name="winnerTeamId" required style={inputStyle()}>
              <option value="">{messages.selectWinner}</option>
              <option value={teamA.id}>{teamA.name}</option>
              <option value={teamB.id}>{teamB.name}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle()}>
                {formatMessage(messages.scoreLabel, { team: teamA.name })}
              </label>
              <input
                type="number"
                name="teamAScore"
                min="0"
                max="99"
                defaultValue="0"
                required
                style={inputStyle()}
              />
            </div>

            <div>
              <label style={labelStyle()}>
                {formatMessage(messages.scoreLabel, { team: teamB.name })}
              </label>
              <input
                type="number"
                name="teamBScore"
                min="0"
                max="99"
                defaultValue="0"
                required
                style={inputStyle()}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle()}>{messages.evidenceUrl}</label>
            <input
              type="url"
              name="evidenceUrl"
              placeholder="https://…"
              style={inputStyle()}
            />
          </div>

          <div>
            <label style={labelStyle()}>{messages.noteOptional}</label>
            <textarea
              name="note"
              rows={2}
              maxLength={500}
              placeholder={messages.notePlaceholder}
              style={{ ...inputStyle(), resize: "vertical" }}
            />
          </div>

          <button
            type="submit"
            disabled={reportPending}
            className="px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: "var(--asc-accent-2)",
              boxShadow: "0 0 20px var(--asc-accent-glow)",
              clipPath:
                "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)",
            }}
          >
            {reportPending ? messages.submitting : messages.submitResult}
          </button>
        </form>
      )}

      <ConfirmDialogPortal
        open={confirmOpen}
        eyebrow={messages.confirmation}
        title={messages.submitTitle}
        description={formatMessage(messages.submitDescription, {
          teamA: teamA.name,
          teamB: teamB.name,
        })}
        confirmLabel={messages.submitConfirm}
        cancelLabel={messages.cancel}
        pendingLabel={messages.submitting}
        pending={reportPending}
        variant="primary"
        onConfirm={runReportAction}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

type DisputeFormProps = {
  matchId: string;
  locale: Locale;
};

export function DisputeForm({ matchId, locale }: DisputeFormProps) {
  const messages = matchReportFormMessages[locale];
  const disputeFormRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [state, formAction, pending] = useActionState(
    disputeMatchResult,
    initialState,
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmOpen(true);
  }

  function runDisputeAction() {
    const form = disputeFormRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);

    setConfirmOpen(false);

    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <div className="grid gap-4">
      <ActionFeedback result={state} />

      {!state.ok && (
        <form
          ref={disputeFormRef}
          onSubmit={handleSubmit}
          className="grid gap-4"
        >
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="locale" value={locale} />

          <div>
            <label style={labelStyle()}>{messages.disputeReason}</label>
            <textarea
              name="reason"
              rows={3}
              maxLength={500}
              required
              placeholder={messages.disputePlaceholder}
              style={{ ...inputStyle(), resize: "vertical" }}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="border px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: "var(--asc-live-border)",
              color: "var(--asc-live)",
              background: "transparent",
              clipPath:
                "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)",
            }}
          >
            {pending ? messages.filingDispute : messages.fileDispute}
          </button>
        </form>
      )}

      <ConfirmDialogPortal
        open={confirmOpen}
        eyebrow={messages.confirmation}
        title={messages.disputeTitle}
        description={messages.disputeDescription}
        confirmLabel={messages.disputeConfirm}
        cancelLabel={messages.cancel}
        pendingLabel={messages.filingDispute}
        pending={pending}
        variant="danger"
        onConfirm={runDisputeAction}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
