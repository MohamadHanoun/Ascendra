"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

const MAX_TIMEOUT_MS = 2_147_483_647;
const REFRESH_BUFFER_MS = 1000;

type TournamentLifecycleRefreshProps = {
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

function parseLifecycleTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export default function TournamentLifecycleRefresh({
  registrationOpensAt,
  registrationClosesAt,
  startsAt,
  endsAt,
}: TournamentLifecycleRefreshProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    let timeoutId: number | null = null;
    let cancelled = false;
    const lifecycleTimes = [
      parseLifecycleTime(registrationOpensAt),
      parseLifecycleTime(registrationClosesAt),
      parseLifecycleTime(startsAt),
      parseLifecycleTime(endsAt),
    ]
      .filter((time): time is number => time !== null)
      .sort((a, b) => a - b);

    function clearTimer() {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    }

    function scheduleNextRefresh() {
      if (cancelled) {
        return;
      }

      clearTimer();

      const now = Date.now();
      const nextTime = lifecycleTimes.find((time) => time > now);

      if (nextTime === undefined) {
        return;
      }

      const delay = Math.min(
        Math.max(nextTime - now + REFRESH_BUFFER_MS, 0),
        MAX_TIMEOUT_MS,
      );

      timeoutId = window.setTimeout(() => {
        timeoutId = null;
        startTransition(() => {
          router.refresh();
        });
        scheduleNextRefresh();
      }, delay);
    }

    scheduleNextRefresh();

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [
    registrationOpensAt,
    registrationClosesAt,
    startsAt,
    endsAt,
    router,
    startTransition,
  ]);

  return null;
}
