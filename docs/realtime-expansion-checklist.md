# Realtime Expansion Checklist

**Required before adding any new realtime event or consumer.** Maximum **one new
event type per batch**. See `realtime-server/THREAT_MODEL.md` for the security
rationale; run `npm --prefix realtime-server run expansion:gate` to confirm the
current state still matches the approved pilot.

The current frozen baseline is **Realtime Pilot RC9**
(`docs/realtime-release-candidate.md`). Before staging, confirm the repo matches
it with `npm run check:realtime-rc` and run the full gate with
`npm run verify:realtime-security`. Any new event moves the repo off RC9 and
requires re-baselining.

## 1. Event proposal

- [ ] Event name (e.g. `tournament.result.updated`).
- [ ] `entityType` / `entityId`.
- [ ] `audience` (`public`, `private`, or `admin`).
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
tournament pages do not refresh for this event (E2E-asserted);
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
tournament pages do not refresh for this event (E2E-asserted);
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
override); `check:realtime-rc` green. **RC6 Preview verification passed
2026-06-11** (evidence: `realtime-server/STAGING_SIGNOFF.md` §14) — WebSocket
connected, the same match's page refreshed live after confirming a test
match, a different match's page did not, kill-switch rollback worked after
both flags were returned to `false`, polling fallback remained intact.
Production remains disabled; anonymous browser realtime remains disabled.

---

## Completed expansion record — `tournament.match.advanced` (Batch 7A → RC7)

**1. Event proposal:** `tournament.match.advanced`; `entityType`
`tournamentMatch` / `entityId` `{matchId}`; audience `public`; rooms
`match:{matchId}` + `tournament:{tournamentId}` (the mapper's existing public
match-event routing — no new room shape); payload exactly
`{ tournamentId, matchId }`; classification public.

**2. Security review:** payload is ID-only (sanitizer public path —
`nextMatchId`, `slot`, winner/team IDs, scores, proof details, names,
comments, and admin notes are stripped); same anonymous-joinable
`match:{id}` and `tournament:{id}` public room classes with validated ID
segments; missing/expired tokens degrade to polling; a realtime outage cannot
affect bracket advancement (`after()`-scheduled, never throws) and DB polling
continues.

**3. Implementation:** one event type; one guarded dispatch in the shared
`emitMatchEvent` helper (`lib/tournamentMatchEngine.ts`, already an
allowlisted emitter file) firing only for `tournament.match.advanced` + public
audience, emitted by `advanceBracketAfterMatch` after the DB `RealtimeEvent`
write; **zero new consumers** and **zero new room shapes**. The existing
`MatchRealtimeRefresh` helper now accepts the event for the mounted match, and
the existing `TournamentDetailsRealtime` helper accepts it for the mounted
tournament because bracket progression affects bracket/details. Gates are
re-baselined to RC7; unit + gated E2E tests cover delivery, cross-match and
cross-tournament isolation, and sensitive-field stripping. All unapproved
match events remain polling-only.

**4. Rollback:** unchanged — `REALTIME_ENABLE_SOCKET=false` and/or
`NEXT_PUBLIC_REALTIME_ENABLE=false`; DB polling remains the source of truth.

**5. Validation:** `verify:realtime-security` green (with the known audit
override); `check:realtime-rc` green. **RC7 Preview verification passed
2026-06-11** (evidence: `realtime-server/STAGING_SIGNOFF.md` §15) — WebSocket
connected, the same match page and same tournament page refreshed live after
bracket advancement, different match and tournament pages did not, kill-switch
rollback worked after both flags were returned to `false`, polling fallback
remained intact. Production remains disabled; anonymous browser realtime
remains disabled.

---

## Completed expansion record — `tournament.registration.updated` (Batch 8A → RC8)

**1. Event proposal:** `tournament.registration.updated`; `entityType`
`tournament` / `entityId` `{tournamentId}`; audience `public`; room
`tournament:{tournamentId}` (existing public tournament room); payload exactly
`{ tournamentId }`; classification public.

