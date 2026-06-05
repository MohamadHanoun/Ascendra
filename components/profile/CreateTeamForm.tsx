"use client";

import { useRef, useState, useTransition } from "react";

import { createTeam } from "@/actions/teamActions";
import CustomSelect from "@/components/CustomSelect";
import ConfirmDialogPortal from "@/components/ConfirmDialogPortal";
import type { Game, ProfileLabels } from "@/components/profile/types";

export function CreateTeamForm({
  dbGames,
  labels,
}: {
  dbGames: Game[];
  labels: ProfileLabels;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpen(true);
  }

  function runAction() {
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    startTransition(async () => {
      await createTeam(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-5 p-5">
        <div className="relative z-50 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
              {labels.teamName}
            </span>
            <input
              name="name"
              required
              placeholder={labels.teamNamePlaceholder}
              className="border px-4 py-3 outline-none transition"
              style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-0)" }}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
              {labels.game}
            </span>
            <CustomSelect
              name="gameSlug"
              required
              placeholder={labels.selectGame}
              options={dbGames.map((game) => ({
                value: game.slug,
                label: game.name,
                description: labels.teamGame,
              }))}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-fit px-5 py-3 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--asc-accent-2)",
            boxShadow: "0 0 20px var(--asc-accent-glow)",
            clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
          }}
        >
          {pending ? labels.creatingLabel : labels.createTeam}
        </button>
      </form>

      <ConfirmDialogPortal
        open={open}
        eyebrow={labels.confirmationEyebrow}
        title={labels.createTeamDialogTitle}
        description={labels.createTeamDialogDesc}
        confirmLabel={labels.createTeam}
        cancelLabel={labels.cancelLabel}
        pendingLabel={labels.creatingLabel}
        pending={pending}
        variant="primary"
        onConfirm={runAction}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
