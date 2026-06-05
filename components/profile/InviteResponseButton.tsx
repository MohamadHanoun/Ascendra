"use client";

import { useState, useTransition } from "react";

import { respondToTeamInvite } from "@/actions/teamActions";
import ConfirmDialogPortal from "@/components/ConfirmDialogPortal";
import type { ProfileLabels } from "@/components/profile/types";

export function InviteResponseButton({
  inviteId,
  response,
  teamName,
  labels,
}: {
  inviteId: string;
  response: "accepted" | "rejected";
  teamName: string;
  labels: ProfileLabels;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isAccept = response === "accepted";

  function runAction() {
    const formData = new FormData();
    formData.set("inviteId", inviteId);
    formData.set("response", response);
    startTransition(async () => {
      await respondToTeamInvite(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className={`px-4 py-2 text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${isAccept ? "" : "border"}`}
        style={{
          ...(isAccept
            ? { background: "var(--asc-green)", color: "#fff" }
            : { borderColor: "var(--asc-live-border)", color: "var(--asc-live)", background: "transparent" }),
          clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
        }}
      >
        {isAccept ? labels.accept : labels.decline}
      </button>

      <ConfirmDialogPortal
        open={open}
        eyebrow={labels.confirmationEyebrow}
        title={isAccept ? labels.acceptTitle : labels.declineTitle}
        description={
          isAccept
            ? labels.joinTeamTemplate.replace("{team}", teamName)
            : labels.declineTeamTemplate.replace("{team}", teamName)
        }
        confirmLabel={isAccept ? labels.accept : labels.decline}
        cancelLabel={labels.cancelLabel}
        pendingLabel={isAccept ? labels.acceptingLabel : labels.decliningLabel}
        pending={pending}
        variant={isAccept ? "success" : "danger"}
        onConfirm={runAction}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
