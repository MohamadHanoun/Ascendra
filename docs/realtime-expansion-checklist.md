# Realtime Expansion Checklist

**Required before adding any new realtime event or consumer.** Maximum **one new
event type per batch**. See `realtime-server/THREAT_MODEL.md` for the security
rationale; run `npm --prefix realtime-server run expansion:gate` to confirm the
current state still matches the approved pilot.

The current frozen baseline is **Realtime Pilot RC3**
(`docs/realtime-release-candidate.md`). Before staging, confirm the repo matches
it with `npm run check:realtime-rc` and run the full gate with
`npm run verify:realtime-security`. Any new event moves the repo off RC3 and
requires re-baselining.

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

> No further realtime event may be enabled until this checklist is completed for
> it and the current pilots are stable.

---

## Completed expansion record — `tournament.result.updated` (Batch 2A → RC2)

**1. Event proposal:** `tournament.result.updated`; `entityType` `tournament` /
`entityId` `{tournamentId}`; audience `public`; room `tournament:{tournamentId}`;
payload exactly `{ tournamentId }`; classification public.

**2. Security review:** payload is ID-only (enforced by the sanitizer's public
path; covered in `realtimePayload.test.ts`); no sensitive fields; clients join
only the public `tournament:{id}` room (anonymous-joinable class, validated ID
segment on both sides); missing/expired tokens degrade to polling; a realtime
outage cannot affect the award mutation (`after()`-scheduled, never throws) and
DB polling continues.

**3. Implementation:** one event type; emitter added only in
`publishAwardRealtimeEvents` (`lib/tournamentResults.ts`); consumer
`TournamentDetailsRealtime` extended additively (polling untouched); guardrails,
RC checker, and expansion gate re-baselined to exactly two events / two
consumers; unit + gated E2E tests added (including cross-room isolation); the
manual inline-save admin path intentionally remains polling-only.

**4. Rollback:** unchanged — `REALTIME_ENABLE_SOCKET=false` and/or
`NEXT_PUBLIC_REALTIME_ENABLE=false`; DB polling remains the source of truth.

**5. Validation:** `verify:realtime-security` green (with the known audit
override); `check:realtime-rc` green. **RC2 Preview verification passed
2026-06-11** (evidence: `realtime-server/STAGING_SIGNOFF.md` §10) — tournament
page refreshed live, a different tournament's page did not, kill-switch
rollback worked, polling fallback continued. Production remains disabled;
anonymous browser realtime remains disabled.

---

## Completed expansion record — `tournament.bracket.generated` (Batch 3A → RC3)

**1. Event proposal:** `tournament.bracket.generated`; `entityType`
`tournament` / `entityId` `{tournamentId}`; audience `public`; room
`tournament:{tournamentId}` (existing, RC2-verified); payload exactly
`{ tournamentId }`; classification public.

**2. Security review:** payload is ID-only (sanitizer public path; covered by
the dispatch test and the gated E2E, which prove `totalMatches`/`teamName` etc.
never leave); same anonymous-joinable public room class as RC2 with validated
ID segments; missing/expired tokens degrade to polling; a realtime outage
cannot affect bracket generation (`after()`-scheduled, never throws) and DB
polling continues.

**3. Implementation:** one event type; one appended dispatch in
`generateBracket` (`lib/tournamentMatchEngine.ts`) — no engine logic changes;
**zero new consumers** (the existing `TournamentDetailsRealtime` helper now
accepts the type for the mounted tournament); gates re-baselined to a
**per-file emitter allowlist** (`tournamentResults.ts` → its two events;
`tournamentMatchEngine.ts` → bracket only); unit + gated E2E tests added
(delivery + cross-room isolation). `tournament.status.updated` and all other
events remain polling-only.

**4. Rollback:** unchanged — `REALTIME_ENABLE_SOCKET=false` and/or
`NEXT_PUBLIC_REALTIME_ENABLE=false`; DB polling remains the source of truth.

**5. Validation:** `verify:realtime-security` green (with the known audit
override); `check:realtime-rc` green. Production remains disabled; anonymous
browser realtime remains disabled; RC3 still requires its own Preview
verification before any production decision.
