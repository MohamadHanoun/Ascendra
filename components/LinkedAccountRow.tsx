"use client";

import { useActionState, useRef, useState } from "react";

import type { AccountActionResult } from "@/actions/profileAccountActions";
import ConfirmDialogPortal from "@/components/ConfirmDialogPortal";

type Props = {
  icon: string;
  title: string;
  providerName: string;
  subtitle: string;
  connected: boolean;
  displayName?: string | null;
  linkedDate?: string | null;
  connectHref: string;
  unlinkAction: (
    prevState: AccountActionResult,
    formData: FormData,
  ) => Promise<AccountActionResult>;
  labels: {
    linked: string;
    connected: string;
    connect: string;
    unlink: string;
    unlinking: string;
    confirmationEyebrow: string;
    unlinkAccountConfirmTitle: string;
    unlinkAccountConfirmDescription: string;
    unlinkAccountConfirmButton: string;
    cancel: string;
  };
};

const INITIAL: AccountActionResult = { ok: false, message: "" };

export default function LinkedAccountRow({
  icon,
  title,
  providerName,
  subtitle,
  connected,
  displayName,
  linkedDate,
  connectHref,
  unlinkAction,
  labels,
}: Props) {
  const [state, formAction, pending] = useActionState(unlinkAction, INITIAL);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [prevPending, setPrevPending] = useState(pending);
  const formRef = useRef<HTMLFormElement>(null);

  if (prevPending !== pending) {
    setPrevPending(pending);
    if (!pending) setConfirmOpen(false);
  }

  const confirmDescription = labels.unlinkAccountConfirmDescription.replace(
    "{provider}",
    providerName,
  );

  function submitUnlink() {
    formRef.current?.requestSubmit();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--asc-bg-1)] px-5 py-4">
      <div className="flex items-center gap-4">
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
          {icon}
        </div>
        <div>
          <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
            {title}
          </p>
          <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
            {subtitle}
          </p>
        </div>
      </div>

      {connected ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <p
              className="font-mono font-black"
              style={{ color: "var(--asc-accent)" }}
            >
              {displayName ?? "—"}
            </p>
            {linkedDate && (
              <p className="text-[10px]" style={{ color: "var(--asc-fg-3)" }}>
                {labels.linked} {linkedDate}
              </p>
            )}
          </div>
          <span
            className="border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.10em]"
            style={{
              borderColor: "var(--asc-green-border)",
              background: "var(--asc-green-bg)",
              color: "var(--asc-green)",
            }}
          >
            {labels.connected}
          </span>
          <form ref={formRef} action={formAction}>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmOpen(true)}
              className="border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] transition hover:opacity-80 disabled:opacity-40"
              style={{
                borderColor: "var(--asc-live-border)",
                background: "transparent",
                color: "var(--asc-live)",
              }}
            >
              {pending ? labels.unlinking : labels.unlink}
            </button>
          </form>
          <ConfirmDialogPortal
            open={confirmOpen}
            eyebrow={labels.confirmationEyebrow}
            title={labels.unlinkAccountConfirmTitle}
            description={confirmDescription}
            confirmLabel={labels.unlinkAccountConfirmButton}
            cancelLabel={labels.cancel}
            pendingLabel={labels.unlinking}
            pending={pending}
            variant="danger"
            onConfirm={submitUnlink}
            onCancel={() => setConfirmOpen(false)}
          />
          {state.message && (
            <p
              className="w-full text-[10px]"
              style={{ color: state.ok ? "var(--asc-green)" : "var(--asc-live)" }}
            >
              {state.message}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-end gap-1">
          <a
            href={connectHref}
            className="border px-4 py-2 text-xs font-black uppercase tracking-[0.08em] transition hover:opacity-80"
            style={{
              borderColor: "var(--asc-accent-border)",
              background: "var(--asc-accent-dim)",
              color: "var(--asc-accent)",
            }}
          >
            {labels.connect} →
          </a>
          {state.message && (
            <p
              className="text-[10px]"
              style={{ color: state.ok ? "var(--asc-green)" : "var(--asc-live)" }}
            >
              {state.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
