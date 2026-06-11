# Realtime Browser Client (Skeleton — Not Mounted)

Batch 1O added a **flag-gated, unmounted** browser realtime client. It does
nothing until it is both mounted (a future batch) and explicitly enabled.

> **Staging sign-off required before production.** See
> `realtime-server/STAGING_SIGNOFF.md` (use `npm run status:check`). The
> current pilot scope is the frozen RC9 baseline — no additional realtime
> events should be enabled until the relevant sign-off passes.
>
> **Adding a new realtime event?** First complete
> `docs/realtime-expansion-checklist.md` and review
> `realtime-server/THREAT_MODEL.md`; the offline `npm run expansion:gate` enforces
> that the wiring still matches the approved pilot (one event type per batch).
> Run the full local gate with **`npm run verify:realtime-security`** before any
> expansion or staging/prod sign-off.
>
> The frozen baseline is **Realtime Pilot RC9** —
> `docs/realtime-release-candidate.md`. Confirm the repo still matches it with
> **`npm run check:realtime-rc`** before staging. Operators follow
> `docs/realtime-staging-operator-guide.md` to execute the staging verification.

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
- `components/realtime/realtimeContext.tsx` — React context + consumer hooks
  (`useRealtimeSocket`, `useRealtimePublicRoom`). Consumers import hooks from
  here (not from the provider component).

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

## First consumer: LeaderboardRealtime (Batch 1Q)

`components/LeaderboardRealtime.tsx` is the first read-only realtime consumer:

- Keeps its existing `useRealtimeEvents` DB-polling listener **exactly as-is** —
  polling remains the source of truth/fallback.
- Additionally calls `useRealtimePublicRoom("leaderboard")` (the only room it
  requests) and `useRealtimeSocket().subscribe(...)`.
- On a socket `ascendra:event` of type `leaderboard.updated` or
  `tournament.result.updated`, it triggers the **same** debounced
  `router.refresh()` the poller already uses. The socket payload is **never**
  trusted for UI state and is never logged.
- When realtime is disabled/disconnected the socket trigger is inert (the hook is
  a no-op), so behavior is identical to before.

Public-room joins are **ref-counted** (joined once even if multiple components
request the same room; left only when the last unmounts) and **rejoined on
reconnect**. Only `leaderboard` / `tournament:{id}` / `match:{id}` are accepted;
private/admin rooms cannot be requested via this API.

## First server emitter pilot: leaderboard.updated (Batch 1R)

`lib/tournamentResults.ts` (`publishAwardRealtimeEvents`, the tournament-result
award path) is the **only** wired server emitter. After the existing
`createRealtimeEvent` DB writes, it additionally calls — fire-and-forget —
`dispatchRealtimeEventSoon({ type: "leaderboard.updated", audience: "public",
entityType: "leaderboard", entityId: "global", payload: { tournamentId } })`.

- **Flag-gated:** the dispatch self-skips unless `REALTIME_ENABLE_SOCKET === "true"`
  (`dispatchRealtimeEventSoon` schedules nothing at all while the flag is off).
- **Additive & non-blocking:** it never blocks the caller, never throws, and
  cannot affect the award mutation. The DB `RealtimeEvent` (and DB polling)
  remain the source of truth.
- **Serverless-safe (RC1 hardening):** `dispatchRealtimeEventSoon` schedules the
  emit via Next.js `after()`, so on Vercel the function instance is kept alive
  until the emit settles *after* the response is sent — a merely un-awaited
  promise could be frozen mid-flight and silently dropped. Outside a request
  scope (unit tests, scripts) it degrades to the previous best-effort
  fire-and-forget behavior.
- **Minimal payload:** ID-only (`tournamentId`); the sanitizer + room mapper
  enforce a public ID-only payload routed solely to the `leaderboard` room.
- **At RC1, no other emitter was wired** — later sections document the
  approved additive event batches. Everything outside the current RC baseline
  still uses the DB path only.

## Second pilot: tournament.result.updated (Batch 2A — RC2)

