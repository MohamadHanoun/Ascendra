# Realtime Production Dry-Run Checklist

> ⚠️ **Manual checklist — this document deploys nothing.** Complete every section
> before enabling realtime in Vercel or connecting any browser client. Nothing
> here should be automated against production by this repo. **Do not touch the
> Discord bot.** The DB-polling realtime system stays the source of truth
> throughout.

Related: [`DEPLOYMENT.md`](./DEPLOYMENT.md) · [`SECURITY.md`](./SECURITY.md) ·
[`FAILURE_MODES.md`](./FAILURE_MODES.md). Offline pre-check:
`npm run dry-run:check`.

## 1. Purpose

- A manual, operator-driven dry run. It does **not** deploy by itself.
- It must be completed **before** setting Vercel `REALTIME_ENABLE_SOCKET=true`
  or shipping a browser provider.

## 2. Preconditions

- [ ] Batches 1A–1L committed.
- [ ] `git status` clean.
- [ ] `npm.cmd run test` passes.
- [ ] `npm.cmd run build` passes.
- [ ] `npm.cmd --prefix realtime-server run test:e2e` passes.
- [ ] `npm.cmd --prefix realtime-server run preflight` passes with production-like
      **fake** env (no real secrets printed).
- [ ] `npm.cmd --prefix realtime-server run dry-run:check` passes.
- [ ] No pending root dependency changes.
- [ ] Discord bot untouched.

## 3. Secrets checklist (names only — never values)

**Vercel (server-side):**
- [ ] `REALTIME_ENABLE_SOCKET`
- [ ] `REALTIME_SERVER_URL`
- [ ] `REALTIME_EVENT_SECRET`
- [ ] `REALTIME_CLIENT_TOKEN_SECRET`
- [ ] `REALTIME_CLIENT_TOKEN_TTL_SECONDS`
- [ ] `REALTIME_EMIT_TIMEOUT_MS`

**Future browser public env (NOT enabled in this phase):**
- [ ] `NEXT_PUBLIC_REALTIME_URL`
- [ ] `NEXT_PUBLIC_REALTIME_ENABLE`

**Hetzner:**
- [ ] `NODE_ENV`
- [ ] `PORT`
- [ ] `REALTIME_EVENT_SECRET`
- [ ] `REALTIME_CLIENT_TOKEN_SECRET`
- [ ] `REALTIME_STATUS_SECRET`
- [ ] `ALLOWED_ORIGINS`
- [ ] `ASCENDRA_SITE_URL`
- [ ] `LOG_LEVEL`
- [ ] `INTERNAL_EVENTS_RATE_LIMIT_PER_MINUTE`
- [ ] `INTERNAL_EVENTS_REPLAY_WINDOW_SECONDS`

**Rules:**
- [ ] `REALTIME_EVENT_SECRET` ≠ `REALTIME_CLIENT_TOKEN_SECRET`.
- [ ] `REALTIME_STATUS_SECRET` ≠ both of the above.
- [ ] `REALTIME_EVENT_SECRET` / `REALTIME_CLIENT_TOKEN_SECRET` match on Vercel and
      Hetzner.
- [ ] No secret in any `NEXT_PUBLIC_*` variable.
- [ ] No secret committed to git.
- [ ] No secret left in shell history (paste into the env file via an editor).
- [ ] No secret printed in logs.

## 4. DNS checklist

- [ ] `realtime.ascendrahub.com` A record → Hetzner IPv4.
- [ ] AAAA only later, and only if the exact IPv6 host is configured.
- [ ] DNS propagation complete.
- [ ] Verify: `nslookup realtime.ascendrahub.com` / `dig +short realtime.ascendrahub.com`.
- [ ] Existing `ascendrahub.com` records unchanged.

## 5. Hetzner filesystem checklist

- [ ] App: `/opt/ascendra-realtime` (owned by the `ascendra-realtime` service user).
- [ ] Env: `/etc/ascendra/realtime.env`, `chmod 600` (or `640` root:service-group).
- [ ] systemd unit: `/etc/systemd/system/ascendra-realtime.service`.
- [ ] Caddy config: `/etc/caddy/Caddyfile`.
- [ ] Service user is **not** root.
- [ ] No files shared with the Discord bot service.

## 6. Install checklist (examples only)

```bash
cd /opt/ascendra-realtime
npm ci --omit=dev
npm run preflight                  # must pass in production env
node src/server.mjs                # optional local smoke (Ctrl-C after)
sudo systemctl daemon-reload
sudo systemctl enable --now ascendra-realtime
sudo systemctl status ascendra-realtime
```

## 7. Caddy / TLS checklist

