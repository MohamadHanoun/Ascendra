import type { ReactNode } from "react";

import {
  activateGameInline,
  deactivateGameInline,
  deleteGameInline,
  updateGameInline,
} from "@/actions/adminGameInlineActions";
import InlineAdminGameForm from "@/components/InlineAdminGameForm";
import { prisma } from "@/lib/prisma";

const platforms = ["PC", "Console", "Mobile", "Cross-platform"];

type GameAction = (formData: FormData) => Promise<{
  ok: boolean;
  message: string;
  redirectTo?: string;
}>;

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

const pillStyleMap: Record<string, React.CSSProperties> = {
  green: { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
  red: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
  gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
  violet: { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
  blue: { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" },
};

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
      {children}
    </span>
  );
}

function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "green" | "red" | "gray" | "violet" | "blue";
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

function SmallAction({
  action,
  gameId,
  label,
  pendingLabel,
  variant = "secondary",
}: {
  action: GameAction;
  gameId: string;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "success" | "danger" | "secondary";
}) {
  return (
    <InlineAdminGameForm
      action={action}
      buttonLabel={label}
      pendingLabel={pendingLabel}
      variant={variant}
      className="grid gap-2"
    >
      <input type="hidden" name="gameId" value={gameId} />
    </InlineAdminGameForm>
  );
}

export default async function AdminGameList() {
  const games = await prisma.game.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { tournaments: true, teams: true } },
    },
  });

  const activeCount = games.filter((g) => g.isActive).length;
  const inactiveCount = games.length - activeCount;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
            Manage games
          </p>
          <h2 className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>Games list</h2>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Stat label="Total" value={games.length} />
          <Stat label="Active" value={activeCount} />
          <Stat label="Inactive" value={inactiveCount} />
        </div>
      </div>

      {games.length === 0 ? (
        <div className="border p-6 shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-3)" }}>
          No games found. Add one above.
        </div>
      ) : (
        <section className="overflow-hidden border shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
          <div
            className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] xl:grid xl:grid-cols-[minmax(0,1fr)_140px_120px_100px_100px] xl:gap-5"
            style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "oklch(0.08 0.02 287)", color: "var(--asc-fg-3)" }}
          >
            <span>Game</span>
            <span>Platform</span>
            <span>Team size</span>
            <span>Status</span>
            <span>Linked</span>
          </div>

          <div>
            {games.map((game, idx) => (
              <article
                key={game.id}
                className="grid gap-4 px-5 py-5 transition hover:bg-white/[0.035]"
                style={idx < games.length - 1 ? { borderBottom: "1px solid var(--asc-line-soft)" } : {}}
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_140px_120px_100px_100px] xl:items-center xl:gap-5">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{game.name}</h3>
                    <p className="mt-0.5 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                      {game.slug}
                      {game.shortName && <span className="ml-2" style={{ color: "var(--asc-fg-3)", opacity: 0.6 }}>· {game.shortName}</span>}
                    </p>
                  </div>

                  <Pill tone={game.platform ? "blue" : "gray"}>{game.platform ?? "—"}</Pill>

                  <p className="text-sm font-bold" style={{ color: "var(--asc-fg-0)" }}>
                    {game.defaultTeamSize}v{game.defaultTeamSize}
                    {game.defaultSubstitutes > 0 && (
                      <span className="ml-1 font-normal" style={{ color: "var(--asc-fg-3)" }}>+{game.defaultSubstitutes} sub</span>
                    )}
                  </p>

                  <Pill tone={game.isActive ? "green" : "red"}>{game.isActive ? "Active" : "Inactive"}</Pill>

                  <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
                    {game._count.tournaments}T · {game._count.teams}Tm
                  </p>
                </div>

                <details className="border" style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.08 0.02 287)" }}>
                  <summary
                    className="cursor-pointer px-4 py-3 text-sm font-black transition"
                    style={{ color: "var(--asc-fg-3)" }}
                  >
                    Edit and actions
                  </summary>

                  <div
                    className="grid gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_200px] xl:items-start"
                    style={{ borderTop: "1px solid var(--asc-line-soft)" }}
                  >
                    <InlineAdminGameForm
                      action={updateGameInline}
                      buttonLabel="Save changes"
                      pendingLabel="Saving..."
                      className="grid gap-4"
                    >
                      <input type="hidden" name="gameId" value={game.id} />

                      <div className="grid gap-4 lg:grid-cols-2">
                        <label className="grid gap-2">
                          <FieldLabel>Name</FieldLabel>
                          <input name="name" required defaultValue={game.name} className="border px-4 py-3 text-white outline-none transition" style={inputStyle} />
                        </label>

                        <label className="grid gap-2">
                          <FieldLabel>Slug</FieldLabel>
                          <input name="slug" required defaultValue={game.slug} className="border px-4 py-3 text-white outline-none transition" style={inputStyle} />
                        </label>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_140px_140px]">
                        <label className="grid gap-2">
                          <FieldLabel>Short name</FieldLabel>
                          <input name="shortName" defaultValue={game.shortName ?? ""} placeholder="e.g. VAL" className="border px-4 py-3 text-white outline-none transition" style={inputStyle} />
                        </label>

                        <label className="grid gap-2">
                          <FieldLabel>Platform</FieldLabel>
                          <select name="platform" defaultValue={game.platform ?? ""} className="border px-4 py-3 text-white outline-none transition" style={inputStyle}>
                            <option value="">No platform</option>
                            {platforms.map((platform) => (
                              <option key={platform} value={platform}>{platform}</option>
                            ))}
                          </select>
                        </label>

                        <label className="grid gap-2">
                          <FieldLabel>Team size</FieldLabel>
                          <input name="defaultTeamSize" type="number" min={1} max={20} defaultValue={game.defaultTeamSize} className="border px-4 py-3 text-white outline-none transition" style={inputStyle} />
                        </label>

                        <label className="grid gap-2">
                          <FieldLabel>Substitutes</FieldLabel>
                          <input name="defaultSubstitutes" type="number" min={0} max={10} defaultValue={game.defaultSubstitutes} className="border px-4 py-3 text-white outline-none transition" style={inputStyle} />
                        </label>
                      </div>
                    </InlineAdminGameForm>

                    <aside className="grid content-start gap-3">
                      {game.isActive ? (
                        <SmallAction action={deactivateGameInline} gameId={game.id} label="Deactivate" pendingLabel="Deactivating..." variant="danger" />
                      ) : (
                        <SmallAction action={activateGameInline} gameId={game.id} label="Activate" pendingLabel="Activating..." variant="success" />
                      )}

                      <InlineAdminGameForm
                        action={deleteGameInline}
                        buttonLabel="Delete"
                        pendingLabel="Deleting..."
                        variant="danger"
                        className="grid gap-2"
                        confirmTitle="Delete game?"
                        confirmDescription={`Delete ${game.name}? This cannot be undone. Games with linked tournaments or teams cannot be deleted.`}
                        confirmLabel="Delete permanently"
                      >
                        <input type="hidden" name="gameId" value={game.id} />
                      </InlineAdminGameForm>
                    </aside>
                  </div>
                </details>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
