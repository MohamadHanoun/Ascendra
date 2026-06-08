# Realtime Pilot RC1 — leaderboard.updated only

Frozen release-candidate baseline for the Ascendra realtime pilot. This is the
exact scope that may go to staging. Any deviation must follow
`docs/realtime-expansion-checklist.md`. Verify the repo matches this baseline with
`npm run check:realtime-rc`, and run the full gate with
`npm run verify:realtime-security`.

## 1. Release candidate name

**Realtime Pilot RC1 — `leaderboard.updated` only.**

## 2. Current approved scope

**Allowed server emitter:**
- `leaderboard.updated` only.
- Source file: `lib/tournamentResults.ts` (`publishAwardRealtimeEvents`).
- Room: `leaderboard`.
- Payload: ID-only (`tournamentId`).
- Server flag: `REALTIME_ENABLE_SOCKET` (additive, fire-and-forget; the DB
  `RealtimeEvent` write remains the source of truth).

**Allowed browser consumer:**
- `components/LeaderboardRealtime.tsx` only.
- Joins only the public room `leaderboard`.
- Triggers `router.refresh()` only.
- Does **not** trust the socket payload for UI state.
- Browser flag: `NEXT_PUBLIC_REALTIME_ENABLE`.

**Allowed provider:**
- `RealtimeProviderRoot` mounted in `app/layout.tsx` (with `publicRooms={[]}`).
- `RealtimeProvider` imported only through `RealtimeProviderRoot`.
- `socket.io-client` imported only in `components/realtime/RealtimeProvider.tsx`.

## 3. Explicitly NOT included

- Registration realtime socket events.
- Match realtime socket events.
- Team socket events.
- Notification socket events.
- Admin/private UI consumers.
- Tournament-page socket consumer.
- Profile socket consumer.
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

- Operator runbook: `docs/realtime-staging-operator-guide.md` (step-by-step
  staging execution of this RC).
- Complete `realtime-server/STAGING_SIGNOFF.md` before production.
- Passing staging does **not** automatically approve production.
- No second realtime event may be added before staging sign-off or explicit
  approval (one event type per batch).

## 9. Production go/no-go

- Production requires **manual** approval.
- Do **not** enable flags automatically.
- Do **not** deploy from scripts.
