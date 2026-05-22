"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

const adminEventTypes = new Set([
  "registration.approved",
  "registration.rejected",
  "registration.cancelled",
  "bot.event.updated",
]);

const publicEventTypes = new Set([
  "tournament.registration.updated",
  "tournament.updated",
  "tournament.deleted",
  "tournament.status.updated",
  "tournament.registrationStatus.updated",
  "team.updated",
  "team.member.updated",
  "team.invite.updated",
]);

export default function AdminRegistrationsRealtime() {
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
    audience: "admin",
    intervalSeconds: 2,
    onEvents(events) {
      const shouldRefresh = events.some((event) =>
        adminEventTypes.has(event.type),
      );

      if (shouldRefresh) {
        refreshSoon();
      }
    },
  });

  useRealtimeEvents({
    audience: "public",
    intervalSeconds: 2,
    onEvents(events) {
      const shouldRefresh = events.some((event) =>
        publicEventTypes.has(event.type),
      );

      if (shouldRefresh) {
        refreshSoon();
      }
    },
  });

  return null;
}
