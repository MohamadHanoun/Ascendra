import { createTeam } from "@/actions/teamActions";

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

type CreateTeamFormProps = {
  canCreateTeam: boolean;
};

export default function CreateTeamForm({ canCreateTeam }: CreateTeamFormProps) {
  if (!canCreateTeam) {
    return (
      <section className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-8">
        <h2 className="mb-3 text-3xl font-black text-yellow-300">
          Team creation locked
        </h2>

        <p className="leading-7 text-gray-300">
          Join the RTN Discord server to create teams, accept team invitations,
          and join future tournaments.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <h2 className="mb-3 text-3xl font-black">Create Team</h2>

      <p className="mb-6 max-w-2xl leading-7 text-gray-300">
        Create a draft team, choose its game, then invite players before sending
        it for admin approval.
      </p>

      <form action={createTeam} className="grid gap-4">
        <label className="grid gap-2">
          <span className="font-semibold text-gray-200">Team Name</span>

          <input
            name="name"
            required
            minLength={2}
            maxLength={40}
            placeholder="Example: RTN Wolves"
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-indigo-400"
          />
        </label>

        <label className="grid gap-2">
          <span className="font-semibold text-gray-200">Game</span>

          <select
            name="game"
            required
            defaultValue=""
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-indigo-400"
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

        <button
          type="submit"
          className="w-full rounded-xl bg-indigo-500 px-5 py-3 font-bold text-white transition hover:bg-indigo-400 sm:w-fit"
        >
          Create Draft Team
        </button>
      </form>
    </section>
  );
}
