"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ConfirmDialogPortalProps = {
  open: boolean;
  eyebrow?: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  variant?: "primary" | "success" | "danger" | "secondary";
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

const panelClip =
  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";

function getConfirmButtonStyle(
  variant: ConfirmDialogPortalProps["variant"],
): CSSProperties {
  if (variant === "danger") {
    return {
      background: "var(--asc-live)",
      color: "var(--asc-on-danger)",
      boxShadow: "0 0 18px var(--asc-live-border)",
    };
  }

  if (variant === "success") {
    return {
      background: "var(--asc-green)",
      color: "var(--asc-on-danger)",
      boxShadow: "0 0 18px var(--asc-green-border)",
    };
  }

  return {
    background: "var(--asc-accent-2)",
    color: "var(--asc-on-accent)",
    boxShadow: "0 0 18px var(--asc-accent-glow)",
  };
}

export default function ConfirmDialogPortal({
  open,
  eyebrow = "Confirmation",
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  pendingLabel = "Working...",
  pending = false,
  variant = "primary",
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, pending, onCancel]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 grid place-items-center px-4 py-8"
      style={{
        zIndex: 9999,
        background:
          "radial-gradient(circle at 50% 35%, var(--asc-accent-glow), transparent 38%), var(--asc-modal-backdrop)",
        backdropFilter: "blur(14px)",
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onCancel();
        }
      }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden border shadow-2xl shadow-black/60"
        style={{
          borderColor: "var(--asc-line)",
          background:
            "linear-gradient(180deg, var(--asc-bg-2), var(--asc-bg-1))",
          clipPath: panelClip,
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span
          aria-hidden="true"
          className="asc-corner-mark"
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 12,
            height: 12,
            borderTop: "1.5px solid var(--asc-accent)",
            borderLeft: "1.5px solid var(--asc-accent)",
            opacity: 0.9,
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        <div
          className="px-6 py-5"
          style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
        >
          <p
            className="text-sm font-black uppercase tracking-[0.16em]"
            style={{ color: "var(--asc-accent)" }}
          >
            {eyebrow}
          </p>

          <h2
            className="mt-2 text-2xl font-black uppercase"
            style={{
              color: "var(--asc-fg-0)",
              fontFamily: "var(--font-display, sans-serif)",
              letterSpacing: "0.03em",
            }}
          >
            {title}
          </h2>

          {description && (
            <p className="mt-2 leading-7" style={{ color: "var(--asc-fg-2)" }}>
              {description}
            </p>
          )}

          {children}
        </div>

        <div className="flex flex-wrap justify-end gap-3 p-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="border px-5 py-3 text-sm font-black uppercase tracking-[0.08em] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: "var(--asc-line-soft)",
              color: "var(--asc-fg-2)",
              background: "transparent",
              clipPath:
                "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
            }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="px-5 py-3 text-sm font-black uppercase tracking-[0.08em] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              ...getConfirmButtonStyle(variant),
              clipPath:
                "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
            }}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
