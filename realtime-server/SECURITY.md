# Realtime Server — Security & Supply Chain

This package (`ascendra-realtime-server`) is the standalone realtime service for
Ascendra. It is intentionally isolated and minimal.

See also [`FAILURE_MODES.md`](./FAILURE_MODES.md) for fail-closed behavior and
rollback under outage/misconfiguration/attack.

## Isolation

- **Standalone.** This package must **not** import any code from the Next.js app
  (`../lib`, `../app`, etc.). Shared logic (token format, room rules) is kept as
  an independent copy here on purpose. (Test files may cross-import app helpers
  only to prove interoperability — never runtime code.)
- It does **not** use Redis and does **not** touch the database or the Discord
  bot.

## Dependency hygiene

- **Keep dependencies minimal.** Runtime: `express`, `cors`, `dotenv`,
  `socket.io`. Dev-only: `socket.io-client` (used solely by the local E2E
  harness). Do not add new runtime dependencies without review.
- **Do not install realtime-server packages in the repo root.** Always work
  inside this folder (`cd realtime-server`) or with `npm --prefix realtime-server`.
- `socket.io-client` is a **devDependency** and must not ship to production.

## Lockfile & installs

- **Commit `package-lock.json`** for reproducible installs. `.npmrc` enforces
  `package-lock=true` and `save-exact=true`.
- **Never commit `node_modules`** (gitignored).
- **Production install:** `npm ci --omit=dev` inside this folder — reproducible
  and excludes dev tooling.

## Auditing

- Run an audit **before every deployment**:
  - `npm run audit` → `npm audit --omit=optional`
  - `npm run audit:prod` → `npm audit --omit=dev --omit=optional` (production
    surface only)
  - `npm run deps:check` → `npm ls --all` (inspect the resolved tree)
- **Do not run `npm audit fix` blindly.** Review each advisory; apply only
  non-breaking, justified bumps. If a fix is breaking or uncertain, stop and
  escalate rather than auto-upgrading.

## Static guardrails

Automated guardrail tests (`lib/__tests__/realtimeSecurityGuardrails.test.ts`,
run by the normal `npm test`) scan source as text and **fail the build** if
unsafe realtime patterns are reintroduced. They enforce:

- No `NEXT_PUBLIC_*SECRET` env usage anywhere in the app (no client secret
  exposure).
- The bridge/token modules keep `import "server-only"`.
- `realtime-server/` never imports app/framework code (`@/`, `next`, `react`,
  `prisma`, `auth`, or relative traversal into the app).
- The app never imports `realtime-server`.
- The app does not import `socket.io-client` (no browser socket usage yet).
- No runtime emitter references `dispatchRealtimeEvent(Soon)` (no emitter wiring
  yet); it stays defined only in `lib/realtime/dispatchRealtime.ts`.
- The payload sanitizer still covers the required sensitive fields.
- The room mapper never reads `payload.rooms`.
- The client-token tests still forbid PII/secret fields in the token payload.

**These guardrails must only be relaxed by a batch that explicitly approves the
relevant capability** (e.g. the browser RealtimeProvider, or wiring the first
pilot emitter). Never move a secret into a `NEXT_PUBLIC_` variable to satisfy a
guardrail.

## Secrets

- **No secrets in source or git.** No HMAC secrets (`REALTIME_EVENT_SECRET`),
  client-token secrets (`REALTIME_CLIENT_TOKEN_SECRET`), OAuth tokens, or Discord
  bot tokens anywhere in this repository.
- **Never commit `.env` files** (gitignored). Secrets come from the environment
  / platform env (e.g. systemd `EnvironmentFile`), never from committed files.
- `.npmrc` here contains **no** registry auth tokens or private-registry
  credentials.
- Logs must never include secrets, signatures, `Authorization` headers, tokens,
  cookies, or raw request bodies.
