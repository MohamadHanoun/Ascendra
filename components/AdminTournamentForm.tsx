"use client";

import { createTournamentInline } from "@/actions/adminTournamentInlineActions";
import InlineAdminTournamentForm from "@/components/InlineAdminTournamentForm";

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

const tournamentStatuses = [
  {
    value: "upcoming",
    label: "Upcoming",
  },
  {
    value: "open",
    label: "Open",
  },
  {
    value: "closed",
    label: "Closed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

const registrationStatuses = [
  {
    value: "open",
    label: "Open",
  },
  {
    value: "closed",
    label: "Closed",
  },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-bold text-gray-200">{children}</span>;
}

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400";
}

export default function AdminTournamentForm() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-5">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
            Tournaments
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            Create tournament
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Create a new tournament. A game image is used automatically when no
            custom image URL is provided.
          </p>
        </div>

        <InlineAdminTournamentForm
          action={createTournamentInline}
          buttonLabel="Create tournament"
          pendingLabel="Creating..."
          resetOnSuccess
          className="grid gap-4"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <label className="grid gap-2">
              <FieldLabel>Title</FieldLabel>

              <input
                name="title"
                required
                placeholder="Example: RTN Valorant Cup"
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Game</FieldLabel>

              <select
                name="game"
                required
                defaultValue=""
                className={inputClass()}
              >
                <option value="" disabled>
                  Select game
                </option>

                {games.map((game) => (
                  <option key={game} value={game}>
                    {game}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <FieldLabel>Image URL</FieldLabel>

            <input
              name="imageUrl"
              placeholder="Optional custom image URL"
              className={inputClass()}
            />
          </label>

          <label className="grid gap-2">
            <FieldLabel>Description</FieldLabel>

            <textarea
              name="description"
              required
              placeholder="Write a clear tournament description..."
              className={`${inputClass()} min-h-24 resize-y`}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2">
              <FieldLabel>Date</FieldLabel>

              <input
                name="date"
                required
                placeholder="Example: 20/06/2026, 19:00"
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Prize</FieldLabel>

              <input
                name="prize"
                required
                placeholder="Example: 500 SEK"
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Max slots</FieldLabel>

              <input
                name="maxSlots"
                type="number"
                min="1"
                required
                placeholder="8"
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Team size</FieldLabel>

              <input
                name="teamSize"
                type="number"
                min="1"
                required
                placeholder="5"
                className={inputClass()}
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <label className="grid gap-2">
              <FieldLabel>Tournament status</FieldLabel>

              <select
                name="status"
                required
                defaultValue="upcoming"
                className={inputClass()}
              >
                {tournamentStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <FieldLabel>Registration status</FieldLabel>

              <select
                name="registrationStatus"
                required
                defaultValue="open"
                className={inputClass()}
              >
                {registrationStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </InlineAdminTournamentForm>
      </div>
    </section>
  );
}
