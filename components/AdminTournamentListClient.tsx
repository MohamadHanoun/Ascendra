"use client";

import { useMemo, useState } from "react";
import ConfirmDeleteForm from "@/components/ConfirmDeleteForm";

type TournamentItem = {
  id: string;
  title: string;
  game: string;
  date: string;
  prize: string;
  description: string;
  maxSlots: number;
  teamSize: number;
  status: string;
  registrationStatus: string;
};

type ServerAction = (formData: FormData) => void | Promise<void>;

type AdminTournamentListClientProps = {
  tournaments: TournamentItem[];
  updateTournament: ServerAction;
  deleteTournament: ServerAction;
};

type StatusFilter = "all" | "open" | "upcoming" | "closed";

const statusFilters: {
  label: string;
  value: StatusFilter;
}[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Closed", value: "closed" },
];

function registrationBadge(status: string) {
  if (status === "open") {
    return "border-green-500/20 bg-green-500/10 text-green-300";
  }

  return "border-red-500/20 bg-red-500/10 text-red-300";
}

export default function AdminTournamentListClient({
  tournaments,
  updateTournament,
  deleteTournament,
}: AdminTournamentListClientProps) {
  const [items, setItems] = useState(tournaments);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filteredTournaments = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return items.filter((tournament) => {
      const matchesStatus = status === "all" || tournament.status === status;

      const matchesSearch =
        !searchValue ||
        tournament.title.toLowerCase().includes(searchValue) ||
        tournament.game.toLowerCase().includes(searchValue) ||
        tournament.date.toLowerCase().includes(searchValue) ||
        tournament.prize.toLowerCase().includes(searchValue) ||
        tournament.description.toLowerCase().includes(searchValue);

      return matchesStatus && matchesSearch;
    });
  }, [items, search, status]);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Tournament List
          </p>

          <h2 className="text-3xl font-black">Manage Tournaments</h2>

          <p className="mt-3 max-w-2xl leading-7 text-gray-300">
            Search, filter, edit, or delete tournaments from the Ascendra database.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="grid gap-2">
              <span className="font-semibold text-gray-200">
                Search tournaments
              </span>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, game, prize, date..."
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400"
              />
            </label>

            <div className="grid gap-2">
              <span className="font-semibold text-gray-200">Filter status</span>

              <div className="flex flex-wrap gap-2">
                {statusFilters.map((filter) => {
                  const isActive = status === filter.value;

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setStatus(filter.value)}
                      className={`rounded-xl border px-4 py-3 font-bold transition ${
                        isActive
                          ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-200"
                          : "border-white/10 bg-black/20 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="mt-5 text-sm text-gray-400">
            Showing {filteredTournaments.length} of {items.length} tournaments.
          </p>
        </div>

        {filteredTournaments.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-gray-300">
            No tournaments found.
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredTournaments.map((tournament) => (
              <article
                key={tournament.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-black">{tournament.title}</h3>

                    <p className="mt-2 text-gray-300">{tournament.game}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-sm font-bold text-cyan-300">
                      {tournament.status}
                    </span>

                    <span
                      className={`rounded-full border px-4 py-1 text-sm font-bold ${registrationBadge(
                        tournament.registrationStatus,
                      )}`}
                    >
                      Registration {tournament.registrationStatus}
                    </span>
                  </div>
                </div>

                <form action={updateTournament} className="grid gap-4">
                  <input type="hidden" name="id" value={tournament.id} />

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="font-semibold text-gray-200">Title</span>

                      <input
                        name="title"
                        defaultValue={tournament.title}
                        required
                        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="font-semibold text-gray-200">Game</span>

                      <select
                        name="game"
                        defaultValue={tournament.game}
                        required
                        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                      >
                        <option value="Valorant">Valorant</option>
                        <option value="League of Legends">
                          League of Legends
                        </option>
                        <option value="CS2">CS2</option>
                        <option value="Dota2">Dota2</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <label className="grid gap-2">
                      <span className="font-semibold text-gray-200">Date</span>

                      <input
                        name="date"
                        defaultValue={tournament.date}
                        required
                        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="font-semibold text-gray-200">Prize</span>

                      <input
                        name="prize"
                        defaultValue={tournament.prize}
                        required
                        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="font-semibold text-gray-200">
                        Max Teams
                      </span>

                      <input
                        name="maxSlots"
                        type="number"
                        min="1"
                        defaultValue={tournament.maxSlots}
                        required
                        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="font-semibold text-gray-200">
                        Team Size
                      </span>

                      <input
                        name="teamSize"
                        type="number"
                        min="1"
                        defaultValue={tournament.teamSize}
                        required
                        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="font-semibold text-gray-200">
                        Tournament Status
                      </span>

                      <select
                        name="status"
                        defaultValue={tournament.status}
                        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                      >
                        <option value="open">Open</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="font-semibold text-gray-200">
                        Registration Status
                      </span>

                      <select
                        name="registrationStatus"
                        defaultValue={tournament.registrationStatus}
                        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="font-semibold text-gray-200">
                      Description
                    </span>

                    <textarea
                      name="description"
                      defaultValue={tournament.description}
                      required
                      rows={4}
                      className="resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    />
                  </label>

                  <div className="grid gap-3 sm:flex sm:flex-wrap">
                    <button
                      type="submit"
                      className="w-full rounded-xl border border-cyan-500/20 px-4 py-2 font-bold text-cyan-300 transition hover:bg-cyan-500/10 sm:w-auto"
                    >
                      Save Changes
                    </button>

                    <ConfirmDeleteForm
                      id={tournament.id}
                      action={deleteTournament}
                      message="Are you sure you want to delete this tournament?"
                      onDeleted={() => {
                        setItems((currentItems) =>
                          currentItems.filter(
                            (item) => item.id !== tournament.id,
                          ),
                        );
                      }}
                    />
                  </div>
                </form>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
