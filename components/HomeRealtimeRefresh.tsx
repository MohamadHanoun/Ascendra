"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

const homeEventTypes = new Set([
  "leaderboard.updated",
  "tournament.result.updated",
  "tournament.match.confirmed",
  "tournament.match.advanced",
  "tournament.status.updated",
  "tournament.bracket.generated",
]);

export default function HomeRealtimeRefresh() {
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
    }, 500);
  }

  useRealtimeEvents({
    audience: "public",
    intervalSeconds: 8,
    onEvents(events) {
      const shouldRefresh = events.some((event) =>
        homeEventTypes.has(event.type),
      );

      if (shouldRefresh) {
        refreshSoon();
      }
    },
  });

  return null;
}
