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

export default function PlayerInviteSearch({
  teamId,
}: PlayerInviteSearchProps) {
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const cleanQuery = query.trim();

    if (cleanQuery.length < 2) {
      setPlayers([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/players/search?teamId=${teamId}&q=${encodeURIComponent(
            cleanQuery,
          )}`,
          {
            cache: "no-store",
          },
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
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-cyan-400"
        />

        {query.trim().length >= 2 && !selectedPlayer && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl">
            {isLoading ? (
              <p className="p-4 text-sm text-gray-400">Searching...</p>
            ) : players.length === 0 ? (
              <p className="p-4 text-sm text-gray-400">
                No matching players found.
              </p>
            ) : (
              players.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => selectPlayer(player)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/10"
                >
                  {player.avatar ? (
                    <img
                      src={player.avatar}
                      alt={player.username}
                      className="h-9 w-9 rounded-full"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-black text-indigo-300">
                      RTN
                    </span>
                  )}

                  <span className="font-semibold text-white">
                    {player.username}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {selectedPlayer && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
          <p className="text-sm text-cyan-300">Selected player</p>
          <p className="mt-1 font-bold text-white">{selectedPlayer.username}</p>
        </div>
      )}

      <form action={invitePlayerToTeam} className="grid gap-3 sm:flex">
        <input type="hidden" name="teamId" value={teamId} />
        <input type="hidden" name="playerId" value={selectedPlayer?.id || ""} />

        <button
          type="submit"
          disabled={!selectedPlayer}
          className="rounded-xl bg-indigo-500 px-5 py-3 font-bold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send Invite
        </button>

        <p className="self-center text-sm text-gray-400">
          The player must be registered and connected to RTN Discord.
        </p>
      </form>
    </div>
  );
}
