import { createTournament } from "@/actions/tournamentActions";

export default function AdminTournamentForm() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">
        <div className="mb-8">
          <h2 className="mb-3 text-3xl font-black">Create Tournament</h2>
        </div>

        <form action={createTournament} className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="font-semibold text-gray-200">Title</span>
              <input
                name="title"
                required
                placeholder="Example: RTN Community Cup"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="font-semibold text-gray-200">Game</span>
              <input
                name="game"
                required
                placeholder="Example: Valorant, League of Legends, Multi-Game"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400"
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="font-semibold text-gray-200">Date</span>
              <input
                name="date"
                required
                placeholder="Example: Coming soon"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="font-semibold text-gray-200">Prize</span>
              <input
                name="prize"
                required
                placeholder="Example: Community rewards"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="font-semibold text-gray-200">Max Slots</span>
              <input
                name="maxSlots"
                type="number"
                min="1"
                defaultValue="16"
                required
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="font-semibold text-gray-200">Status</span>
            <select
              name="status"
              defaultValue="upcoming"
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            >
              <option value="open">Open</option>
              <option value="upcoming">Upcoming</option>
              <option value="closed">Closed</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="font-semibold text-gray-200">Description</span>
            <textarea
              name="description"
              required
              rows={5}
              placeholder="Write the tournament details here..."
              className="resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400"
            />
          </label>

          <button
            type="submit"
            className="w-fit rounded-xl bg-cyan-500 px-7 py-4 font-bold text-black transition hover:-translate-y-1 hover:bg-cyan-400"
          >
            Create Tournament
          </button>
        </form>
      </div>
    </section>
  );
}