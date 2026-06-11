/**
 * Realtime expansion gate (Batch 1U) — OFFLINE scan only.
 *
 * Ensures the realtime wiring still matches the approved pilot state (RC6):
 *   - Emitters are allowlisted PER FILE: lib/tournamentResults.ts may dispatch
 *     only leaderboard.updated + tournament.result.updated;
 *     lib/tournamentMatchEngine.ts may dispatch only
 *     tournament.bracket.generated + tournament.match.report_submitted +
 *     tournament.match.confirmed;
 *     actions/adminTournamentInlineActions.ts and
 *     lib/jobs/tournamentLifecycleJobs.ts may each dispatch only
 *     tournament.status.updated. No other file may dispatch.
 *   - LeaderboardRealtime, TournamentDetailsRealtime, and MatchRealtimeRefresh
 *     are the ONLY non-provider consumers of realtime hooks.
 *   - socket.io-client is imported only by RealtimeProvider.tsx.
 *   - the provider root mounts with no public rooms.
 *   - required security docs exist.
 *   - no NEXT_PUBLIC *SECRET / *TOKEN_SECRET exposure.
 *   - pilot docs mention leaderboard.updated, DB polling, and both flags.
 *
 * No network. No secrets printed. Exit 1 on any violation. Pure helpers are
 * exported for unit testing.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// repo root = two levels up from realtime-server/scripts
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "coverage"]);
const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;

// Per-file emitter allowlist (RC6): each file may dispatch EXACTLY these types.
const ALLOWED_EMITTERS = {
  "lib/tournamentResults.ts": [
    "leaderboard.updated",
    "tournament.result.updated",
  ],
  "lib/tournamentMatchEngine.ts": [
    "tournament.bracket.generated",
    "tournament.match.report_submitted",
    "tournament.match.confirmed",
  ],
  "actions/adminTournamentInlineActions.ts": ["tournament.status.updated"],
  "lib/jobs/tournamentLifecycleJobs.ts": ["tournament.status.updated"],
};
const ALLOWED_CONSUMERS = [
  "components/LeaderboardRealtime.tsx",
  "components/TournamentDetailsRealtime.tsx",
  "components/MatchRealtimeRefresh.tsx",
];
const PROVIDER = "components/realtime/RealtimeProvider.tsx";
const PROVIDER_ROOT = "components/realtime/RealtimeProviderRoot.tsx";

const REQUIRED_DOCS = [
  "realtime-server/THREAT_MODEL.md",
  "realtime-server/STAGING_SIGNOFF.md",
  "realtime-server/PRODUCTION_DRY_RUN.md",
  "realtime-server/FAILURE_MODES.md",
  "realtime-server/SECURITY.md",
  "docs/realtime-expansion-checklist.md",
];

// ─── Pure helpers (exported for tests) ────────────────────────────────────────

export function importSpecifiers(content) {
  const specs = [];
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(content))) specs.push(m[1]);
  }
  return specs;
}

export function dispatchedEventTypes(src) {
  const types = [];
  const re = /dispatchRealtimeEventSoon\s*\(\s*\{([\s\S]*?)\}\s*\)\s*;/g;
  let m;
  while ((m = re.exec(src))) {
    const typeMatch = m[1].match(/type\s*:\s*["']([^"']+)["']/);
    if (typeMatch) types.push(typeMatch[1]);
  }
  return types;
}

export function hasForbiddenNextPublicSecret(content) {
  return /NEXT_PUBLIC_[A-Z0-9_]*SECRET/.test(content);
}

// ─── Repo scan ────────────────────────────────────────────────────────────────

function walk(dir, exts) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name === "__tests__") continue;
      out.push(...walk(full, exts));
    } else if (!TEST_FILE.test(entry.name) && exts.some((e) => entry.name.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function read(relPath) {
  const full = path.join(ROOT, relPath);
  return existsSync(full) ? readFileSync(full, "utf8") : null;
}

export function runExpansionGate() {
  const violations = [];
  const add = (msg) => violations.push(msg);

  const appFiles = ["actions", "app", "components", "hooks", "lib"].flatMap((d) =>
    walk(path.join(ROOT, d), [".ts", ".tsx"]),
  );

  // 1. Only the allowed emitter files dispatch, each EXACTLY its approved types.
  const dispatchAllowedFiles = new Set([
    ...Object.keys(ALLOWED_EMITTERS),
    "lib/realtime/dispatchRealtime.ts",
  ]);
  for (const file of appFiles) {
    const r = rel(file);
    const content = readFileSync(file, "utf8");
    if (content.includes("dispatchRealtimeEvent") && !dispatchAllowedFiles.has(r)) {
      add(`dispatch used outside the allowed emitters: ${r}`);
    }
  }
  for (const [emitterFile, allowedTypes] of Object.entries(ALLOWED_EMITTERS)) {
    const pilot = read(emitterFile);
    if (!pilot) {
      add(`missing pilot emitter file: ${emitterFile}`);
      continue;
    }
    const types = dispatchedEventTypes(pilot);
    if (types.length !== allowedTypes.length) {
      add(`${emitterFile}: expected exactly ${allowedTypes.length} dispatched events, found ${types.length}`);
    }
    for (const t of types) {
      if (!allowedTypes.includes(t)) add(`${emitterFile}: unapproved dispatched event type: ${t}`);
    }
    for (const t of allowedTypes) {
      if (!types.includes(t)) add(`${emitterFile}: missing approved dispatched event type: ${t}`);
    }
    if (!pilot.includes("createRealtimeEvent")) add(`${emitterFile} lost its DB createRealtimeEvent path`);
  }

  // 2. Only approved consumers use realtime hooks (besides the provider).
  const CONTEXT_RE = /realtime\/realtimeContext$/;
  const CONTEXT_ALLOWED = new Set([PROVIDER, ...ALLOWED_CONSUMERS]);
  for (const file of appFiles) {
    const r = rel(file);
    for (const spec of importSpecifiers(readFileSync(file, "utf8"))) {
      if (CONTEXT_RE.test(spec) && !CONTEXT_ALLOWED.has(r)) {
        add(`realtime hook imported by unapproved consumer: ${r}`);
      }
    }
  }

  // 3. Provider invariants.
  for (const file of appFiles) {
    const r = rel(file);
    for (const spec of importSpecifiers(readFileSync(file, "utf8"))) {
      if ((spec === "socket.io-client" || spec.startsWith("socket.io-client/")) && r !== PROVIDER) {
        add(`socket.io-client imported outside the provider: ${r}`);
      }
    }
  }
  const layout = read("app/layout.tsx");
  if (!layout || !layout.includes("RealtimeProviderRoot")) {
    add("RealtimeProviderRoot is not mounted in app/layout.tsx");
  }
  const providerRoot = read(PROVIDER_ROOT);
  if (!providerRoot || !/publicRooms=\{\[\]\}/.test(providerRoot)) {
    add("RealtimeProviderRoot must mount with publicRooms={[]}");
  }

  // 4. Required docs exist.
  for (const doc of REQUIRED_DOCS) {
    if (!read(doc)) add(`missing required doc: ${doc}`);
  }

  // 5. No NEXT_PUBLIC secret exposure in app source.
  for (const file of appFiles) {
    if (hasForbiddenNextPublicSecret(readFileSync(file, "utf8"))) {
      add(`NEXT_PUBLIC secret exposure in ${rel(file)}`);
    }
  }

  // 6. Pilot docs mention the key invariants.
  const clientDoc = read("docs/realtime-client.md") ?? "";
  for (const needle of [
    "leaderboard.updated",
    "REALTIME_ENABLE_SOCKET",
    "NEXT_PUBLIC_REALTIME_ENABLE",
  ]) {
    if (!clientDoc.includes(needle)) add(`docs/realtime-client.md missing mention of ${needle}`);
  }
  if (!/poll/i.test(clientDoc)) add("docs/realtime-client.md missing DB polling fallback mention");

  return violations;
}

// ─── CLI ───────────────────────────────────────────────────────────────────────

function isRunDirectly() {
  try {
    if (!process.argv[1]) return false;
    return path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isRunDirectly()) {
  const violations = runExpansionGate();
  if (violations.length === 0) {
    console.log("Expansion gate PASSED — realtime state matches the approved pilot.");
    process.exit(0);
  }
  console.error("Expansion gate FAILED:");
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}
