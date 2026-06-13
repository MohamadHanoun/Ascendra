# Ascendra Realtime — Threat Model

Security threat model for the Ascendra realtime architecture. Review this before
adding any new realtime event family, before production enablement, and after any
incident or suspicious metric spike.

Related: [`SECURITY.md`](./SECURITY.md) · [`FAILURE_MODES.md`](./FAILURE_MODES.md)
· [`STAGING_SIGNOFF.md`](./STAGING_SIGNOFF.md) ·
[`PRODUCTION_DRY_RUN.md`](./PRODUCTION_DRY_RUN.md) ·
[`../docs/realtime-expansion-checklist.md`](../docs/realtime-expansion-checklist.md).

## 1. Scope

Covers the Ascendra realtime architecture only:

- Vercel/Next.js app (server actions + browser client).
- Hetzner standalone realtime server (Socket.IO).
- HMAC-signed `POST /internal/events` server-to-server bridge.
- Short-lived client tokens (`/api/realtime/token`) + room ACL.
- DB-polling realtime system as the fallback / source of truth.

**Currently wired pilots (RC3):** `leaderboard.updated` (room `leaderboard`)
and `tournament.result.updated` (room `tournament:{id}`) from the
tournament-result award path, plus `tournament.bracket.generated` (room
`tournament:{id}`) from `generateBracket` — all public ID-only payloads,
emitters allowlisted per file.

## 2. Assets to protect

- `REALTIME_EVENT_SECRET`, `REALTIME_CLIENT_TOKEN_SECRET`, `REALTIME_STATUS_SECRET`.
- Discord OAuth / session data.
- User database IDs.
- Admin-only room access.
- Private `notifications:` / `user:` / `profile:` / `team:` rooms.
- Tournament-result integrity.
- DB-polling fallback integrity.
- Server logs.

## 3. Trust boundaries

- Browser ↔ Vercel (authenticated session).
- Browser ↔ realtime server (anonymous public rooms; token-gated private/admin).
- Vercel ↔ realtime server (Bearer + HMAC, server-to-server).
- Operator ↔ Hetzner (SSH / systemd / env file).
- Realtime server ↔ logs / `/internal/status` (status secret).
- Public rooms vs private/admin rooms (ACL boundary).

## 4. Threats and mitigations

**A. Secret exposure** — secrets leaked via `NEXT_PUBLIC` or logs.
Mitigations: static guardrails (no `NEXT_PUBLIC_*SECRET`), `server-only` imports
on bridge/token modules, no secret logging, no secrets in docs/examples, expansion
gate.

**B. Forged server events** — attacker POSTs fake `/internal/events`.
Mitigations: Bearer secret + HMAC signature, timestamp skew window, replay cache,
per-IP rate limit, fixed `/internal/events` path, safe-signing smoke tool.

**C. Replay attacks** — captured request replayed.
Mitigations: ±120s timestamp window, in-memory replay cache keyed by
timestamp+signature, E2E coverage.

**D. Payload data leakage** — public events carry `rejectionReason`, Discord IDs,
tokens, emails, team/user details.
Mitigations: payload sanitizer (public = ID-only), room mapper, guardrails,
unit + loop tests asserting sensitive fields are stripped.

**E. Room escalation** — browser joins admin/user/notifications/team rooms.
Mitigations: signed token claims, exact-room ACL (no wildcard), public-room
allowlist (`leaderboard` / `tournament:{id}` / `match:{id}`), guardrails, E2E.

**F. CORS/origin abuse** — malicious origin connects.
Mitigations: `ALLOWED_ORIGINS` allowlist, no wildcard in production, fail-closed
when empty in production, preflight checks.

**G. DoS / abuse** — flood of internal events or socket joins.
Mitigations: 64 KB body limit, per-IP internal rate limit, 30/min per-socket join
limit, metrics + abuse-threshold counters.

**H. Realtime-server outage** — socket server unavailable.
Mitigations: fire-and-forget bridge (scheduled post-response via Next.js
`after()`; never blocks the mutation, never throws), mutations never fail
because of realtime, DB-polling fallback, server + browser kill switches.

**I. Token theft / expiry** — client token reused.
Mitigations: short TTL (default 5 min, max 10), token kept **in memory only**
(no localStorage/sessionStorage/cookies), exact room claims, HTTPS required.

**J. Over-expansion risk** — many events wired without review.
Mitigations: static guardrails, expansion checklist, **one event type per batch**,
expansion gate script, staging sign-off required.

## 5. Security invariants (hard rules)

- No secret in any `NEXT_PUBLIC_*` variable.
- No secret in the client bundle.
- No app emitter except allowlisted ones may use `dispatchRealtimeEventSoon`.
  The allowlist is per file: `lib/tournamentResults.ts` (only
  `leaderboard.updated` + `tournament.result.updated`) and
  `lib/tournamentMatchEngine.ts` (only `tournament.bracket.generated`).
- Public payloads are ID-only.
- Private/admin rooms require exact token claims.
- DB polling remains the fallback until explicitly retired in a future approved
  phase.
- Realtime failures must never break business mutations.
- Maximum **one new event type per batch**.

## 6. Residual risks

- Replay/rate-limit state is in-memory and single-instance (no Redis yet) — a
  second instance would not share replay history.
- Operator mistakes with env flags (e.g. enabling before staging sign-off).
- Browser token theft if the user's device is compromised (mitigated by short TTL
  + memory-only storage).
- The `postcss`/`next` moderate `npm audit` finding is **pre-existing** and not
  fixed because the only fix is a breaking Next downgrade.
- Live production load is still untested until staging/production dry-run.

## 7. Review cadence

- Before adding each new event family (run the expansion checklist + gate).
- Before production enablement.
- After any incident or suspicious metric spike (e.g. rising rejection counters).
