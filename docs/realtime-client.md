# Realtime Browser Client (Skeleton — Not Mounted)

Batch 1O added a **flag-gated, unmounted** browser realtime client. It does
nothing until it is both mounted (a future batch) and explicitly enabled.

## Files

- `components/realtime/RealtimeProvider.tsx` — `"use client"` React provider +
  `useRealtimeSocket()` hook. The **only** file allowed to import
  `socket.io-client`.
- `components/realtime/realtimeClientUtils.ts` — pure helpers + the
  framework-agnostic controller (Socket.IO factory is injected, so this file does
  **not** import `socket.io-client`).
- `components/realtime/RealtimeProviderRoot.tsx` — minimal app-shell client
  boundary that mounts the provider. The **only** file allowed to import
  `RealtimeProvider`.

## Mount status (Batch 1P)

`RealtimeProviderRoot` is mounted in `app/layout.tsx` (wrapping `children` inside
`PublicThemeProvider`). It:

- is **inert until** `NEXT_PUBLIC_REALTIME_ENABLE === "true"` **and**
  `NEXT_PUBLIC_REALTIME_URL` is set — by default it fetches no token and opens no
  socket, and the app renders exactly as before;
- joins **no public rooms** yet (`publicRooms={[]}`);
- has **no consumers / subscribers** yet;
- changes no UI, reads no secrets, uses no storage/cookies.

**Instant client-side rollback:** unset `NEXT_PUBLIC_REALTIME_ENABLE` (or set it
to anything other than `"true"`) and redeploy. DB polling remains active and is
unaffected. No emitters are wired.

## Activation

The provider runs only when **both** are true (read at runtime, client-side):

- `NEXT_PUBLIC_REALTIME_ENABLE === "true"`
- `NEXT_PUBLIC_REALTIME_URL` is set (the `wss://realtime.ascendrahub.com` origin)

Otherwise it stays in `disabled` status and never fetches a token or opens a
socket. **It is not mounted** in `app/layout.tsx` or any page yet.

## Behavior

1. Fetches a short-lived token from **`/api/realtime/token`** (`cache: "no-store"`,
   `credentials: "same-origin"`). `404` → `disabled`; `401` (logged out) → `idle`;
   other non-OK → `error`. Tokens are kept **only in memory** — never in
   `localStorage`, `sessionStorage`, or cookies.
2. Connects via Socket.IO with `auth: { token }`.
3. Joins the **private rooms from the token claims** plus any `publicRooms` prop
   that pass validation (`leaderboard`, `tournament:{id}`, `match:{id}` only —
   `admin`/`user`/`notifications`/`profile`/`team` are rejected client-side).
4. Refreshes the token ~60s before `expiresAt` and re-auths.
5. On disconnect/error it degrades gracefully; **the existing DB-polling realtime
   system remains the source of truth/fallback** and is unaffected.

## Hook API

`useRealtimeSocket()` returns `{ status, isEnabled, isConnected, lastError,
joinedRooms, subscribe, reconnect }`. When no provider is mounted it returns a
safe inert value (`disabled`). `subscribe(handler)` receives `ascendra:event`
envelopes (full payloads are never logged).

## Security notes

- No server secrets are read in client code (`REALTIME_EVENT_SECRET` /
  `REALTIME_CLIENT_TOKEN_SECRET` never appear here); no secret is exposed via
  `NEXT_PUBLIC_*`.
- Private rooms are only ever those the server signed into the token — the client
  cannot request arbitrary private/admin rooms.
- No emitters are wired; the provider only *consumes* events once mounted.

A static guardrail (`lib/__tests__/realtimeSecurityGuardrails.test.ts`) enforces
that `socket.io-client` is imported only by `RealtimeProvider.tsx`, that the
provider is not imported anywhere in `app/`, and that no secret/storage/cookie
usage creeps into the client files.
