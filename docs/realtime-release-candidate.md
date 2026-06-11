# Realtime Pilot RC8 — leaderboard.updated + tournament.result.updated + tournament.bracket.generated + tournament.status.updated + tournament.match.report_submitted + tournament.match.confirmed + tournament.match.advanced + tournament.registration.updated

Frozen release-candidate baseline for the Ascendra realtime pilot. This is the
exact scope that may go to staging. Any deviation must follow
`docs/realtime-expansion-checklist.md`. Verify the repo matches this baseline with
`npm run check:realtime-rc`, and run the full gate with
`npm run verify:realtime-security`.

> RC8 (Batch 8A) supersedes RC7 by adding exactly one event
> (`tournament.registration.updated`) into the existing public
> `tournament:{id}` room and existing `TournamentDetailsRealtime` consumer.
> Zero new consumers, zero new room shapes, zero realtime-server runtime
> changes. The approved emitters are only the existing registration action
> files that already write the exact DB `tournament.registration.updated`
> event; all other registration/private/admin/team/profile socket events stay
> polling-only.
> Preview verifications are recorded in `realtime-server/STAGING_SIGNOFF.md`:
> RC1 in §9, RC2 in §10, RC3 in §11, RC4 in §12, RC5 in §13, RC6 in §14,
> **RC7 in §15 (passed 2026-06-11)**; **RC8 requires its own Preview verification** before
> any production decision. Production remains disabled and requires its own
> manual go/no-go.

## 1. Release candidate name

**Realtime Pilot RC8 — `leaderboard.updated` + `tournament.result.updated` +
`tournament.bracket.generated` + `tournament.status.updated` +
`tournament.match.report_submitted` + `tournament.match.confirmed` +
`tournament.match.advanced` + `tournament.registration.updated` only.**

## 2. Current approved scope

**Allowed server emitters (per-file allowlist — each file may dispatch EXACTLY
these events):**
- `lib/tournamentResults.ts` (`publishAwardRealtimeEvents`, the
  tournament-result award path):
  - `leaderboard.updated` → room `leaderboard`.
  - `tournament.result.updated` → room `tournament:{tournamentId}`.
- `lib/tournamentMatchEngine.ts` (`generateBracket` + `submitManualMatchReport`
  + the shared `emitMatchEvent` helper):
  - `tournament.bracket.generated` → room `tournament:{tournamentId}`.
  - `tournament.match.report_submitted` → rooms `match:{matchId}` +
    `tournament:{tournamentId}` (the mapper's pre-existing public match-event
    routing); dispatched **only** for the plain report outcome.
  - `tournament.match.confirmed` → rooms `match:{matchId}` +
    `tournament:{tournamentId}`; dispatched from the shared `emitMatchEvent`
    helper (guarded to exactly this event + public audience), covering every
    confirmation path: auto-confirm, admin confirm, FACEIT auto-result, admin
    override. The disputed outcome stays polling-only.
  - `tournament.match.advanced` → rooms `match:{matchId}` +
    `tournament:{tournamentId}`; dispatched from the same shared
    `emitMatchEvent` helper (guarded to exactly this event + public
    audience), emitted by `advanceBracketAfterMatch` (bracket progression).
    `nextMatchId`/`slot` never reach the dispatch.
- `actions/adminTournamentInlineActions.ts` (the admin status action):
  - `tournament.status.updated` → room `tournament:{tournamentId}`.
- `lib/jobs/tournamentLifecycleJobs.ts` (`publishLifecycleEvents`, scheduled
  lifecycle transitions):
  - `tournament.status.updated` → room `tournament:{tournamentId}`.
- `actions/tournamentRegistrationInlineActions.ts` (player register/cancel):
  - `tournament.registration.updated` → room `tournament:{tournamentId}`.
- `actions/adminRegistrationInlineActions.ts` (admin approve/reject/cancel):
  - `tournament.registration.updated` → room `tournament:{tournamentId}`.
- `actions/adminRegistrationDiscordSyncActions.ts` (admin Discord sync/remove):
  - `tournament.registration.updated` → room `tournament:{tournamentId}`.
- Payloads: ID-only (`tournamentId` / `matchId`; `status`, registration IDs,
  user IDs, Discord IDs, scores, proof URLs, names, reasons, notes, and
  reporter/team identifiers are stripped by the public
  sanitizer).
- Server flag: `REALTIME_ENABLE_SOCKET` (additive, fire-and-forget; each emit is
  scheduled post-response via Next.js `after()` — with a safe fallback outside
  request scope, e.g. cron — so it is serverless-safe and never blocks or fails
  the mutation — including bracket generation, the admin status action, and the
  lifecycle job, registration actions, and Discord sync actions; the DB
  `RealtimeEvent` writes remain the source of truth).
- The manual inline-save admin path (`actions/adminTournamentResultActions.ts`)
  intentionally remains polling-only (no socket dispatch).

**Allowed browser consumers:**
- `components/LeaderboardRealtime.tsx` — joins only the public room
  `leaderboard`.
