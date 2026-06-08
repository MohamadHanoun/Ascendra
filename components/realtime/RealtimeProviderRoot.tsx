"use client";

/**
 * RealtimeProviderRoot (Batch 1P) — the app-shell client boundary that mounts the
 * realtime provider.
 *
 * It is a minimal pass-through wrapper:
 *  - Joins NO public rooms yet (publicRooms={[]}).
 *  - Subscribes to NO events.
 *  - Changes NO UI.
 *  - Reads NO secrets; uses NO localStorage/sessionStorage/cookies.
 *
 * The underlying RealtimeProvider is inert unless
 * NEXT_PUBLIC_REALTIME_ENABLE === "true" and NEXT_PUBLIC_REALTIME_URL is set, so
 * mounting this has zero effect by default. The DB-polling realtime system
 * remains the source of truth.
 */

import type { ReactNode } from "react";

import RealtimeProvider from "@/components/realtime/RealtimeProvider";

export default function RealtimeProviderRoot({
  children,
}: {
  children: ReactNode;
}) {
  return <RealtimeProvider publicRooms={[]}>{children}</RealtimeProvider>;
}
