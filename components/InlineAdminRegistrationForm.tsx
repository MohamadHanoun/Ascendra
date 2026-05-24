"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminRegistrationActionResult } from "@/actions/adminRegistrationInlineActions";

import ConfirmDialogPortal from "@/components/ConfirmDialogPortal";

type InlineAdminRegistrationFormProps = {
  action: (formData: FormData) => Promise<AdminRegistrationActionResult>;
  children: ReactNode;
  buttonLabel: string;
  pendingLabel?: string;
  variant?: "success" | "danger" | "secondary";
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
  textareaName?: string;
  textareaLabel?: string;
  textareaPlaceholder?: string;
  textareaRequired?: boolean;
};

function getButtonStyle(
  variant: InlineAdminRegistrationFormProps["variant"],
): CSSProperties {
  if (variant === "success") {
    return {
      background: "oklch(0.55 0.14 150)",
      color: "#fff",
    };
  }

  if (variant === "danger") {
    return {
      borderColor: "oklch(0.50 0.20 25 / 0.5)",
      color: "var(--asc-live)",
      background: "transparent",
    };
  }

  return {
    borderColor: "var(--asc-line-soft)",
    color: "var(--asc-fg-2)",
    background: "transparent",
  };
}

export default function InlineAdminRegistrationForm({
  action,
  children,
  buttonLabel,
  pendingLabel = "Working...",
  variant = "secondary",
  confirmTitle,
  confirmDescription,
  confirmLabel = "Confirm",
  textareaName,
  textareaLabel,
  textareaPlaceholder,
  textareaRequired = false,
}: InlineAdminRegistrationFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<AdminRegistrationActionResult | null>(
    null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [textareaValue, setTextareaValue] = useState("");

  const buttonStyle = getButtonStyle(variant);
  const isBordered = variant === "danger" || variant === "secondary";
  const needsConfirmation = Boolean(
    confirmTitle || confirmDescription || textareaName,
  );

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

    if (needsConfirmation) {
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
            className="border px-3 py-2 text-xs font-bold"
            style={
              notice.ok
                ? {
                    borderColor: "oklch(0.55 0.14 150 / 0.5)",
                    background: "oklch(0.25 0.12 150 / 0.18)",
                    color: "var(--asc-green)",
                  }
                : {
                    borderColor: "oklch(0.50 0.20 25 / 0.5)",
                    background: "oklch(0.25 0.18 25 / 0.18)",
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
        eyebrow="Confirmation"
        title={confirmTitle || "Confirm action"}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        cancelLabel="Cancel"
        pendingLabel={pendingLabel}
        pending={pending}
        variant={variant}
        onConfirm={runAction}
        onCancel={() => setConfirmOpen(false)}
      >
        {textareaName && (
          <label className="mt-5 grid gap-2">
            <span
              className="text-sm font-bold"
              style={{ color: "var(--asc-fg-1)" }}
            >
              {textareaLabel || "Reason"}
            </span>

            <textarea
              value={textareaValue}
              onChange={(event) => setTextareaValue(event.target.value)}
              placeholder={textareaPlaceholder || "Write a reason..."}
              className="min-h-28 border px-4 py-3 outline-none transition"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-2)",
                color: "var(--asc-fg-0)",
                clipPath:
                  "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
              }}
            />
          </label>
        )}
      </ConfirmDialogPortal>
    </>
  );
}
