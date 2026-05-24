import { deleteTournamentResultInline } from "@/actions/adminTournamentResultActions";
import AdminTournamentResultForm from "@/components/AdminTournamentResultForm";
import InlineAdminTournamentForm from "@/components/InlineAdminTournamentForm";

type TournamentRegistrationItem = {
  id: string;
  status: string;
  teamId: string;
  snapshotTeamName: string | null;
  snapshotTeamGame: string | null;
  team: { id: string; name: string };
};

type TournamentResultItem = {
  id: string;
  teamId: string;
  placement: number;
  points: number;
  note: string | null;
  snapshotTeamName: string | null;
  snapshotTeamGame?: string | null;
  team: { name: string };
};

type AdminTournamentResultsPanelProps = {
  tournamentId: string;
  tournamentTitle: string;
  registrations: TournamentRegistrationItem[];
  results: TournamentResultItem[];
};

const pillStyleMap: Record<string, React.CSSProperties> = {
  green: { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
  yellow: { color: "var(--asc-amber)", borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)" },
  red: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
  gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
  violet: { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
};

function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "gray" | "violet";
}) {
  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={pillStyleMap[tone]}>
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>{label}</p>
      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

function ProgressBar({ resultsCount, approvedTeams }: { resultsCount: number; approvedTeams: number }) {
  const progress = approvedTeams > 0 ? Math.min((resultsCount / approvedTeams) * 100, 100) : 0;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-4 text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
        <span>{resultsCount}/{approvedTeams} results</span>
        <span>{Math.round(progress)}%</span>
      </div>

      <div className="h-2 overflow-hidden" style={{ background: "var(--asc-line-soft)" }}>
        <div className="h-full" style={{ width: `${progress}%`, background: "var(--asc-accent-2)" }} />
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
  const approvedRegistrations = registrations.filter((r) => r.status === "approved");

  const sortedResults = [...results].sort((a, b) => {
    if (a.placement !== b.placement) return a.placement - b.placement;
    return b.points - a.points;
  });

  const totalPoints = results.reduce((total, result) => total + result.points, 0);
  const remainingResults = Math.max(approvedRegistrations.length - results.length, 0);

  return (
    <section className="grid gap-5">
      <div
        className="grid gap-5 border p-4 sm:grid-cols-3"
        style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.08 0.02 287)" }}
      >
        <Stat label="Approved" value={approvedRegistrations.length} />
        <Stat label="Saved" value={results.length} />
        <Stat label="Points" value={totalPoints} />
      </div>

      <ProgressBar resultsCount={results.length} approvedTeams={approvedRegistrations.length} />

      {remainingResults > 0 && (
        <p
          className="border px-4 py-3 text-sm font-bold"
          style={{ borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)", color: "var(--asc-amber)" }}
        >
          {remainingResults} approved team{remainingResults === 1 ? "" : "s"} still missing results.
        </p>
      )}

      <details className="group overflow-hidden border" style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.08 0.02 287)" }}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/[0.035]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-accent)" }}>Add or edit</p>
            <h3 className="mt-1 font-black" style={{ color: "var(--asc-fg-0)" }}>Result form</h3>
          </div>

          <span
            className="grid h-9 w-9 place-items-center text-lg font-black transition group-open:rotate-45"
            style={{ border: "1px solid var(--asc-line-soft)", background: "oklch(0.09 0.02 287)", color: "var(--asc-fg-3)" }}
          >
            +
          </span>
        </summary>

        <div className="p-4" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
          {approvedRegistrations.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>Approve teams before adding results.</p>
          ) : (
            <AdminTournamentResultForm
              tournamentId={tournamentId}
              registrations={approvedRegistrations}
              results={results}
            />
          )}
        </div>
      </details>

      <section className="overflow-hidden border" style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.08 0.02 287)" }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
          <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>Saved standings</p>
        </div>

        {sortedResults.length === 0 ? (
          <div className="p-4 text-sm" style={{ color: "var(--asc-fg-3)" }}>No results saved yet.</div>
        ) : (
          <div>
            {sortedResults.map((result, idx) => {
              const teamName = result.snapshotTeamName || result.team.name;
              const teamGame = result.snapshotTeamGame || null;

              return (
                <article
                  key={result.id}
                  className="grid gap-4 px-4 py-4 md:grid-cols-[90px_minmax(0,1fr)_90px_110px] md:items-center"
                  style={idx < sortedResults.length - 1 ? { borderBottom: "1px solid var(--asc-line-soft)" } : {}}
                >
                  <Pill tone={result.placement <= 3 ? "yellow" : "violet"}>#{result.placement}</Pill>

                  <div>
                    <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>{teamName}</p>
                    {teamGame && <p className="mt-1 text-xs" style={{ color: "var(--asc-fg-3)" }}>{teamGame}</p>}
                    {result.note && <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>{result.note}</p>}
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
                    <input type="hidden" name="tournamentId" value={tournamentId} />
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
