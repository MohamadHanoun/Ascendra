"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

const tournamentsEventTypes = new Set([
  "tournament.updated",
  "tournament.status.updated",
  "tournament.registrationStatus.updated",
  "tournament.registration.updated",
  "tournament.deleted",
  "tournament.bracket.generated",
]);

export default function TournamentsRealtimeRefresh() {
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
    }, 300);
  }

  useRealtimeEvents({
    audience: "public",
    intervalSeconds: 5,
    onEvents(events) {
      const shouldRefresh = events.some((event) =>
        tournamentsEventTypes.has(event.type),
      );

      if (shouldRefresh) {
        refreshSoon();
      }
    },
  });

  return null;
}
