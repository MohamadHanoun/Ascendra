/**
 * Production preflight for the Ascendra realtime server (Batch 1I).
 *
 * Validates deployment readiness WITHOUT printing any secret values. It prints
 * one PASS / WARN / FAIL line per check and a summary.
 *
 * Modes:
 *  - Production (NODE_ENV === "production"): required checks that fail are FAIL
 *    and the process exits non-zero.
 *  - Dev/default: required checks that fail are downgraded to WARN and the
 *    process exits 0 (so local runs are advisory, not blocking).
 *
 * Security: never prints the value (or exact length) of any secret/token, nor
 * any env var whose name contains TOKEN / SECRET / PASSWORD.
 */

const isProd = process.env.NODE_ENV === "production";

const MIN_SECRET_LENGTH = 32;
const CANONICAL_ORIGINS = [
  "https://www.ascendrahub.com",
  "https://ascendrahub.com",
];
const VALID_LOG_LEVELS = ["error", "warn", "info", "debug"];

const results = [];

/**
 * @param {string} name
 * @param {boolean} ok
 * @param {{ required?: boolean, detail?: string }} [opts]
 */
function check(name, ok, opts = {}) {
  const { required = false, detail = "" } = opts;
  let status;
  if (ok) {
    status = "PASS";
  } else if (required) {
    status = isProd ? "FAIL" : "WARN";
  } else {
    status = "WARN";
  }
  results.push({ name, status, detail });
}

function present(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// ─── Environment ──────────────────────────────────────────────────────────────

check("NODE_ENV is production", isProd, {
  required: false,
  detail: isProd ? "" : "running in dev/advisory mode",
});

// PORT — optional; valid integer or safe default.
const rawPort = process.env.PORT;
const portNum = Number.parseInt(rawPort ?? "", 10);
const portOk = !present(rawPort) || (Number.isFinite(portNum) && portNum > 0 && portNum < 65536);
check("PORT valid or defaulted", portOk, {
  required: false,
  detail: present(rawPort) ? "" : "defaulting to 8787",
});

// Secrets — presence + minimum strength (length/value never printed).
const eventSecret = process.env.REALTIME_EVENT_SECRET ?? "";
const clientSecret = process.env.REALTIME_CLIENT_TOKEN_SECRET ?? "";

check("REALTIME_EVENT_SECRET present and strong", eventSecret.length >= MIN_SECRET_LENGTH, {
  required: true,
  detail: eventSecret.length === 0 ? "missing" : eventSecret.length < MIN_SECRET_LENGTH ? "too short" : "",
});
check(
  "REALTIME_CLIENT_TOKEN_SECRET present and strong",
  clientSecret.length >= MIN_SECRET_LENGTH,
  {
    required: true,
    detail:
      clientSecret.length === 0 ? "missing" : clientSecret.length < MIN_SECRET_LENGTH ? "too short" : "",
  },
);

// Secrets must differ (only meaningful when both present).
check(
  "Secrets are distinct",
  !(eventSecret.length > 0 && eventSecret === clientSecret),
  { required: true, detail: "REALTIME_EVENT_SECRET must differ from REALTIME_CLIENT_TOKEN_SECRET" },
);

// Optional status secret, when set, must differ from the other two.
const statusSecret = process.env.REALTIME_STATUS_SECRET ?? "";
check(
  "REALTIME_STATUS_SECRET distinct (if set)",
  !(statusSecret.length > 0 && (statusSecret === eventSecret || statusSecret === clientSecret)),
  { required: true, detail: "status secret must differ from event/client token secrets" },
);

// ─── Origins ──────────────────────────────────────────────────────────────────

const origins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

check("ALLOWED_ORIGINS not empty", origins.length > 0, {
  required: true,
  detail: origins.length === 0 ? "must list allowed browser origins in production" : "",
});
check("ALLOWED_ORIGINS has no wildcard", !origins.includes("*"), {
  required: true,
  detail: origins.includes("*") ? "wildcard '*' is forbidden" : "",
});

// No insecure http origins in production (localhost http is dev-only).
const httpOrigins = origins.filter((o) => o.startsWith("http://"));
const nonLocalHttp = httpOrigins.filter(
  (o) => !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(o),
);
check(
  "ALLOWED_ORIGINS uses https (no insecure http in production)",
  isProd ? httpOrigins.length === 0 : nonLocalHttp.length === 0,
  { required: true, detail: "http origins are not allowed in production" },
);
check(
  "ALLOWED_ORIGINS includes canonical site origins",
  CANONICAL_ORIGINS.every((o) => origins.includes(o)),
  { required: false, detail: "expected www + apex ascendrahub.com (unless intentionally different)" },
);

// ─── Site URL ─────────────────────────────────────────────────────────────────

const siteUrl = (process.env.ASCENDRA_SITE_URL ?? "").trim();
check(
  "ASCENDRA_SITE_URL is the canonical https site",
  siteUrl === "" ? false : CANONICAL_ORIGINS.includes(siteUrl.replace(/\/$/, "")),
  { required: false, detail: "expected https://www.ascendrahub.com" },
);

// ─── Logging + limits ─────────────────────────────────────────────────────────

const logLevel = process.env.LOG_LEVEL;
check(
  "LOG_LEVEL is valid",
  !present(logLevel) || VALID_LOG_LEVELS.includes(logLevel),
  { required: true, detail: present(logLevel) ? "must be error|warn|info|debug" : "defaulting to info" },
);

function sane(name, min, max) {
  const raw = process.env[name];
  if (!present(raw)) {
    check(`${name} sane or defaulted`, true, { detail: "using default" });
    return;
  }
  const n = Number.parseInt(raw, 10);
  check(`${name} sane`, Number.isFinite(n) && n >= min && n <= max, {
    required: false,
    detail: `expected ${min}-${max}`,
  });
}

sane("INTERNAL_EVENTS_RATE_LIMIT_PER_MINUTE", 1, 6000);
sane("INTERNAL_EVENTS_REPLAY_WINDOW_SECONDS", 30, 600);

// ─── Output ───────────────────────────────────────────────────────────────────

let fails = 0;
let warns = 0;

for (const { name, status, detail } of results) {
  if (status === "FAIL") fails += 1;
  if (status === "WARN") warns += 1;
  const suffix = detail ? `  (${detail})` : "";
  // eslint-disable-next-line no-console
  console.log(`${status.padEnd(4)} ${name}${suffix}`);
}

// eslint-disable-next-line no-console
console.log(
  `\nPreflight ${isProd ? "PRODUCTION" : "DEV"} mode — ${results.length} checks, ${fails} fail, ${warns} warn`,
);

if (fails > 0) {
  // eslint-disable-next-line no-console
  console.log("Preflight FAILED — resolve the FAIL items before starting in production.");
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(
  isProd
    ? "Preflight PASSED."
    : "Preflight OK (dev/advisory). Set production env to enforce required checks.",
);
process.exit(0);
