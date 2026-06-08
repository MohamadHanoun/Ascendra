# Ascendra Realtime Server (Dormant Foundation)

Standalone Node.js + Socket.IO server skeleton that will **later** power true
realtime updates for AscendraHub from a Hetzner box behind a TLS reverse proxy
(`wss://realtime.ascendrahub.com`).

> ⚠️ **This is a dormant foundation.** It is **not** wired into the Next.js app,
> it is **not** deployed, and it must **not** be run on production until Mohamad
> approves. The current realtime system (DB-backed polling via `RealtimeEvent` +
> `/api/realtime/events`) continues to work exactly as before and is unchanged.

> **Batch 1B** added an HMAC-protected server-to-server event bridge: the
> Next.js helper `lib/realtime/emitRealtimeEvent.ts` (server-only) and the
> `/internal/events` Bearer + HMAC verification here. It remains **dormant** —
> no app emitter calls it, and the DB-polling realtime system is unchanged.
>
> **Batch 1C** added two server-side safety helpers in the Next.js app —
> `lib/realtime/payload.ts` (payload sanitizer) and `lib/realtime/rooms.ts`
> (room mapper). They are **not wired into any emitter yet**. Before browser
> WebSocket rollout:
>
> - **Public payloads must be minimal / ID-only.** The sanitizer strips
>   sensitive fields (rejection reasons, names, emails, tokens, secrets,
>   headers, Discord IDs, `userIds`, etc.), blocks prototype pollution, and caps
>   depth/size; public events keep only safe IDs.
> - **Notification events must become user-scoped.** The room mapper sends
>   `notification.*` only to `notifications:{userId}` and returns `[]` when no
>   safe user ID is present — they must never broadcast to public rooms.
> - **Rooms are derived only from validated event fields**, never from caller
>   payload.

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
  - Requires **BOTH** (else `401`, failing closed if `REALTIME_EVENT_SECRET` is
    unset):
    1. `Authorization: Bearer <REALTIME_EVENT_SECRET>`
    2. A valid HMAC signature (see below).
  - JSON body:
    - `type` — non-empty string (required)
    - `rooms` — array of room-name strings (required)
    - `payload` — object (optional)
    - `audience` — string (optional)
    - `entityType` — string (optional)
    - `entityId` — string (optional)
  - Broadcasts to each room as the Socket.IO event `ascendra:event`.

### Internal events authentication (Batch 1B)

`/internal/events` is protected by a shared bearer secret **and** an HMAC
signature, so a leaked bearer token alone cannot be replayed or forged.

Required request headers (set automatically by the Next.js bridge):

- `Authorization: Bearer <REALTIME_EVENT_SECRET>`
- `X-Ascendra-Timestamp: <unix seconds>`
- `X-Ascendra-Signature: sha256=<hex>`
- `Content-Type: application/json`
- `User-Agent: Ascendra-Realtime-Bridge/1.0`

Signature definition:

```
signature = HMAC_SHA256(REALTIME_EVENT_SECRET, `${timestamp}.${rawJsonBody}`)
header    = "sha256=" + hex(signature)
```

Verification rules enforced by the server:

- The HMAC is computed over the **exact raw JSON body bytes** (captured via the
  Express `json({ verify })` option), not a re-serialized object.
- Timestamps outside a **±120 second** replay window are rejected.
- Signatures are compared in constant time.
- The secret, signatures, and full payloads are **never logged**.

The matching sender lives in the Next.js app at
`lib/realtime/emitRealtimeEvent.ts` (server-only, dormant — see below).

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

### Realtime server (this folder)

See `.env.example`. Copy it to `.env` for local use only — never commit real
secrets.

- `NODE_ENV`
- `PORT`
- `REALTIME_EVENT_SECRET`
- `REALTIME_CLIENT_TOKEN_SECRET`
- `ALLOWED_ORIGINS`
- `ASCENDRA_SITE_URL`
- `LOG_LEVEL`

### Next.js / Vercel bridge (Batch 1B)

The dormant bridge `lib/realtime/emitRealtimeEvent.ts` reads these on the
**server side of the Next.js app** (Vercel project env). Names only:

- `REALTIME_ENABLE_SOCKET` — must be exactly `"true"` to enable sending.
  Disabled by default.
- `REALTIME_SERVER_URL` — absolute base URL of this server. **HTTPS is required
  in production**; plain `http://` is allowed only for `localhost`/`127.0.0.1`
  outside production. The bridge always POSTs to the fixed `/internal/events`
  path (callers cannot choose the path).
- `REALTIME_EVENT_SECRET` — must match this server's secret. **Server-only.**
- `REALTIME_EMIT_TIMEOUT_MS` — optional; default `1500`, clamped to `500`–`5000`.

> **Never** prefix any secret with `NEXT_PUBLIC_`. `REALTIME_EVENT_SECRET` and
> the bridge are server-only and must never reach the browser bundle.

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
