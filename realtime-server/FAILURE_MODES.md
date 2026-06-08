# Realtime Failure Modes & Rollback

How the realtime system behaves under failure, misconfiguration, or attack. The
guiding principle: **fail closed, never leak secrets, and never break the site**
— the DB-polling realtime system (`RealtimeEvent` + `/api/realtime/events`)
remains the fallback and source of truth at all times.

See also: [`SECURITY.md`](./SECURITY.md), [`DEPLOYMENT.md`](./DEPLOYMENT.md),
[`README.md`](./README.md).

## Failure matrix

| Condition | Behavior | User impact |
| --- | --- | --- |
| **realtime-server is down/unreachable** | Vercel bridge `fetch` times out (default 1.5s, fire-and-forget) → `{ ok:false, skipped:false, reason:"network_error"/"timeout" }`. The mutation already succeeded and is unaffected. | None — UI updates via DB polling. |
| **Vercel `REALTIME_ENABLE_SOCKET` unset/false** | Bridge short-circuits with `{ skipped:true, reason:"disabled" }`; no network call. | None — DB polling only (current behavior). |
| **`REALTIME_SERVER_URL` missing/invalid/unsafe** | URL is validated (absolute, https in prod, no credentials, no `javascript:`/`file:`/`ftp:`); bad values → `{ skipped:true }`, no request. Caller can never inject the path — it is always `<origin>/internal/events`. | None. |
| **Token route disabled** (`REALTIME_ENABLE_SOCKET !== "true"`) | `GET /api/realtime/token` returns `404`. Browser cannot obtain a token. | None — no private realtime; DB polling continues. |
| **HMAC secret mismatch** (Vercel ≠ server) | Server rejects every `/internal/events` with `401` (bearer or HMAC fails). No events broadcast. | None — DB polling continues; counters record `auth`/`hmac` rejections. |
| **Wrong CORS/origin** | Disallowed browser origins get no `Access-Control-Allow-Origin`; the browser blocks the socket. Empty `ALLOWED_ORIGINS` in production fails closed (all browser origins denied). Server-to-server `/internal/events` is unaffected (no Origin; protected by bearer+HMAC). | Realtime unavailable for that origin; DB polling continues. |
| **Replay attack** | Reused `timestamp`+`signature` within the replay window → `409`. Stale timestamps (>±120s) → `401`. | None — attacker gains nothing. |
| **Rate limit hit** | `/internal/events` over the per-IP limit → `429` with `Retry-After`. Socket joins over 30/min per socket → ack `{ ok:false }`. | Transient; legitimate traffic resumes next window. DB polling unaffected. |
| **Token expires** | Server rejects private/admin joins for the expired token; the (future) client refreshes via the token route and rejoins. Public rooms still work anonymously. | Brief; auto-recovers on refresh. |
| **Browser socket disconnects** (future client) | The client falls back to existing DB polling / `router.refresh()` and retries the socket. | None — polling covers the gap. |
| **Oversized/invalid body** | `>64 KB` → `413`; invalid JSON → `400`; wrong method → `405`. Bodies are never logged. | None. |

## Safe rollback

1. **Instant kill switch:** set Vercel `REALTIME_ENABLE_SOCKET=false`. The app
   immediately stops emitting to the realtime server and the (future) browser
   client stops connecting — everything reverts to DB polling.
2. When a browser enable flag exists later (e.g. `NEXT_PUBLIC_REALTIME_ENABLE`),
   unset it too so clients stop attempting socket connections.
3. Optionally stop the service: `sudo systemctl stop ascendra-realtime`. The
   site keeps working through DB polling regardless.

No realtime failure should ever require touching the Discord bot, the database,
or app business logic.

## Debugging safely

- Use `journalctl -u ascendra-realtime` and `GET /internal/status` (authenticated)
  for counters. **Never** print or paste secrets, tokens, signatures,
  `Authorization` headers, cookies, or raw request bodies while debugging.
- Metrics are in-memory and reset on restart; rejection counters
  (`auth`/`hmac`/`replay`/`rate_limit`/`validation`/`body_too_large`/`method`,
  and join `invalid_room`/`private_denied`/`admin_denied`/`rate_limit`) help
  pinpoint the failure class without exposing payloads.
