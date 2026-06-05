"use client";

import { useActionState, useRef, useState } from "react";

import type { AccountActionResult } from "@/actions/profileAccountActions";
import ConfirmDialogPortal from "@/components/ConfirmDialogPortal";

type Props = {
  connected: boolean;
  faceitNickname?: string | null;
  faceitSkillLevel?: number | null;
  faceitLinkedAt?: string | null;
  connectAction: (
    prevState: AccountActionResult,
    formData: FormData,
  ) => Promise<AccountActionResult>;
  unlinkAction: (
    prevState: AccountActionResult,
    formData: FormData,
  ) => Promise<AccountActionResult>;
  labels: {
    title: string;
    subtitle: string;
    help: string;
    connectedHelp: string;
    connected: string;
    connect: string;
    connecting: string;
    unlink: string;
    unlinking: string;
    linked: string;
    skillLevel: string;
    nicknamePlaceholder: string;
    confirmationEyebrow: string;
    unlinkAccountConfirmTitle: string;
    unlinkAccountConfirmDescription: string;
    unlinkAccountConfirmButton: string;
    cancel: string;
  };
};

const INITIAL: AccountActionResult = { ok: false, message: "" };

export default function FaceitConnectRow({
  connected,
  faceitNickname,
  faceitSkillLevel,
  faceitLinkedAt,
  connectAction,
  unlinkAction,
  labels,
}: Props) {
  const [connectState, connectFormAction, connectPending] = useActionState(connectAction, INITIAL);
  const [unlinkState, unlinkFormAction, unlinkPending] = useActionState(unlinkAction, INITIAL);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [prevUnlinkPending, setPrevUnlinkPending] = useState(unlinkPending);
  const unlinkFormRef = useRef<HTMLFormElement>(null);

  if (prevUnlinkPending !== unlinkPending) {
    setPrevUnlinkPending(unlinkPending);
    if (!unlinkPending) setConfirmOpen(false);
  }

  function submitUnlink() {
    unlinkFormRef.current?.requestSubmit();
  }

  const pending = connectPending || unlinkPending;

  return (
    <div className="asc-profile-row flex flex-wrap items-center justify-between gap-4 bg-[var(--asc-bg-1)] px-5 py-4">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center border text-xs font-black"
          style={{
            borderColor: connected
              ? "var(--asc-green-border)"
              : "var(--asc-line-soft)",
            background: connected
              ? "var(--asc-green-bg)"
              : "transparent",
            color: connected ? "var(--asc-green)" : "var(--asc-fg-3)",
          }}
        >
          F
        </div>
        <div className="min-w-0">
          <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
            {labels.title}
          </p>
          <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
            {labels.subtitle}
          </p>
          {!connected && (
            <p
              className="mt-1 max-w-xl text-xs leading-5"
              style={{ color: "var(--asc-fg-2)" }}
            >
              {labels.help}
            </p>
          )}
        </div>
      </div>

      {connected ? (
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
          <div className="min-w-0 text-right">
            <p
              dir="ltr"
              className="break-all font-mono font-black"
              style={{ color: "var(--asc-accent)" }}
            >
              {faceitNickname ?? "—"}
            </p>
            {faceitSkillLevel != null && (
              <p className="text-[10px]" style={{ color: "var(--asc-fg-3)" }}>
                {labels.skillLevel} {faceitSkillLevel}
                {faceitLinkedAt ? ` · ${labels.linked} ${faceitLinkedAt}` : ""}
              </p>
            )}
            {faceitSkillLevel == null && faceitLinkedAt && (
              <p className="text-[10px]" style={{ color: "var(--asc-fg-3)" }}>
                {labels.linked} {faceitLinkedAt}
              </p>
            )}
            <p
              className="mt-1 max-w-sm text-[10px] leading-4"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {labels.connectedHelp}
            </p>
          </div>
          <span
            className="asc-profile-pill border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.10em]"
            style={{
              borderColor: "var(--asc-green-border)",
              background: "var(--asc-green-bg)",
              color: "var(--asc-green)",
            }}
          >
            {labels.connected}
          </span>
          <form ref={unlinkFormRef} action={unlinkFormAction}>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmOpen(true)}
              className="asc-profile-action asc-profile-action--danger px-3 py-1 text-[10px] tracking-[0.08em] disabled:opacity-40"
            >
              {unlinkPending ? labels.unlinking : labels.unlink}
            </button>
          </form>
          <ConfirmDialogPortal
            open={confirmOpen}
            eyebrow={labels.confirmationEyebrow}
            title={labels.unlinkAccountConfirmTitle}
            description={labels.unlinkAccountConfirmDescription}
            confirmLabel={labels.unlinkAccountConfirmButton}
            cancelLabel={labels.cancel}
            pendingLabel={labels.unlinking}
            pending={unlinkPending}
            variant="danger"
            onConfirm={submitUnlink}
            onCancel={() => setConfirmOpen(false)}
          />
          {unlinkState.message && (
            <p
              className="w-full text-[10px]"
              style={{ color: unlinkState.ok ? "var(--asc-green)" : "var(--asc-live)" }}
            >
              {unlinkState.message}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-end gap-2">
          <form
            action={connectFormAction}
            className="flex flex-wrap items-center justify-end gap-2"
          >
            <input
              type="text"
              name="faceitNickname"
              required
              placeholder={labels.nicknamePlaceholder}
              disabled={connectPending}
              className="asc-profile-input px-3 py-2 text-xs font-mono disabled:opacity-50"
              style={{
                outline: "none",
                width: "min(100%, 220px)",
              }}
            />
            <button
              type="submit"
              disabled={connectPending}
              className="asc-profile-action whitespace-nowrap px-4 py-2 text-xs tracking-[0.08em] disabled:opacity-40"
            >
              {connectPending ? labels.connecting : `${labels.connect} →`}
            </button>
          </form>
          {connectState.message && (
            <p
              className="text-[10px]"
              style={{ color: connectState.ok ? "var(--asc-green)" : "var(--asc-live)" }}
            >
              {connectState.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
