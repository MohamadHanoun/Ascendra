# Realtime Pilot RC10

Frozen release-candidate baseline for the Ascendra realtime pilot. Any
deviation must follow `docs/realtime-expansion-checklist.md`. Verify this
baseline with `npm run check:realtime-rc`, and run the full gate with
`npm run verify:realtime-security`.

RC10 (Batch 10A) supersedes RC9 by adding exactly one public event:
`tournaments.updated` to the new public static room `tournaments` (global
tournament-list refresh signal). Production remains disabled, both realtime
flags remain false outside Preview testing, anonymous browser realtime remains
disabled, and DB polling remains the fallback.

Preview verification evidence is recorded in
`realtime-server/STAGING_SIGNOFF.md`: RC1 in section 9, RC2 in section 10, RC3
in section 11, RC4 in section 12, RC5 in section 13, RC6 in section 14, RC7 in
section 15, RC8 in section 16, and RC9 in section 17. RC10 requires its own
Preview verification before any production decision.

## 1. Approved Event Types

Allowed socket event types are exactly:

- `leaderboard.updated`
- `tournament.result.updated`
- `tournament.bracket.generated`
- `tournament.status.updated`
- `tournament.match.report_submitted`
- `tournament.match.confirmed`
- `tournament.match.advanced`
- `tournament.registration.updated`
- `notification.created`
- `tournaments.updated`

## 2. Approved Server Emitters

Per-file allowlist. Each file may dispatch exactly the listed event type(s):

- `lib/tournamentResults.ts`
  - `leaderboard.updated` -> `leaderboard`
  - `tournament.result.updated` -> `tournament:{tournamentId}`
- `lib/tournamentMatchEngine.ts`
  - `tournament.bracket.generated` -> `tournament:{tournamentId}`
  - `tournament.match.report_submitted` -> `match:{matchId}` +
    `tournament:{tournamentId}`
  - `tournament.match.confirmed` -> `match:{matchId}` +
    `tournament:{tournamentId}`
  - `tournament.match.advanced` -> `match:{matchId}` +
    `tournament:{tournamentId}`
- `actions/adminTournamentInlineActions.ts`
  - `tournament.status.updated` -> `tournament:{tournamentId}`
  - `tournaments.updated` -> `tournaments` (create / update / delete / status
    paths only; registration-status changes stay polling-only)
- `lib/jobs/tournamentLifecycleJobs.ts`
  - `tournament.status.updated` -> `tournament:{tournamentId}`
  - `tournaments.updated` -> `tournaments` (lifecycle status transitions only)
- `actions/tournamentRegistrationInlineActions.ts`
  - `tournament.registration.updated` -> `tournament:{tournamentId}`
- `actions/adminRegistrationInlineActions.ts`
  - `tournament.registration.updated` -> `tournament:{tournamentId}`
- `actions/adminRegistrationDiscordSyncActions.ts`
  - `tournament.registration.updated` -> `tournament:{tournamentId}`
- `lib/notifications.ts`
  - `notification.created` -> `notifications:{userId}`

All socket dispatches are additive, flag-gated by `REALTIME_ENABLE_SOCKET`,
scheduled after the DB `RealtimeEvent` write, never-throwing, and non-blocking.
The DB `RealtimeEvent` rows remain the source of truth for polling fallback.

## 3. Payload Rules

- Public tournament/leaderboard/match/registration payloads are ID-only.
- `tournaments.updated` socket payload is tournament-ID-only
  (`{ tournamentId }` + entity identifiers); titles, prizes, descriptions, and
  admin details are stripped.
- `notification.created` socket payload is exactly `{ notificationId }`.
- Notification routing may use an internal `targetUserId`, but that value is
  not emitted to the realtime server payload.
- Sensitive fields are stripped: names, emails, Discord IDs, user IDs in
  socket payloads, registration IDs, team IDs/names, scores, proof URLs,
  comments, rejection reasons, admin notes, links, tokens, cookies, headers,
  secrets, and raw metadata.

## 4. Approved Browser Consumers

Allowed consumers are exactly:

