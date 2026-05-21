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
  snapshotTeamName: string | null;
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

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function PointsPresetCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        highlight
          ? "border-emerald-400/25 bg-emerald-500/10"
          : "border-white/10 bg-black/25"
      }`}
    >
      <p
        className={`text-xs font-black uppercase tracking-[0.14em] ${
          highlight ? "text-emerald-300" : "text-gray-500"
        }`}
      >
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function PlacementBadge({ placement }: { placement: number }) {
  const isTopThree = placement <= 3;

  return (
    <span
      className={`grid h-11 w-11 place-items-center rounded-2xl border text-lg font-black ${
        isTopThree
          ? "border-yellow-400/25 bg-yellow-500/10 text-yellow-300"
          : "border-violet-400/25 bg-violet-500/10 text-violet-200"
      }`}
    >
      #{placement}
    </span>
  );
}

function ResultStatusBox({
  approvedTeams,
  resultsCount,
}: {
  approvedTeams: number;
  resultsCount: number;
}) {
  const remainingResults = Math.max(approvedTeams - resultsCount, 0);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        Result progress
      </p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25"
          style={{
            width:
              approvedTeams > 0
                ? `${Math.min((resultsCount / approvedTeams) * 100, 100)}%`
                : "0%",
          }}
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-gray-400">
        {resultsCount}/{approvedTeams} approved teams have saved results.
        {remainingResults > 0
          ? ` ${remainingResults} result${remainingResults === 1 ? "" : "s"} remaining.`
          : " Results are complete."}
      </p>
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

  const bestPlacement =
    results.length > 0
      ? Math.min(...results.map((result) => result.placement))
      : null;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-black/25">
      <div className="border-b border-white/10 bg-white/[0.03] px-5 py-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
          Results
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Tournament standings
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
          Add final placements for approved teams. Each saved result updates the
          tournament page, profiles, stats, and leaderboard.
        </p>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Approved teams"
            value={approvedRegistrations.length}
          />
          <SummaryCard label="Saved results" value={results.length} />
          <SummaryCard label="Awarded points" value={totalPoints} />
        </div>

        <ResultStatusBox
          approvedTeams={approvedRegistrations.length}
          resultsCount={results.length}
        />

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                Suggested points
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Presets keep scoring fast while still allowing manual edits.
              </p>
            </div>

            <p className="text-sm font-black text-yellow-300">
              Best: {bestPlacement ? `#${bestPlacement}` : "-"}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <PointsPresetCard label="Champion" value="10 pts" highlight />
            <PointsPresetCard label="Runner-up" value="7 pts" />
            <PointsPresetCard label="Third place" value="5 pts" />
            <PointsPresetCard label="Participation" value="1 pt" />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          {approvedRegistrations.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-gray-400">
              No approved teams yet. Approve tournament registrations before
              adding official results.
            </div>
          ) : (
            <AdminTournamentResultForm
              tournamentId={tournamentId}
              registrations={approvedRegistrations}
              results={results}
            />
          )}
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
              Saved standings
            </p>
          </div>

          {sortedResults.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">
              No tournament results saved yet.
            </div>
          ) : (
            <div className="grid gap-3 p-4">
              {sortedResults.map((result) => {
                const teamName = result.snapshotTeamName || result.team.name;

                return (
                  <article
                    key={result.id}
                    className="grid gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 lg:grid-cols-[70px_minmax(0,1fr)_100px_140px] lg:items-center"
                  >
                    <PlacementBadge placement={result.placement} />

                    <div>
                      <p className="font-black text-white">{teamName}</p>

                      {result.note && (
                        <p className="mt-1 text-sm text-gray-400">
                          {result.note}
                        </p>
                      )}
                    </div>

                    <p className="text-sm font-black text-emerald-300">
                      {result.points} pts
                    </p>

                    <InlineAdminTournamentForm
                      action={deleteTournamentResultInline}
                      buttonLabel="Delete"
                      pendingLabel="Deleting..."
                      variant="danger"
                      className="grid gap-2"
                      confirmTitle="Delete tournament result?"
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
      </div>
    </section>
  );
}
