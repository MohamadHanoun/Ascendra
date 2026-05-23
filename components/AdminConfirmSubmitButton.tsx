"use client";

import { useState, useTransition } from "react";

type AdminConfirmSubmitButtonProps = {
  label: string;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  className?: string;
};

export default function AdminConfirmSubmitButton({
  label,
  confirmTitle,
  confirmDescription,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  className,
}: AdminConfirmSubmitButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirmSubmit() {
    const button = document.activeElement as HTMLButtonElement | null;
    const form = button?.form;

    setOpen(false);

    if (!form) {
      return;
    }

    startTransition(() => {
      form.requestSubmit();
    });
  }

  const defaultClass = danger
    ? "rounded-2xl border border-red-400/25 bg-red-500/10 px-5 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    : "rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setOpen(true)}
        className={className || defaultClass}
      >
        {isPending ? "Working..." : label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11121d] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-2xl font-black text-white">{confirmTitle}</h2>

            <p className="mt-3 text-sm leading-7 text-gray-300">
              {confirmDescription}
            </p>

            <div className="mt-6 grid gap-3 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={confirmSubmit}
                className={
                  danger
                    ? "rounded-xl bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:bg-red-400"
                    : "rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-500"
                }
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
