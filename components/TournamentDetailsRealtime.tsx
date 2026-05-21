"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

type TournamentDetailsRealtimeProps = {
  tournamentId: string;
};

export default function TournamentDetailsRealtime({
  tournamentId,
}: TournamentDetailsRealtimeProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [lastUpdateAt, setLastUpdateAt] = useState<Date | null>(null);

  function refresh() {
    startTransition(() => {
      router.refresh();
      setLastUpdateAt(new Date());
    });
  }

  useRealtimeEvents({
    audience: "public",
    intervalSeconds: 5,
    onEvents(events) {
      const shouldRefresh = events.some((event) => {
        if (event.entityType !== "tournament") {
          return false;
        }

        if (event.entityId !== tournamentId) {
          return false;
        }

        return [
          "tournament.created",
          "tournament.updated",
          "tournament.deleted",
          "tournament.status.updated",
          "tournament.registrationStatus.updated",
          "tournament.registration.updated",
          "tournament.result.updated",
        ].includes(event.type);
      });

      if (shouldRefresh) {
        refresh();
      }
    },
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
            Live tournament
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Updates when tournament data or registrations change.
          </p>

          {lastUpdateAt && (
            <p className="mt-1 text-xs text-gray-500">
              Last update: {lastUpdateAt.toLocaleTimeString()}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={isPending}
          className="rounded-xl border border-violet-400/35 bg-violet-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Refreshing..." : "Refresh now"}
        </button>
      </div>
    </div>
  );
}
