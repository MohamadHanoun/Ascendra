"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

export default function LeaderboardRealtime() {
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
    intervalSeconds: 3,
    onEvents(events) {
      const shouldRefresh = events.some((event) =>
        ["leaderboard.updated", "tournament.result.updated"].includes(
          event.type,
        ),
      );

      if (shouldRefresh) {
        refreshSoon();
      }
    },
  });

  return null;
}
