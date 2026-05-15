"use client";

import { useMemo, useState } from "react";
import TournamentCard from "@/components/TournamentCard";
import type { Tournament, TournamentStatus } from "@/data/tournaments";

type TournamentBrowserProps = {
  tournaments: Tournament[];
};

type StatusFilter = "all" | TournamentStatus;

const statusFilters: {
  label: string;
  value: StatusFilter;
}[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Closed", value: "closed" },
];

export default function TournamentBrowser({
  tournaments,
}: TournamentBrowserProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filteredTournaments = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return tournaments.filter((tournament) => {
      const matchesStatus =
        status === "all" || tournament.status === status;

      const matchesSearch =
        !searchValue ||
        tournament.title.toLowerCase().includes(searchValue) ||
        tournament.game.toLowerCase().includes(searchValue) ||
        tournament.description.toLowerCase().includes(searchValue) ||
        tournament.date.toLowerCase().includes(searchValue) ||
        tournament.prize.toLowerCase().includes(searchValue);

      return matchesStatus && matchesSearch;
    });
  }, [search, status, tournaments]);

  return (
    <>
      <div className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="grid gap-2">
            <span className="font-semibold text-gray-200">
              Search tournaments
            </span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, game, prize, or date..."
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-indigo-400"
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
                        ? "border-indigo-400/40 bg-indigo-500/20 text-indigo-200"
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
          Showing {filteredTournaments.length} of {tournaments.length} tournaments.
        </p>
      </div>

      {filteredTournaments.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h2 className="mb-3 text-2xl font-bold">No tournaments found</h2>

          <p className="text-gray-300">
            Try changing the search text or status filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}
    </>
  );
}