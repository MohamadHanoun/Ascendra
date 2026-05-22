import { createTeam } from "@/actions/teamActions";

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

type CreateTeamFormProps = {
  canCreateTeam: boolean;
};

export default function CreateTeamForm({ canCreateTeam }: CreateTeamFormProps) {
  if (!canCreateTeam) {
    return (
      <section className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-yellow-300">
          Team Access Locked
        </p>

        <h2 className="mb-4 text-3xl font-black">Join Ascendra Discord first</h2>

        <p className="max-w-2xl leading-7 text-gray-300">
          You can login with Discord, but team creation is only available for
          members of the Ascendra Discord server.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
          Create Team
        </p>

        <h2 className="text-3xl font-black">Start a new team</h2>

        <p className="mt-4 max-w-2xl leading-7 text-gray-300">
          Your team will start as a draft. You can edit it, invite players, and
          submit it for review when it is ready.
        </p>
      </div>

      <form action={createTeam} className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="font-semibold text-gray-200">Team Name</span>

            <input
              name="name"
              required
              minLength={2}
              maxLength={40}
              placeholder="Example: Ascendra Wolves"
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400"
            />
          </label>

          <label className="grid gap-2">
            <span className="font-semibold text-gray-200">Game</span>

            <select
              name="game"
              required
              defaultValue=""
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            >
              <option value="" disabled>
                Select game
              </option>

              {games.map((game) => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="rounded-xl bg-indigo-500 px-6 py-3 font-bold text-white transition hover:-translate-y-1 hover:bg-indigo-400"
          >
            Create Draft Team
          </button>

          <p className="text-sm text-gray-400">
            You can invite players after creating the team.
          </p>
        </div>
      </form>
    </section>
  );
}
