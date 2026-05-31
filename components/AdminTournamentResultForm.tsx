"use client";

import { useMemo, useState } from "react";

import { saveTournamentResultInline } from "@/actions/adminTournamentResultActions";
import CustomSelect from "@/components/CustomSelect";
import InlineAdminTournamentForm from "@/components/InlineAdminTournamentForm";

type TournamentRegistrationItem = {
  id: string;
  status: string;
  teamId: string;
  snapshotTeamName?: string | null;
  snapshotTeamGame?: string | null;
  team: { id: string; name: string };
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
  { label: "Champion", placement: 1, points: 10, note: "Champion" },
  { label: "Runner-up", placement: 2, points: 7, note: "Runner-up" },
  { label: "Third place", placement: 3, points: 5, note: "Third place" },
  { label: "Participation", placement: 4, points: 1, note: "Participation" },
];

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-xs font-black uppercase tracking-[0.12em]"
      style={{ color: "var(--asc-fg-3)" }}
    >
      {children}
    </span>
  );
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

  const existingResultTeamIds = useMemo(
    () => new Set(results.map((result) => result.teamId)),
    [results],
  );

  const options = registrations.map((registration) => {
    const alreadyHasResult = existingResultTeamIds.has(registration.teamId);
    const teamName = registration.snapshotTeamName || registration.team.name;
    const teamGame = registration.snapshotTeamGame || null;

    return {
      value: registration.teamId,
      label: alreadyHasResult ? `${teamName} · edit result` : teamName,
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
    const safeValue = Number.isFinite(value) && value > 0 ? value : 1;

    setPlacement(safeValue);
    setPoints(getSuggestedPoints(safeValue));
    setNote(getSuggestedNote(safeValue));
  }

  return (
    <InlineAdminTournamentForm
      action={saveTournamentResultInline}
      buttonLabel="Save result"
      pendingLabel="Saving..."
      variant="success"
      className="grid gap-5"
      confirmTitle="Save tournament result?"
      confirmDescription="Save or update this team's official tournament placement and points. This may affect the leaderboard."
      confirmLabel="Save result"
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
                className="border px-4 py-3 text-left transition hover:opacity-90"
                style={
                  isActive
                    ? {
                        borderColor: "var(--asc-green-border)",
                        background: "var(--asc-green-bg)",
                        color: "var(--asc-green)",
                      }
                    : {
                        borderColor: "var(--asc-line-soft)",
                        background: "var(--asc-bg-2)",
                        color: "var(--asc-fg-3)",
                      }
                }
              >
                <span className="block text-sm font-black">{preset.label}</span>

                <span
                  className="mt-1 block text-xs font-bold"
                  style={{ color: "var(--asc-fg-3)" }}
                >
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
        className="w-fit border px-4 py-2 text-sm font-black transition hover:opacity-90"
        style={{
          borderColor: "var(--asc-accent-border)",
          background: "var(--asc-accent-dim)",
          color: "var(--asc-accent)",
          clipPath:
            "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
        }}
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
            className="w-full border px-4 py-3 outline-none transition"
            style={inputStyle}
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
            className="w-full border px-4 py-3 outline-none transition"
            style={inputStyle}
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
          className="w-full border px-4 py-3 outline-none transition"
          style={inputStyle}
        />
      </label>
    </InlineAdminTournamentForm>
  );
}
