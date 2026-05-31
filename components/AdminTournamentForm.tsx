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

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
      {children}
    </span>
  );
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
    <section className="overflow-hidden border shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
          Tournaments
        </p>
        <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Create tournament</h2>
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
            <input name="title" required placeholder="Example: Ascendra Valorant Cup" className="border px-4 py-3 outline-none transition" style={inputStyle} />
          </label>

          <AdminTournamentImageFields games={games} onGameChange={handleGameChange} />

          <label className="grid gap-2">
            <FieldLabel>Description</FieldLabel>
            <textarea name="description" required placeholder="Write a clear tournament description..." className="min-h-24 resize-y border px-4 py-3 text-sm leading-6 outline-none transition" style={inputStyle} />
          </label>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="grid gap-2">
              <FieldLabel>Prize</FieldLabel>
              <input name="prize" placeholder="Example: 500 SEK" className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Max teams</FieldLabel>
              <input name="maxTeams" type="number" min="1" required placeholder="16" className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Min teams</FieldLabel>
              <input name="minTeams" type="number" min="1" defaultValue={2} className="border px-4 py-3 outline-none transition" style={inputStyle} />
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
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
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
                className="border px-4 py-3 outline-none transition"
                style={inputStyle}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Best of</FieldLabel>
              <select name="bestOf" defaultValue="1" className="border px-4 py-3 outline-none transition" style={inputStyle}>
                {[1, 3, 5, 7].map((n) => (
                  <option key={n} value={n}>BO{n}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2">
              <FieldLabel>Format</FieldLabel>
              <select name="format" defaultValue="single_elimination" className="border px-4 py-3 outline-none transition" style={inputStyle}>
                {tournamentFormats.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <FieldLabel>Visibility</FieldLabel>
              <select name="visibility" defaultValue="public" className="border px-4 py-3 outline-none transition" style={inputStyle}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>

            <label className="grid gap-2">
              <FieldLabel>Region</FieldLabel>
              <input name="region" placeholder="e.g. MENA, EU, NA" className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Platform</FieldLabel>
              <select name="platform" defaultValue="" className="border px-4 py-3 outline-none transition" style={inputStyle}>
                <option value="">No platform</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel>Start date</FieldLabel>
              <input name="startsAt" type="datetime-local" className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>

            <label className="grid gap-2">
              <FieldLabel>End date</FieldLabel>
              <input name="endsAt" type="datetime-local" className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel>Registration opens</FieldLabel>
              <input name="registrationOpensAt" type="datetime-local" className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Registration closes</FieldLabel>
              <input name="registrationClosesAt" type="datetime-local" className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel>Tournament status</FieldLabel>
              <select name="status" required defaultValue="upcoming" className="border px-4 py-3 outline-none transition" style={inputStyle}>
                {tournamentStatuses.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <FieldLabel>Registration status</FieldLabel>
              <select name="registrationStatus" required defaultValue="closed" className="border px-4 py-3 outline-none transition" style={inputStyle}>
                {registrationStatuses.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>
          </div>
        </InlineAdminTournamentForm>
      </div>
    </section>
  );
}