The same award path (`publishAwardRealtimeEvents` in `lib/tournamentResults.ts`)
additionally dispatches `tournament.result.updated` to the **public room
`tournament:{tournamentId}`** — also flag-gated, `after()`-scheduled, and
ID-only (`{ tournamentId }`).

- **Consumer:** `components/TournamentDetailsRealtime.tsx` (mounted on
  `/tournaments/[id]` and `/tournaments/[id]/matches`). Its DB-polling listener
  is unchanged; additively it joins `tournament:{tournamentId}` and triggers the
  **same** debounced `router.refresh()` when
  `shouldRefreshTournamentDetailsFromRealtimeEvent`
  (`components/tournament/tournamentRealtimeUtils.ts`) matches the mounted
  tournament. The socket event is never trusted for UI state — the page
  re-fetches everything server-side.
- **Isolation:** events for one tournament are delivered only to that
  tournament's room; pages for other tournaments do not refresh (covered by the
  gated `tournamentRoomLoop` E2E test).
- **Manual admin saves stay polling-only:** `saveTournamentResultInline`
  (`actions/adminTournamentResultActions.ts`) writes DB `RealtimeEvent`s but has
  **no** socket dispatch in RC2 — tournament pages still update via polling for
  that path.
- **Production remains disabled** (`REALTIME_ENABLE_SOCKET=false`,
  `NEXT_PUBLIC_REALTIME_ENABLE=false`), **anonymous browser realtime remains
  disabled**, and the DB-polling fallback remains active for all visitors.

## Third pilot: tournament.bracket.generated (Batch 3A — RC3)

`generateBracket` in `lib/tournamentMatchEngine.ts` — the second approved
emitter **file** (per-file allowlist) — dispatches
`tournament.bracket.generated` to the same public room
`tournament:{tournamentId}` after its existing DB `RealtimeEvent` write. Also
flag-gated, `after()`-scheduled, ID-only (`{ tournamentId }`); a realtime
failure can never break bracket generation.

- **Consumer:** unchanged — `TournamentDetailsRealtime` already joins the room;
  the refresh-decision helper now also accepts `tournament.bracket.generated`
  for the mounted tournament. Same debounced `router.refresh()`; no visual
  change.
- **Still polling-only:** `tournament.status.updated` (admin action + lifecycle
  job — wired in RC4, see below), registrations (first socket event wired in
  RC8, see below), matches, notifications except `notification.created`
  (wired in RC9, see below),
  profiles, teams.
- **Production remains disabled**, **anonymous browser realtime remains
  disabled**, and the DB-polling fallback remains active for all visitors.

## Fourth pilot: tournament.status.updated (Batch 4A — RC4)

Both existing `tournament.status.updated` emitters — the admin status action in
`actions/adminTournamentInlineActions.ts` (the first approved `actions/` emitter
file) and the scheduled lifecycle transition in
`lib/jobs/tournamentLifecycleJobs.ts` — now additionally dispatch
`tournament.status.updated` to the same public room `tournament:{tournamentId}`
after their existing DB `RealtimeEvent` writes. Also flag-gated,
`after()`-scheduled (with a safe fallback outside request scope, e.g. cron),
ID-only (`{ tournamentId }` — the `status` value itself is stripped by the
public sanitizer); a realtime failure can never break the admin action or the
lifecycle job.

- **Consumer:** unchanged — `TournamentDetailsRealtime` already joins the room;
  the refresh-decision helper now also accepts `tournament.status.updated` for
  the mounted tournament. Same debounced `router.refresh()`; no visual change.
- **Still polling-only:** `tournament.registrationStatus.updated` (both its
  emitters), registrations except `tournament.registration.updated` (wired in
  RC8, see below), matches (first match event wired in RC5, see below),
  notifications except `notification.created` (wired in RC9, see below),
  profiles, teams.
- **Production remains disabled**, **anonymous browser realtime remains
  disabled**, and the DB-polling fallback remains active for all visitors.

## Fifth pilot: tournament.match.report_submitted (Batch 5A — RC5)

