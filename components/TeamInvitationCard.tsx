import { respondToTeamInvite } from "@/actions/teamActions";

type TeamInvitationCardProps = {
  invite: {
    id: string;
    team?: {
      name: string;
      game: string;
      status: string;
    } | null;
    invitedBy?: {
      username: string;
    } | null;
  };
};

export default function TeamInvitationCard({ invite }: TeamInvitationCardProps) {
  if (!invite.team) {
    return (
      <article
        className="asc-card border p-5"
        style={{ borderColor: "var(--asc-live-border)", background: "oklch(0.25 0.18 25 / 0.10)" }}
      >
        <h3 className="text-xl font-bold" style={{ color: "var(--asc-live)" }}>
          Invitation unavailable
        </h3>
        <p className="mt-2 leading-7" style={{ color: "var(--asc-fg-2)" }}>
          This invitation is missing team information. It may belong to a deleted team.
        </p>
      </article>
    );
  }

  const isLocked = invite.team.status === "pending" || invite.team.status === "approved";

  return (
    <article className="asc-card border p-5" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-sm font-black uppercase tracking-[0.2em]" style={{ color: "var(--asc-accent)" }}>
            Team Invitation
          </p>

          <h3 className="text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{invite.team.name}</h3>

          <p className="mt-2" style={{ color: "var(--asc-fg-2)" }}>
            {invite.team.game} · Invited by {invite.invitedBy?.username || "Unknown player"}
          </p>
        </div>

        <span
          className="inline-flex border px-4 py-1 text-sm font-bold"
          style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
        >
          {invite.team.status}
        </span>
      </div>

      {isLocked ? (
        <div
          className="border p-4"
          style={{ borderColor: "oklch(0.65 0.16 75 / 0.4)", background: "oklch(0.25 0.14 75 / 0.12)" }}
        >
          <p className="font-bold" style={{ color: "var(--asc-amber)" }}>Invitation locked</p>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-2)" }}>
            This team has already been submitted or approved, so this invitation can no longer be accepted.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:flex">
          <form action={respondToTeamInvite}>
            <input type="hidden" name="inviteId" value={invite.id} />
            <input type="hidden" name="response" value="accepted" />
            <button
              type="submit"
              className="w-full px-5 py-3 font-bold text-white transition hover:opacity-90 sm:w-auto"
              style={{ background: "var(--asc-green)" }}
            >
              Accept
            </button>
          </form>

          <form action={respondToTeamInvite}>
            <input type="hidden" name="inviteId" value={invite.id} />
            <input type="hidden" name="response" value="rejected" />
            <button
              type="submit"
              className="w-full border px-5 py-3 font-bold transition hover:opacity-90 sm:w-auto"
              style={{ borderColor: "var(--asc-live-border)", color: "var(--asc-live)", background: "transparent" }}
            >
              Reject
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
