"use client";

import { createTournamentInline } from "@/actions/adminTournamentInlineActions";
import AdminTournamentImageFields from "@/components/AdminTournamentImageFields";
import InlineAdminTournamentForm from "@/components/InlineAdminTournamentForm";

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

const tournamentStatuses = [
  { value: "upcoming", label: "Upcoming" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

const registrationStatuses = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-bold text-gray-200">{children}</span>;
}

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400";
}

export default function AdminTournamentForm() {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
          Tournaments
        </p>

        <h2 className="mt-1 text-xl font-black text-white">
          Create tournament
        </h2>
      </div>

      <div className="p-5">
        <InlineAdminTournamentForm
          action={createTournamentInline}
          buttonLabel="Create tournament"
          pendingLabel="Creating..."
          resetOnSuccess
          className="grid gap-5"
        >
          <label className="grid gap-2">
            <FieldLabel>Title</FieldLabel>

            <input
              name="title"
              required
              placeholder="Example: Ascendra Valorant Cup"
              className={inputClass()}
            />
          </label>

          <AdminTournamentImageFields games={games} />

          <label className="grid gap-2">
            <FieldLabel>Description</FieldLabel>

            <textarea
              name="description"
              required
              placeholder="Write a clear tournament description..."
              className={`${inputClass()} min-h-24 resize-y text-sm leading-6`}
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

          <div className="grid gap-4 md:grid-cols-2">
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
