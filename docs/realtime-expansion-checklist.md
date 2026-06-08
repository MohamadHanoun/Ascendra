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

- [ ] `npm --prefix realtime-server run expansion:gate`
- [ ] Static guardrails (`realtimeSecurityGuardrails`).
- [ ] Root tests (dispatch / payload / rooms / failure modes / consumer).
- [ ] `npm --prefix realtime-server run test:e2e`.
- [ ] `npm run build`.
- [ ] `npm audit --omit=optional` (no new vulnerabilities).
- [ ] Staging sign-off (`realtime-server/STAGING_SIGNOFF.md`) if app-facing.

> No second realtime event may be enabled until this checklist is completed and
> the leaderboard pilot is stable.
