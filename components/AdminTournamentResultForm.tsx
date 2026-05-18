"use client";

import { useState } from "react";
import { saveTournamentResultInline } from "@/actions/adminTournamentResultActions";
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

type AdminTournamentResultFormProps = {
  tournamentId: string;
  registrations: TournamentRegistrationItem[];
};

const presets = [
  {
    label: "1st place",
    placement: 1,
    points: 10,
    note: "Winner",
  },
  {
    label: "2nd place",
    placement: 2,
    points: 7,
    note: "Second place",
  },
  {
    label: "3rd place",
    placement: 3,
    points: 5,
    note: "Third place",
  },
  {
    label: "Participation",
    placement: 4,
    points: 1,
    note: "Participation",
  },
];

function inputClass() {
  return "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-bold text-gray-200">{children}</span>;
}

export default function AdminTournamentResultForm({
  tournamentId,
  registrations,
}: AdminTournamentResultFormProps) {
  const [placement, setPlacement] = useState(1);
  const [points, setPoints] = useState(10);
  const [note, setNote] = useState("Winner");

  function applyPreset(preset: (typeof presets)[number]) {
    setPlacement(preset.placement);
    setPoints(preset.points);
    setNote(preset.note);
  }

  return (
    <InlineAdminTournamentForm
      action={saveTournamentResultInline}
      buttonLabel="Save result"
      pendingLabel="Saving result..."
      variant="success"
      className="grid gap-4"
    >
      <input type="hidden" name="tournamentId" value={tournamentId} />

      <label className="grid gap-2">
        <FieldLabel>Team</FieldLabel>

        <select name="teamId" required defaultValue="" className={inputClass()}>
          <option value="" disabled>
            Select team
          </option>

          {registrations.map((registration) => (
            <option key={registration.id} value={registration.teamId}>
              {registration.team.name} · {registration.status}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-2">
        <FieldLabel>Result preset</FieldLabel>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {presets.map((preset) => {
            const isActive =
              placement === preset.placement && points === preset.points;

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-green-500/30 bg-green-500/10 text-green-300"
                    : "border-white/10 bg-black/20 text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="block text-sm font-black">{preset.label}</span>

                <span className="mt-1 block text-xs font-bold text-gray-500">
                  #{preset.placement} · {preset.points} pts
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <FieldLabel>Placement</FieldLabel>

          <input
            name="placement"
            type="number"
            min="1"
            required
            value={placement}
            onChange={(event) => setPlacement(Number(event.target.value))}
            className={inputClass()}
          />
        </label>

        <label className="grid gap-2">
          <FieldLabel>Points</FieldLabel>

          <input
            name="points"
            type="number"
            min="0"
            required
            value={points}
            onChange={(event) => setPoints(Number(event.target.value))}
            className={inputClass()}
          />
        </label>
      </div>

      <label className="grid gap-2">
        <FieldLabel>Note</FieldLabel>

        <input
          name="note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note, example: Winner, second place, participation..."
          className={inputClass()}
        />
      </label>
    </InlineAdminTournamentForm>
  );
}
