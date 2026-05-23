"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

const refreshEventTypes = new Set([
  "bot.heartbeat",
  "bot.event.updated",
  "bot.command.queued",
  "bot.events.locked",
  "bot.events.recovered",
  "bot.events.failed",
  "bot.events.processing.reset",
  "bot.events.pending.cancelled",
  "bot.events.cleaned",
  "bot.queue.paused",
  "bot.queue.resumed",
]);

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
    intervalSeconds: 3,
    onEvents(events) {
      const shouldRefresh = events.some((event) =>
        refreshEventTypes.has(event.type),
      );

      if (shouldRefresh) {
        refresh();
      }
    },
  });

  return null;
}
