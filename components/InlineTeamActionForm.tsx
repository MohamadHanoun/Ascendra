"use client";

import type { ReactNode } from "react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type InlineActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

type InlineTeamActionFormProps = {
  action: (formData: FormData) => Promise<InlineActionResult>;
  children: ReactNode;
  buttonLabel: string;
  pendingLabel?: string;
  variant?: "primary" | "success" | "danger" | "secondary";
  confirmEyebrow?: string;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
  confirmFallbackTitle?: string;
  cancelLabel?: string;
};

function getButtonClass(variant: InlineTeamActionFormProps["variant"]) {
  if (variant === "danger") {
    return "rounded-xl border border-red-500/25 px-4 py-2 text-sm font-black text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50";
  }

  if (variant === "success") {
    return "rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50";
  }

  if (variant === "secondary") {
    return "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50";
  }

  return "rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50";
}

function getConfirmButtonClass(variant: InlineTeamActionFormProps["variant"]) {
  if (variant === "danger") {
    return "rounded-xl bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50";
  }

  if (variant === "success") {
    return "rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50";
  }

  return "rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50";
}

export default function InlineTeamActionForm({
  action,
  children,
  buttonLabel,
  pendingLabel = "Working...",
  variant = "primary",
  confirmEyebrow = "Confirmation",
  confirmTitle,
  confirmDescription,
  confirmLabel = "Confirm",
  confirmFallbackTitle = "Confirm action",
  cancelLabel = "Cancel",
}: InlineTeamActionFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<InlineActionResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function runAction() {
    const form = formRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);

    startTransition(async () => {
      const result = await action(formData);

      setNotice(result);
      setConfirmOpen(false);

      if (result.redirectTo) {
        window.setTimeout(() => {
          router.push(result.redirectTo || "/profile");
        }, 350);

        return;
      }

      if (result.ok) {
        window.setTimeout(() => {
          router.refresh();
        }, 500);
      }
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (confirmTitle || confirmDescription) {
      setConfirmOpen(true);
      return;
    }

    runAction();
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
        {children}

        <button
          type="submit"
          disabled={pending}
          className={getButtonClass(variant)}
        >
          {pending ? pendingLabel : buttonLabel}
        </button>

        {notice && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
              notice.ok
                ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                : "border-red-400/25 bg-red-500/10 text-red-300"
            }`}
          >
            {notice.message}
          </div>
        )}
      </form>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#11121d] shadow-2xl shadow-black/40">
            <div className="border-b border-white/10 px-6 py-5">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-300">
                {confirmEyebrow}
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                {confirmTitle || confirmFallbackTitle}
              </h2>

              {confirmDescription && (
                <p className="mt-2 leading-7 text-gray-300">
                  {confirmDescription}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3 p-6">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                disabled={pending}
                onClick={runAction}
                className={getConfirmButtonClass(variant)}
              >
                {pending ? pendingLabel : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
