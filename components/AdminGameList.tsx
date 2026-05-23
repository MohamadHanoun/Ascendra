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

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400";
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-sm font-bold text-gray-200">{children}</span>;
}

function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "green" | "red" | "gray" | "violet" | "blue";
}) {
  const styles = {
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    red: "border-red-400/25 bg-red-500/10 text-red-300",
    gray: "border-white/10 bg-white/5 text-gray-300",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
    blue: "border-blue-400/25 bg-blue-500/10 text-blue-300",
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
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
            Manage games
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">Games list</h2>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Stat label="Total" value={games.length} />
          <Stat label="Active" value={activeCount} />
          <Stat label="Inactive" value={inactiveCount} />
        </div>
      </div>

      {games.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-gray-300 shadow-2xl shadow-black/20">
          No games found. Add one above.
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <div className="hidden border-b border-white/10 bg-black/20 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-gray-500 xl:grid xl:grid-cols-[minmax(0,1fr)_140px_120px_100px_100px] xl:gap-5">
            <span>Game</span>
            <span>Platform</span>
            <span>Team size</span>
            <span>Status</span>
            <span>Linked</span>
          </div>

          <div className="divide-y divide-white/10">
            {games.map((game) => (
              <article
                key={game.id}
                className="grid gap-4 px-5 py-5 transition hover:bg-white/[0.035]"
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_140px_120px_100px_100px] xl:items-center xl:gap-5">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-black text-white">
                      {game.name}
                    </h3>

                    <p className="mt-0.5 text-sm text-gray-500">
                      {game.slug}
                      {game.shortName && (
                        <span className="ml-2 text-gray-600">
                          · {game.shortName}
                        </span>
                      )}
                    </p>
                  </div>

                  <Pill tone={game.platform ? "blue" : "gray"}>
                    {game.platform ?? "—"}
                  </Pill>

                  <p className="text-sm font-bold text-gray-300">
                    {game.defaultTeamSize}v{game.defaultTeamSize}
                    {game.defaultSubstitutes > 0 && (
                      <span className="ml-1 font-normal text-gray-500">
                        +{game.defaultSubstitutes} sub
                      </span>
                    )}
                  </p>

                  <Pill tone={game.isActive ? "green" : "red"}>
                    {game.isActive ? "Active" : "Inactive"}
                  </Pill>

                  <p className="text-sm text-gray-500">
                    {game._count.tournaments}T · {game._count.teams}Tm
                  </p>
                </div>

                <details className="rounded-2xl border border-white/10 bg-black/20">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-black text-gray-300 transition hover:text-white">
                    Edit and actions
                  </summary>

                  <div className="grid gap-5 border-t border-white/10 p-4 xl:grid-cols-[minmax(0,1fr)_200px] xl:items-start">
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

                          <input
                            name="name"
                            required
                            defaultValue={game.name}
                            className={inputClass()}
                          />
                        </label>

                        <label className="grid gap-2">
                          <FieldLabel>Slug</FieldLabel>

                          <input
                            name="slug"
                            required
                            defaultValue={game.slug}
                            className={inputClass()}
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_140px_140px]">
                        <label className="grid gap-2">
                          <FieldLabel>Short name</FieldLabel>

                          <input
                            name="shortName"
                            defaultValue={game.shortName ?? ""}
                            placeholder="e.g. VAL"
                            className={inputClass()}
                          />
                        </label>

                        <label className="grid gap-2">
                          <FieldLabel>Platform</FieldLabel>

                          <select
                            name="platform"
                            defaultValue={game.platform ?? ""}
                            className={inputClass()}
                          >
                            <option value="">No platform</option>

                            {platforms.map((platform) => (
                              <option key={platform} value={platform}>
                                {platform}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="grid gap-2">
                          <FieldLabel>Team size</FieldLabel>

                          <input
                            name="defaultTeamSize"
                            type="number"
                            min={1}
                            max={20}
                            defaultValue={game.defaultTeamSize}
                            className={inputClass()}
                          />
                        </label>

                        <label className="grid gap-2">
                          <FieldLabel>Substitutes</FieldLabel>

                          <input
                            name="defaultSubstitutes"
                            type="number"
                            min={0}
                            max={10}
                            defaultValue={game.defaultSubstitutes}
                            className={inputClass()}
                          />
                        </label>
                      </div>
                    </InlineAdminGameForm>

                    <aside className="grid content-start gap-3">
                      {game.isActive ? (
                        <SmallAction
                          action={deactivateGameInline}
                          gameId={game.id}
                          label="Deactivate"
                          pendingLabel="Deactivating..."
                          variant="danger"
                        />
                      ) : (
                        <SmallAction
                          action={activateGameInline}
                          gameId={game.id}
                          label="Activate"
                          pendingLabel="Activating..."
                          variant="success"
                        />
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
