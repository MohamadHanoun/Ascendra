"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

type RealtimeEvent = {
  type: string;
};

export default function AdminRegistrationsRealtime() {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [lastUpdateAt, setLastUpdateAt] = useState<Date | null>(null);
  const [lastEventCount, setLastEventCount] = useState(0);

  function refresh(eventCount = 0) {
    startTransition(() => {
      router.refresh();
      setLastUpdateAt(new Date());

      if (eventCount > 0) {
        setLastEventCount(eventCount);
      }
    });
  }

  function shouldRefreshFromAdminEvents(events: RealtimeEvent[]) {
    return events.some((event) =>
      [
        "registration.approved",
        "registration.rejected",
        "registration.cancelled",
        "bot.event.updated",
      ].includes(event.type),
    );
  }

  function shouldRefreshFromPublicEvents(events: RealtimeEvent[]) {
    return events.some((event) =>
      [
        "tournament.registration.updated",
        "tournament.updated",
        "tournament.deleted",
        "tournament.status.updated",
        "tournament.registrationStatus.updated",
      ].includes(event.type),
    );
  }

  useRealtimeEvents({
    audience: "admin",
    intervalSeconds: 5,
    onEvents(events) {
      if (shouldRefreshFromAdminEvents(events)) {
        refresh(events.length);
      }
    },
  });

  useRealtimeEvents({
    audience: "public",
    intervalSeconds: 5,
    onEvents(events) {
      if (shouldRefreshFromPublicEvents(events)) {
        refresh(events.length);
      }
    },
  });

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
          Realtime registrations
        </p>

        <p className="mt-1 text-sm leading-6 text-gray-300">
          Updates when registration, tournament, or bot status changes are
          detected.
        </p>

        {lastUpdateAt && (
          <p className="mt-1 text-xs text-gray-500">
            Last update: {lastUpdateAt.toLocaleTimeString()}
            {lastEventCount > 0 ? ` · ${lastEventCount} event(s)` : ""}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => refresh()}
        disabled={isPending}
        className="rounded-xl border border-violet-400/35 bg-violet-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Refreshing..." : "Refresh now"}
      </button>
    </div>
  );
}
