# Realtime Staging Operator Guide — RC1

Step-by-step guide for Mohamad/operator to execute the **Realtime Pilot RC1**
staging verification safely. This is an operator runbook — it changes no code.

Related: [`realtime-release-candidate.md`](./realtime-release-candidate.md) ·
[`realtime-client.md`](./realtime-client.md) ·
[`../realtime-server/STAGING_SIGNOFF.md`](../realtime-server/STAGING_SIGNOFF.md) ·
[`../realtime-server/PRODUCTION_DRY_RUN.md`](../realtime-server/PRODUCTION_DRY_RUN.md)
· [`../realtime-server/THREAT_MODEL.md`](../realtime-server/THREAT_MODEL.md).

## 1. Purpose

- Walk the operator through staging verification of RC1.
- **No code changes. No production. No Discord bot changes. No secrets in this
  document.**

## 2. RC1 scope reminder

- Only `leaderboard.updated`.
- Only the `LeaderboardRealtime` consumer.
- Only the public `leaderboard` room.
- No other realtime events / consumers.
- DB polling remains the fallback / source of truth.

## 3. Local pre-checks (before touching staging)

Run from the repo root:

```bash
git status --short
npm.cmd run check:realtime-rc
# Windows CMD:
set REALTIME_VERIFY_ALLOW_KNOWN_AUDIT=true && npm.cmd run verify:realtime-security
# PowerShell:
#   $env:REALTIME_VERIFY_ALLOW_KNOWN_AUDIT="true"; npm.cmd run verify:realtime-security
npm.cmd --prefix realtime-server run dry-run:check
```

Expected: clean git tree, RC check **green**, verify gate **green** (with the
known Next/PostCSS audit advisory handled), dry-run **green**.

## 4. Staging server preparation (operator checklist — do not auto-execute)

- [ ] Create/use a **separate** staging realtime directory.
- [ ] Do **not** share files with the Discord bot.
- [ ] Use a separate service name if possible: `ascendra-realtime-staging`.
- [ ] Run as a non-root service user.
- [ ] Use a separate env file: `/etc/ascendra/realtime-staging.env` (chmod 600/640).
- [ ] Use a staging domain: `realtime-staging.ascendrahub.com` (or chosen equivalent).
- [ ] Do **not** reuse production secrets for staging.
- [ ] Keep `PORT` private (bound to loopback) behind Caddy.
- [ ] `npm ci --omit=dev` in the deployed `realtime-server` folder.
- [ ] `npm run preflight` with the staging env (must pass).

## 5. Staging DNS / TLS

- [ ] Add an A record for the staging realtime subdomain → staging host IPv4.
- [ ] Do **not** change production DNS records.
- [ ] Caddy auto-TLS for the staging subdomain.
- [ ] Verify: `curl -fsS https://<staging-realtime-domain>/healthz`.
- [ ] `/healthz` returns minimal `{ ok, uptimeSeconds, connections }` only.

## 6. Required staging env (names only — never values)

**Realtime-server (staging):** `NODE_ENV`, `PORT`, `REALTIME_EVENT_SECRET`,
`REALTIME_CLIENT_TOKEN_SECRET`, `REALTIME_STATUS_SECRET`, `ALLOWED_ORIGINS`,
`ASCENDRA_SITE_URL`, `LOG_LEVEL`, `INTERNAL_EVENTS_RATE_LIMIT_PER_MINUTE`,
`INTERNAL_EVENTS_REPLAY_WINDOW_SECONDS`.

**Vercel preview/staging (server-side):** `REALTIME_ENABLE_SOCKET`,
`REALTIME_SERVER_URL`, `REALTIME_EVENT_SECRET`, `REALTIME_CLIENT_TOKEN_SECRET`,
`REALTIME_CLIENT_TOKEN_TTL_SECONDS`, `REALTIME_EMIT_TIMEOUT_MS`.