`submitManualMatchReport` in `lib/tournamentMatchEngine.ts` (already an
approved emitter file) dispatches `tournament.match.report_submitted` after
its existing DB `RealtimeEvent` write — **only** for the plain report outcome;
the auto-confirmed and disputed outcomes stay polling-only. Also flag-gated,
`after()`-scheduled, ID-only (`{ tournamentId, matchId }` — scores, proof
URLs/file names, reporter IDs, team names, and comments are stripped by the
public sanitizer); a realtime failure can never break match reporting.

- **Rooms:** the mapper's pre-existing public match-event routing targets both
  `match:{matchId}` and the parent `tournament:{tournamentId}`. For this event,
  tournament pages do not refresh from it.
- **Consumer:** `components/MatchRealtimeRefresh.tsx` (mounted on
  `/tournaments/[id]/matches/[matchId]`) — the third approved consumer. Its
  DB-polling subscriptions are unchanged; additively it joins `match:{matchId}`
  and triggers the **same** debounced `router.refresh()` when
  `shouldRefreshMatchFromRealtimeEvent`
  (`components/match/matchRealtimeUtils.ts`) matches the mounted match. The
  socket event is never trusted for UI state.
- **Not part of RC5:** `tournament.match.confirmed` is wired in RC6 and
  `tournament.match.advanced` is wired in RC7; the remaining match events
  (`disputed`, `game_completed`, `room_linked`, `checkin_updated`,
  `proof_synced`, `communication_updated`), `tournament.registration.updated`
  is wired in RC8; `tournament.registrationStatus.updated`, other registration
  events, notifications except `notification.created`, profiles, and teams
  remain polling-only.
- **Production remains disabled**, **anonymous browser realtime remains
  disabled**, and the DB-polling fallback remains active for all visitors.

## Sixth pilot: tournament.match.confirmed (Batch 6A — RC6)

The shared `emitMatchEvent` helper in `lib/tournamentMatchEngine.ts` (already
an approved emitter file) dispatches `tournament.match.confirmed` after its
existing DB `RealtimeEvent` write — guarded to exactly this event + public
audience, so **one dispatch site** covers every confirmation path:
auto-confirm (matching reports), admin confirm, FACEIT auto-result, and admin
override. Also flag-gated, `after()`-scheduled, ID-only
(`{ tournamentId, matchId }` — winner team, admin/confirmer IDs, FACEIT flags,
scores, team names, and comments never reach the dispatch and are stripped by
the public sanitizer regardless); a realtime failure can never break match
confirmation.

- **Rooms:** unchanged — the mapper's pre-existing public match-event routing
  targets `match:{matchId}` + the parent `tournament:{tournamentId}`. For this
  event, `TournamentDetailsRealtime` does not refresh from the parent
  tournament room.
- **Consumer:** unchanged — `MatchRealtimeRefresh` already joins the room; the
  refresh-decision helper now also accepts `tournament.match.confirmed` for
  the mounted match. Same debounced `router.refresh()`; no visual change.
- **Not part of RC6:** `tournament.match.advanced` is wired in RC7; the
  remaining match events (`disputed`, `game_completed`, `room_linked`,
  `checkin_updated`, `proof_synced`, `communication_updated`),
  `tournament.registrationStatus.updated`, other registration events,
  notifications except `notification.created`, profiles, and teams remain
  polling-only.
- **Production remains disabled**, **anonymous browser realtime remains
  disabled**, and the DB-polling fallback remains active for all visitors.
  RC6 Preview verification passed 2026-06-11; RC7 Preview verification passed
  2026-06-11; RC8 Preview verification passed 2026-06-11; RC9 requires its own
  Preview verification before any production decision.

## Seventh pilot: tournament.match.advanced (Batch 7A — RC7)

The shared `emitMatchEvent` helper in `lib/tournamentMatchEngine.ts` dispatches
`tournament.match.advanced` after its existing DB `RealtimeEvent` write —
guarded to exactly this event + public audience, and emitted by
`advanceBracketAfterMatch` when bracket progression happens. Also flag-gated,
`after()`-scheduled, ID-only (`{ tournamentId, matchId }` — `nextMatchId`,
`slot`, winner/team IDs, scores, proof details, names, comments, and admin notes
never reach the dispatch and are stripped by the public sanitizer regardless);
a realtime failure can never break bracket advancement.

