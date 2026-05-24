"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

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

function SubmitButton({
  pendingLabel,
  confirmLabel,
  variant,
}: {
  pendingLabel?: string;
  confirmLabel: string;
  variant: "danger" | "secondary";
}) {
  const { pending } = useFormStatus();

  const style: React.CSSProperties =
    variant === "danger"
      ? { background: "oklch(0.50 0.20 25)", color: "#fff" }
      : { background: "var(--asc-accent-2)", color: "#fff" };

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-3 text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      style={style}
    >
      {pending ? pendingLabel || "Working..." : confirmLabel}
    </button>
  );
}

export default function ConfirmActionForm({
  action,
  hiddenFields,
  buttonLabel,
  pendingLabel,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}: ConfirmActionFormProps) {
  const [open, setOpen] = useState(false);

  const buttonStyle: React.CSSProperties =
    variant === "danger"
      ? { borderColor: "oklch(0.50 0.20 25 / 0.5)", color: "var(--asc-live)", background: "transparent" }
      : { borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-2)", background: "transparent" };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border px-4 py-2 text-sm font-black transition hover:opacity-90"
        style={buttonStyle}
      >
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
          <div
            className="w-full max-w-md overflow-hidden border shadow-2xl shadow-black/40"
            style={{ borderColor: "var(--asc-line)", background: "var(--asc-bg-1)" }}
          >
            <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
              <p className="text-sm font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-accent)" }}>
                Confirmation
              </p>

              <h2 className="mt-2 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{title}</h2>

              <p className="mt-2 leading-7" style={{ color: "var(--asc-fg-2)" }}>{description}</p>
            </div>

            <form action={action} className="flex flex-wrap justify-end gap-3 p-6">
              {hiddenFields.map((field) => (
                <input
                  key={`${field.name}-${field.value}`}
                  type="hidden"
                  name={field.name}
                  value={field.value}
                />
              ))}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="border px-5 py-3 text-sm font-black transition hover:opacity-90"
                style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-2)", background: "transparent" }}
              >
                {cancelLabel}
              </button>

              <SubmitButton pendingLabel={pendingLabel} confirmLabel={confirmLabel} variant={variant} />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