- `components/LeaderboardRealtime.tsx`
  - Joins only `leaderboard`.
- `components/TournamentDetailsRealtime.tsx`
  - Joins only `tournament:{tournamentId}` for the mounted tournament.
- `components/MatchRealtimeRefresh.tsx`
  - Joins only `match:{matchId}` for the mounted match.
- `components/NotificationsDropdown.tsx`
  - Does not accept a `userId` prop.
  - Does not request private rooms directly.
  - Uses the token-issued authenticated notification room and refreshes from
    server data only.
- `components/TournamentsListRealtime.tsx`
  - Joins only the public static `tournaments` room.
  - Mounted only on tournament-list surfaces (`/tournaments` and the
    homepage).

All consumers keep DB polling fallback intact and use safe refresh/refetch
paths. Socket payloads are never trusted as UI data. The tournament-list
surfaces keep their existing page-level DB-polling refreshers
(`TournamentsRealtimeRefresh`, `HomeRealtimeRefresh`) unchanged.

## 5. Explicitly Not Included

- `notification.updated`, `notification.read`, `notification.deleted`,
  `notification.bulk`.
- Registration events other than `tournament.registration.updated`.
- `tournament.registrationStatus.updated` (registration-status changes also do
  not emit `tournaments.updated`).
- Match events other than the three approved match events.
- Admin rooms, team rooms, profile rooms, or new private rooms beyond
  `notifications:{userId}`.
- Wildcard rooms or wildcard events of any kind.
- Anonymous browser realtime.
- Redis.
- DB schema changes or migrations.
- Polling removal.
- Production enablement.

## 6. Security Controls

HMAC + Bearer on `/internal/events`; replay protection; rate limits; 64 KB body
limit; CORS allowlist; short-lived client tokens; exact-room ACL; public-room
allowlist (exact `tournaments` name — no prefix/wildcard variant); private
notification room token claims; payload sanitizer; room mapper; static
guardrails; expansion gate; E2E isolation tests; protected `/internal/status`;
smoke/dry-run/preflight tools; and the one-command `verify:realtime-security`
gate.

`/api/realtime/token` stays hidden when `REALTIME_ENABLE_SOCKET !== "true"`,
returns 401 for anonymous users, and only grants signed-in users their own
`notifications:{userId}` room (unchanged from RC9). Anonymous realtime remains
disabled.

RC10 includes exactly one realtime-server runtime change: the `tournaments`
exact public-room allowlist entry in `realtime-server/src/channels.mjs`. No
other runtime file changed; private/admin ACL behavior is unchanged and
re-verified by unit + E2E tests.

## 7. Required Local Validation

```bash
npm run check:realtime-rc
npm run verify:realtime-security
npm test
npm --prefix realtime-server run test:e2e
npm run build
```

If `npm run verify:realtime-security` fails only on the known pre-existing
Next/PostCSS audit advisory, rerun with:

```powershell
$env:REALTIME_VERIFY_ALLOW_KNOWN_AUDIT="true"; npm run verify:realtime-security
```

Do not run `npm audit fix`.

## 8. Rollback

- Server side: `REALTIME_ENABLE_SOCKET=false`.
- Browser side: `NEXT_PUBLIC_REALTIME_ENABLE=false`.
- DB polling continues as the source of truth.
- No schema rollback is required.

## 9. Staging Sign-Off Requirement

Use `docs/realtime-staging-operator-guide.md` and record evidence in
`realtime-server/STAGING_SIGNOFF.md`. RC10 Preview verification must prove:

- WebSocket connects in Preview.
- `tournaments.updated` is emitted after an admin tournament create / update /
  delete / status change.
- The `/tournaments` page (and homepage tournament sections) refresh live via
  the public `tournaments` room.
- Pages not mounting the tournament-list consumer do not refresh from it.
- Anonymous users can join only public rooms; private notification rooms stay
  token-gated exactly as in RC9.
- Polling fallback remains intact.
- Kill-switch rollback works after both flags return to false.
- Production is not touched.

Passing Preview does not approve production. Production requires a separate
manual go/no-go.
