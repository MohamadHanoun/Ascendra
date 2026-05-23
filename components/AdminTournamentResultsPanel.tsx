import { deleteTournamentResultInline } from "@/actions/adminTournamentResultActions";
import AdminTournamentResultForm from "@/components/AdminTournamentResultForm";
import InlineAdminTournamentForm from "@/components/InlineAdminTournamentForm";

type TournamentRegistrationItem = {
  id: string;
  status: string;
  teamId: string;
  snapshotTeamName: string | null;
  snapshotTeamGame: string | null;
  team: {
    id: string;
    name: string;
  };
};

type TournamentResultItem = {
  id: string;
  teamId: string;
  placement: number;
  points: number;
  note: string | null;
  snapshotTeamName: string | null;
  snapshotTeamGame?: string | null;
  team: {
    name: string;
  };
};

type AdminTournamentResultsPanelProps = {
  tournamentId: string;
  tournamentTitle: string;
  registrations: TournamentRegistrationItem[];
  results: TournamentResultItem[];
};

function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "gray" | "violet";
}) {
  const styles = {
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    yellow: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    red: "border-red-400/25 bg-red-500/10 text-red-300",
    gray: "border-white/10 bg-white/5 text-gray-300",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function ProgressBar({
  resultsCount,
  approvedTeams,
}: {
  resultsCount: number;
  approvedTeams: number;
}) {
  const progress =
    approvedTeams > 0 ? Math.min((resultsCount / approvedTeams) * 100, 100) : 0;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-4 text-xs font-bold text-gray-500">
        <span>
          {resultsCount}/{approvedTeams} results
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function AdminTournamentResultsPanel({
  tournamentId,
  tournamentTitle,
  registrations,
  results,
}: AdminTournamentResultsPanelProps) {
  const approvedRegistrations = registrations.filter(
    (registration) => registration.status === "approved",
  );

  const sortedResults = [...results].sort((a, b) => {
    if (a.placement !== b.placement) {
      return a.placement - b.placement;
    }

    return b.points - a.points;
  });

  const totalPoints = results.reduce(
    (total, result) => total + result.points,
    0,
  );

  const remainingResults = Math.max(
    approvedRegistrations.length - results.length,
    0,
  );

  return (
    <section className="grid gap-5">
      <div className="grid gap-5 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-3">
        <Stat label="Approved" value={approvedRegistrations.length} />
        <Stat label="Saved" value={results.length} />
        <Stat label="Points" value={totalPoints} />
      </div>

      <ProgressBar
        resultsCount={results.length}
        approvedTeams={approvedRegistrations.length}
      />

      {remainingResults > 0 && (
        <p className="rounded-xl border border-yellow-400/25 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-300">
          {remainingResults} approved team
          {remainingResults === 1 ? "" : "s"} still missing results.
        </p>
      )}

      <details className="group overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/[0.035]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-300">
              Add or edit
            </p>

            <h3 className="mt-1 font-black text-white">Result form</h3>
          </div>

          <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/25 text-lg font-black text-gray-300 transition group-open:rotate-45">
            +
          </span>
        </summary>

        <div className="border-t border-white/10 p-4">
          {approvedRegistrations.length === 0 ? (
            <p className="text-sm text-gray-400">
              Approve teams before adding results.
            </p>
          ) : (
            <AdminTournamentResultForm
              tournamentId={tournamentId}
              registrations={approvedRegistrations}
              results={results}
            />
          )}
        </div>
      </details>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
            Saved standings
          </p>
        </div>

        {sortedResults.length === 0 ? (
          <div className="p-4 text-sm text-gray-400">No results saved yet.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {sortedResults.map((result) => {
              const teamName = result.snapshotTeamName || result.team.name;
              const teamGame = result.snapshotTeamGame || null;

              return (
                <article
                  key={result.id}
                  className="grid gap-4 px-4 py-4 md:grid-cols-[90px_minmax(0,1fr)_90px_110px] md:items-center"
                >
                  <Pill tone={result.placement <= 3 ? "yellow" : "violet"}>
                    #{result.placement}
                  </Pill>

                  <div>
                    <p className="font-black text-white">{teamName}</p>

                    {teamGame && (
                      <p className="mt-1 text-xs text-gray-500">{teamGame}</p>
                    )}

                    {result.note && (
                      <p className="mt-1 text-sm text-gray-400">
                        {result.note}
                      </p>
                    )}
                  </div>

                  <Pill tone="green">{result.points} pts</Pill>

                  <InlineAdminTournamentForm
                    action={deleteTournamentResultInline}
                    buttonLabel="Delete"
                    pendingLabel="Deleting..."
                    variant="danger"
                    className="grid gap-2"
                    confirmTitle="Delete result?"
                    confirmDescription={`Delete ${teamName}'s result from ${tournamentTitle}?`}
                    confirmLabel="Delete result"
                  >
                    <input type="hidden" name="resultId" value={result.id} />
                    <input
                      type="hidden"
                      name="tournamentId"
                      value={tournamentId}
                    />
                  </InlineAdminTournamentForm>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
