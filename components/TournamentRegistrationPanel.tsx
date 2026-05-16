import {
  cancelTournamentRegistration,
  registerTeamForTournament,
} from "@/actions/tournamentRegistrationActions";
import Link from "next/link";

type TeamOption = {
  id: string;
  name: string;
  game: string;
  memberCount: number;
};

type ActiveRegistration = {
  id: string;
  status: string;
  teamName: string;
};

type TournamentRegistrationPanelProps = {
  tournamentId: string;
  tournamentStatus: string;
  registrationStatus: string;
  slotsRemaining: number;
  teamSize: number;
  isLoggedIn: boolean;
  isGuildMember: boolean;
  availableTeams: TeamOption[];
  activeRegistrations: ActiveRegistration[];
};

export default function TournamentRegistrationPanel({
  tournamentId,
  tournamentStatus,
  registrationStatus,
  slotsRemaining,
  teamSize,
  isLoggedIn,
  isGuildMember,
  availableTeams,
  activeRegistrations,
}: TournamentRegistrationPanelProps) {
  const registrationIsOpen =
    tournamentStatus === "open" && registrationStatus === "open";

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="font-bold text-gray-200">Login required</p>

        <p className="mt-2 text-sm leading-6 text-gray-400">
          Login with Discord to register an approved team for this tournament.
        </p>

        <Link
          href="/login"
          className="mt-4 inline-flex rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-400"
        >
          Login with Discord
        </Link>
      </div>
    );
  }

  if (!isGuildMember) {
    return (
      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
        <p className="font-bold text-yellow-300">RTN Discord required</p>

        <p className="mt-2 text-sm leading-6 text-gray-300">
          You can view tournaments, but you must be a member of the RTN Discord
          server to register teams.
        </p>
      </div>
    );
  }

  if (!registrationIsOpen) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="font-bold text-gray-300">Registration is closed</p>

        <p className="mt-2 text-sm leading-6 text-gray-400">
          This tournament is not currently accepting team registrations.
        </p>
      </div>
    );
  }

  if (slotsRemaining <= 0) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
        <p className="font-bold text-red-300">Tournament is full</p>

        <p className="mt-2 text-sm leading-6 text-gray-300">
          There are no available slots left for this tournament.
        </p>
      </div>
    );
  }

  if (activeRegistrations.length > 0) {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
        <p className="font-bold text-green-300">Your team is registered</p>

        <div className="mt-3 grid gap-3">
          {activeRegistrations.map((registration) => (
            <div
              key={registration.id}
              className="rounded-xl border border-white/10 bg-black/20 p-3"
            >
              <p className="font-bold text-white">{registration.teamName}</p>

              <p className="mt-1 text-sm capitalize text-gray-300">
                Status: {registration.status}
              </p>

              {registration.status === "registered" && (
                <form action={cancelTournamentRegistration} className="mt-3">
                  <input
                    type="hidden"
                    name="registrationId"
                    value={registration.id}
                  />

                  <button
                    type="submit"
                    className="rounded-xl border border-red-500/20 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                  >
                    Cancel Registration
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (availableTeams.length === 0) {
    return (
      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
        <p className="font-bold text-yellow-300">No eligible team</p>

        <p className="mt-2 text-sm leading-6 text-gray-300">
          You need an approved team for this game with at least {teamSize}{" "}
          player{teamSize === 1 ? "" : "s"}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
      <p className="font-bold text-cyan-300">Register your team</p>

      <p className="mt-2 text-sm leading-6 text-gray-300">
        Choose one of your approved teams for this tournament.
      </p>

      <form action={registerTeamForTournament} className="mt-4 grid gap-3">
        <input type="hidden" name="tournamentId" value={tournamentId} />

        <select
          name="teamId"
          required
          defaultValue=""
          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
        >
          <option value="" disabled>
            Select team
          </option>

          {availableTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name} — {team.memberCount} players
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-xl bg-cyan-500 px-5 py-3 font-bold text-white transition hover:bg-cyan-400"
        >
          Register Team
        </button>
      </form>
    </div>
  );
}
