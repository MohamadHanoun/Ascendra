# Ascendra Realtime Server (Dormant Foundation)

Standalone Node.js + Socket.IO server skeleton that will **later** power true
realtime updates for AscendraHub from a Hetzner box behind a TLS reverse proxy
(`wss://realtime.ascendrahub.com`).

> ⚠️ **This is a dormant foundation.** It is **not** wired into the Next.js app,
> it is **not** deployed, and it must **not** be run on production until Mohamad
> approves. The current realtime system (DB-backed polling via `RealtimeEvent` +
> `/api/realtime/events`) continues to work exactly as before and is unchanged.

**Key docs:**

- [`SECURITY.md`](./SECURITY.md) — dependency hygiene & secret handling.
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — production runbook (systemd, Caddy,
  firewall, DNS, rollback).
- [`FAILURE_MODES.md`](./FAILURE_MODES.md) — how realtime fails closed under
  outage/misconfig/attack, and the instant rollback (DB polling stays the
  source of truth).
- `npm run preflight` — validate production env/readiness (PASS/WARN/FAIL, never
  prints secrets) before starting the service.

> ⚠️ **Production is not active until Mohamad approves.** Do not flip the Vercel
> `REALTIME_ENABLE_SOCKET` flag until this service is deployed, healthy, and has
> passed preflight + health checks.

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
>
> **Batch 1D** added a single server-only dispatch helper in the Next.js app —
> `lib/realtime/dispatchRealtime.ts`. It composes the previous pieces in order:
> **room mapping → payload sanitization → HMAC bridge**
> (`mapRealtimeEventToRooms` → `sanitizeRealtimePayload` → `emitRealtimeEventToServer`).
> It is **not wired into any existing emitter**, never throws, and the bridge
> remains env-gated (`REALTIME_ENABLE_SOCKET`, off by default). The DB-polling
> realtime system remains the source of truth.
>
> **Batch 1F** added short-lived **client token** issuance
> (`app/api/realtime/token` + `lib/realtime/clientToken.ts`) and **room ACL**
> enforcement here (`src/clientToken.mjs` + `src/acl.mjs`). Private/admin rooms
> now require an exact token claim; public rooms stay anonymous. The token route
> is dormant (404) until `REALTIME_ENABLE_SOCKET=true`, and **no browser client
> exists yet**.

## What this is / is not

- ✅ Independent folder. Imports **no** code from the Next.js app.
- ✅ No Redis. No database access. Does **not** touch the Discord bot.
- ✅ Socket.IO server + an internal HTTP ingress for server-to-server events.
- ❌ Not enabled in the website. No WebSocket client exists in Next.js yet.
- ❌ No production ACLs yet — anonymous connections are allowed and only public
  rooms are joinable.

## Endpoints

- `GET /healthz` — **public, minimal** liveness probe. Returns only `ok`,
  `uptimeSeconds`, and `connections`. No config/secret details.
- `GET /internal/status` — **protected** in-memory metrics (Batch 1J). Requires
  `Authorization: Bearer <REALTIME_STATUS_SECRET>` (falls back to
  `REALTIME_EVENT_SECRET` when no dedicated status secret is set); `401`
  otherwise. Returns counters + non-sensitive config flags only — never secrets,
  tokens, signatures, payloads, or the full origin list (count only). See the
  Observability section below.
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

### Hardening (Batch 1E)

`/internal/events` is further protected, all in-memory (no Redis):

- **Bearer + HMAC + timestamp + replay protection.** A given
  `timestamp`+`signature` pair is accepted once; reuse within the replay window
  (`INTERNAL_EVENTS_REPLAY_WINDOW_SECONDS`, default 120s) returns `409`. The
  replay cache is **in-memory and single-instance only** — acceptable because
  there is no Redis and exactly one Hetzner realtime process is expected.
- **Per-IP rate limit** (`INTERNAL_EVENTS_RATE_LIMIT_PER_MINUTE`, default 120) →
  `429` with `Retry-After` when exceeded.
- **64 KB JSON body limit** → `413` on oversize (`/internal/events` only ever
  needs tiny ID-only payloads).
- **Strict methods** — `/internal/events` accepts only `POST`, `/healthz` only
  `GET`; anything else returns `405` with an `Allow` header.