- **Rooms:** unchanged — the mapper's existing public match-event routing
  targets `match:{matchId}` + the parent `tournament:{tournamentId}`.
- **Consumers:** no new consumer. `MatchRealtimeRefresh` refreshes only the
  mounted match, and `TournamentDetailsRealtime` refreshes only the mounted
  tournament because bracket progression affects bracket/details. Both still
  use `router.refresh()` and never trust the socket payload for UI state.
- **Still polling-only:** `tournament.match.disputed`,
  `tournament.match.game_completed`, `tournament.match.room_linked`,
  `tournament.match.checkin_updated`, `tournament.match.proof_synced`,
  `tournament.match.communication_updated`,
  `tournament.registrationStatus.updated`, other registration events,
  notifications except `notification.created` (wired in RC9, see below),
  profiles, and teams.
- **Production remains disabled**, **anonymous browser realtime remains
  disabled**, and the DB-polling fallback remains active for all visitors.
  RC7 Preview verification passed 2026-06-11; RC8 Preview verification passed
  2026-06-11; RC9 requires its own Preview verification before any production
  decision.

## Eighth pilot: tournament.registration.updated (Batch 8A — RC8)

The existing registration actions dispatch `tournament.registration.updated`
after their existing DB `RealtimeEvent` writes: player register/cancel, admin
approve/reject/cancel, and admin Discord sync/remove. Each dispatch is
flag-gated, `after()`-scheduled, non-blocking, and ID-only (`{ tournamentId }`);
registration IDs, team IDs/names, player/user IDs, Discord IDs, rejection
reasons, notes, invite details, and admin details are stripped by the public
sanitizer. A realtime failure can never break registration, approval,
rejection, cancellation, or Discord sync actions.

- **Rooms:** unchanged — the event targets the existing public
  `tournament:{tournamentId}` room.
- **Consumer:** no new consumer. `TournamentDetailsRealtime` already joins the
  tournament room; its refresh-decision helper now accepts
  `tournament.registration.updated` only for the mounted tournament. Same
  debounced `router.refresh()`; polling remains the fallback/source of truth.
- **Still polling-only:** `registration.approved`, `registration.rejected`,
  `registration.cancelled`, `tournament.registrationStatus.updated`,
  `notification.updated`, `notification.read`, `notification.deleted`,
  `notification.bulk`, teams, profiles, private/admin rooms other than the
  token-issued notification room, and all other events.
- **Production remains disabled**, **anonymous browser realtime remains
  disabled**, and the DB-polling fallback remains active for all visitors.
  RC8 Preview verification passed 2026-06-11; RC9 requires its own Preview
  verification before any production decision.

## Ninth pilot: notification.created (Batch 9A — RC9)

`lib/notifications.ts` dispatches `notification.created` after existing
notification creation and the existing DB `RealtimeEvent` write. The socket
dispatch is flag-gated, `after()`-scheduled, non-blocking, and private:
`audience: "private"`, `entityType: "notification"`, `entityId:
notificationId`, and socket payload exactly `{ notificationId }`.

- **Room:** `notifications:{userId}`. The dispatch uses an internal
  `targetUserId` for room routing only; that value is not emitted in the socket
  payload.
- **Consumer:** no new visual surface. The existing
  `components/NotificationsDropdown.tsx` subscribes to socket events, accepts no
  `userId` prop, does not call `useRealtimePublicRoom`, and refreshes from
  server data only. Its existing `/api/notifications` fetch and DB polling
  fallback remain intact.
- **ACL:** `/api/realtime/token` is signed-in only and hidden while
  `REALTIME_ENABLE_SOCKET !== "true"`. For RC9 it issues only the signed-in
  user's `notifications:{userId}` room. The realtime-server ACL denies
  anonymous notification-room joins and exact-claim mismatches, so a signed-in
  user cannot join another user's notification room.
