"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

const adminMatchEventTypes = new Set([
  "tournament.match.report_submitted",
  "tournament.match.confirmed",
  "tournament.match.disputed",
  "tournament.match.game_completed",
  "tournament.match.advanced",
  "tournament.match.room_linked",
  "tournament.match.communication_updated",
  "tournament.match.checkin_updated",
  "tournament.match.proof_synced",
]);

const publicMatchEventTypes = new Set([
  "tournament.match.confirmed",
  "tournament.match.advanced",
  "tournament.result.updated",
]);

export default function AdminMatchOperationsRealtime() {
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
    audience: "admin",
    intervalSeconds: 4,
    onEvents(events) {
      const shouldRefresh = events.some((event) =>
        adminMatchEventTypes.has(event.type),
      );

      if (shouldRefresh) {
        refreshSoon();
      }
    },
  });

  useRealtimeEvents({
    audience: "public",
    intervalSeconds: 4,
    onEvents(events) {
      const shouldRefresh = events.some((event) =>
        publicMatchEventTypes.has(event.type),
      );

      if (shouldRefresh) {
        refreshSoon();
      }
    },
  });

  return null;
}
