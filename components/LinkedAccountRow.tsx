"use client";

import { useActionState } from "react";

import type { AccountActionResult } from "@/actions/profileAccountActions";

type Props = {
  icon: string;
  title: string;
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
  };
};

const INITIAL: AccountActionResult = { ok: false, message: "" };

export default function LinkedAccountRow({
  icon,
  title,
  subtitle,
  connected,
  displayName,
  linkedDate,
  connectHref,
  unlinkAction,
  labels,
}: Props) {
  const [state, formAction, pending] = useActionState(unlinkAction, INITIAL);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--asc-bg-1)] px-5 py-4">
      <div className="flex items-center gap-4">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center border text-xs font-black"
          style={{
            borderColor: connected
              ? "oklch(0.55 0.14 150 / 0.5)"
              : "var(--asc-line-soft)",
            background: connected
              ? "oklch(0.25 0.12 150 / 0.18)"
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
              borderColor: "oklch(0.55 0.14 150 / 0.5)",
              background: "oklch(0.25 0.12 150 / 0.18)",
              color: "var(--asc-green)",
            }}
          >
            {labels.connected}
          </span>
          <form action={formAction}>
            <button
              type="submit"
              disabled={pending}
              className="border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] transition hover:opacity-80 disabled:opacity-40"
              style={{
                borderColor: "oklch(0.50 0.20 25 / 0.4)",
                background: "transparent",
                color: "var(--asc-live)",
              }}
            >
              {pending ? labels.unlinking : labels.unlink}
            </button>
          </form>
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
              borderColor: "oklch(0.50 0.20 285 / 0.4)",
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
