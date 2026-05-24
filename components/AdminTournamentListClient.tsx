"use client";

import { useMemo, useState } from "react";
import ConfirmDeleteForm from "@/components/ConfirmDeleteForm";

type TournamentItem = {
  id: string;
  title: string;
  gameName: string | null;
  startsAt: string | null;
  prize: string | null;
  description: string;
  maxTeams: number;
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

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Closed", value: "closed" },
];

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

function registrationBadgeStyle(status: string): React.CSSProperties {
  if (status === "open") {
    return { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" };
  }
  return { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" };
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
        (tournament.gameName ?? "").toLowerCase().includes(searchValue) ||
        (tournament.startsAt ?? "").toLowerCase().includes(searchValue) ||
        (tournament.prize ?? "").toLowerCase().includes(searchValue) ||
        tournament.description.toLowerCase().includes(searchValue);

      return matchesStatus && matchesSearch;
    });
  }, [items, search, status]);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <div className="border p-6" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--asc-accent)" }}>
            Tournament List
          </p>
          <h2 className="text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>Manage Tournaments</h2>
          <p className="mt-3 max-w-2xl leading-7" style={{ color: "var(--asc-fg-3)" }}>
            Search, filter, edit, or delete tournaments from the Ascendra database.
          </p>
        </div>

        <div className="mb-8 border p-5" style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.08 0.02 287)" }}>
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Search tournaments</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, game, prize, date..."
                className="border px-4 py-3 text-white outline-none transition"
                style={inputStyle}
              />
            </label>

            <div className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Filter status</span>

              <div className="flex flex-wrap gap-2">
                {statusFilters.map((filter) => {
                  const isActive = status === filter.value;

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setStatus(filter.value)}
                      className="border px-4 py-3 font-bold transition"
                      style={
                        isActive
                          ? { borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }
                          : { borderColor: "var(--asc-line-soft)", background: "transparent", color: "var(--asc-fg-3)" }
                      }
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="mt-5 text-sm" style={{ color: "var(--asc-fg-3)" }}>
            Showing {filteredTournaments.length} of {items.length} tournaments.
          </p>
        </div>

        {filteredTournaments.length === 0 ? (
          <div className="border p-6" style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.08 0.02 287)", color: "var(--asc-fg-3)" }}>
            No tournaments found.
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredTournaments.map((tournament) => (
              <article
                key={tournament.id}
                className="border p-5"
                style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.08 0.02 287)" }}
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{tournament.title}</h3>
                    <p className="mt-2" style={{ color: "var(--asc-fg-3)" }}>{tournament.gameName ?? "—"}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className="border px-4 py-1 text-sm font-bold"
                      style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
                    >
                      {tournament.status}
                    </span>

                    <span className="border px-4 py-1 text-sm font-bold" style={registrationBadgeStyle(tournament.registrationStatus)}>
                      Registration {tournament.registrationStatus}
                    </span>
                  </div>
                </div>

                <form action={updateTournament} className="grid gap-4">
                  <input type="hidden" name="id" value={tournament.id} />

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Title</span>
                      <input name="title" defaultValue={tournament.title} required className="border px-4 py-3 text-white outline-none transition" style={inputStyle} />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Game</span>
                      <p className="border px-4 py-3" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}>
                        {tournament.gameName ?? "Not set"} — edit via Admin panel
                      </p>
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="grid gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Prize</span>
                      <input name="prize" defaultValue={tournament.prize ?? ""} className="border px-4 py-3 text-white outline-none transition" style={inputStyle} />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Max Teams</span>
                      <input name="maxTeams" type="number" min="1" defaultValue={tournament.maxTeams} required className="border px-4 py-3 text-white outline-none transition" style={inputStyle} />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Team Size</span>
                      <input name="teamSize" type="number" min="1" defaultValue={tournament.teamSize} required className="border px-4 py-3 text-white outline-none transition" style={inputStyle} />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Tournament Status</span>
                      <select name="status" defaultValue={tournament.status} className="border px-4 py-3 text-white outline-none transition" style={inputStyle}>
                        <option value="open">Open</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Registration Status</span>
                      <select name="registrationStatus" defaultValue={tournament.registrationStatus} className="border px-4 py-3 text-white outline-none transition" style={inputStyle}>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Description</span>
                    <textarea
                      name="description"
                      defaultValue={tournament.description}
                      required
                      rows={4}
                      className="resize-none border px-4 py-3 text-white outline-none transition"
                      style={inputStyle}
                    />
                  </label>

                  <div className="grid gap-3 sm:flex sm:flex-wrap">
                    <button
                      type="submit"
                      className="w-full border px-4 py-2 font-bold transition hover:opacity-90 sm:w-auto"
                      style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", color: "var(--asc-accent)", background: "var(--asc-accent-dim)" }}
                    >
                      Save Changes
                    </button>

                    <ConfirmDeleteForm
                      id={tournament.id}
                      action={deleteTournament}
                      message="Are you sure you want to delete this tournament?"
                      onDeleted={() => {
                        setItems((currentItems) => currentItems.filter((item) => item.id !== tournament.id));
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