**Vercel preview/staging (public):** `NEXT_PUBLIC_REALTIME_ENABLE`,
`NEXT_PUBLIC_REALTIME_URL`.

**Rules:**
- [ ] No secret in any `NEXT_PUBLIC_*` variable.
- [ ] `REALTIME_EVENT_SECRET` matches between Vercel staging and the staging server.
- [ ] `REALTIME_CLIENT_TOKEN_SECRET` matches between both.
- [ ] `REALTIME_STATUS_SECRET` is distinct from the other two.
- [ ] Staging secrets only — never production secrets.

## 7. Staging startup verification (examples only — no values, no secrets)

```bash
# Protected status (set the env vars in your shell first; never paste literals):
#   REALTIME_STATUS_TARGET_URL=https://<staging-realtime-domain>
#   REALTIME_STATUS_SECRET=<set-in-env>
npm.cmd --prefix realtime-server run status:check

# Safe signed smoke event:
#   REALTIME_SMOKE_TARGET_URL=https://<staging-realtime-domain>
#   REALTIME_EVENT_SECRET=<set-in-env>
npm.cmd --prefix realtime-server run smoke:event
```

Expected: `/healthz` ok; `/internal/status` requires auth; `smoke:event` →
`status: 200 ok=true`; `/internal/status` counters increment.

## 8. Vercel preview flag sequence (safe order)

1. Deploy the app preview with the current code.
2. Keep `REALTIME_ENABLE_SOCKET=false` and `NEXT_PUBLIC_REALTIME_ENABLE=false`.
3. Verify the normal site works with DB polling.
4. Set the server envs but keep both flags off.
5. Enable `REALTIME_ENABLE_SOCKET=true` **first**.
6. Verify no app breakage (server-side emit only; no browser change yet).
7. Enable `NEXT_PUBLIC_REALTIME_ENABLE=true` and set `NEXT_PUBLIC_REALTIME_URL`.
8. Verify the browser connects.
9. Verify the leaderboard surface only.

If anything goes wrong, **turn the flags off** — DB polling remains the fallback.

## 9. Browser verification

- [ ] Open the staging site.
- [ ] Console: no secrets, no token logs, no noisy errors.
- [ ] Network:
  - [ ] `/api/realtime/token` appears only when the browser flag is enabled.
  - [ ] The socket connects only to the staging realtime URL.
  - [ ] No `REALTIME_EVENT_SECRET` / `REALTIME_CLIENT_TOKEN_SECRET` exposed anywhere.
- [ ] Leaderboard page:
  - [ ] Joins `leaderboard` only.
  - [ ] No private/admin rooms.
  - [ ] Refresh occurs after a test event/result.
- [ ] With the flag disabled: no socket connection, polling still works.

## 10. Leaderboard pilot test

- [ ] Use the existing admin/staging flow to award/update a **test** tournament result.
- [ ] DB result is correct.
- [ ] Leaderboard updates.
- [ ] Realtime `/internal/status` counters increment.
- [ ] Browser refreshes quickly when the socket is enabled.
- [ ] With the socket disabled, the leaderboard still updates via polling.

## 11. Rollback drill

- [ ] Set `REALTIME_ENABLE_SOCKET=false` → confirm no new app events reach the server.
- [ ] Set `NEXT_PUBLIC_REALTIME_ENABLE=false` → confirm the browser stops connecting.
- [ ] Confirm the leaderboard still updates via polling.
- [ ] No schema rollback (there are no schema changes).
- [ ] Do not touch the Discord bot.

## 12. Evidence template (copy/fill — no secrets)

```
Date/time:
Staging app URL:
Staging realtime URL:
RC check result:
Verify gate result:
Healthz result:
Status (before):
Smoke result:
Status (after smoke):
Leaderboard (before / after):
Rollback result:
Issues found:
```

## 13. Go / No-Go recommendation

- **Go** to production only if all checks pass.
- **No second event** until RC1 is stable.
- Production requires **separate manual approval** (see `PRODUCTION_DRY_RUN.md`).