- [ ] Caddy serves `realtime.ascendrahub.com` → `reverse_proxy 127.0.0.1:8787`.
- [ ] Auto TLS certificate issued.
- [ ] `curl -fsS https://realtime.ascendrahub.com/healthz` returns `{"ok":true,...}`.
- [ ] Port `8787` is **not** publicly reachable (only via Caddy/loopback).

## 8. Firewall checklist

- [ ] UFW allows `22`, `80`, `443`.
- [ ] `8787` is **not** exposed.
- [ ] `sudo ufw status` confirms the above.
- [ ] Optional: `curl -fsS http://127.0.0.1:8787/healthz` on the box.

## 9. Health / status checklist

```bash
curl -fsS https://realtime.ascendrahub.com/healthz
# minimal: {"ok":true,"uptimeSeconds":...,"connections":...}

# Protected metrics — use the env var, never paste the literal secret:
curl -fsS -H "Authorization: Bearer $REALTIME_STATUS_SECRET" \
  http://127.0.0.1:8787/internal/status
```

- [ ] `/healthz` returns minimal fields only (no config/secret details).
- [ ] `/internal/status` requires auth (401 without it).
- [ ] No secrets appear in any response.

## 10. Local-to-production smoke checklist

- [ ] Do **not** use real app emitters (none are wired).
- [ ] Use the built-in signed smoke tool — it HMAC-signs for you and never prints
      secrets/signatures. **Never** craft HMAC in the shell manually.

  ```bash
  # Local (default target http://127.0.0.1:8787):
  REALTIME_EVENT_SECRET=<set-in-env> npm run smoke:event

  # Against the deployed server (https required in production):
  REALTIME_SMOKE_TARGET_URL=https://realtime.ascendrahub.com \
    REALTIME_EVENT_SECRET=<set-in-env> npm run smoke:event
  ```

- [ ] Expect `status: 200 ok=true`. It sends one minimal **public** event
      (`leaderboard.updated` → `["leaderboard"]`); it cannot target
      private/admin rooms. Confirm via `/internal/status` that
      `internalEventsAccepted` incremented.
- [ ] Once `NEXT_PUBLIC_REALTIME_ENABLE` is enabled in a client, `smoke:event`
      can be used to verify the leaderboard surface receives the
      `leaderboard` room event (the `LeaderboardRealtime` consumer triggers a
      `router.refresh()`; DB polling remains the fallback).

## 11. Vercel checklist

- [ ] Add **server-side** envs only (no `NEXT_PUBLIC` secrets).
- [ ] `REALTIME_ENABLE_SOCKET` stays `false` until the server is healthy. (When
      set `true`, the only wired server emitter is the `leaderboard.updated`
      pilot in `lib/tournamentResults.ts` — additive, non-blocking; the DB
      `RealtimeEvent` remains the source of truth. Live leaderboard socket
      refresh also requires `NEXT_PUBLIC_REALTIME_ENABLE=true`.)
- [ ] `NEXT_PUBLIC_REALTIME_ENABLE` stays unset (the browser `RealtimeProvider` is
      mounted in `app/layout.tsx` but **inert** unless this flag is `"true"` and
      `NEXT_PUBLIC_REALTIME_URL` is set; it joins no rooms and has no consumers).
- [ ] DB polling remains active throughout.

## 12. Rollback checklist

- [ ] Set Vercel `REALTIME_ENABLE_SOCKET=false` (instant kill switch).
- [ ] Later, unset `NEXT_PUBLIC_REALTIME_ENABLE` once it exists.
- [ ] `sudo systemctl stop ascendra-realtime` if needed.
- [ ] Site remains fully functional via DB polling.
- [ ] No DB schema rollback — there are **no** schema changes.

## 13. Manual QA checklist (without browser provider)

- [ ] Existing site works unchanged.
- [ ] Login works.
- [ ] Notifications still update via DB polling.
- [ ] Tournaments page still updates via current polling.
- [ ] Leaderboard behaves as today.
- [ ] No console errors from missing realtime env.
- [ ] `/internal/status` is not publicly accessible.
- [ ] `/api/realtime/token` returns 404 while disabled.

## 14. Go / No-Go

**GO only if all are true:**
- [ ] tests green
- [ ] build green
- [ ] e2e green
- [ ] preflight green
- [ ] dry-run:check green
- [ ] DNS ready
- [ ] TLS ready
- [ ] `/healthz` ok
- [ ] `/internal/status` protected
- [ ] firewall ok
- [ ] no secrets leaked
- [ ] Discord bot untouched

Otherwise: **NO-GO** — keep `REALTIME_ENABLE_SOCKET=false`; the site continues on
DB polling with zero realtime dependency.
