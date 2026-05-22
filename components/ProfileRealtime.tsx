"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

const profileEventTypes = new Set([
  "profile.updated",
  "team.created",
  "team.updated",
  "team.deleted",
  "team.member.updated",
  "team.member.added",
  "team.member.removed",
  "team.invite.created",
  "team.invite.updated",
  "team.invite.accepted",
  "team.invite.rejected",
  "team.invite.cancelled",
  "tournament.registration.updated",
  "tournament.result.updated",
  "leaderboard.updated",
]);

export default function ProfileRealtime() {
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
        if (profileEventTypes.has(event.type)) {
          return true;
        }

        if (event.entityType === "team") {
          return true;
        }

        if (event.entityType === "profile") {
          return true;
        }

        return false;
      });

      if (shouldRefresh) {
        refreshSoon();
      }
    },
  });

  return null;
}
