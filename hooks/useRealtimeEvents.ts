"use client";

import { useEffect, useRef } from "react";

type RealtimeEvent = {
  id: string;
  type: string;
  audience: string;
  entityType?: string | null;
  entityId?: string | null;
  payload?: unknown;
  createdAt: string;
};

type UseRealtimeEventsOptions = {
  audience?: "public" | "admin";
  intervalSeconds?: number;
  onEvents: (events: RealtimeEvent[]) => void;
};

export function useRealtimeEvents({
  audience = "public",
  intervalSeconds = 10,
  onEvents,
}: UseRealtimeEventsOptions) {
  const cursorRef = useRef<string | null>(null);
  const onEventsRef = useRef(onEvents);

  onEventsRef.current = onEvents;

  useEffect(() => {
    let isActive = true;

    async function fetchEvents() {
      if (document.visibilityState !== "visible") {
        return;
      }

      const params = new URLSearchParams({
        audience,
      });

      if (cursorRef.current) {
        params.set("after", cursorRef.current);
      }

      const response = await fetch(
        `/api/realtime/events?${params.toString()}`,
        {
          cache: "no-store",
          credentials: "same-origin",
        },
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (!isActive) {
        return;
      }

      if (data.cursor) {
        cursorRef.current = data.cursor;
      }

      if (Array.isArray(data.events) && data.events.length > 0) {
        onEventsRef.current(data.events);
      }
    }

    fetchEvents();

    const interval = window.setInterval(fetchEvents, intervalSeconds * 1000);

    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, [audience, intervalSeconds]);
}
