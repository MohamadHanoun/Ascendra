"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

export default function AdminBotAutoRefresh() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  useRealtimeEvents({
    audience: "admin",
    intervalSeconds: 10,
    onEvents(events) {
      const shouldRefresh = events.some((event) =>
        ["bot.heartbeat", "bot.event.updated"].includes(event.type),
      );

      if (shouldRefresh) {
        refresh();
      }
    },
  });

  return null;
}
