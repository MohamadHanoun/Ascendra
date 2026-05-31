"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import ConfirmDialogPortal from "@/components/ConfirmDialogPortal";

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

function getButtonStyle(
  variant: InlineTeamActionFormProps["variant"],
): CSSProperties {
  if (variant === "danger") {
    return {
      borderColor: "var(--asc-live-border)",
      color: "var(--asc-live)",
      background: "transparent",
    };
  }

  if (variant === "success") {
    return {
      background: "var(--asc-green)",
      color: "#fff",
    };
  }

  if (variant === "secondary") {
    return {
      borderColor: "var(--asc-line-soft)",
      color: "var(--asc-fg-2)",
      background: "transparent",
    };
  }

  return {
    background: "var(--asc-accent-2)",
    color: "#fff",
    boxShadow: "0 0 16px var(--asc-accent-glow)",
  };
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

  const isBordered = variant === "danger" || variant === "secondary";
  const buttonStyle = getButtonStyle(variant);
  const needsConfirmation = Boolean(confirmTitle || confirmDescription);

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

    if (needsConfirmation) {
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
          className={`px-4 py-2 text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
            isBordered ? "border" : ""
          }`}
          style={{
            ...buttonStyle,
            clipPath:
              "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
          }}
        >
          {pending ? pendingLabel : buttonLabel}
        </button>

        {notice && (
          <div
            className="border px-4 py-3 text-sm font-bold"
            style={
              notice.ok
                ? {
                    borderColor: "var(--asc-green-border)",
                    background: "var(--asc-green-bg)",
                    color: "var(--asc-green)",
                  }
                : {
                    borderColor: "var(--asc-live-border)",
                    background: "var(--asc-live-bg)",
                    color: "var(--asc-live)",
                  }
            }
          >
            {notice.message}
          </div>
        )}
      </form>

      <ConfirmDialogPortal
        open={confirmOpen}
        eyebrow={confirmEyebrow}
        title={confirmTitle || confirmFallbackTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        pendingLabel={pendingLabel}
        pending={pending}
        variant={variant}
        onConfirm={runAction}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
