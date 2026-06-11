# Realtime Expansion Checklist

**Required before adding any new realtime event or consumer.** Maximum **one new
event type per batch**. See `realtime-server/THREAT_MODEL.md` for the security
rationale; run `npm --prefix realtime-server run expansion:gate` to confirm the
current state still matches the approved pilot.

The current frozen baseline is **Realtime Pilot RC6**
(`docs/realtime-release-candidate.md`). Before staging, confirm the repo matches
it with `npm run check:realtime-rc` and run the full gate with
`npm run verify:realtime-security`. Any new event moves the repo off RC6 and
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
override); `check:realtime-rc` green. **RC3 Preview verification passed
2026-06-11** (evidence: `realtime-server/STAGING_SIGNOFF.md` §11) — WebSocket
connected, the same tournament's page refreshed live after bracket generation,
a different tournament's page did not, kill-switch rollback worked after both
flags were returned to `false`, polling fallback remained intact. Production
remains disabled; anonymous browser realtime remains disabled.

---

## Completed expansion record — `tournament.status.updated` (Batch 4A → RC4)

**1. Event proposal:** `tournament.status.updated`; `entityType` `tournament` /
`entityId` `{tournamentId}`; audience `public`; room `tournament:{tournamentId}`
(existing, RC2/RC3-verified); payload exactly `{ tournamentId }`; classification
public.

**2. Security review:** payload is ID-only (sanitizer public path strips the
`status` value — covered by the dispatch tests and the gated E2E); same
anonymous-joinable public room class as RC2/RC3 with validated ID segments;
missing/expired tokens degrade to polling; a realtime outage cannot affect the
admin status action or the lifecycle job (`after()`-scheduled with a safe
fallback outside request scope, never throws) and DB polling continues.

**3. Implementation:** one event type; two appended dispatches next to the
existing `createRealtimeEvent` calls — the admin status action in
`actions/adminTournamentInlineActions.ts` (the first approved `actions/`
emitter file) and `publishLifecycleEvents` in
`lib/jobs/tournamentLifecycleJobs.ts` — no business-logic or status-transition
changes; **zero new consumers** (the existing `TournamentDetailsRealtime`
helper now accepts the type for the mounted tournament); gates re-baselined to
the four-file emitter allowlist and now also scan `actions/`; unit + gated E2E
tests added (delivery + cross-room isolation + status-field stripping).
`tournament.registrationStatus.updated` and all other events remain
polling-only.

**4. Rollback:** unchanged — `REALTIME_ENABLE_SOCKET=false` and/or
`NEXT_PUBLIC_REALTIME_ENABLE=false`; DB polling remains the source of truth.

**5. Validation:** `verify:realtime-security` green (with the known audit
override); `check:realtime-rc` green. **RC4 Preview verification passed
2026-06-11** (evidence: `realtime-server/STAGING_SIGNOFF.md` §12) — WebSocket
connected, the same tournament's page refreshed live after a status change, a
different tournament's page did not, kill-switch rollback worked after both
flags were returned to `false`, polling fallback remained intact. Production
remains disabled; anonymous browser realtime remains disabled.

---

## Completed expansion record — `tournament.match.report_submitted` (Batch 5A → RC5)

**1. Event proposal:** `tournament.match.report_submitted`; `entityType`
`tournamentMatch` / `entityId` `{matchId}`; audience `public`; rooms
`match:{matchId}` + `tournament:{tournamentId}` (the room mapper's
pre-existing public match-event routing — the `match:{id}` public room class
was already server-approved and ACL-tested, this is its first client use);
payload exactly `{ tournamentId, matchId }`; classification public.

**2. Security review:** payload is ID-only (sanitizer public path — scores,
proof URLs/file names, reporter IDs, team names, comments, and admin notes are
stripped; covered by the dispatch tests and the gated E2E); `match:{id}` is the
same anonymous-joinable public room class as `tournament:{id}` with validated
ID segments; the parent tournament room also receives the event by design, and
the tournament-details refresh helper ignores match events (E2E-asserted);
missing/expired tokens degrade to polling; a realtime outage cannot affect
match reporting (`after()`-scheduled, never throws) and DB polling continues.

**3. Implementation:** one event type; one appended conditional dispatch in
`submitManualMatchReport` (`lib/tournamentMatchEngine.ts`, already an
allowlisted emitter file) — fires **only** for the plain report outcome; the
auto-confirmed / disputed outcomes stay polling-only; consumer
`MatchRealtimeRefresh` extended additively (polling untouched) with a pure
refresh helper (`components/match/matchRealtimeUtils.ts`) accepting only this
event for the mounted match; gates re-baselined (third approved consumer, the
engine file's event list grew by one); unit + gated E2E tests added (delivery
+ cross-match isolation + sensitive-field stripping). All other match events
remain polling-only.

**4. Rollback:** unchanged — `REALTIME_ENABLE_SOCKET=false` and/or
`NEXT_PUBLIC_REALTIME_ENABLE=false`; DB polling remains the source of truth.

**5. Validation:** `verify:realtime-security` green (with the known audit
override); `check:realtime-rc` green. **RC5 Preview verification passed
2026-06-11** (evidence: `realtime-server/STAGING_SIGNOFF.md` §13) — WebSocket
connected, the same match's page refreshed live after a normal report
submission, a different match's page did not, kill-switch rollback worked
after both flags were returned to `false`, polling fallback remained intact.
Production remains disabled; anonymous browser realtime remains disabled.

---

## Completed expansion record — `tournament.match.confirmed` (Batch 6A → RC6)

**1. Event proposal:** `tournament.match.confirmed`; `entityType`
`tournamentMatch` / `entityId` `{matchId}`; audience `public`; rooms
`match:{matchId}` + `tournament:{tournamentId}` (the mapper's pre-existing
public match-event routing — no new room shape); payload exactly
`{ tournamentId, matchId }`; classification public.

**2. Security review:** payload is ID-only (sanitizer public path — winner
team, admin/confirmer IDs, FACEIT flags, scores, team names, and comments are
stripped; covered by the dispatch tests and the gated E2E); same
anonymous-joinable `match:{id}` public room class as RC5 with validated ID
segments; the parent tournament room also receives the event by design, and
the tournament-details refresh helper ignores match events (E2E-asserted);
missing/expired tokens degrade to polling; a realtime outage cannot affect
match confirmation (`after()`-scheduled, never throws) and DB polling
continues.

**3. Implementation:** one event type; one guarded dispatch in the shared
`emitMatchEvent` helper (`lib/tournamentMatchEngine.ts`, already an allowlisted
emitter file) firing only for `tournament.match.confirmed` + public audience —
one dispatch site covers every confirmation path (auto-confirm, admin confirm,
FACEIT auto-result, admin override) with a fresh ID-only payload (the
`extra` fields never reach the dispatch); **zero new consumers** (the existing
`MatchRealtimeRefresh` helper now also accepts the type for the mounted
match); gates re-baselined (the engine file's event list grew by one); unit +
gated E2E tests added (delivery + cross-match isolation + sensitive-field
stripping). `tournament.match.disputed` and all other match events remain
polling-only.

**4. Rollback:** unchanged — `REALTIME_ENABLE_SOCKET=false` and/or
`NEXT_PUBLIC_REALTIME_ENABLE=false`; DB polling remains the source of truth.

**5. Validation:** `verify:realtime-security` green (with the known audit
override); `check:realtime-rc` green. Production remains disabled; anonymous
browser realtime remains disabled; RC6 still requires its own Preview
verification before any production decision.
