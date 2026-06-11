# Realtime Production Readiness Runbook — RC10 Final Baseline (LOCKED)

> ⚠️ **Manual runbook — this document changes nothing by itself.** It prepares
> the production go/no-go decision for the RC10 realtime baseline. Nothing in
> this repo deploys to or configures Production. **Production go-live is NOT
> yet approved.** Both realtime flags remain `false` everywhere:
> `REALTIME_ENABLE_SOCKET=false` and `NEXT_PUBLIC_REALTIME_ENABLE=false`.

Related: `docs/realtime-release-candidate.md` (frozen RC10 baseline) ·
`realtime-server/PRODUCTION_DRY_RUN.md` (infra dry-run checklist) ·
`realtime-server/STAGING_SIGNOFF.md` (Preview evidence §9–§18) ·
`realtime-server/DEPLOYMENT.md` · `realtime-server/SECURITY.md` ·
`realtime-server/FAILURE_MODES.md` · `realtime-server/THREAT_MODEL.md` ·
`docs/realtime-expansion-checklist.md`.

---

## 1. Status — what is done vs. what is not

### ✅ Completed: Preview/staging verification (RC1–RC10)

All ten release candidates were implemented one event per batch, gated, and
operator-verified against the Vercel **Preview** environment and the
**staging** realtime server. Evidence lives in
`realtime-server/STAGING_SIGNOFF.md`:

| RC | Event | Room(s) | Evidence |
|----|-------|---------|----------|
| RC1 | `leaderboard.updated` | `leaderboard` | §9 |
| RC2 | `tournament.result.updated` | `tournament:{id}` | §10 |
| RC3 | `tournament.bracket.generated` | `tournament:{id}` | §11 |
| RC4 | `tournament.status.updated` | `tournament:{id}` | §12 |
| RC5 | `tournament.match.report_submitted` | `match:{matchId}` (+ parent tournament room) | §13 |
| RC6 | `tournament.match.confirmed` | `match:{matchId}` (+ parent tournament room) | §14 |
| RC7 | `tournament.match.advanced` | `match:{matchId}` + `tournament:{tournamentId}` | §15 |
| RC8 | `tournament.registration.updated` | `tournament:{tournamentId}` | §16 |
| RC9 | `notification.created` | `notifications:{userId}` (private) | §17 |
| RC10 | `tournaments.updated` | `tournaments` | §18 |

Each sign-off verified: WebSocket connectivity, correct-room delivery,
cross-room/cross-user isolation, intact polling fallback, kill-switch
rollback, and that Production was never touched.

Local gates are green at RC10: `npm run check:realtime-rc`,
`npm run verify:realtime-security` (with the documented known-audit
override), root tests, realtime-server E2E, and build.

### ❌ Not done: Production go/no-go

- Production realtime is **disabled**. No Production env var has been set or
  changed.
- The go/no-go is a **separate manual decision** by the operator. Nothing in
  this repo may flip it.
- Until that decision, the site runs entirely on the DB-polling/fetch
  realtime fallback, which is fully verified and unaffected.

---

## 2. Final approved scope (RC10 — LOCKED)

### Approved rooms (exactly five shapes)

- `leaderboard` — public static.
- `tournament:{id}` — public, validated ID segment.
- `match:{id}` — public, validated ID segment.
- `tournaments` — public static (exact name; added in RC10).
- `notifications:{userId}` — **private**; requires an exact signed token claim.

### Approved events (exactly ten)

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

Emitters are allowlisted **per file** and consumers are allowlisted per
component — see `docs/realtime-release-candidate.md` §2 and §4 for the exact
lists. Anything not listed there is out of scope.

### Data-safety invariants

- **All socket payloads are ID-only/minimal.** The payload sanitizer strips
  names, emails, Discord IDs, user IDs in public payloads, registration IDs,
  team IDs/names, scores, proof URLs, comments, rejection reasons, admin
  notes, titles/prizes/descriptions, links, tokens, cookies, headers,
  secrets, and raw metadata.
- **Socket payloads are never trusted as UI data.** Consumers only use events
  as refresh signals and re-fetch everything from the server
  (`router.refresh()` / API refetch).