- `components/TournamentDetailsRealtime.tsx` — joins only the public room
  `tournament:{tournamentId}` of the mounted page; since RC8 its refresh
  helper also accepts `tournament.registration.updated` for the mounted
  tournament, in addition to `tournament.match.advanced` from RC7.
- `components/MatchRealtimeRefresh.tsx` — joins only the public room
  `match:{matchId}` of the mounted match page (its DB-polling subscriptions
  are unchanged); its refresh helper accepts only
  `tournament.match.report_submitted`, `tournament.match.confirmed`, and
  `tournament.match.advanced` for the mounted match.
- All trigger `router.refresh()` only and do **not** trust the socket payload
  for UI state (the event is only matched against the mounted page).
- Browser flag: `NEXT_PUBLIC_REALTIME_ENABLE`.
- **Authenticated-only for RC2:** anonymous (logged-out) visitors get no socket
  (`/api/realtime/token` → 401 → client stays `idle`) and keep updating via the
  DB-polling fallback. Anonymous socket support is a future, separately approved
  change.

**Allowed provider:**
- `RealtimeProviderRoot` mounted in `app/layout.tsx` (with `publicRooms={[]}`).
- `RealtimeProvider` imported only through `RealtimeProviderRoot`.
- `socket.io-client` imported only in `components/realtime/RealtimeProvider.tsx`.

## 3. Explicitly NOT included

- Registration socket events other than `tournament.registration.updated`.
- Registration/private/admin event types such as `registration.approved`,
  `registration.rejected`, `registration.cancelled`, notification events,
  profile events, and team events.
- All other match socket events — `tournament.match.disputed`,
  `game_completed`, `room_linked`, `checkin_updated`, `proof_synced`,
  `communication_updated` stay polling-only.
- Registration-status realtime (`tournament.registrationStatus.updated` — both
  its emitters stay polling-only).
- Team socket events.
- Notification socket events.
- Admin/private UI consumers.
- Profile socket consumer.
- Anonymous browser realtime.
- Socket dispatch from `saveTournamentResultInline` (manual admin save stays
  polling-only).
- Redis.
- DB schema changes.
- Polling removal.
- Production enablement.

## 4. Security controls included

HMAC + Bearer on `/internal/events`; replay protection (timestamp window +
in-memory cache); per-IP rate limits; 64 KB body limit; CORS allowlist
(no wildcard in prod, fail-closed); short-lived client tokens + exact-room ACL;
public-room allowlist (`leaderboard` / `tournament:{id}` / `match:{id}`); payload
sanitizer (public = ID-only); room mapper; static security guardrails; expansion
gate; failure-mode drills; protected `/internal/status`; safe signed smoke tool;
dry-run + preflight; and the one-command `verify:realtime-security` gate.

## 5. Required commands before staging

```bash
# Confirm the repo still matches this RC baseline:
npm run check:realtime-rc

# Run the full local security gate:
npm run verify:realtime-security
# If ONLY the known Next/PostCSS audit advisory fails:
#   Windows CMD:  set REALTIME_VERIFY_ALLOW_KNOWN_AUDIT=true && npm run verify:realtime-security
#   PowerShell:   $env:REALTIME_VERIFY_ALLOW_KNOWN_AUDIT="true"; npm run verify:realtime-security

# Operator-only (need a running server / secrets — NOT run by the gate):
npm --prefix realtime-server run status:check   # against a running local/staging server
npm --prefix realtime-server run smoke:event    # with safe env + target
```

## 6. Known audit note

- `npm audit --omit=optional` reports **2 moderate** vulnerabilities — a
  **pre-existing** `postcss` advisory pulled in transitively by `next`.
- Do **not** run `npm audit fix` — the only remediation is a breaking Next
  downgrade.
- This is documented, known, pre-existing risk, unrelated to `socket.io-client`
  or the realtime code.

## 7. Rollback

- Server side: `REALTIME_ENABLE_SOCKET=false`.
- Browser side: `NEXT_PUBLIC_REALTIME_ENABLE=false`.
- DB polling continues as the source of truth.
- No schema rollback required (there are no schema changes).
- Stop the realtime-server service if needed.

## 8. Staging sign-off requirement

- Operator runbook: `docs/realtime-staging-operator-guide.md` (written for the
  RC1 run; reuse the same steps for RC2–RC8, additionally verifying after a
  registration update that the same tournament's details page refreshes live
  while a different tournament's page does **not** refresh).
- Complete `realtime-server/STAGING_SIGNOFF.md` before production. Preview runs
  are recorded there: RC1 (§9), RC2 (§10), RC3 (§11), RC4 (§12), RC5 (§13),
  RC6 (§14), and RC7 (§15, passed 2026-06-11) — all with both flags returned
  to `false` afterwards. **RC8 needs its own Preview verification** with both flags
  returned to `false` afterwards.
- Passing staging does **not** automatically approve production.
- No further realtime event may be added before staging sign-off or explicit
  approval (one event type per batch).

## 9. Production go/no-go

- Production requires **manual** approval.
- Do **not** enable flags automatically.
- Do **not** deploy from scripts.
