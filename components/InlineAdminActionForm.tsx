"use client";

import type { ReactNode } from "react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminTeamActionResult } from "@/actions/adminTeamInlineActions";

type InlineAdminActionFormProps = {
  action: (formData: FormData) => Promise<AdminTeamActionResult>;
  children: ReactNode;
  buttonLabel: string;
  pendingLabel?: string;
  variant?: "primary" | "success" | "danger" | "secondary";
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
  textareaName?: string;
  textareaLabel?: string;
  textareaPlaceholder?: string;
  textareaRequired?: boolean;
};

function getButtonClass(variant: InlineAdminActionFormProps["variant"]) {
  if (variant === "danger") {
    return "rounded border border-red-500/25 px-4 py-2 text-sm font-black text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50";
  }

  if (variant === "success") {
    return "rounded bg-green-500 px-4 py-2 text-sm font-black text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50";
  }

  if (variant === "secondary") {
    return "rounded border border-white/10 px-4 py-2 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50";
  }

  return "rounded bg-indigo-500 px-4 py-2 text-sm font-black text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50";
}

export default function InlineAdminActionForm({
  action,
  children,
  buttonLabel,
  pendingLabel = "Working...",
  variant = "primary",
  confirmTitle,
  confirmDescription,
  confirmLabel = "Confirm",
  textareaName,
  textareaLabel,
  textareaPlaceholder,
  textareaRequired = false,
}: InlineAdminActionFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<AdminTeamActionResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [textareaValue, setTextareaValue] = useState("");

  function runAction() {
    const form = formRef.current;

    if (!form) {
      return;
    }

    if (textareaRequired && textareaName && !textareaValue.trim()) {
      setNotice({
        ok: false,
        message: "Please write a reason before confirming.",
      });

      return;
    }

    const formData = new FormData(form);

    if (textareaName) {
      formData.set(textareaName, textareaValue.trim());
    }

    startTransition(async () => {
      const result = await action(formData);

      setNotice(result);
      setConfirmOpen(false);

      if (result.redirectTo) {
        window.setTimeout(() => {
          router.push(result.redirectTo || "/admin");
        }, 350);

        return;
      }

      if (result.ok) {
        window.setTimeout(() => {
          router.refresh();
        }, 450);
      }
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (confirmTitle || confirmDescription || textareaName) {
      setConfirmOpen(true);
      return;
    }

    runAction();
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-2">
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
            className={`rounded-lg border px-3 py-2 text-xs font-bold ${
              notice.ok
                ? "border-green-500/20 bg-green-500/10 text-green-300"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {notice.message}
          </div>
        )}
      </form>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/40">
            <div className="border-b border-white/10 px-6 py-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
                Confirmation
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                {confirmTitle || "Confirm action"}
              </h2>

              {confirmDescription && (
                <p className="mt-2 leading-7 text-gray-300">
                  {confirmDescription}
                </p>
              )}

              {textareaName && (
                <label className="mt-5 grid gap-2">
                  <span className="text-sm font-bold text-gray-200">
                    {textareaLabel || "Reason"}
                  </span>

                  <textarea
                    value={textareaValue}
                    onChange={(event) => setTextareaValue(event.target.value)}
                    placeholder={textareaPlaceholder || "Write a reason..."}
                    className="min-h-28 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400"
                  />
                </label>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3 p-6">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded border border-white/10 px-5 py-3 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={pending}
                onClick={runAction}
                className={
                  variant === "danger"
                    ? "rounded bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                    : "rounded bg-indigo-500 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                }
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
