"use client";

import { useState } from "react";

import { createTournamentInline } from "@/actions/adminTournamentInlineActions";
import AdminTournamentImageFields from "@/components/AdminTournamentImageFields";
import InlineAdminTournamentForm from "@/components/InlineAdminTournamentForm";

type GameOption = {
  slug: string;
  name: string;
  defaultTeamSize: number;
  defaultSubstitutes: number;
};

type AdminTournamentFormProps = {
  games: GameOption[];
};

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

const tournamentFormats = [
  { value: "single_elimination", label: "Single Elimination" },
  { value: "double_elimination", label: "Double Elimination" },
  { value: "round_robin", label: "Round Robin" },
  { value: "swiss", label: "Swiss" },
  { value: "group_stage", label: "Group Stage" },
];

const platforms = ["PC", "Console", "Mobile", "Cross-platform"];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-bold text-gray-200">{children}</span>;
}

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400";
}

export default function AdminTournamentForm({ games }: AdminTournamentFormProps) {
  const [teamSize, setTeamSize] = useState(5);
  const [substitutes, setSubstitutes] = useState(0);

  function handleGameChange(game: GameOption | undefined) {
    if (game) {
      setTeamSize(game.defaultTeamSize);
      setSubstitutes(game.defaultSubstitutes);
    }
  }

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

          <AdminTournamentImageFields
            games={games}
            onGameChange={handleGameChange}
          />

          <label className="grid gap-2">
            <FieldLabel>Description</FieldLabel>

            <textarea
              name="description"
              required
              placeholder="Write a clear tournament description..."
              className={`${inputClass()} min-h-24 resize-y text-sm leading-6`}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="grid gap-2">
              <FieldLabel>Prize</FieldLabel>

              <input
                name="prize"
                placeholder="Example: 500 SEK"
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Max teams</FieldLabel>

              <input
                name="maxTeams"
                type="number"
                min="1"
                required
                placeholder="16"
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Min teams</FieldLabel>

              <input
                name="minTeams"
                type="number"
                min="1"
                defaultValue={2}
                className={inputClass()}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2">
              <FieldLabel>Team size</FieldLabel>

              <input
                name="teamSize"
                type="number"
                min="1"
                required
                value={teamSize}
                onChange={(e) => setTeamSize(Math.max(1, Number(e.target.value) || 1))}
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Substitutes per team</FieldLabel>

              <input
                name="substitutesAllowed"
                type="number"
                min="0"
                value={substitutes}
                onChange={(e) => setSubstitutes(Math.max(0, Number(e.target.value) || 0))}
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Best of</FieldLabel>

              <select name="bestOf" defaultValue="1" className={inputClass()}>
                {[1, 3, 5, 7].map((n) => (
                  <option key={n} value={n}>
                    BO{n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2">
              <FieldLabel>Format</FieldLabel>

              <select
                name="format"
                defaultValue="single_elimination"
                className={inputClass()}
              >
                {tournamentFormats.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <FieldLabel>Visibility</FieldLabel>

              <select
                name="visibility"
                defaultValue="public"
                className={inputClass()}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>

            <label className="grid gap-2">
              <FieldLabel>Region</FieldLabel>

              <input
                name="region"
                placeholder="e.g. MENA, EU, NA"
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Platform</FieldLabel>

              <select
                name="platform"
                defaultValue=""
                className={inputClass()}
              >
                <option value="">No platform</option>

                {platforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel>Start date</FieldLabel>

              <input
                name="startsAt"
                type="datetime-local"
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>End date</FieldLabel>

              <input
                name="endsAt"
                type="datetime-local"
                className={inputClass()}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel>Registration opens</FieldLabel>

              <input
                name="registrationOpensAt"
                type="datetime-local"
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Registration closes</FieldLabel>

              <input
                name="registrationClosesAt"
                type="datetime-local"
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
                defaultValue="closed"
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
