# Ascendra Realtime Server (Dormant Foundation)

Standalone Node.js + Socket.IO server skeleton that will **later** power true
realtime updates for AscendraHub from a Hetzner box behind a TLS reverse proxy
(`wss://realtime.ascendrahub.com`).

> ⚠️ **This is a dormant foundation.** It is **not** wired into the Next.js app,
> it is **not** deployed, and it must **not** be run on production until Mohamad
> approves. The current realtime system (DB-backed polling via `RealtimeEvent` +
> `/api/realtime/events`) continues to work exactly as before and is unchanged.

## What this is / is not

- ✅ Independent folder. Imports **no** code from the Next.js app.
- ✅ No Redis. No database access. Does **not** touch the Discord bot.
- ✅ Socket.IO server + an internal HTTP ingress for server-to-server events.
- ❌ Not enabled in the website. No WebSocket client exists in Next.js yet.
- ❌ No production ACLs yet — anonymous connections are allowed and only public
  rooms are joinable.

## Endpoints

- `GET /healthz` — liveness/readiness probe. Returns status, uptime, connection
  count, and which config flags are present (never the secret values).
- `POST /internal/events` — server-to-server event ingress.
  - Requires `Authorization: Bearer <REALTIME_EVENT_SECRET>` (else `401`).
  - JSON body:
    - `type` — non-empty string (required)
    - `rooms` — array of room-name strings (required)
    - `payload` — object (optional)
    - `audience` — string (optional)
    - `entityType` — string (optional)
    - `entityId` — string (optional)
  - Broadcasts to each room as the Socket.IO event `ascendra:event`.

## Channels / rooms

Builders live in `src/channels.mjs`. Planned model:

| Room                         | Visibility (future)            |
| ---------------------------- | ------------------------------ |
| `tournament:{id}`            | public                         |
| `match:{id}`                 | public                         |
| `leaderboard`                | public                         |
| `user:{userId}`              | private (that user only)       |
| `notifications:{userId}`     | private (that user only)       |
| `profile:{userId}`           | private (that user only)       |
| `team:{teamId}`              | team members only              |
| `admin`                      | admins only                    |
| `admin:tournament:{id}`      | admins only                    |
| `admin:queue`                | admins only                    |

In this dormant phase, only `tournament:*`, `match:*`, and `leaderboard` are
joinable. Private/admin rooms are refused until client-token ACLs are added in a
later phase (see comments in `src/auth.mjs` and `src/channels.mjs`).

## Local development

From inside `realtime-server/`:

```bash
npm install
npm run dev
```

- `npm run dev` runs the server with `--watch` (auto-restart on file changes).
- `npm start` runs it once (used by the systemd example).

Default port is `8787`, bound to `127.0.0.1`.

## Environment variables (names only)

See `.env.example`. Copy it to `.env` for local use only — never commit real
secrets.

- `NODE_ENV`
- `PORT`
- `REALTIME_EVENT_SECRET`
- `REALTIME_CLIENT_TOKEN_SECRET`
- `ALLOWED_ORIGINS`
- `ASCENDRA_SITE_URL`
- `LOG_LEVEL`

## Deployment templates (examples only)

- `systemd/ascendra-realtime.service.example` — systemd unit template with
  placeholder paths (`/opt/ascendra-realtime`), `Restart=always`, and an
  `EnvironmentFile` for secrets. **Example only.**
- `Caddyfile.example` — reverse proxy for `realtime.ascendrahub.com` →
  `127.0.0.1:8787` with automatic TLS and WebSocket support. **Example only.**

Both are templates. Adjust paths/users to the real server and provide secrets
via the environment file (never in git).

> **Do not run this on production until Mohamad approves.** It must remain a
> separate service from the existing Discord bot.
