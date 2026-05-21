"use client";

import { useMemo, useState } from "react";

import { getTournamentImageUrl } from "@/lib/tournamentImages";

type AdminTournamentImageFieldsProps = {
  games: string[];
  defaultGame?: string;
  defaultImageUrl?: string | null;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-bold text-gray-200">{children}</span>;
}

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400";
}

function isValidImageUrl(imageUrl: string) {
  if (!imageUrl) {
    return true;
  }

  return (
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("/")
  );
}

export default function AdminTournamentImageFields({
  games,
  defaultGame = "",
  defaultImageUrl = "",
}: AdminTournamentImageFieldsProps) {
  const [game, setGame] = useState(defaultGame);
  const [imageUrl, setImageUrl] = useState(defaultImageUrl || "");

  const trimmedImageUrl = imageUrl.trim();

  const hasInvalidImageUrl =
    Boolean(trimmedImageUrl) && !isValidImageUrl(trimmedImageUrl);

  const previewImageUrl = useMemo(() => {
    if (trimmedImageUrl && isValidImageUrl(trimmedImageUrl)) {
      return trimmedImageUrl;
    }

    return getTournamentImageUrl(game, null);
  }, [game, trimmedImageUrl]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <label className="grid gap-2">
          <FieldLabel>Game</FieldLabel>

          <select
            name="game"
            required
            value={game}
            onChange={(event) => setGame(event.target.value)}
            className={inputClass()}
          >
            <option value="" disabled>
              Select game
            </option>

            {games.map((gameName) => (
              <option key={gameName} value={gameName}>
                {gameName}
              </option>
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
            className={inputClass()}
          />
        </label>
      </div>

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
        <div
          className="h-28 rounded-xl border border-white/10 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(7,8,17,0.08), rgba(7,8,17,0.62)), url("${previewImageUrl}")`,
          }}
        />

        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-300">
            Image preview
          </p>

          <p className="mt-1 font-black text-white">
            {game || "Select a game"}
          </p>

          <p className="mt-1 text-sm leading-6 text-gray-400">
            {trimmedImageUrl && !hasInvalidImageUrl
              ? "Custom tournament image selected."
              : "Automatic game image will be used."}
          </p>
        </div>
      </div>

      {hasInvalidImageUrl && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
          Image URL must start with http://, https://, or /.
        </p>
      )}
    </div>
  );
}
