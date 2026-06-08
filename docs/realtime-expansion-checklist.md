# Realtime Expansion Checklist

**Required before adding any new realtime event or consumer.** Maximum **one new
event type per batch**. See `realtime-server/THREAT_MODEL.md` for the security
rationale; run `npm --prefix realtime-server run expansion:gate` to confirm the
current state still matches the approved pilot.

## 1. Event proposal

- [ ] Event name (e.g. `tournament.result.updated`).
- [ ] `entityType` / `entityId`.
- [ ] `audience` (`public` or `admin`).
- [ ] Target room(s).
- [ ] Payload fields (exhaustive list).
- [ ] Classification: public / private / admin.

## 2. Security review

- [ ] Is the payload **ID-only** for public events?
- [ ] Any sensitive fields (names, emails, Discord IDs, tokens, reasons)? They
      must be stripped by the sanitizer.
- [ ] Which `payload.ts` sanitizer tests cover it?
- [ ] Which rooms will clients join, and which ACL protects them?
- [ ] What happens when the token is missing/expired? (Must degrade safely.)
- [ ] What happens when the realtime server is down? (Must not break mutations;
      DB polling continues.)

## 3. Implementation rules

- [ ] One event type per batch.
- [ ] Add a static guardrail entry for the new emitter/consumer/room.
- [ ] Add unit tests (dispatch + sanitizer + room mapping).
- [ ] Add an E2E / full-loop test where possible.
- [ ] Keep the DB-polling fallback in place.
- [ ] Keep the dispatch non-blocking (`dispatchRealtimeEventSoon`, fire-and-forget).
- [ ] No business-logic change.
- [ ] No schema change unless separately approved.

## 4. Rollback plan

- [ ] Server flag off: `REALTIME_ENABLE_SOCKET=false`.
- [ ] Browser flag off: `NEXT_PUBLIC_REALTIME_ENABLE=false`.
- [ ] DB polling continues as the source of truth.
- [ ] Remove/disable the specific consumer if needed.

## 5. Required validation

- [ ] **`npm run verify:realtime-security`** — one command that runs the full
      gate (expansion gate, dry-run, preflight, realtime-server E2E, root realtime
      tests, build, audit). If only the **known pre-existing** Next/PostCSS audit
      advisory fails, re-run with
      `REALTIME_VERIFY_ALLOW_KNOWN_AUDIT=true npm run verify:realtime-security`.
      Do not auto-remediate dependencies.
- [ ] Staging sign-off (`realtime-server/STAGING_SIGNOFF.md`) if app-facing.

The individual checks the command wraps (run separately if needed):
`expansion:gate`, `dry-run:check`, `preflight`, `test:e2e`, the root realtime
tests, `build`, and `audit --omit=optional`. `status:check` and `smoke:event`
remain **manual operator** commands (they need a running server / secrets).

> No second realtime event may be enabled until this checklist is completed and
> the leaderboard pilot is stable.
