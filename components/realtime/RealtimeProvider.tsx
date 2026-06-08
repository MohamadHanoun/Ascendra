"use client";

/**
 * Browser RealtimeProvider skeleton (Batch 1O) — FLAG-GATED and NOT MOUNTED.
 *
 * This is the ONLY file permitted to import `socket.io-client` (see the static
 * guardrails). It is a thin React wrapper over the framework-agnostic controller
 * in realtimeClientUtils.ts.
 *
 * IMPORTANT
 * ---------
 * - Dormant: it is not mounted in app/layout.tsx or any page yet.
 * - Runs only when NEXT_PUBLIC_REALTIME_ENABLE === "true" AND
 *   NEXT_PUBLIC_REALTIME_URL is set.
 * - Never reads server secrets; never uses localStorage/sessionStorage/cookies.
 * - Tokens are fetched from /api/realtime/token and kept only in memory.
 * - The existing DB-polling realtime system remains the source of truth/fallback.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io } from "socket.io-client";

import {
  createRealtimeController,
  isRealtimeEnabled,
  type RealtimeController,
  type RealtimeEventEnvelope,
  type RealtimeSocketLike,
  type RealtimeStatus,
} from "@/components/realtime/realtimeClientUtils";

type RealtimeEventHandler = (event: RealtimeEventEnvelope) => void;

export type RealtimeContextValue = {
  status: RealtimeStatus;
  isEnabled: boolean;
  isConnected: boolean;
  lastError: string | null;
  joinedRooms: string[];
  subscribe: (handler: RealtimeEventHandler) => () => void;
  reconnect: () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

type RealtimeProviderProps = {
  /** Optional public rooms to join: leaderboard / tournament:{id} / match:{id} only. */
  publicRooms?: string[];
  children: ReactNode;
};

export default function RealtimeProvider({
  publicRooms,
  children,
}: RealtimeProviderProps) {
  const [status, setStatus] = useState<RealtimeStatus>("disabled");
  const [lastError, setLastError] = useState<string | null>(null);
  const [joinedRooms, setJoinedRooms] = useState<string[]>([]);

  const subscribersRef = useRef<Set<RealtimeEventHandler>>(new Set());
  const controllerRef = useRef<RealtimeController | null>(null);

  // Stable snapshot of publicRooms for the effect dependency.
  const publicRoomsKey = (publicRooms ?? []).join(",");

  useEffect(() => {
    const enabled = isRealtimeEnabled(
      process.env.NEXT_PUBLIC_REALTIME_ENABLE,
      process.env.NEXT_PUBLIC_REALTIME_URL,
    );
    const url = process.env.NEXT_PUBLIC_REALTIME_URL;

    if (!enabled || !url) {
      setStatus("disabled");
      return;
    }

    const controller = createRealtimeController({
      enabled: true,
      url,
      ioFactory: (u, opts) => io(u, opts) as unknown as RealtimeSocketLike,
      publicRooms: publicRooms ?? [],
      onStatus: (next) => setStatus(next),
      onError: (message) => setLastError(message),
      onEvent: (event) => {
        for (const handler of subscribersRef.current) {
          try {
            handler(event);
          } catch {
            /* never let a subscriber break delivery */
          }
        }
      },
      onRooms: (rooms) => setJoinedRooms(rooms),
    });

    controllerRef.current = controller;
    void controller.start();

    return () => {
      controller.stop();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicRoomsKey]);

  const subscribe = useCallback((handler: RealtimeEventHandler) => {
    subscribersRef.current.add(handler);
    return () => {
      subscribersRef.current.delete(handler);
    };
  }, []);

  const reconnect = useCallback(() => {
    controllerRef.current?.reconnect();
  }, []);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      status,
      isEnabled: status !== "disabled",
      isConnected: status === "connected",
      lastError,
      joinedRooms,
      subscribe,
      reconnect,
    }),
    [status, lastError, joinedRooms, subscribe, reconnect],
  );

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
}

export { RealtimeContext };

/** Hook to read realtime status / subscribe to events. Safe when unmounted. */
export function useRealtimeSocket(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    return {
      status: "disabled",
      isEnabled: false,
      isConnected: false,
      lastError: null,
      joinedRooms: [],
      subscribe: () => () => {},
      reconnect: () => {},
    };
  }
  return ctx;
}
