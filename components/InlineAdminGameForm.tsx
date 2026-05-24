"use client";

import { type FormEvent, type ReactNode, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminGameActionResult } from "@/actions/adminGameInlineActions";

type InlineAdminGameFormProps = {
  action: (formData: FormData) => Promise<AdminGameActionResult>;
  children: ReactNode;
  buttonLabel: string;
  pendingLabel?: string;
  variant?: "primary" | "success" | "danger" | "secondary";
  className?: string;
  resetOnSuccess?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
};

function getButtonStyle(variant: InlineAdminGameFormProps["variant"]): React.CSSProperties {
  if (variant === "danger") return { borderColor: "oklch(0.50 0.20 25 / 0.5)", color: "var(--asc-live)", background: "transparent" };
  if (variant === "success") return { background: "oklch(0.55 0.14 150)", color: "#fff" };
  if (variant === "secondary") return { borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-2)", background: "transparent" };
  return { background: "var(--asc-accent-2)", color: "#fff", boxShadow: "0 0 16px var(--asc-accent-glow)" };
}

function getConfirmButtonStyle(variant: InlineAdminGameFormProps["variant"]): React.CSSProperties {
  if (variant === "danger") return { background: "oklch(0.50 0.20 25)", color: "#fff" };
  if (variant === "success") return { background: "oklch(0.55 0.14 150)", color: "#fff" };
  return { background: "var(--asc-accent-2)", color: "#fff" };
}

export default function InlineAdminGameForm({
  action,
  children,
  buttonLabel,
  pendingLabel = "Working...",
  variant = "primary",
  className = "grid gap-4",
  resetOnSuccess = false,
  confirmTitle,
  confirmDescription,
  confirmLabel = "Confirm",
}: InlineAdminGameFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<AdminGameActionResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isBordered = variant === "danger" || variant === "secondary";

  function runAction() {
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await action(formData);
      setNotice(result);
      setConfirmOpen(false);
      if (result.redirectTo) { router.push(result.redirectTo); return; }
      if (result.ok) {
        if (resetOnSuccess) form.reset();
        window.setTimeout(() => router.refresh(), 450);
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmTitle || confirmDescription) { setConfirmOpen(true); return; }
    runAction();
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className={className}>
        {children}
        <button type="submit" disabled={pending} className={`px-4 py-2 text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${isBordered ? "border" : ""}`} style={getButtonStyle(variant)}>
          {pending ? pendingLabel : buttonLabel}
        </button>
        {notice && (
          <div className="border px-4 py-3 text-sm font-bold" style={notice.ok ? { borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" } : { borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" }}>
            {notice.message}
          </div>
        )}
      </form>
      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden border shadow-2xl shadow-black/40" style={{ borderColor: "var(--asc-line)", background: "var(--asc-bg-1)" }}>
            <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
              <p className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Confirmation</p>
              <h2 className="mt-2 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{confirmTitle || "Confirm action"}</h2>
              {confirmDescription && <p className="mt-2 leading-7" style={{ color: "var(--asc-fg-2)" }}>{confirmDescription}</p>}
            </div>
            <div className="flex flex-wrap justify-end gap-3 p-6">
              <button type="button" onClick={() => setConfirmOpen(false)} className="border px-5 py-3 text-sm font-black transition hover:opacity-90" style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-2)", background: "transparent" }}>Cancel</button>
              <button type="button" onClick={runAction} disabled={pending} className="px-5 py-3 text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" style={getConfirmButtonStyle(variant)}>{pending ? pendingLabel : confirmLabel}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
