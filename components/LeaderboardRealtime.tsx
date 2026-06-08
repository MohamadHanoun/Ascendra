"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import {
  useRealtimePublicRoom,
  useRealtimeSocket,
} from "@/components/realtime/realtimeContext";
import { shouldRefreshLeaderboardFromRealtimeEvent } from "@/components/leaderboard/leaderboardRealtimeUtils";

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

  // Existing DB-polling listener — unchanged; remains the source of truth/fallback.
  useRealtimeEvents({
    audience: "public",
    intervalSeconds: 3,
    onEvents(events) {
      const shouldRefresh = events.some((event) =>
        shouldRefreshLeaderboardFromRealtimeEvent(event),
      );

      if (shouldRefresh) {
        refreshSoon();
      }
    },
  });

  // Additive socket trigger (inert unless realtime is enabled + connected).
  // It only re-runs the same debounced router.refresh; the socket payload is
  // never trusted for UI state and is never logged.
  useRealtimePublicRoom("leaderboard");
  const { subscribe } = useRealtimeSocket();
  const refreshSoonRef = useRef(refreshSoon);
  refreshSoonRef.current = refreshSoon;

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (shouldRefreshLeaderboardFromRealtimeEvent(event)) {
        refreshSoonRef.current();
      }
    });
    return unsubscribe;
  }, [subscribe]);

  return null;
}
