import { respondToTeamInvite } from "@/actions/teamActions";

type TeamInvitationCardProps = {
  invite: {
    id: string;
    team: {
      name: string;
      game: string;
    };
    invitedBy: {
      username: string;
    };
  };
};

export default function TeamInvitationCard({
  invite,
}: TeamInvitationCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <h3 className="text-2xl font-bold">{invite.team.name}</h3>

      <p className="mt-2 text-gray-300">
        {invite.team.game} • Invited by {invite.invitedBy.username}
      </p>

      <div className="mt-5 grid gap-3 sm:flex">
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
    </article>
  );
}
