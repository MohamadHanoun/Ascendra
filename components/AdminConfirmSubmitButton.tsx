"use client";

import { useRef, useState } from "react";

type AdminConfirmSubmitButtonProps = {
  label: string;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export default function AdminConfirmSubmitButton({
  label,
  confirmTitle,
  confirmDescription,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  disabled = false,
  className,
  style,
}: AdminConfirmSubmitButtonProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openConfirm(event: React.MouseEvent<HTMLButtonElement>) {
    formRef.current = event.currentTarget.form;
    setOpen(true);
  }

  function closeConfirm() {
    if (isSubmitting) return;
    setOpen(false);
  }

  function confirmSubmit() {
    if (!formRef.current) {
      setOpen(false);
      return;
    }

    setIsSubmitting(true);
    setOpen(false);
    formRef.current.requestSubmit();
  }

  const defaultStyle: React.CSSProperties = danger
    ? { borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)", color: "var(--asc-live)" }
    : { background: "var(--asc-accent-2)", color: "var(--asc-on-accent)", boxShadow: "0 0 20px var(--asc-accent-glow)" };

  const confirmBtnStyle: React.CSSProperties = danger
    ? { background: "var(--asc-live)", color: "var(--asc-on-danger)" }
    : { background: "var(--asc-accent-2)", color: "var(--asc-on-accent)" };

  return (
    <>
      <button
        type="button"
        disabled={disabled || isSubmitting}
        onClick={openConfirm}
        className={className || (danger ? "border px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60" : "px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60")}
        style={style ?? (className ? undefined : defaultStyle)}
      >
        {isSubmitting ? "Working..." : label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-6" style={{ background: "var(--asc-modal-backdrop)" }}>
          <div className="w-full max-w-md border p-6 shadow-2xl shadow-black/40" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
            <h2 className="text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{confirmTitle}</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--asc-fg-3)" }}>{confirmDescription}</p>

            <div className="mt-6 grid gap-3 sm:flex sm:justify-end">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={closeConfirm}
                className="border px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-3)", background: "transparent" }}
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={confirmSubmit}
                className="px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60"
                style={confirmBtnStyle}
              >
                {isSubmitting ? "Working..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
