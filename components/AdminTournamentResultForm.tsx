"use client";

import { useState } from "react";

import { saveTournamentResultInline } from "@/actions/adminTournamentResultActions";
import CustomSelect from "@/components/CustomSelect";
import InlineAdminTournamentForm from "@/components/InlineAdminTournamentForm";

type TournamentRegistrationItem = {
  id: string;
  status: string;
  teamId: string;
  snapshotTeamName?: string | null;
  snapshotTeamGame?: string | null;
  team: {
    id: string;
    name: string;
    game: string;
  };
};

type ExistingResultItem = {
  teamId: string;
  placement: number;
  points: number;
};

type AdminTournamentResultFormProps = {
  tournamentId: string;
  registrations: TournamentRegistrationItem[];
  results: ExistingResultItem[];
};

const presets = [
  {
    label: "Champion",
    placement: 1,
    points: 10,
    note: "Champion",
  },
  {
    label: "Runner-up",
    placement: 2,
    points: 7,
    note: "Runner-up",
  },
  {
    label: "Third place",
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
  return "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-bold text-gray-200">{children}</span>;
}

function getNextPlacement(results: ExistingResultItem[]) {
  if (results.length === 0) {
    return 1;
  }

  const usedPlacements = new Set(results.map((result) => result.placement));
  let placement = 1;

  while (usedPlacements.has(placement)) {
    placement += 1;
  }

  return placement;
}

function getSuggestedPoints(placement: number) {
  if (placement === 1) {
    return 10;
  }

  if (placement === 2) {
    return 7;
  }

  if (placement === 3) {
    return 5;
  }

  return 1;
}

function getSuggestedNote(placement: number) {
  if (placement === 1) {
    return "Champion";
  }

  if (placement === 2) {
    return "Runner-up";
  }

  if (placement === 3) {
    return "Third place";
  }

  return "Participation";
}

export default function AdminTournamentResultForm({
  tournamentId,
  registrations,
  results,
}: AdminTournamentResultFormProps) {
  const nextPlacement = getNextPlacement(results);

  const [placement, setPlacement] = useState(nextPlacement);
  const [points, setPoints] = useState(getSuggestedPoints(nextPlacement));
  const [note, setNote] = useState(getSuggestedNote(nextPlacement));

  const existingResultTeamIds = new Set(results.map((result) => result.teamId));

  const options = registrations.map((registration) => {
    const alreadyHasResult = existingResultTeamIds.has(registration.teamId);
    const teamName = registration.snapshotTeamName || registration.team.name;
    const teamGame = registration.snapshotTeamGame || registration.team.game;

    return {
      value: registration.teamId,
      label: alreadyHasResult ? `${teamName} · update result` : teamName,
      description: `${teamGame} · approved${
        alreadyHasResult ? " · result saved" : ""
      }`,
    };
  });

  function applyPreset(preset: (typeof presets)[number]) {
    setPlacement(preset.placement);
    setPoints(preset.points);
    setNote(preset.note);
  }

  function applyNextAvailablePlacement() {
    const availablePlacement = getNextPlacement(results);

    setPlacement(availablePlacement);
    setPoints(getSuggestedPoints(availablePlacement));
    setNote(getSuggestedNote(availablePlacement));
  }

  function handlePlacementChange(value: number) {
    setPlacement(value);
    setPoints(getSuggestedPoints(value));
    setNote(getSuggestedNote(value));
  }

  return (
    <InlineAdminTournamentForm
      action={saveTournamentResultInline}
      buttonLabel="Save result"
      pendingLabel="Saving..."
      variant="success"
      className="grid gap-5"
    >
      <input type="hidden" name="tournamentId" value={tournamentId} />

      <label className="grid gap-2">
        <FieldLabel>Team</FieldLabel>

        <CustomSelect
          name="teamId"
          required
          placeholder="Select approved team"
          options={options}
        />
      </label>

      <div className="grid gap-2">
        <FieldLabel>Quick presets</FieldLabel>

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
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-black/25 text-gray-300 hover:border-violet-400/30 hover:bg-white/10 hover:text-white"
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

      <button
        type="button"
        onClick={applyNextAvailablePlacement}
        className="w-fit rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-sm font-black text-violet-200 transition hover:bg-violet-500/20"
      >
        Use next placement
      </button>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <FieldLabel>Placement</FieldLabel>

          <input
            name="placement"
            type="number"
            min="1"
            required
            value={placement}
            onChange={(event) =>
              handlePlacementChange(Number(event.target.value))
            }
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
          placeholder="Optional note"
          className={inputClass()}
        />
      </label>
    </InlineAdminTournamentForm>
  );
}
