"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptProfileInvitationInline,
  rejectProfileInvitationInline,
  type ProfileInvitationActionResult,
} from "@/actions/profileInvitationInlineActions";

type ProfileInvitation = {
  id: string;
  status: string;
  createdAt: string | Date;
  team: {
    id: string;
    name: string;
    game: string;
    leader?: { username: string } | null;
  };
  invitedBy?: { username: string } | null;
};

type ProfileInvitationsPanelProps = {
  invitations?: ProfileInvitation[];
  receivedInvitations?: ProfileInvitation[];
};

function formatDate(date: string | Date) {
  return new Date(date).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
}

function ActionNotice({ result }: { result: ProfileInvitationActionResult | null }) {
  if (!result) return null;

  return (
    <div
      className="border px-4 py-3 text-sm font-bold"
      style={
        result.ok
          ? { borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" }
          : { borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" }
      }
    >
      {result.message}
    </div>
  );
}

function InvitationActionForm({
  inviteId,
  actionType,
  teamName,
}: {
  inviteId: string;
  actionType: "accept" | "reject";
  teamName: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<ProfileInvitationActionResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isReject = actionType === "reject";

  function runAction() {
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);

    startTransition(async () => {
      const result = isReject
        ? await rejectProfileInvitationInline(formData)
        : await acceptProfileInvitationInline(formData);

      setNotice(result);
      setConfirmOpen(false);

      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }

      if (result.ok) {
        window.setTimeout(() => router.refresh(), 450);
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReject) { setConfirmOpen(true); return; }
    runAction();
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-2">
        <input type="hidden" name="inviteId" value={inviteId} />

        <button
          type="submit"
          disabled={pending}
          className="border px-4 py-2 text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={
            isReject
              ? { borderColor: "oklch(0.50 0.20 25 / 0.5)", color: "var(--asc-live)", background: "transparent" }
              : { background: "oklch(0.55 0.14 150)", color: "#fff", border: "none" }
          }
        >
          {pending ? (isReject ? "Rejecting..." : "Accepting...") : isReject ? "Reject" : "Accept"}
        </button>

        <ActionNotice result={notice} />
      </form>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
          <div
            className="w-full max-w-md overflow-hidden border shadow-2xl shadow-black/40"
            style={{ borderColor: "var(--asc-line)", background: "var(--asc-bg-1)" }}
          >
            <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
              <p className="text-sm font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-accent)" }}>
                Confirmation
              </p>
              <h2 className="mt-2 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>Reject invitation?</h2>
              <p className="mt-2 leading-7" style={{ color: "var(--asc-fg-2)" }}>
                Are you sure you want to reject the invitation from {teamName}?
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-3 p-6">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="border px-5 py-3 text-sm font-black transition hover:opacity-90"
                style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-2)", background: "transparent" }}
              >
                Keep invitation
              </button>

              <button
                type="button"
                onClick={runAction}
                disabled={pending}
                className="px-5 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "oklch(0.50 0.20 25)" }}
              >
                {pending ? "Rejecting..." : "Reject invitation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProfileInvitationsPanel({ invitations, receivedInvitations }: ProfileInvitationsPanelProps) {
  const pendingInvitations = (invitations || receivedInvitations || []).filter(
    (invite) => invite.status === "pending",
  );

  return (
    <section className="overflow-hidden border shadow-2xl" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
      <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "var(--asc-table-head-bg)" }}>
        <p className="text-sm font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-accent)" }}>
          Invitations
        </p>
        <h2 className="mt-2 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>Team invitations</h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
          Accept or reject team invitations sent by team leaders.
        </p>
      </div>

      {pendingInvitations.length === 0 ? (
        <div className="p-6" style={{ color: "var(--asc-fg-2)" }}>No pending invitations.</div>
      ) : (
        <div>
          {pendingInvitations.map((invite) => (
            <article key={invite.id} className="grid gap-5 p-6" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                      {invite.team.name}
                    </h3>

                    <span
                      className="inline-flex border px-3 py-1 text-xs font-bold"
                      style={{ borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)", color: "var(--asc-blue)" }}
                    >
                      {invite.team.game}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                    <p>
                      Invited by:{" "}
                      <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>
                        {invite.invitedBy?.username || "Unknown"}
                      </span>
                    </p>
                    <p>
                      Team leader:{" "}
                      <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>
                        {invite.team.leader?.username || "Unknown"}
                      </span>
                    </p>
                    <p>
                      Sent at:{" "}
                      <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>
                        {formatDate(invite.createdAt)}
                      </span>
                    </p>
                  </div>
                </div>

                <span
                  className="w-fit border px-3 py-1 text-xs font-bold"
                  style={{ borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)", color: "var(--asc-amber)" }}
                >
                  Pending
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:max-w-sm">
                <InvitationActionForm inviteId={invite.id} actionType="accept" teamName={invite.team.name} />
                <InvitationActionForm inviteId={invite.id} actionType="reject" teamName={invite.team.name} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export { ProfileInvitationsPanel };
export default ProfileInvitationsPanel;
