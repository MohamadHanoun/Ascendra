import { createTeam } from "@/actions/teamActions";

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

type CreateTeamFormProps = {
  canCreateTeam: boolean;
};

export default function CreateTeamForm({ canCreateTeam }: CreateTeamFormProps) {
  if (!canCreateTeam) {
    return (
      <section
        className="asc-card border p-8"
        style={{ borderColor: "oklch(0.65 0.16 75 / 0.4)", background: "oklch(0.25 0.14 75 / 0.08)" }}
      >
        <p className="mb-3 text-sm font-black uppercase tracking-[0.25em]" style={{ color: "var(--asc-amber)" }}>
          Team Access Locked
        </p>

        <h2 className="mb-4 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>Join Ascendra Discord first</h2>

        <p className="max-w-2xl leading-7" style={{ color: "var(--asc-fg-2)" }}>
          You can login with Discord, but team creation is only available for members of the Ascendra Discord server.
        </p>
      </section>
    );
  }

  return (
    <section className="asc-card border p-8" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
      <div className="mb-8">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.25em]" style={{ color: "var(--asc-accent)" }}>
          Create Team
        </p>

        <h2 className="text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>Start a new team</h2>

        <p className="mt-4 max-w-2xl leading-7" style={{ color: "var(--asc-fg-2)" }}>
          Your team will start as a draft. You can edit it, invite players, and submit it for review when it is ready.
        </p>
      </div>

      <form action={createTeam} className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
              Team Name
            </span>

            <input
              name="name"
              required
              minLength={2}
              maxLength={40}
              placeholder="Example: Ascendra Wolves"
              className="border px-4 py-3 text-white outline-none transition"
              style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
              Game
            </span>

            <select
              name="game"
              required
              defaultValue=""
              className="border px-4 py-3 text-white outline-none transition"
              style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
            >
              <option value="" disabled>Select game</option>

              {games.map((game) => (
                <option key={game} value={game}>{game}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="px-6 py-3 font-bold text-white transition hover:opacity-90"
            style={{ background: "var(--asc-accent-2)" }}
          >
            Create Draft Team
          </button>

          <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
            You can invite players after creating the team.
          </p>
        </div>
      </form>
    </section>
  );
}
