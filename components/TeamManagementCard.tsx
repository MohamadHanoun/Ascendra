import {
  cancelTeamInvite,
  deleteTeam,
  invitePlayerToTeam,
  removeTeamMember,
  submitTeamForReview,
  updateTeam,
} from "@/actions/teamActions";
import ConfirmDeleteForm from "@/components/ConfirmDeleteForm";
import PlayerInviteSearch from "@/components/PlayerInviteSearch";

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

type TeamManagementCardProps = {
  team: {
    id: string;
    name: string;
    game: string;
    status: string;
    rejectionReason: string | null;
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
    return "border-green-500/20 bg-green-500/10 text-green-300";
  }

  if (status === "pending") {
    return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
  }

  if (status === "rejected") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  return "border-indigo-500/20 bg-indigo-500/10 text-indigo-300";
}

function statusLabel(status: string) {
  if (status === "approved") {
    return "Approved";
  }

  if (status === "pending") {
    return "Pending Review";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return "Draft";
}

function statusDescription(status: string) {
  if (status === "approved") {
    return "This team is approved and ready for future Ascendra tournaments.";
  }

  if (status === "pending") {
    return "This team is waiting for admin review. You can still update it before approval.";
  }

  if (status === "rejected") {
    return "This team was rejected. You can edit it and submit it again.";
  }

  return "This team is still a draft. Invite players, then submit it for review.";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function TeamManagementCard({ team }: TeamManagementCardProps) {
  const canEdit =
    team.status === "draft" ||
    team.status === "pending" ||
    team.status === "rejected";

  const canSubmit = team.status === "draft" || team.status === "rejected";
  const canDelete = team.status !== "approved";

  const pendingInvites = team.invites.filter(
    (invite) => invite.status === "pending",
  );

  const leader = team.members.find((member) => member.role === "leader");
  const regularMembers = team.members.filter(
    (member) => member.role !== "leader",
  );

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#101522]">
      <div className="border-b border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-4 py-1 text-sm font-bold ${statusStyle(
                  team.status,
                )}`}
              >
                {statusLabel(team.status)}
              </span>

              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-sm font-bold text-cyan-300">
                {team.game}
              </span>
            </div>

            <h3 className="text-3xl font-black">{team.name}</h3>

            <p className="mt-3 max-w-2xl leading-7 text-gray-300">
              {statusDescription(team.status)}
            </p>
          </div>

          <div className="grid min-w-[160px] grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-2xl font-black">{team.members.length}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-500">
                Members
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-2xl font-black">{pendingInvites.length}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-500">
                Invites
              </p>
            </div>
          </div>
        </div>
      </div>

      {team.status === "rejected" && team.rejectionReason && (
        <div className="border-b border-red-500/20 bg-red-500/10 p-6">
          <p className="mb-2 font-bold text-red-300">Team rejected</p>

          <p className="leading-7 text-gray-300">
            Reason: {team.rejectionReason}
          </p>
        </div>
      )}

      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="grid gap-6">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xl font-black">Team Settings</h4>
                <p className="mt-1 text-sm text-gray-400">
                  Update the team name or game before approval.
                </p>
              </div>
            </div>

            <form action={updateTeam} className="grid gap-4">
              <input type="hidden" name="teamId" value={team.id} />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="font-semibold text-gray-200">Team Name</span>

                  <input
                    name="name"
                    defaultValue={team.name}
                    disabled={!canEdit}
                    required
                    className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="font-semibold text-gray-200">Game</span>

                  <select
                    name="game"
                    defaultValue={team.game}
                    disabled={!canEdit}
                    className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {games.map((game) => (
                      <option key={game} value={game}>
                        {game}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {canEdit ? (
                <button
                  type="submit"
                  className="w-full rounded-xl border border-indigo-500/20 px-4 py-3 font-bold text-indigo-300 transition hover:bg-indigo-500/10 sm:w-fit"
                >
                  Save Changes
                </button>
              ) : (
                <p className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm leading-6 text-green-200">
                  Approved teams are locked for players. Contact Ascendra staff if
                  this team needs changes.
                </p>
              )}
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="mb-5">
              <h4 className="text-xl font-black">Invite Player</h4>
              <p className="mt-1 text-sm text-gray-400">
                Search for registered Ascendra players and send them a team
                invitation.
              </p>
            </div>

            {canEdit ? (
              <PlayerInviteSearch teamId={team.id} />
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-gray-300">
                Invitations are locked after team approval.
              </p>
            )}

            {pendingInvites.length > 0 && (
              <div className="mt-5 grid gap-3">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div>
                      <p className="font-semibold">
                        {invite.invitedUser.username}
                      </p>
                      <p className="mt-1 text-sm text-yellow-300">
                        Pending invitation
                      </p>
                    </div>

                    {canEdit && (
                      <form action={cancelTeamInvite}>
                        <input
                          type="hidden"
                          name="inviteId"
                          value={invite.id}
                        />

                        <button
                          type="submit"
                          className="rounded-xl border border-red-500/20 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="grid content-start gap-6">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="mb-5">
              <h4 className="text-xl font-black">Members</h4>
              <p className="mt-1 text-sm text-gray-400">
                Players currently connected to this team.
              </p>
            </div>

            <div className="grid gap-3">
              {leader && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-sm font-black text-indigo-300">
                        {getInitials(leader.user.username)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {leader.user.username}
                        </p>
                        <p className="text-sm text-indigo-300">Leader</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {regularMembers.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-gray-300">
                  No members yet. Invite players to build your team.
                </p>
              ) : (
                regularMembers.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-black text-gray-300">
                          {getInitials(member.user.username)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-bold">
                            {member.user.username}
                          </p>
                          <p className="text-sm capitalize text-gray-400">
                            {member.role}
                          </p>
                        </div>
                      </div>

                      {canEdit && (
                        <form action={removeTeamMember}>
                          <input type="hidden" name="teamId" value={team.id} />
                          <input
                            type="hidden"
                            name="memberId"
                            value={member.id}
                          />

                          <button
                            type="submit"
                            className="rounded-xl border border-red-500/20 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                          >
                            Remove
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h4 className="text-xl font-black">Actions</h4>

            <p className="mt-1 text-sm leading-6 text-gray-400">
              Submit the team when it is ready, or delete it if you no longer
              need it.
            </p>

            <div className="mt-5 grid gap-3">
              {canSubmit && (
                <form action={submitTeamForReview}>
                  <input type="hidden" name="teamId" value={team.id} />

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-green-500 px-5 py-3 font-bold text-white transition hover:bg-green-400"
                  >
                    Submit for Review
                  </button>
                </form>
              )}

              {team.status === "pending" && (
                <p className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-100">
                  This team is already waiting for admin review.
                </p>
              )}

              {canDelete && (
                <ConfirmDeleteForm
                  id={team.id}
                  action={deleteTeam}
                  message="Are you sure you want to delete this team?"
                />
              )}

              {team.status === "approved" && (
                <p className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm leading-6 text-green-100">
                  This team is approved and cannot be deleted by players.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
