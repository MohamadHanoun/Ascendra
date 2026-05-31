"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import ConfirmDialogPortal from "@/components/ConfirmDialogPortal";

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

      formData.set("id", id);

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
        disabled={isPending}
        className="w-full border px-4 py-2 font-bold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        style={{
          borderColor: "var(--asc-live-border)",
          color: "var(--asc-live)",
          background: "transparent",
          clipPath:
            "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
        }}
      >
        Delete
      </button>

      <ConfirmDialogPortal
        open={isOpen}
        eyebrow="Confirmation"
        title="Confirm delete"
        description={message}
        confirmLabel="Delete permanently"
        cancelLabel="Cancel"
        pendingLabel="Deleting..."
        pending={isPending}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
