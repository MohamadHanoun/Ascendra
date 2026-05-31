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
import type { AdminRoleActionResult } from "@/actions/adminRoleInlineActions";

import ConfirmDialogPortal from "@/components/ConfirmDialogPortal";

type InlineAdminRoleFormProps = {
  action: (formData: FormData) => Promise<AdminRoleActionResult>;
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
  variant: InlineAdminRoleFormProps["variant"],
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
      color: "var(--asc-on-danger)",
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
    color: "var(--asc-on-accent)",
    boxShadow: "0 0 16px var(--asc-accent-glow)",
  };
}

export default function InlineAdminRoleForm({
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
}: InlineAdminRoleFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<AdminRoleActionResult | null>(null);
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
