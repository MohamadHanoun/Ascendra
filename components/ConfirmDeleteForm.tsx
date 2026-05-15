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
        className="rounded-xl border border-red-500/20 px-4 py-2 font-bold text-red-300 transition hover:bg-red-500/10"
      >
        Delete
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
            <h2 className="mb-3 text-2xl font-black text-white">
              Confirm Delete
            </h2>

            <p className="mb-6 leading-7 text-gray-300">{message}</p>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="rounded-xl border border-white/10 px-5 py-3 font-bold text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
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