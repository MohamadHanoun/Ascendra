"use client";

import { useActionState, useState } from "react";

import {
  updateProfilePrivacy,
  type PrivacyActionResult,
} from "@/actions/profileSettingsActions";

type PrivacyTogglesProps = {
  initial: {
    publicProfileEnabled: boolean;
    showDiscordId: boolean;
    showTeams: boolean;
    showTournamentHistory: boolean;
  };
  labels: {
    masterTitle: string;
    masterDesc: string;
    showDiscordId: string;
    showTeams: string;
    showTournamentHistory: string;
    save: string;
    saving: string;
  };
};

const INITIAL: PrivacyActionResult = { ok: false, message: "" };

function Switch({
  name,
  checked,
  disabled,
  onChange,
}: {
  name: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <>
      <input type="hidden" name={name} value={checked ? "on" : "off"} />
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 items-center border transition disabled:opacity-40"
        style={{
          borderColor: checked && !disabled ? "var(--asc-accent-border)" : "var(--asc-line-soft)",
          background: checked && !disabled ? "var(--asc-accent-dim)" : "transparent",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <span
          aria-hidden="true"
          className="inline-block h-4 w-4 transition-transform"
          style={{
            background: checked && !disabled ? "var(--asc-accent)" : "var(--asc-fg-3)",
            transform: checked ? "translateX(22px)" : "translateX(3px)",
          }}
        />
      </button>
    </>
  );
}

function ToggleRow({
  label,
  name,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  name: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <p
        className="text-sm font-black"
        style={{ color: disabled ? "var(--asc-fg-3)" : "var(--asc-fg-1)" }}
      >
        {label}
      </p>
      <Switch name={name} checked={checked} disabled={disabled} onChange={onChange} />
    </div>
  );
}

export default function PrivacyToggles({ initial, labels }: PrivacyTogglesProps) {
  const [state, formAction, pending] = useActionState(updateProfilePrivacy, INITIAL);

  const [publicEnabled, setPublicEnabled] = useState(initial.publicProfileEnabled);
  const [showDiscordId, setShowDiscordId] = useState(initial.showDiscordId);
  const [showTeams, setShowTeams] = useState(initial.showTeams);
  const [showHistory, setShowHistory] = useState(initial.showTournamentHistory);

  const subDisabled = !publicEnabled;

  return (
    <form
      action={formAction}
      className="border"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      {/* Master toggle */}
      <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: "var(--asc-line-soft)" }}>
        <div>
          <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
            {labels.masterTitle}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
            {labels.masterDesc}
          </p>
        </div>
        <Switch
          name="publicProfileEnabled"
          checked={publicEnabled}
          onChange={setPublicEnabled}
        />
      </div>

      {/* Sub-toggles */}
      <div className="grid gap-px" style={{ background: "var(--asc-line-soft)" }}>
        <div style={{ background: "var(--asc-bg-1)" }}>
          <ToggleRow
            label={labels.showDiscordId}
            name="showDiscordId"
            checked={showDiscordId}
            disabled={subDisabled}
            onChange={setShowDiscordId}
          />
        </div>
        <div style={{ background: "var(--asc-bg-1)" }}>
          <ToggleRow
            label={labels.showTeams}
            name="showTeams"
            checked={showTeams}
            disabled={subDisabled}
            onChange={setShowTeams}
          />
        </div>
        <div style={{ background: "var(--asc-bg-1)" }}>
          <ToggleRow
            label={labels.showTournamentHistory}
            name="showTournamentHistory"
            checked={showHistory}
            disabled={subDisabled}
            onChange={setShowHistory}
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex flex-wrap items-center gap-3 border-t px-5 py-4" style={{ borderColor: "var(--asc-line-soft)" }}>
        <button
          type="submit"
          disabled={pending}
          className="border px-5 py-2.5 text-xs font-black uppercase tracking-[0.10em] transition hover:opacity-80 disabled:opacity-40"
          style={{
            borderColor: "var(--asc-accent-border)",
            color: "var(--asc-accent)",
            background: "var(--asc-accent-dim)",
          }}
        >
          {pending ? labels.saving : labels.save}
        </button>
        {state.message && (
          <p
            className="text-xs"
            style={{ color: state.ok ? "var(--asc-green)" : "var(--asc-live)" }}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
