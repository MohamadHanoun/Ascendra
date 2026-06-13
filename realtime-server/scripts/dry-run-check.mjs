/**
 * Offline production dry-run verifier (Batch 1M).
 *
 * Local/offline checks only — NO network calls, NO production access, NO secret
 * values printed. Prints PASS/FAIL lines and exits non-zero on any failure.
 *
 * Confirms the realtime-server package is structurally ready for the manual
 * PRODUCTION_DRY_RUN.md checklist.
 */

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
}

function fileExists(rel) {
  return existsSync(path.join(ROOT, rel));
}

function readIfExists(rel) {
  const full = path.join(ROOT, rel);
  return existsSync(full) ? readFileSync(full, "utf8") : null;
}

// ─── Required docs / examples ─────────────────────────────────────────────────

for (const rel of [
  "package-lock.json",
  "SECURITY.md",
  "DEPLOYMENT.md",
  "FAILURE_MODES.md",
  "PRODUCTION_DRY_RUN.md",
  ".env.example",
  ".gitignore",
  "systemd/ascendra-realtime.service.example",
  "Caddyfile.example",
  "src/server.mjs",
]) {
  check(`exists: ${rel}`, fileExists(rel), fileExists(rel) ? "" : "missing");
}

// ─── .env.example contains the required names ─────────────────────────────────

const envExample = readIfExists(".env.example") ?? "";
for (const name of [
  "NODE_ENV",
  "PORT",
  "REALTIME_EVENT_SECRET",
  "REALTIME_CLIENT_TOKEN_SECRET",
  "REALTIME_STATUS_SECRET",
  "ALLOWED_ORIGINS",
  "ASCENDRA_SITE_URL",
  "LOG_LEVEL",
  "INTERNAL_EVENTS_RATE_LIMIT_PER_MINUTE",
  "INTERNAL_EVENTS_REPLAY_WINDOW_SECONDS",
]) {
  check(`.env.example documents ${name}`, envExample.includes(name));
}

// ─── package.json has the expected scripts ────────────────────────────────────

let pkg = {};
try {
  pkg = JSON.parse(readIfExists("package.json") ?? "{}");
} catch {
  pkg = {};
}
const scripts = pkg.scripts ?? {};
for (const script of ["preflight", "test:e2e", "audit:prod", "dry-run:check"]) {
  check(`package.json script: ${script}`, typeof scripts[script] === "string");
}
check("package.json is private", pkg.private === true);

// ─── No secrets / no committed .env ───────────────────────────────────────────

check("no committed .env file", !fileExists(".env"), fileExists(".env") ? "remove it" : "");
check(".gitignore ignores .env", (readIfExists(".gitignore") ?? "").includes(".env"));

// Scan text files for a Discord-bot-token-shaped string (3 dot-separated
// base64url segments). We never print any match — only that one was found.
const DISCORD_TOKEN = /[A-Za-z0-9_-]{23,28}\.[A-Za-z0-9_-]{6,7}\.[A-Za-z0-9_-]{27,}/;
const scanFiles = [
  ".env.example",
  "README.md",
  "SECURITY.md",
  "DEPLOYMENT.md",
  "FAILURE_MODES.md",
  "PRODUCTION_DRY_RUN.md",
  "Caddyfile.example",
  "systemd/ascendra-realtime.service.example",
];
let tokenLeak = false;
for (const rel of scanFiles) {
  const content = readIfExists(rel);
  if (content && DISCORD_TOKEN.test(content)) {
    tokenLeak = true;
    break;
  }
}
check("no token-shaped secret in tracked text files", !tokenLeak);

// .env.example values must be empty/placeholder (no `KEY=<long value>`).
const suspiciousEnvValue = envExample
  .split(/\r?\n/)
  .filter((line) => !line.trimStart().startsWith("#"))
  .some((line) => {
    const eq = line.indexOf("=");
    if (eq === -1) return false;
    const value = line.slice(eq + 1).trim();
    // Allow short obvious placeholders/defaults (e.g. 8787, info, 120, URLs).
    return value.length > 60;
  });
check("no long values baked into .env.example", !suspiciousEnvValue);

// ─── Output ───────────────────────────────────────────────────────────────────

let fails = 0;
for (const { name, ok, detail } of results) {
  if (!ok) fails += 1;
  const suffix = detail ? `  (${detail})` : "";
  // eslint-disable-next-line no-console
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${suffix}`);
}

// eslint-disable-next-line no-console
console.log(`\nDry-run check — ${results.length} checks, ${fails} fail`);

if (fails > 0) {
  // eslint-disable-next-line no-console
  console.log("Dry-run check FAILED — resolve the FAIL items before deployment.");
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log("Dry-run check PASSED (offline structural checks only).");
process.exit(0);
