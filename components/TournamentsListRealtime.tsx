"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  useRealtimePublicRoom,
  useRealtimeSocket,
} from "@/components/realtime/realtimeContext";
import { shouldRefreshTournamentsListFromRealtimeEvent } from "@/components/tournament/tournamentsListRealtimeUtils";

/**
 * RC10 (Batch 10A) — additive socket trigger for public tournament-list
 * surfaces (/tournaments and the homepage tournament sections). Inert unless
 * realtime is enabled and connected. Joins ONLY the public `tournaments` room
 * and re-runs a debounced router.refresh(); the socket event is only used as
 * a refresh signal and is never trusted for UI state or logged. The existing
 * DB-polling refreshers (TournamentsRealtimeRefresh / HomeRealtimeRefresh)
 * stay mounted and unchanged as the fallback.
 */
export default function TournamentsListRealtime() {
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

  useRealtimePublicRoom("tournaments");
  const { subscribe } = useRealtimeSocket();
  const refreshSoonRef = useRef(refreshSoon);
  refreshSoonRef.current = refreshSoon;

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (shouldRefreshTournamentsListFromRealtimeEvent(event)) {
        refreshSoonRef.current();
      }
    });
    return unsubscribe;
  }, [subscribe]);

  return null;
}