- **Still polling-only:** `notification.updated`, `notification.read`,
  `notification.deleted`, `notification.bulk`, admin rooms, team rooms, profile
  rooms, and all other private events.
- **Production remains disabled**, **anonymous browser realtime remains
  disabled**, and the DB-polling fallback remains active for all visitors.
  RC9 requires its own Preview verification before any production decision.

## Enabling live leaderboard socket refresh

Both flags must be on:

- **Server side:** Vercel `REALTIME_ENABLE_SOCKET=true` (+ `REALTIME_SERVER_URL`,
  `REALTIME_EVENT_SECRET`, `REALTIME_CLIENT_TOKEN_SECRET`) so the emitter sends.
- **Browser side:** `NEXT_PUBLIC_REALTIME_ENABLE=true` (+ `NEXT_PUBLIC_REALTIME_URL`)
  so `LeaderboardRealtime` connects and joins the `leaderboard` room.

**Safe rollback:** set `REALTIME_ENABLE_SOCKET=false` to stop server emits, and/or
`NEXT_PUBLIC_REALTIME_ENABLE=false` to stop the browser socket. DB polling
continues either way. The `smoke:event` tool can deliver a test `leaderboard`
event for manual verification once the client flag is enabled.

## Verified loop (Batch 1S)

A gated local test (`realtime-server/src/__tests__/leaderboardLoop.e2e.test.mjs`,
run via `npm run test:e2e`) proves the **full** path on an ephemeral local server
with generated test secrets: `dispatchRealtimeEvent("leaderboard.updated")` →
signed `POST /internal/events` → broadcast to the `leaderboard` room → Socket.IO
client receives a **sanitized** `ascendra:event` (sensitive fields like
`teamName`/`rejectionReason` stripped; ID-only payload) →
`shouldRefreshLeaderboardFromRealtimeEvent` returns `true`. It also asserts a
dispatch to an unreachable server fails safely without throwing.

The refresh decision lives in
`components/leaderboard/leaderboardRealtimeUtils.ts`
(`shouldRefreshLeaderboardFromRealtimeEvent`), used by `LeaderboardRealtime` for
**both** the DB-polling and socket triggers. This is **local verification only —
not production go-live**; live refresh still requires both
`REALTIME_ENABLE_SOCKET=true` and `NEXT_PUBLIC_REALTIME_ENABLE=true`, and DB
polling remains the source of truth/fallback.

## Activation

The provider runs only when **both** are true (read at runtime, client-side):

- `NEXT_PUBLIC_REALTIME_ENABLE === "true"`
- `NEXT_PUBLIC_REALTIME_URL` is set (the `wss://realtime.ascendrahub.com` origin)

Otherwise it stays in `disabled` status and never fetches a token or opens a
socket. It is mounted inertly through `RealtimeProviderRoot`; no socket opens
unless the browser flag and URL are present.

## Behavior

1. Fetches a short-lived token from **`/api/realtime/token`** (`cache: "no-store"`,
   `credentials: "same-origin"`). `404` → `disabled`; `401` (logged out) → `idle`;
   other non-OK → `error`. Tokens are kept **only in memory** — never in
   `localStorage`, `sessionStorage`, or cookies.

   > **RC1 note — browser realtime is authenticated-only by design.** A
   > logged-out (anonymous) visitor receives `401` and the client stays `idle`:
   > it does **not** open an anonymous socket, even though the realtime server
   > itself allows anonymous public-room connections. Anonymous browser realtime
   > is intentionally deferred to a future, separately approved batch; public
   > pages (e.g. the leaderboard) keep updating for anonymous visitors via the
   > DB-polling fallback.
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
- The browser client only *consumes* events; it never emits socket events.

A static guardrail (`lib/__tests__/realtimeSecurityGuardrails.test.ts`) enforces
that `socket.io-client` is imported only by `RealtimeProvider.tsx`, that the
provider is not imported anywhere in `app/`, and that no secret/storage/cookie
usage creeps into the client files.