- **The database remains the source of truth.** Every socket dispatch happens
  only after the DB mutation and its DB `RealtimeEvent` write.
- **Polling/fetch fallback remains active everywhere.** Every surface keeps
  its DB-polling listener; realtime being down, disabled, or broken changes
  nothing functionally.

---

## 3. Kill switches

Two independent flags; either one alone stops realtime. Both are instant and
require no deploy beyond the env change taking effect:

| Flag | Side | Effect when `false`/unset |
|------|------|---------------------------|
| `REALTIME_ENABLE_SOCKET` | Vercel server-side | All server dispatches self-skip (nothing is even scheduled); `/api/realtime/token` returns 404 |
| `NEXT_PUBLIC_REALTIME_ENABLE` | Browser (public env) | The provider stays inert: no token fetch, no socket, no room joins |

DB polling continues as the source of truth in every kill-switch state. There
is **no schema rollback** — realtime made zero schema/migration changes.

---

## 4. Required manual production steps (rollout sequence — DO NOT EXECUTE YET)

Run only after a recorded manual GO decision. Complete
`realtime-server/PRODUCTION_DRY_RUN.md` (secrets/DNS/TLS/firewall/systemd
checklists) alongside this sequence. One step at a time; stop and roll back on
any anomaly.

1. **Confirm code baseline** — the production deployment (main) includes the
   RC10 baseline: `npm run check:realtime-rc` reports
   "matches Realtime Pilot RC10 baseline" on the deployed commit, and
   `npm run verify:realtime-security` is green.
2. **Deploy/update the production realtime server runtime if needed** — the
   Hetzner server must run the RC10 `realtime-server/src` (which includes the
   `tournaments` exact public-room allowlist). `npm ci --omit=dev`,
   `npm run preflight` (must pass in production env), restart the systemd
   service.
3. **Verify health** — `curl -fsS https://realtime.ascendrahub.com/healthz`
   returns `{"ok":true,...}` with minimal fields; `/internal/status` returns
   401 without auth; port 8787 is not publicly reachable.
4. **Set production env only after manual approval** — server-side Vercel vars
   (`REALTIME_SERVER_URL`, `REALTIME_EVENT_SECRET`,
   `REALTIME_CLIENT_TOKEN_SECRET`, TTL/timeout) and the browser
   `NEXT_PUBLIC_REALTIME_URL`, with both enable-flags still `false`. Secrets
   follow the rules in `PRODUCTION_DRY_RUN.md` §3 (distinct, never public,
   never logged).
5. **Enable the server flag first** — `REALTIME_ENABLE_SOCKET=true`. Emitters
   start sending; browsers are still inert. Confirm no errors in app logs and
   that admin/tournament actions behave identically.
6. **Enable the browser flag second** — `NEXT_PUBLIC_REALTIME_ENABLE=true`.
   Browsers connect, join public rooms, and signed-in users fetch tokens.
7. **Monitor status counters/logs** — `/internal/status` (with
   `REALTIME_STATUS_SECRET`): connections, join accept/reject counts,
   `internalEventsAccepted`/rejected; server logs for rejected joins or
   signature failures; Vercel logs for token-route errors. No secrets in any
   output.
8. **Test one public event** — e.g. an admin tournament status/list change →
   `tournaments.updated` (or `npm run smoke:event` for `leaderboard`):
   confirm the public surface refreshes live and counters increment.
9. **Test one private notification event** — trigger a notification for a test
   user: that user's UI refreshes live via `notifications:{userId}`; a second
   signed-in user receives nothing; an anonymous session cannot join the
   room.
10. **Rollback flags to false if any issue** — see §5. Any anomaly = NO-GO;
    the site continues on polling.

## 5. Rollback steps

1. Set Vercel `REALTIME_ENABLE_SOCKET=false` (server emits stop; token route
   hides as 404).
2. Set `NEXT_PUBLIC_REALTIME_ENABLE=false` (browsers go inert on next load).
3. Confirm the site works unchanged on DB polling (notifications, tournaments
   list, leaderboard, match pages).
