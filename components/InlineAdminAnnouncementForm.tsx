"use client";

import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import type { AdminAnnouncementActionResult } from "@/actions/adminAnnouncementInlineActions";

import ConfirmDialogPortal from "@/components/ConfirmDialogPortal";

type InlineAdminAnnouncementFormProps = {
  action: (formData: FormData) => Promise<AdminAnnouncementActionResult>;
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

function getButtonStyle(
  variant: InlineAdminAnnouncementFormProps["variant"],
): CSSProperties {
  if (variant === "danger") {
    return {
      borderColor: "oklch(0.50 0.20 25 / 0.5)",
      color: "var(--asc-live)",
      background: "transparent",
    };
  }

  if (variant === "success") {
    return {
      background: "oklch(0.55 0.14 150)",
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

export default function InlineAdminAnnouncementForm({
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
}: InlineAdminAnnouncementFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<AdminAnnouncementActionResult | null>(
    null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isBordered = variant === "danger" || variant === "secondary";
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
        router.push(result.redirectTo);
        return;
      }

      if (result.ok) {
        if (resetOnSuccess) {
          form.reset();
        }

        window.setTimeout(() => {
          router.refresh();
        }, 450);
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (needsConfirmation) {
      setConfirmOpen(true);
      return;
    }

    runAction();
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className={className}>
        {children}

        <button
          type="submit"
          disabled={pending}
          className={`px-4 py-2 text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
            isBordered ? "border" : ""
          }`}
          style={{
            ...getButtonStyle(variant),
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
      />
    </>
  );
}
