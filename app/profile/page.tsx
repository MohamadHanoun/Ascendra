import { respondToTeamInvite } from "@/actions/teamActions";

type TeamInvitationCardProps = {
  invite: {
    id: string;
    team: {
      name: string;
      game: string;
      status: string;
    };
    invitedBy: {
      username: string;
    };
  };
};

export default function TeamInvitationCard({
  invite,
}: TeamInvitationCardProps) {
  const teamIsLocked =
    invite.team.status === "pending" || invite.team.status === "approved";

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Team Invitation
          </p>

          <h3 className="text-2xl font-bold">{invite.team.name}</h3>

          <p className="mt-2 text-gray-300">
            {invite.team.game} • Invited by {invite.invitedBy.username}
          </p>
        </div>

        <span className="rounded-full bg-indigo-500/20 px-4 py-1 text-sm font-bold text-indigo-300">
          {invite.team.status}
        </span>
      </div>

      {teamIsLocked ? (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
          <p className="font-bold text-yellow-300">Invitation locked</p>

          <p className="mt-2 text-sm leading-6 text-gray-300">
            This team has already been submitted or approved, so this invitation
            can no longer be accepted.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:flex">
          <form action={respondToTeamInvite}>
            <input type="hidden" name="inviteId" value={invite.id} />
            <input type="hidden" name="response" value="accepted" />

            <button
              type="submit"
              className="w-full rounded-xl bg-green-500 px-5 py-3 font-bold text-white transition hover:bg-green-400 sm:w-auto"
            >
              Accept
            </button>
          </form>

          <form action={respondToTeamInvite}>
            <input type="hidden" name="inviteId" value={invite.id} />
            <input type="hidden" name="response" value="rejected" />

            <button
              type="submit"
              className="w-full rounded-xl border border-red-500/20 px-5 py-3 font-bold text-red-300 transition hover:bg-red-500/10 sm:w-auto"
            >
              Reject
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
