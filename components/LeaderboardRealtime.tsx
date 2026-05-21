"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

export default function LeaderboardRealtime() {
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
        ["leaderboard.updated", "tournament.result.updated"].includes(
          event.type,
        ),
      );

      if (shouldRefresh) {
        refresh();
      }
    },
  });

  return null;
}
