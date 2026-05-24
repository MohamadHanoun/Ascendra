"use client";

import { useMemo, useState } from "react";

import { getTournamentImageUrl } from "@/lib/tournamentImages";

type GameOption = {
  slug: string;
  name: string;
  defaultTeamSize: number;
  defaultSubstitutes: number;
};

type AdminTournamentImageFieldsProps = {
  games: GameOption[];
  defaultGameSlug?: string;
  defaultImageUrl?: string | null;
  onGameChange?: (game: GameOption | undefined) => void;
};

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

function isValidImageUrl(imageUrl: string) {
  if (!imageUrl) return true;
  return imageUrl.startsWith("https://") || imageUrl.startsWith("http://") || imageUrl.startsWith("/");
}

export default function AdminTournamentImageFields({
  games,
  defaultGameSlug = "",
  defaultImageUrl = "",
  onGameChange,
}: AdminTournamentImageFieldsProps) {
  const [gameSlug, setGameSlug] = useState(defaultGameSlug);
  const [imageUrl, setImageUrl] = useState(defaultImageUrl || "");

  const trimmedImageUrl = imageUrl.trim();
  const hasInvalidImageUrl = Boolean(trimmedImageUrl) && !isValidImageUrl(trimmedImageUrl);
  const selectedGame = games.find((g) => g.slug === gameSlug);

  const previewImageUrl = useMemo(() => {
    if (trimmedImageUrl && isValidImageUrl(trimmedImageUrl)) return trimmedImageUrl;
    return getTournamentImageUrl(gameSlug || null, null);
  }, [gameSlug, trimmedImageUrl]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <label className="grid gap-2">
          <FieldLabel>Game</FieldLabel>
          <select
            name="gameSlug"
            required
            value={gameSlug}
            onChange={(event) => {
              const slug = event.target.value;
              setGameSlug(slug);
              onGameChange?.(games.find((g) => g.slug === slug));
            }}
            className="border px-4 py-3 text-white outline-none transition"
            style={inputStyle}
          >
            <option value="" disabled>Select game</option>
            {games.map((game) => (
              <option key={game.slug} value={game.slug}>{game.name}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <FieldLabel>Image URL</FieldLabel>
          <input
            name="imageUrl"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="Optional custom image URL"
            className="border px-4 py-3 text-white outline-none transition"
            style={inputStyle}
          />
        </label>
      </div>

      <div
        className="grid gap-3 border p-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center"
        style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.08 0.02 287)" }}
      >
        <div
          className="h-28 border bg-cover bg-center"
          style={{
            borderColor: "var(--asc-line-soft)",
            backgroundImage: `linear-gradient(to bottom, rgba(7,8,17,0.08), rgba(7,8,17,0.62)), url("${previewImageUrl}")`,
          }}
        />

        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-accent)" }}>Image preview</p>
          <p className="mt-1 font-black" style={{ color: "var(--asc-fg-0)" }}>{selectedGame?.name || "Select a game"}</p>
          <p className="mt-1 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            {trimmedImageUrl && !hasInvalidImageUrl
              ? "Custom tournament image selected."
              : "Automatic game image will be used."}
          </p>
        </div>
      </div>

      {hasInvalidImageUrl && (
        <p
          className="border px-4 py-3 text-sm font-bold"
          style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" }}
        >
          Image URL must start with http://, https://, or /.
        </p>
      )}
    </div>
  );
}
