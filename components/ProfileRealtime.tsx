"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

export default function ProfileRealtime() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  useRealtimeEvents({
    audience: "public",
    intervalSeconds: 5,
    onEvents(events) {
      const shouldRefresh = events.some((event) =>
        [
          "tournament.registration.updated",
          "tournament.result.updated",
          "leaderboard.updated",
          "profile.updated",
        ].includes(event.type),
      );

      if (shouldRefresh) {
        refresh();
      }
    },
  });

  return null;
}
