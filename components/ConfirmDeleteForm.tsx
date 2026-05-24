"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ConfirmDeleteFormProps = {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
  message?: string;
  onDeleted?: () => void;
};

export default function ConfirmDeleteForm({
  id,
  action,
  message = "Are you sure you want to delete this item?",
  onDeleted,
}: ConfirmDeleteFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", id);
      await action(formData);
      onDeleted?.();
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full border px-4 py-2 font-bold transition hover:opacity-90 sm:w-auto"
        style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", color: "var(--asc-live)", background: "transparent" }}
      >
        Delete
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div
            className="w-full max-w-md border p-6 shadow-2xl"
            style={{ borderColor: "var(--asc-line)", background: "var(--asc-bg-1)" }}
          >
            <h2 className="mb-3 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>
              Confirm Delete
            </h2>

            <p className="mb-6 leading-7" style={{ color: "var(--asc-fg-2)" }}>{message}</p>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="border px-5 py-3 font-bold transition hover:opacity-90 disabled:opacity-50"
                style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-2)", background: "transparent" }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "oklch(0.50 0.20 25)" }}
              >
                {isPending ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
