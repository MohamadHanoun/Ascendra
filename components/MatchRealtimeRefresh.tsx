"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import {
  useRealtimePublicRoom,
  useRealtimeSocket,
} from "@/components/realtime/realtimeContext";
import { shouldRefreshMatchFromRealtimeEvent } from "@/components/match/matchRealtimeUtils";

type MatchRealtimeRefreshProps = {
  tournamentId: string;
  matchId: string;
  listenToAdminEvents?: boolean;
};

type RealtimeAudience = "public" | "admin";

type RealtimeEventLike = {
  type: string;
  entityId?: string | null;
  payload?: unknown;
};

const matchEventTypes = new Set([
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

function getPayloadString(payload: unknown, key: string) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function isRelevantMatchEvent(
  event: RealtimeEventLike,
  tournamentId: string,
  matchId: string,
) {
  if (!matchEventTypes.has(event.type)) {
    return false;
  }

  if (event.entityId === matchId || event.entityId === tournamentId) {
    return true;
  }

  return (
    getPayloadString(event.payload, "matchId") === matchId ||
    getPayloadString(event.payload, "tournamentId") === tournamentId
  );
}

function MatchRealtimeSubscription({
  audience,
  tournamentId,
  matchId,
  onRefresh,
}: {
  audience: RealtimeAudience;
  tournamentId: string;
  matchId: string;
  onRefresh: () => void;
}) {
  useRealtimeEvents({
    audience,
    intervalSeconds: 2,
    onEvents(events) {
      const shouldRefresh = events.some((event) =>
        isRelevantMatchEvent(event, tournamentId, matchId),
      );

      if (shouldRefresh) {
        onRefresh();
      }
    },
  });

  return null;
}

export default function MatchRealtimeRefresh({
  tournamentId,
  matchId,
  listenToAdminEvents = false,
}: MatchRealtimeRefreshProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

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

  // Additive socket trigger (Batch 5A — inert unless realtime is enabled and
  // connected). Joins only the public match:{id} room and re-runs the same
  // debounced router.refresh; the socket event is only used to match the
  // mounted match and is never trusted for UI state or logged. The DB-polling
  // subscriptions below are unchanged and remain the fallback.
  useRealtimePublicRoom(`match:${matchId}`);
  const { subscribe } = useRealtimeSocket();
  const refreshSoonRef = useRef(refreshSoon);
  refreshSoonRef.current = refreshSoon;

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (shouldRefreshMatchFromRealtimeEvent(event, matchId)) {
        refreshSoonRef.current();
      }
    });
    return unsubscribe;
  }, [subscribe, matchId]);

  return (
    <>
      <MatchRealtimeSubscription
        audience="public"
        tournamentId={tournamentId}
        matchId={matchId}
        onRefresh={refreshSoon}
      />
      {listenToAdminEvents && (
        <MatchRealtimeSubscription
          audience="admin"
          tournamentId={tournamentId}
          matchId={matchId}
          onRefresh={refreshSoon}
        />
      )}
    </>
  );
}
