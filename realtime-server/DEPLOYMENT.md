# Realtime Server — Deployment Runbook

Production deployment guide for `ascendra-realtime-server` on Hetzner.

> ⚠️ **Do NOT deploy until Mohamad approves.** This service stays dormant until
> the Vercel env `REALTIME_ENABLE_SOCKET` is set to `true` — and that must only
> happen **after** this service is live and passing health + E2E checks.
>
> This service is **completely separate** from the existing Discord bot. Do not
> modify, restart, or co-locate it with the bot's process or unit.

See also: [`SECURITY.md`](./SECURITY.md), [`README.md`](./README.md),
[`FAILURE_MODES.md`](./FAILURE_MODES.md) (failure behavior + rollback),
[`PRODUCTION_DRY_RUN.md`](./PRODUCTION_DRY_RUN.md) (complete the operator
checklist — and `npm run dry-run:check` — before deploying), and
[`STAGING_SIGNOFF.md`](./STAGING_SIGNOFF.md) (required staging sign-off for the
leaderboard pilot — use `npm run status:check` — before production).

## 1. Service account & directories

```bash
# Dedicated unprivileged user (no login shell).
sudo useradd --system --no-create-home --shell /usr/sbin/nologin ascendra-realtime

# Release directory.
sudo mkdir -p /opt/ascendra-realtime
sudo chown -R ascendra-realtime:ascendra-realtime /opt/ascendra-realtime

# Secrets directory (env lives OUTSIDE the release dir and out of git).
sudo mkdir -p /etc/ascendra
```

## 2. Secrets / environment file

Place the env at `/etc/ascendra/realtime.env` (see `.env.example` for the names).
**Never commit this file.** Required keys:

- `NODE_ENV=production`
- `PORT=8787`
- `REALTIME_EVENT_SECRET` (≥ 32 chars; must match Vercel)
- `REALTIME_CLIENT_TOKEN_SECRET` (≥ 32 chars; must match Vercel; **different** from the event secret)
- `ALLOWED_ORIGINS=https://www.ascendrahub.com,https://ascendrahub.com`
- `ASCENDRA_SITE_URL=https://www.ascendrahub.com`
- `LOG_LEVEL=info`
- (optional) `INTERNAL_EVENTS_RATE_LIMIT_PER_MINUTE`, `INTERNAL_EVENTS_REPLAY_WINDOW_SECONDS`

Lock it down:

```bash
sudo chown root:ascendra-realtime /etc/ascendra/realtime.env
sudo chmod 640 /etc/ascendra/realtime.env   # or 600 if owned by the service user
```

Generate secrets without leaving them in shell history (note the leading space,
and use a shell configured to ignore space-prefixed history):

```bash
 node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the value directly into the env file with an editor; do not `echo` secrets
on the command line.

## 3. Install (production)

```bash
# Copy the realtime-server release into /opt/ascendra-realtime, then:
cd /opt/ascendra-realtime
npm ci --omit=dev          # reproducible; excludes dev-only socket.io-client
```

## 4. Preflight

Validate configuration before first start (prints PASS/WARN/FAIL, never secrets):

```bash
sudo -u ascendra-realtime --preserve-env \
  env $(grep -v '^#' /etc/ascendra/realtime.env | xargs) \
  npm run preflight
```

Resolve any `FAIL` lines before continuing. (In production mode, failures exit
non-zero.)

## 5. DNS

- `realtime.ascendrahub.com` → **A record** to the Hetzner server IPv4.
- (Optional, later) AAAA record for IPv6.

## 6. Reverse proxy (Caddy)

Use `Caddyfile.example` as the basis for `/etc/caddy/Caddyfile`
(`realtime.ascendrahub.com` → `127.0.0.1:8787`, auto TLS, security headers).

```bash
sudo cp Caddyfile.example /etc/caddy/Caddyfile   # edit as needed
sudo systemctl reload caddy
```

## 7. Firewall (UFW)

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP (ACME + redirect)
sudo ufw allow 443/tcp    # HTTPS / WSS
sudo ufw enable
```

**Do not expose 8787 publicly** — it must remain bound to loopback and reached
only via Caddy.

## 8. systemd

```bash
sudo cp systemd/ascendra-realtime.service.example \
        /etc/systemd/system/ascendra-realtime.service   # edit paths/user
sudo systemctl daemon-reload
sudo systemctl enable ascendra-realtime
sudo systemctl start ascendra-realtime
sudo systemctl status ascendra-realtime
journalctl -u ascendra-realtime -f        # follow logs (no secrets are logged)
```

## 9. Health, status & verification

Public, minimal health probe (no secrets/config):

```bash
curl -fsS https://realtime.ascendrahub.com/healthz
# {"ok":true,"uptimeSeconds":...,"connections":...}
```

Protected metrics (counters + non-sensitive config flags only). Auth with
`REALTIME_STATUS_SECRET` if set, otherwise `REALTIME_EVENT_SECRET`. Reach it over
loopback on the box (do not expose `/internal/*` publicly beyond the proxy):

```bash
curl -fsS -H "Authorization: Bearer $REALTIME_STATUS_SECRET" \
  http://127.0.0.1:8787/internal/status
```

Metrics are **in-memory and reset on restart**. For logs (no secrets/bodies are
logged) use:

```bash
journalctl -u ascendra-realtime -f
```

Send a safe signed smoke event (never prints secrets/signatures; public-only):

```bash
REALTIME_SMOKE_TARGET_URL=https://realtime.ascendrahub.com \
  REALTIME_EVENT_SECRET=<set-in-env> npm run smoke:event
# expect: status: 200 ok=true
```

Optionally run the local E2E suite against a staging instance before flipping the
Vercel flag.

## 10. Enabling the app (only after the above passes)

Only **after** the service is live and healthy:

- Set Vercel `REALTIME_ENABLE_SOCKET=true` (and the matching
  `REALTIME_SERVER_URL`, `REALTIME_EVENT_SECRET`, `REALTIME_CLIENT_TOKEN_SECRET`).
- Until then the app keeps using DB polling and emits nothing to this service.

## 11. Rollback

```bash
sudo systemctl stop ascendra-realtime
# Restore the previous release directory (e.g. swap a symlink or restore backup).
sudo systemctl start ascendra-realtime
sudo systemctl status ascendra-realtime
```

If realtime misbehaves, the safest rollback is to set Vercel
`REALTIME_ENABLE_SOCKET=false` — the app instantly reverts to DB polling with no
dependency on this service.

## 12. Reminders

- Do **not** touch the Discord bot during any of these steps.
- No secrets in source, git, or shell history.
- `node_modules` and `.env` are never committed.
