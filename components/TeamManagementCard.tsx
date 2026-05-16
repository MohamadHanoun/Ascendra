import {
  cancelTeamInvite,
  deleteTeam,
  invitePlayerToTeam,
  removeTeamMember,
  submitTeamForReview,
  updateTeam,
} from "@/actions/teamActions";
import ConfirmDeleteForm from "@/components/ConfirmDeleteForm";

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

type TeamManagementCardProps = {
  team: {
    id: string;
    name: string;
    game: string;
    status: string;
    members: {
      id: string;
      role: string;
      user: {
        id: string;
        username: string;
        avatar: string | null;
      };
    }[];
    invites: {
      id: string;
      status: string;
      invitedUser: {
        username: string;
      };
    }[];
  };
};

function statusStyle(status: string) {
  if (status === "approved") {
    return "bg-green-500/20 text-green-300";
  }

  if (status === "pending") {
    return "bg-yellow-500/20 text-yellow-300";
  }

  if (status === "rejected") {
    return "bg-red-500/20 text-red-300";
  }

  return "bg-indigo-500/20 text-indigo-300";
}

export default function TeamManagementCard({ team }: TeamManagementCardProps) {
  const canEdit =
    team.status === "draft" ||
    team.status === "pending" ||
    team.status === "rejected";
  const pendingInvites = team.invites.filter(
    (invite) => invite.status === "pending",
  );

  return (
    <article className="rounded-3xl border border-white/10 bg-black/20 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black">{team.name}</h3>
          <p className="mt-1 text-gray-300">{team.game}</p>
        </div>

        <span
          className={`rounded-full px-4 py-1 text-sm font-bold ${statusStyle(
            team.status,
          )}`}
        >
          {team.status}
        </span>
      </div>

      <form action={updateTeam} className="grid gap-4">
        <input type="hidden" name="teamId" value={team.id} />

        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="name"
            defaultValue={team.name}
            disabled={!canEdit}
            required
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition disabled:opacity-50"
          />

          <select
            name="game"
            defaultValue={team.game}
            disabled={!canEdit}
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition disabled:opacity-50"
          >
            {games.map((game) => (
              <option key={game} value={game}>
                {game}
              </option>
            ))}
          </select>
        </div>

        {canEdit && (
          <button
            type="submit"
            className="w-full rounded-xl border border-indigo-500/20 px-4 py-3 font-bold text-indigo-300 transition hover:bg-indigo-500/10 sm:w-fit"
          >
            Save Team
          </button>
        )}
      </form>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h4 className="mb-4 text-xl font-bold">Members</h4>

        <div className="grid gap-3">
          {team.members.map((member) => (
            <div
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/20 p-4"
            >
              <div>
                <p className="font-bold">{member.user.username}</p>
                <p className="text-sm capitalize text-gray-400">
                  {member.role}
                </p>
              </div>

              {canEdit && member.role !== "leader" && (
                <form action={removeTeamMember}>
                  <input type="hidden" name="teamId" value={team.id} />
                  <input type="hidden" name="memberId" value={member.id} />

                  <button
                    type="submit"
                    className="rounded-xl border border-red-500/20 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>

      {canEdit && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h4 className="mb-4 text-xl font-bold">Invite Player</h4>

          <form action={invitePlayerToTeam} className="grid gap-3 sm:flex">
            <input type="hidden" name="teamId" value={team.id} />

            <input
              name="player"
              required
              placeholder="Discord username or Discord ID"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-gray-500"
            />

            <button
              type="submit"
              className="rounded-xl bg-indigo-500 px-5 py-3 font-bold text-white transition hover:bg-indigo-400"
            >
              Send Invite
            </button>
          </form>

          {pendingInvites.length > 0 && (
            <div className="mt-5 grid gap-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/20 p-4"
                >
                  <p className="font-semibold">
                    Pending: {invite.invitedUser.username}
                  </p>

                  <form action={cancelTeamInvite}>
                    <input type="hidden" name="inviteId" value={invite.id} />

                    <button
                      type="submit"
                      className="rounded-xl border border-red-500/20 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
        {canEdit && (
          <form action={submitTeamForReview}>
            <input type="hidden" name="teamId" value={team.id} />

            <button
              type="submit"
              className="w-full rounded-xl bg-green-500 px-5 py-3 font-bold text-white transition hover:bg-green-400 sm:w-auto"
            >
              Submit for Review
            </button>
          </form>
        )}

        {team.status !== "approved" && (
          <ConfirmDeleteForm
            id={team.id}
            action={deleteTeam}
            message="Are you sure you want to delete this team?"
          />
        )}
      </div>
    </article>
  );
}
