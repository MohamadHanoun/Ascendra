"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptProfileInvitationInline,
  rejectProfileInvitationInline,
  type ProfileInvitationActionResult,
} from "@/actions/profileInvitationInlineActions";
import type { Locale } from "@/lib/i18n";

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

type InvitationsPanelLabels = {
  eyebrow: string;
  title: string;
  description: string;
  noPending: string;
  invitedBy: string;
  teamLeader: string;
  sentAt: string;
  pending: string;
  accept: string;
  reject: string;
  accepting: string;
  rejecting: string;
  confirmEyebrow: string;
  confirmTitle: string;
  /** Use {team} as placeholder for the team name */
  confirmBody: string;
  keepButton: string;
  rejectButton: string;
};

const panelMessages: Record<Locale, InvitationsPanelLabels> = {
  en: {
    eyebrow: "Invitations",
    title: "Team invitations",
    description: "Accept or reject team invitations sent by team leaders.",
    noPending: "No pending invitations.",
    invitedBy: "Invited by:",
    teamLeader: "Team leader:",
    sentAt: "Sent at:",
    pending: "Pending",
    accept: "Accept",
    reject: "Reject",
    accepting: "Accepting...",
    rejecting: "Rejecting...",
    confirmEyebrow: "Confirmation",
    confirmTitle: "Reject invitation?",
    confirmBody: "Are you sure you want to reject the invitation from {team}?",
    keepButton: "Keep invitation",
    rejectButton: "Reject invitation",
  },
  ar: {
    eyebrow: "الدعوات",
    title: "دعوات الفريق",
    description: "اقبل أو ارفض دعوات الفريق المرسلة من قادة الفرق.",
    noPending: "لا توجد دعوات معلقة.",
    invitedBy: "دعوة من:",
    teamLeader: "قائد الفريق:",
    sentAt: "أُرسلت في:",
    pending: "معلقة",
    accept: "قبول",
    reject: "رفض",
    accepting: "جارٍ القبول...",
    rejecting: "جارٍ الرفض...",
    confirmEyebrow: "تأكيد",
    confirmTitle: "رفض الدعوة؟",
    confirmBody: "هل أنت متأكد من رفض الدعوة من {team}؟",
    keepButton: "الاحتفاظ بالدعوة",
    rejectButton: "رفض الدعوة",
  },
};

type ProfileInvitationsPanelProps = {
  invitations?: ProfileInvitation[];
  receivedInvitations?: ProfileInvitation[];
  locale?: Locale;
};

function formatDate(date: string | Date, locale: Locale = "en") {
  return new Date(date).toLocaleString(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ActionNotice({ result }: { result: ProfileInvitationActionResult | null }) {
  if (!result) return null;

  return (
    <div
      className="border px-4 py-3 text-sm font-bold"
      style={
        result.ok
          ? { borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }
          : { borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)", color: "var(--asc-live)" }
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
  labels,
}: {
  inviteId: string;
  actionType: "accept" | "reject";
  teamName: string;
  labels: InvitationsPanelLabels;
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
              ? { borderColor: "var(--asc-live-border)", color: "var(--asc-live)", background: "transparent" }
              : { background: "var(--asc-green)", color: "#fff", border: "none" }
          }
        >
          {pending
            ? isReject ? labels.rejecting : labels.accepting
            : isReject ? labels.reject : labels.accept}
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
                {labels.confirmEyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                {labels.confirmTitle}
              </h2>
              <p className="mt-2 leading-7" style={{ color: "var(--asc-fg-2)" }}>
                {labels.confirmBody.replace("{team}", teamName)}
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-3 p-6">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="border px-5 py-3 text-sm font-black transition hover:opacity-90"
                style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-2)", background: "transparent" }}
              >
                {labels.keepButton}
              </button>

              <button
                type="button"
                onClick={runAction}
                disabled={pending}
                className="px-5 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "var(--asc-live)" }}
              >
                {pending ? labels.rejecting : labels.rejectButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProfileInvitationsPanel({ invitations, receivedInvitations, locale = "en" }: ProfileInvitationsPanelProps) {
  const labels = panelMessages[locale];
  const pendingInvitations = (invitations || receivedInvitations || []).filter(
    (invite) => invite.status === "pending",
  );

  return (
    <section className="overflow-hidden border shadow-2xl" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
      <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "var(--asc-table-head-bg)" }}>
        <p className="text-sm font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-accent)" }}>
          {labels.eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{labels.title}</h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
          {labels.description}
        </p>
      </div>

      {pendingInvitations.length === 0 ? (
        <div className="p-6" style={{ color: "var(--asc-fg-2)" }}>{labels.noPending}</div>
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
                      style={{ borderColor: "var(--asc-blue-border)", background: "var(--asc-blue-bg)", color: "var(--asc-blue)" }}
                    >
                      {invite.team.game}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                    <p>
                      {labels.invitedBy}{" "}
                      <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>
                        {invite.invitedBy?.username || "Unknown"}
                      </span>
                    </p>
                    <p>
                      {labels.teamLeader}{" "}
                      <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>
                        {invite.team.leader?.username || "Unknown"}
                      </span>
                    </p>
                    <p>
                      {labels.sentAt}{" "}
                      <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>
                        {formatDate(invite.createdAt, locale)}
                      </span>
                    </p>
                  </div>
                </div>

                <span
                  className="w-fit border px-3 py-1 text-xs font-bold"
                  style={{ borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)", color: "var(--asc-amber)" }}
                >
                  {labels.pending}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:max-w-sm">
                <InvitationActionForm inviteId={invite.id} actionType="accept" teamName={invite.team.name} labels={labels} />
                <InvitationActionForm inviteId={invite.id} actionType="reject" teamName={invite.team.name} labels={labels} />
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