- **Security headers** on every response: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer`, `Cache-Control: no-store`.

### CORS / origins

- Browser origins are allowed **only** if listed in `ALLOWED_ORIGINS` (HTTP CORS
  and Socket.IO share one resolver). **No wildcard `*` is ever used.**
- Requests with **no `Origin` header** (server-to-server, curl) are allowed —
  `/internal/events` is still protected by Bearer + HMAC + replay.
- In **development only**, any `localhost` / `127.0.0.1` origin is allowed.
- In **production with empty `ALLOWED_ORIGINS`**, all browser origins are
  rejected (fail closed) and a warning is logged at boot.

### Socket.IO room-join ACL (Batch 1F)

The browser may pass a short-lived signed token in the handshake
(`auth: { token }`). The token is **optional** — public-only usage stays
anonymous. Invalid/expired/tampered tokens do **not** disconnect the socket; the
connection simply falls back to anonymous and private/admin joins are denied.

- **Public rooms — anonymous allowed:** `leaderboard`, `tournament:{id}`,
  `match:{id}`.
- **Private rooms — require a valid token whose `rooms` EXACTLY contains the
  room:** `user:{id}`, `notifications:{id}`, `profile:{id}`.
- **Admin rooms — require a valid token with `isAdmin === true` AND the exact
  room claimed:** `admin`, `admin:queue`. (`admin:tournament:{id}` is only
  joinable if the token explicitly includes that exact room — no wildcard
  escalation.)
- **`team:{id}` is intentionally deferred** — the token route does not issue
  team rooms yet, so they remain inaccessible.
- Room names are strictly validated (`/^[a-zA-Z0-9:_-]+$/`, ≤160 chars, clean ID
  segment) and join attempts are rate-limited to **30/minute per socket**.

Token verification (`src/clientToken.mjs`) mirrors the Next.js issuer
(`lib/realtime/clientToken.ts`) — same format and algorithm. It rejects missing
secret, malformed tokens, bad/expired/not-yet-valid times, unsupported version,
missing `sub`, and invalid rooms, using timing-safe signature comparison. Token
contents and signatures are never logged.

### Safe logging

Logs may include event type, room count, connection count, and status. Logs
**never** include secrets, signatures, `Authorization` headers, cookies, tokens,
handshake auth, or raw/full request bodies.

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

## Observability & abuse monitoring (Batch 1J)

In-memory metrics (`src/metrics.mjs`), per server instance, **reset on restart**:
socket connections (active/total/disconnects); `/internal/events` accepted and
rejected-by-reason (`auth`, `hmac`, `replay`, `rate_limit`, `validation`,
`body_too_large`, `method`); room join attempts/accepts and rejected-by-reason
(`invalid_room`, `private_denied`, `admin_denied`, `rate_limit`); emitted event +
room counts; and `lastEventAt` / `lastRejectionAt` timestamps.

- **Counters only** — no payloads, tokens, secrets, signatures, or raw IPs.
- Exposed only via the **protected** `GET /internal/status` (see Endpoints).
- **Abuse logging:** repeated rejections (rate-limit, invalid HMAC, replay,
  denied private/admin joins) emit threshold `warn` logs with `{ category,
  reason, count }` — never IPs, secrets, signatures, or bodies.
- This is a **monitoring foundation**, not a full observability stack. For logs,
  use `journalctl -u ascendra-realtime`.

## Local end-to-end harness (Batch 1G)

An **opt-in**, local-only E2E suite proves the realtime server, HMAC bridge,
Socket.IO client, token verification, and room ACL work together.

- Local only: boots the server on an **ephemeral loopback port** with
  **generated test secrets** (never production secrets, never the production
  port). No external network.
- Gated by `ASCENDRA_REALTIME_E2E=true`. Default test runs (root `npm test`)
  **skip** it cleanly and do not require `socket.io-client`.
- It proves: public-room delivery; private-room token ACL (exact claim, isolated
  delivery); admin ACL (claim + `isAdmin`, no wildcard escalation); invalid
  token → anonymous fallback (no disconnect); HMAC required; replay rejected;
  tampered body rejected; oversized body rejected. No secrets/bodies are logged.

Run it:

```bash
cd realtime-server
npm install        # installs express/cors/socket.io + socket.io-client (dev)
npm run test:e2e   # sets ASCENDRA_REALTIME_E2E=true and runs the e2e suite
```

`test:e2e` invokes the **root** vitest (via `scripts/run-e2e.mjs`) so it reuses
the repo's test config; you do not need vitest installed inside this folder.

This is **not** a production deployment, and it still does **not** wire the app
UI or any emitter to realtime.

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
- `INTERNAL_EVENTS_RATE_LIMIT_PER_MINUTE` — optional; default 120, clamped 1–6000.
- `INTERNAL_EVENTS_REPLAY_WINDOW_SECONDS` — optional; default 120, clamped 30–600.

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
- `REALTIME_CLIENT_TOKEN_SECRET` — used by `app/api/realtime/token` to sign
  client tokens. **Server-only.** Must match the realtime server's value.
- `REALTIME_CLIENT_TOKEN_TTL_SECONDS` — optional; default `300`, clamped
  `60`–`600`.

> **Never** prefix any secret with `NEXT_PUBLIC_`. `REALTIME_EVENT_SECRET`,
> `REALTIME_CLIENT_TOKEN_SECRET`, and the bridge are server-only and must never
> reach the browser bundle.

### Client token route (Batch 1F)

`GET /api/realtime/token` (Next.js, server-only, `nodejs` runtime) mints a
short-lived signed token for the **authenticated** caller:

- Returns **404** while `REALTIME_ENABLE_SOCKET !== "true"` (route stays hidden);
  **503** if the secret is missing or (in production) shorter than 32 chars;
  **401** if not logged in.
- Token format: `base64url(payload).base64url(HMAC_SHA256(secret, base64url(payload)))`.
- Payload is minimal: `{ sub, isAdmin, rooms, iat, exp, version }` — **no**
  Discord ID, email, username, OAuth tokens, cookies, or session data.
- Rooms issued: `user:{id}`, `notifications:{id}`, `profile:{id}` for everyone;
  plus `admin`, `admin:queue` for admins. No team rooms yet.
- Response headers: `Cache-Control: no-store, max-age=0`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`.
- The browser client that consumes this token is **not** implemented in this
  batch.

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
