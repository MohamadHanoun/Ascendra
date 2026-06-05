"use client";

import { useActionState, useState } from "react";

import {
  updateProfileInfo,
  type ProfileInfoActionResult,
} from "@/actions/profileSettingsActions";

const DISPLAY_NAME_MAX = 32;
const BIO_MAX = 280;

type ProfileInfoFormProps = {
  initial: {
    displayName: string;
    bio: string;
  };
  usernameFallback: string;
  labels: {
    title: string;
    description: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    displayNameHelp: string;
    bioLabel: string;
    bioPlaceholder: string;
    save: string;
    saving: string;
  };
};

const INITIAL: ProfileInfoActionResult = { ok: false, message: "" };

export default function ProfileInfoForm({ initial, usernameFallback, labels }: ProfileInfoFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileInfo, INITIAL);

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);

  return (
    <form
      action={formAction}
      className="border"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div className="border-b px-5 py-4" style={{ borderColor: "var(--asc-line-soft)" }}>
        <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
          {labels.title}
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
          {labels.description}
        </p>
      </div>

      <div className="grid gap-5 px-5 py-5">
        {/* Display name */}
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor="profile-display-name"
              className="text-[10px] font-black uppercase tracking-[0.16em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {labels.displayNameLabel}
            </label>
            <span className="text-[10px] tabular-nums" style={{ color: "var(--asc-fg-3)" }}>
              {displayName.length}/{DISPLAY_NAME_MAX}
            </span>
          </div>
          <input
            id="profile-display-name"
            name="displayName"
            type="text"
            maxLength={DISPLAY_NAME_MAX}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={labels.displayNamePlaceholder || usernameFallback}
            className="w-full border px-3 py-2.5 text-sm outline-none transition focus:border-[var(--asc-accent-border)]"
            style={{
              borderColor: "var(--asc-line-soft)",
              background: "var(--asc-bg-2)",
              color: "var(--asc-fg-0)",
            }}
          />
          <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
            {labels.displayNameHelp}
          </p>
        </div>

        {/* Bio */}
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor="profile-bio"
              className="text-[10px] font-black uppercase tracking-[0.16em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {labels.bioLabel}
            </label>
            <span className="text-[10px] tabular-nums" style={{ color: "var(--asc-fg-3)" }}>
              {bio.length}/{BIO_MAX}
            </span>
          </div>
          <textarea
            id="profile-bio"
            name="bio"
            rows={4}
            maxLength={BIO_MAX}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder={labels.bioPlaceholder}
            className="w-full resize-y border px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-[var(--asc-accent-border)]"
            style={{
              borderColor: "var(--asc-line-soft)",
              background: "var(--asc-bg-2)",
              color: "var(--asc-fg-0)",
            }}
          />
        </div>
      </div>

      {/* Save */}
      <div
        className="flex flex-wrap items-center gap-3 border-t px-5 py-4"
        style={{ borderColor: "var(--asc-line-soft)" }}
      >
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
