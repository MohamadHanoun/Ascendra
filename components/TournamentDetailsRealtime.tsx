"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

type TournamentDetailsRealtimeProps = {
  tournamentId: string;
};

const tournamentEventTypes = new Set([
  "tournament.updated",
  "tournament.deleted",
  "tournament.status.updated",
  "tournament.registrationStatus.updated",
  "tournament.registration.updated",
  "tournament.result.updated",
  "leaderboard.updated",
]);

export default function TournamentDetailsRealtime({
  tournamentId,
}: TournamentDetailsRealtimeProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refreshTimeoutRef = useRef<number | null>(null);

  function refreshSoon() {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 250);
  }

  useRealtimeEvents({
    audience: "public",
    intervalSeconds: 2,
    onEvents(events) {
      const shouldRefresh = events.some((event) => {
        if (!tournamentEventTypes.has(event.type)) {
          return false;
        }

        if (!event.entityId) {
          return true;
        }

        return (
          event.entityId === tournamentId ||
          event.entityType === "registration" ||
          event.entityType === "result"
        );
      });

      if (shouldRefresh) {
        refreshSoon();
      }
    },
  });

  return null;
}
