# Realtime Pilot RC2 — leaderboard.updated + tournament.result.updated

Frozen release-candidate baseline for the Ascendra realtime pilot. This is the
exact scope that may go to staging. Any deviation must follow
`docs/realtime-expansion-checklist.md`. Verify the repo matches this baseline with
`npm run check:realtime-rc`, and run the full gate with
`npm run verify:realtime-security`.

> RC2 (Batch 2A) supersedes RC1 by adding exactly one event
> (`tournament.result.updated`), one public room shape (`tournament:{id}`), and
> one consumer (`TournamentDetailsRealtime`). RC1's Preview verification is
> recorded in `realtime-server/STAGING_SIGNOFF.md` §9; RC2 requires its own
> Preview verification before any production decision.

## 1. Release candidate name

**Realtime Pilot RC2 — `leaderboard.updated` + `tournament.result.updated` only.**

## 2. Current approved scope

**Allowed server emitters (both in `lib/tournamentResults.ts`,
`publishAwardRealtimeEvents` — the tournament-result award path):**
- `leaderboard.updated` → room `leaderboard`.
- `tournament.result.updated` → room `tournament:{tournamentId}`.
- Payloads: ID-only (`tournamentId`).
- Server flag: `REALTIME_ENABLE_SOCKET` (additive, fire-and-forget; each emit is
  scheduled post-response via Next.js `after()` so it is serverless-safe and
  never blocks or fails the mutation; the DB `RealtimeEvent` writes remain the
  source of truth).
- The manual inline-save admin path (`actions/adminTournamentResultActions.ts`)
  intentionally remains polling-only (no socket dispatch).

**Allowed browser consumers:**
- `components/LeaderboardRealtime.tsx` — joins only the public room
  `leaderboard`.
- `components/TournamentDetailsRealtime.tsx` — joins only the public room
  `tournament:{tournamentId}` of the mounted page.
- Both trigger `router.refresh()` only and do **not** trust the socket payload
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

- Registration realtime socket events.
- Match realtime socket events (`match:{id}` rooms).
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
  RC1 run; reuse the same steps for RC2, additionally verifying the tournament
  page live refresh and that a different tournament's page does **not**
  refresh).
- Complete `realtime-server/STAGING_SIGNOFF.md` before production. The RC1
  Preview run is recorded there (§9); RC2 needs its own Preview verification
  with both flags returned to `false` afterwards.
- Passing staging does **not** automatically approve production.
- No further realtime event may be added before staging sign-off or explicit
  approval (one event type per batch).

## 9. Production go/no-go

- Production requires **manual** approval.
- Do **not** enable flags automatically.
- Do **not** deploy from scripts.
