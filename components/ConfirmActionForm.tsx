"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import ConfirmDialogPortal from "@/components/ConfirmDialogPortal";

type HiddenField = {
  name: string;
  value: string;
};

type ConfirmActionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: HiddenField[];
  buttonLabel: string;
  pendingLabel?: string;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "secondary";
};

export default function ConfirmActionForm({
  action,
  hiddenFields,
  buttonLabel,
  pendingLabel = "Working...",
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}: ConfirmActionFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const buttonStyle: React.CSSProperties =
    variant === "danger"
      ? {
          borderColor: "oklch(0.50 0.20 25 / 0.5)",
          color: "var(--asc-live)",
          background: "transparent",
        }
      : {
          borderColor: "var(--asc-line-soft)",
          color: "var(--asc-fg-2)",
          background: "transparent",
        };

  function runAction() {
    const formData = new FormData();

    hiddenFields.forEach((field) => {
      formData.set(field.name, field.value);
    });

    startTransition(async () => {
      await action(formData);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="border px-4 py-2 text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          ...buttonStyle,
          clipPath:
            "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
        }}
      >
        {buttonLabel}
      </button>

      <ConfirmDialogPortal
        open={open}
        eyebrow="Confirmation"
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        pendingLabel={pendingLabel}
        pending={pending}
        variant={variant === "danger" ? "danger" : "secondary"}
        onConfirm={runAction}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
