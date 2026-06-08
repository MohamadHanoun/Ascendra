# Realtime Staging Sign-off — Leaderboard Pilot

> ⚠️ **Staging/non-production only.** Completing this checklist verifies the
> existing `leaderboard.updated` pilot in a staging environment. It does **not**
> approve production and does **not** authorize enabling any other realtime
> event. Production go-live is a separate go/no-go decision.

Related: [`PRODUCTION_DRY_RUN.md`](./PRODUCTION_DRY_RUN.md) ·
[`DEPLOYMENT.md`](./DEPLOYMENT.md) · [`SECURITY.md`](./SECURITY.md) ·
[`FAILURE_MODES.md`](./FAILURE_MODES.md) ·
[`../docs/realtime-client.md`](../docs/realtime-client.md).

## 1. Purpose

- Verify the leaderboard realtime pilot end-to-end in staging.
- Must pass **before** expanding realtime to additional events.
- Passing this does **not** enable production.

## 2. Scope

**Verify only:**
- `leaderboard.updated` server emit (from the tournament-result award path)
- the `leaderboard` room
- `LeaderboardRealtime` triggering `router.refresh()`
- existing DB-polling fallback

**Do NOT test or enable:** registration / match / team / notification socket
events, admin/private rooms in the UI, or production rollout.

## 3. Preconditions

- [ ] Batches 1A–1S committed; `git status` clean.
- [ ] `npm.cmd run test` green; `npm.cmd run build` green.
- [ ] `npm.cmd --prefix realtime-server run test:e2e` green.
- [ ] Staging realtime server deployed **separately from the Discord bot**.
- [ ] Staging DNS ready (e.g. `realtime-staging.ascendrahub.com`, or a documented
      equivalent host).
- [ ] Staging Caddy/TLS working.
- [ ] `GET /healthz` returns ok; `/internal/status` is protected.
- [ ] `npm run smoke:event` works against staging.
- [ ] A Vercel staging/preview environment is available.

## 4. Required env (names only — never values)

**Staging realtime server:** `NODE_ENV`, `PORT`, `REALTIME_EVENT_SECRET`,
`REALTIME_CLIENT_TOKEN_SECRET`, `REALTIME_STATUS_SECRET`, `ALLOWED_ORIGINS`,
`ASCENDRA_SITE_URL`, `LOG_LEVEL`, `INTERNAL_EVENTS_RATE_LIMIT_PER_MINUTE`,
`INTERNAL_EVENTS_REPLAY_WINDOW_SECONDS`.

**Staging Vercel (server-side):** `REALTIME_ENABLE_SOCKET`, `REALTIME_SERVER_URL`,
`REALTIME_EVENT_SECRET`, `REALTIME_CLIENT_TOKEN_SECRET`,
`REALTIME_CLIENT_TOKEN_TTL_SECONDS`, `REALTIME_EMIT_TIMEOUT_MS`.

**Staging Vercel (public):** `NEXT_PUBLIC_REALTIME_ENABLE`,
`NEXT_PUBLIC_REALTIME_URL`.

**Rules:**
- [ ] `REALTIME_EVENT_SECRET` matches between Vercel staging and the staging server.
- [ ] `REALTIME_CLIENT_TOKEN_SECRET` matches between both.
- [ ] `REALTIME_STATUS_SECRET` is distinct from the other two.
- [ ] No secret in any `NEXT_PUBLIC_*` variable.
- [ ] Staging secrets are used — **never** production secrets.

## 5. Step-by-step staging test

### A. Server health
```bash
curl -fsS https://realtime-staging.ascendrahub.com/healthz
```
- [ ] Returns minimal `{ ok, uptimeSeconds, connections }` only (no config/secrets).

### B. Protected status
```bash
# Use the env var; never paste the literal secret.
REALTIME_STATUS_TARGET_URL=https://realtime-staging.ascendrahub.com \
  REALTIME_STATUS_SECRET=<set-in-env> npm run status:check
```
- [ ] Without auth, `/internal/status` returns 401.
- [ ] With the status secret, counters are visible. No secrets printed.

### C. Smoke event
```bash
REALTIME_SMOKE_TARGET_URL=https://realtime-staging.ascendrahub.com \
  REALTIME_EVENT_SECRET=<set-in-env> npm run smoke:event
```
- [ ] `status: 200 ok=true`; `/internal/status` shows `internalEventsAccepted`
      and `emittedEvents` incremented.

### D. Browser flag test
- [ ] Open the Vercel staging URL.
- [ ] No secrets in console/network; no token/cookie logging.
- [ ] `/api/realtime/token` returns a token only when both
      `NEXT_PUBLIC_REALTIME_ENABLE` and the server-side flags are configured;
      otherwise 404/401.
- [ ] The browser connects only to `NEXT_PUBLIC_REALTIME_URL`.

### E. Leaderboard pilot test
- [ ] In staging, award/update a **test** tournament result via the normal
      admin/UI path.
- [ ] DB result is correct; leaderboard updates normally.
- [ ] `/internal/status` counters increment: accepted internal event, emitted
      event, emitted room count.
- [ ] With both flags on, the browser leaderboard refreshes live.
- [ ] With the socket disabled, the leaderboard still updates via DB polling.

### F. Rollback drill
- [ ] Set `REALTIME_ENABLE_SOCKET=false` → server receives no new app events.
- [ ] Set `NEXT_PUBLIC_REALTIME_ENABLE=false` → browser no longer connects.
- [ ] DB polling continues; leaderboard still updates.

## 6. Pass / fail criteria

**Pass only if:** no secrets in client bundle/console/network; `/internal/status`
protected; smoke event works; the real leaderboard pilot works; rollback works;
DB-polling fallback works; Discord bot untouched; no realtime-caused errors in
Vercel logs; no sensitive payload in realtime events.

**Fail if:** any secret appears in the client bundle/console/network; any
private/admin room is joinable anonymously; `/internal/status` is public; the DB
result path breaks; a realtime failure breaks the award flow; or CORS allows a
wildcard in staging/prod mode.

## 7. Evidence to collect (no secrets)

- `/healthz` response.
- `/internal/status` counters before/after the award.
- Vercel logs showing no realtime-caused errors.
- Leaderboard before/after screenshots.
- Rollback confirmation.

## 8. Production decision

- Passing staging does **not** automatically enable production.
- Production requires a separate go/no-go (see `PRODUCTION_DRY_RUN.md`).
- Do **not** enable any new realtime event until the leaderboard pilot is stable
  in production.
