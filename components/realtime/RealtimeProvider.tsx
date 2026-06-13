"use client";

/**
 * Browser RealtimeProvider (Batch 1O/1P/1Q) — FLAG-GATED.
 *
 * This is the ONLY file permitted to import `socket.io-client` (see the static
 * guardrails). It is a thin React wrapper over the framework-agnostic controller
 * in realtimeClientUtils.ts; React context + consumer hooks live in
 * realtimeContext.tsx.
 *
 * IMPORTANT
 * ---------
 * - Inert unless NEXT_PUBLIC_REALTIME_ENABLE === "true" AND
 *   NEXT_PUBLIC_REALTIME_URL is set.
 * - Never reads server secrets; never uses localStorage/sessionStorage/cookies.
 * - Tokens are fetched from /api/realtime/token and kept only in memory.
 * - The existing DB-polling realtime system remains the source of truth/fallback.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io } from "socket.io-client";

import {
  RealtimeContext,
  type RealtimeContextValue,
  type RealtimeEventHandler,
} from "@/components/realtime/realtimeContext";
import {
  createRealtimeController,
  isRealtimeEnabled,
  type RealtimeController,
  type RealtimeSocketLike,
  type RealtimeStatus,
} from "@/components/realtime/realtimeClientUtils";

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

  // Lazily construct the controller (pure — no fetch/io) so consumer effects can
  // call joinPublicRoom even before this provider's own effect runs.
  const getController = useCallback((): RealtimeController => {
    if (!controllerRef.current) {
      controllerRef.current = createRealtimeController({
        enabled: isRealtimeEnabled(
          process.env.NEXT_PUBLIC_REALTIME_ENABLE,
          process.env.NEXT_PUBLIC_REALTIME_URL,
        ),
        url: process.env.NEXT_PUBLIC_REALTIME_URL ?? "",
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
    }
    return controllerRef.current;
  }, [publicRooms]);

  useEffect(() => {
    const enabled = isRealtimeEnabled(
      process.env.NEXT_PUBLIC_REALTIME_ENABLE,
      process.env.NEXT_PUBLIC_REALTIME_URL,
    );
    if (!enabled) {
      setStatus("disabled");
      return;
    }
    const controller = getController();
    void controller.start();
    return () => {
      controller.stop();
    };
  }, [getController]);

  const subscribe = useCallback((handler: RealtimeEventHandler) => {
    subscribersRef.current.add(handler);
    return () => {
      subscribersRef.current.delete(handler);
    };
  }, []);

  const joinPublicRoom = useCallback(
    (room: string) => getController().joinPublicRoom(room),
    [getController],
  );

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
      joinPublicRoom,
      reconnect,
    }),
    [status, lastError, joinedRooms, subscribe, joinPublicRoom, reconnect],
  );

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
}