4. Optionally `sudo systemctl stop ascendra-realtime` on Hetzner if the server
   itself must be taken down.
5. No DB/schema rollback exists or is needed.

## 6. Emergency kill-switch steps (fastest path)

1. **Single fastest action:** flip `REALTIME_ENABLE_SOCKET=false` in Vercel —
   all dispatches stop immediately and the token route returns 404, so
   clients cannot re-authenticate after token expiry (tokens are ≤10-minute
   TTL).
2. Then flip `NEXT_PUBLIC_REALTIME_ENABLE=false` to stop browser connection
   attempts entirely.
3. If the realtime server is misbehaving at the infra level:
   `sudo systemctl stop ascendra-realtime` (browsers degrade gracefully; the
   provider never breaks the page).
4. Verify the site on polling; record the incident; investigate via
   `FAILURE_MODES.md` before any re-enable.

---

## 7. Hetzner staging note — RC10 runtime change

RC10 required exactly **one** realtime-server runtime update: the exact
public room `tournaments` was added to the public-room allowlist in
`realtime-server/src/channels.mjs` (plus its channel builder). The staging
server was updated and verified with it (STAGING_SIGNOFF §18); the
**production** Hetzner server must receive the same runtime before/with the
rollout (step 2 above).

- No wildcard rooms were added; `tournaments:{anything}` and prefix variants
  are rejected (unit + E2E tested).
- No private/admin room rule was weakened; the notifications ACL and token
  issuance are byte-identical to RC9.

## 8. Security guarantees (enforced + tested)

- **Anonymous clients can only join the approved public rooms**
  (`leaderboard`, `tournaments`, `tournament:{id}`, `match:{id}`); everything
  else is denied by the server ACL.
- **`notifications:{userId}` requires an exact signed token claim** — the
  short-lived HMAC token minted by `/api/realtime/token` for the signed-in
  user only; the route is hidden (404) while realtime is disabled and returns
  401 to anonymous callers.
- **Users cannot join `notifications:{otherUserId}`** — exact-room claims
  only, no prefix/wildcard escalation (unit + E2E asserted, Preview-verified
  in RC9).
- **No `localStorage`/`sessionStorage`/cookies are used for realtime tokens or
  payloads** — tokens live only in memory; static guardrails fail the build
  if storage usage creeps in.
- Plus: HMAC + Bearer + replay protection + rate limits + 64 KB body cap on
  `/internal/events`; CORS allowlist (no wildcard in production); protected
  `/internal/status`; secrets never logged.

## 9. Intentionally NOT included in RC10

- Admin rooms (`admin`, `admin:*`).
- Team rooms (`team:{id}`).
- Profile rooms (`profile:{id}`).
- Notification read/unread/deleted/bulk realtime
  (`notification.updated/read/deleted/bulk`).
- Registration-status realtime (`tournament.registrationStatus.updated`).
- Unapproved match events (`disputed`, `game_completed`, `room_linked`,
  `checkin_updated`, `proof_synced`, `communication_updated`).
- Anonymous private realtime (anonymous browser realtime is disabled
  entirely).
- Redis (single-node Socket.IO only).
- Bot telemetry / Discord-bot realtime (the bot is untouched).

These remain polling-only and are actively **blocked** by the guardrails —
adding any of them requires a new checklist batch and re-baselining.

## 10. Guardrails stay strict

The RC10 baseline is enforced by, and must not be relaxed:

- `npm run check:realtime-rc` — offline RC10 baseline checker (per-file
  emitter allowlist, per-consumer room checks, token-room tightening, doc
  presence — including this runbook).
- `npm --prefix realtime-server run expansion:gate` — offline expansion gate.
- `lib/__tests__/realtimeSecurityGuardrails.test.ts` — static guardrails
  (storage/secret/socket-import/dispatch scans).
- `npm run verify:realtime-security` — the one-command full gate
  (expansion gate, dry-run, preflight, server E2E, root realtime tests,
  build, audit).

No wildcard events or rooms are permitted anywhere. Any future change starts
at `docs/realtime-expansion-checklist.md`, not here.
