import { deleteTournamentResultInline } from "@/actions/adminTournamentResultActions";
import AdminTournamentResultForm from "@/components/AdminTournamentResultForm";
import InlineAdminTournamentForm from "@/components/InlineAdminTournamentForm";

type TournamentRegistrationItem = {
  id: string;
  status: string;
  teamId: string;
  team: {
    id: string;
    name: string;
    game: string;
  };
};

type TournamentResultItem = {
  id: string;
  teamId: string;
  placement: number;
  points: number;
  note: string | null;
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

function PointsPresetCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

export default function AdminTournamentResultsPanel({
  tournamentId,
  tournamentTitle,
  registrations,
  results,
}: AdminTournamentResultsPanelProps) {
  const eligibleRegistrations = registrations.filter((registration) =>
    ["registered", "approved"].includes(registration.status),
  );

  return (
    <section className="rounded-xl border border-white/10 bg-black/20 p-5">
      <div className="grid gap-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
              Tournament results
            </p>

            <h4 className="mt-2 text-xl font-black text-white">
              Award tournament points
            </h4>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Add or update final team results. Every player in the selected
              team receives the same tournament points.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 xl:w-[420px]">
            <PointsPresetCard label="1st" value="10 pts" />
            <PointsPresetCard label="2nd" value="7 pts" />
            <PointsPresetCard label="3rd" value="5 pts" />
            <PointsPresetCard label="Play" value="1 pt" />
          </div>
        </div>

        {eligibleRegistrations.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-400">
            No eligible teams yet. Register or approve teams before adding
            results.
          </div>
        ) : (
          <AdminTournamentResultForm
            tournamentId={tournamentId}
            registrations={eligibleRegistrations}
          />
        )}

        {results.length > 0 && (
          <div className="grid gap-3 border-t border-white/10 pt-5">
            {results.map((result) => (
              <div
                key={result.id}
                className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 lg:grid-cols-[minmax(0,1fr)_90px_100px_160px] lg:items-center"
              >
                <div>
                  <p className="font-black text-white">{result.team.name}</p>

                  {result.note && (
                    <p className="mt-1 text-sm text-gray-400">{result.note}</p>
                  )}
                </div>

                <p className="text-sm font-black text-gray-300">
                  #{result.placement}
                </p>

                <p className="text-sm font-black text-green-300">
                  {result.points} pts
                </p>

                <InlineAdminTournamentForm
                  action={deleteTournamentResultInline}
                  buttonLabel="Delete result"
                  pendingLabel="Deleting..."
                  variant="danger"
                  className="grid gap-2"
                  confirmTitle="Delete tournament result?"
                  confirmDescription={`Delete ${result.team.name}'s result from ${tournamentTitle}?`}
                  confirmLabel="Delete result"
                >
                  <input type="hidden" name="resultId" value={result.id} />
                  <input
                    type="hidden"
                    name="tournamentId"
                    value={tournamentId}
                  />
                </InlineAdminTournamentForm>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
