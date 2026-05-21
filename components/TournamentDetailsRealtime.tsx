"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

type TournamentDetailsRealtimeProps = {
  tournamentId: string;
};

export default function TournamentDetailsRealtime({
  tournamentId,
}: TournamentDetailsRealtimeProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  useRealtimeEvents({
    audience: "public",
    intervalSeconds: 5,
    onEvents(events) {
      const shouldRefresh = events.some((event) => {
        return (
          event.entityType === "tournament" &&
          event.entityId === tournamentId &&
          [
            "tournament.updated",
            "tournament.deleted",
            "tournament.status.updated",
            "tournament.registrationStatus.updated",
            "tournament.registration.updated",
            "tournament.result.updated",
          ].includes(event.type)
        );
      });

      if (shouldRefresh) {
        refresh();
      }
    },
  });

  return null;
}
