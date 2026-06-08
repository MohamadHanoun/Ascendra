"use client";

/**
 * Realtime React context + consumer hooks (Batch 1Q).
 *
 * Split out from RealtimeProvider.tsx so consumers can read realtime state /
 * join public rooms WITHOUT importing the provider component (which is the only
 * file allowed to import `socket.io-client`). Safe when no provider is mounted:
 * the hooks return an inert value and never throw.
 */

import { createContext, useContext, useEffect } from "react";

import type {
  RealtimeEventEnvelope,
  RealtimeStatus,
} from "@/components/realtime/realtimeClientUtils";

export type RealtimeEventHandler = (event: RealtimeEventEnvelope) => void;

export type RealtimeContextValue = {
  status: RealtimeStatus;
  isEnabled: boolean;
  isConnected: boolean;
  lastError: string | null;
  joinedRooms: string[];
  subscribe: (handler: RealtimeEventHandler) => () => void;
  /** Request a PUBLIC room (leaderboard / tournament:{id} / match:{id}). Returns a leave fn. */
  joinPublicRoom: (room: string) => () => void;
  reconnect: () => void;
};

const INERT: RealtimeContextValue = {
  status: "disabled",
  isEnabled: false,
  isConnected: false,
  lastError: null,
  joinedRooms: [],
  subscribe: () => () => {},
  joinPublicRoom: () => () => {},
  reconnect: () => {},
};

export const RealtimeContext = createContext<RealtimeContextValue | null>(null);

/** Read realtime status / subscribe to events. Inert (no-op) when unmounted. */
export function useRealtimeSocket(): RealtimeContextValue {
  return useContext(RealtimeContext) ?? INERT;
}

/**
 * Join a public room for the lifetime of the calling component. No-op (and never
 * throws) when realtime is disabled/unmounted or when the room is not a safe
 * public room.
 */
export function useRealtimePublicRoom(room: string): void {
  const { joinPublicRoom } = useRealtimeSocket();
  useEffect(() => {
    const leave = joinPublicRoom(room);
    return typeof leave === "function" ? leave : undefined;
  }, [room, joinPublicRoom]);
}