**2. Security review:** payload is tournament-ID-only (event-specific public
sanitizer path — registration IDs, team IDs/names, player/user IDs, Discord
IDs, rejection reasons, notes, invite details, and admin details are stripped);
same anonymous-joinable `tournament:{id}` public room class with validated ID
segments; missing/expired tokens degrade to polling; a realtime outage cannot
affect registration, approval, rejection, cancellation, or Discord sync actions
(`after()`-scheduled, never throws) and DB polling continues.

**3. Implementation:** one event type; guarded socket dispatches added only
next to existing DB `createRealtimeEvent` writes for the exact
`tournament.registration.updated` event in
`actions/tournamentRegistrationInlineActions.ts`,
`actions/adminRegistrationInlineActions.ts`, and
`actions/adminRegistrationDiscordSyncActions.ts`. **Zero new consumers** and
**zero new room shapes**: the existing `TournamentDetailsRealtime` helper now
accepts the event for the mounted tournament. Gates are re-baselined to RC8;
unit + gated E2E tests cover delivery, cross-tournament isolation, and
sensitive-field stripping. `registration.approved`, `registration.rejected`,
`registration.cancelled`, `tournament.registrationStatus.updated`,
notification events other than `notification.created`, teams, profiles,
private/admin rooms, and all other events remain polling-only.

**4. Rollback:** unchanged — `REALTIME_ENABLE_SOCKET=false` and/or
`NEXT_PUBLIC_REALTIME_ENABLE=false`; DB polling remains the source of truth.

**5. Validation:** `verify:realtime-security` green (with the known audit
override); `check:realtime-rc` green. **RC8 Preview verification passed
2026-06-11** (evidence: `realtime-server/STAGING_SIGNOFF.md` §16) — WebSocket
connected, the same tournament page refreshed live after a registration/admin
registration action, a different tournament page did not, kill-switch rollback
worked after both flags were returned to `false`, polling fallback remained
intact. Production remains disabled; anonymous browser realtime remains
disabled.

---

## Completed expansion record — `notification.created` (Batch 9A → RC9)

**1. Event proposal:** `notification.created`; `entityType` `notification` /
`entityId` `{notificationId}`; audience `private`; room
`notifications:{userId}`; socket payload exactly `{ notificationId }`;
classification private/authenticated user.

**2. Security review:** payload is notification-ID-only (event-specific
sanitizer path — title/body/message, user IDs, emails, Discord IDs, names,
links, admin notes, private metadata, tokens, cookies, headers, and raw data are
stripped). Room routing uses an internal `targetUserId` that is never emitted in
the socket payload. Token issuance is signed-in only, hidden when
`REALTIME_ENABLE_SOCKET !== "true"`, and grants only the signed-in user's
`notifications:{userId}` room for RC9; the realtime-server ACL denies anonymous
notification-room joins and cross-user notification-room joins. Missing/expired
tokens degrade safely and DB polling remains active.

**3. Implementation:** one event type; one approved emitter file:
`lib/notifications.ts`. Dispatch is added only after existing
`notification.created` DB `RealtimeEvent` writes and only for created
notification rows with known `{ notificationId, userId }`. `notification.updated`
remains polling-only. One existing notification UI consumer
(`components/NotificationsDropdown.tsx`) subscribes to socket events without a
`userId` prop and without directly requesting private rooms; it refreshes from
server data and keeps the existing DB polling fallback. Gates are re-baselined
to RC9; unit + gated E2E tests cover token/ACL behavior, routing, ID-only
payloads, sensitive-field stripping, own-room delivery, and cross-user
isolation.

**4. Rollback:** unchanged — `REALTIME_ENABLE_SOCKET=false` and/or
`NEXT_PUBLIC_REALTIME_ENABLE=false`; DB polling remains the source of truth.

**5. Validation:** local validation required before handoff:
`check:realtime-rc`, `verify:realtime-security`, root tests,
realtime-server E2E, and build. **RC9 requires its own Preview verification
before any production decision.** Production remains disabled; anonymous
browser realtime remains disabled.
