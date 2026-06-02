"use client";

import { invitePlayerToTeam } from "@/actions/teamActions";
import { useEffect, useState } from "react";

type Player = {
  id: string;
  username: string;
  avatar: string | null;
};

type PlayerInviteSearchProps = {
  teamId: string;
};

export default function PlayerInviteSearch({ teamId }: PlayerInviteSearchProps) {
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prevQuery, setPrevQuery] = useState(query);

  if (prevQuery !== query) {
    setPrevQuery(query);
    if (query.trim().length < 2) {
      setPlayers([]);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const cleanQuery = query.trim();

    if (cleanQuery.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/players/search?teamId=${teamId}&q=${encodeURIComponent(cleanQuery)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          setPlayers([]);
          return;
        }

        const data = (await response.json()) as Player[];
        setPlayers(data);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, teamId]);

  function handleInputChange(value: string) {
    setQuery(value);
    setSelectedPlayer(null);
  }

  function selectPlayer(player: Player) {
    setSelectedPlayer(player);
    setQuery(player.username);
    setPlayers([]);
  }

  return (
    <div className="grid gap-4">
      <div className="relative">
        <input
          value={query}
          onChange={(event) => handleInputChange(event.target.value)}
          placeholder="Search registered player..."
          className="w-full border px-4 py-3 text-white outline-none transition"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
        />

        {query.trim().length >= 2 && !selectedPlayer && (
          <div
            className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden border shadow-2xl"
            style={{ borderColor: "var(--asc-line)", background: "var(--asc-bg-1)" }}
          >
            {isLoading ? (
              <p className="p-4 text-sm" style={{ color: "var(--asc-fg-3)" }}>Searching...</p>
            ) : players.length === 0 ? (
              <p className="p-4 text-sm" style={{ color: "var(--asc-fg-3)" }}>No matching players found.</p>
            ) : (
              players.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => selectPlayer(player)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:opacity-90"
                  style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
                >
                  {player.avatar ? (
                    <img src={player.avatar} alt={player.username} className="h-9 w-9 object-cover" />
                  ) : (
                    <span
                      className="grid h-9 w-9 place-items-center text-xs font-black"
                      style={{ background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
                    >
                      {player.username.slice(0, 2).toUpperCase()}
                    </span>
                  )}

                  <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>
                    {player.username}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {selectedPlayer && (
        <div
          className="border p-4"
          style={{ borderColor: "var(--asc-blue-border)", background: "var(--asc-blue-bg)" }}
        >
          <p className="text-sm" style={{ color: "var(--asc-blue)" }}>Selected player</p>
          <p className="mt-1 font-bold" style={{ color: "var(--asc-fg-0)" }}>{selectedPlayer.username}</p>
        </div>
      )}

      <form action={invitePlayerToTeam} className="grid gap-3 sm:flex">
        <input type="hidden" name="teamId" value={teamId} />
        <input type="hidden" name="playerId" value={selectedPlayer?.id || ""} />

        <button
          type="submit"
          disabled={!selectedPlayer}
          className="px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "var(--asc-accent-2)" }}
        >
          Send Invite
        </button>

        <p className="self-center text-sm" style={{ color: "var(--asc-fg-3)" }}>
          The player must be registered and connected to Ascendra Discord.
        </p>
      </form>
    </div>
  );
}
