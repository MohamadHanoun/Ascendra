"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

export default function AdminRegistrationsRealtime() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  useRealtimeEvents({
    audience: "admin",
    intervalSeconds: 5,
    onEvents(events) {
      const shouldRefresh = events.some((event) =>
        [
          "registration.approved",
          "registration.rejected",
          "registration.cancelled",
          "bot.event.updated",
        ].includes(event.type),
      );

      if (shouldRefresh) {
        refresh();
      }
    },
  });

  useRealtimeEvents({
    audience: "public",
    intervalSeconds: 5,
    onEvents(events) {
      const shouldRefresh = events.some((event) =>
        [
          "tournament.registration.updated",
          "tournament.updated",
          "tournament.deleted",
          "tournament.status.updated",
          "tournament.registrationStatus.updated",
        ].includes(event.type),
      );

      if (shouldRefresh) {
        refresh();
      }
    },
  });

  return null;
}
