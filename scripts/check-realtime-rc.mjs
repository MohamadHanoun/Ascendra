/**
 * Realtime Pilot RC8 baseline checker (Batch 1W, re-baselined in Batches
 * 2A/3A/4A/5A/6A/7A/8A) — OFFLINE scan only.
 *
 * Verifies the repository still matches the frozen "Realtime Pilot RC8 —
 * leaderboard.updated + tournament.result.updated + tournament.bracket.generated
 * + tournament.status.updated + tournament.match.report_submitted +
 * tournament.match.confirmed + tournament.match.advanced +
 * tournament.registration.updated" baseline (see
 * docs/realtime-release-candidate.md). Emitters are allowlisted PER FILE:
 * each approved file may dispatch exactly its approved event types.
 *
 * No network. No secrets printed. No dependency mutation. No release/host access.
 * Prints PASS/FAIL lines; exits 1 on any violation.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "coverage"]);
const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;

const DISPATCH_DEF_FILE = "lib/realtime/dispatchRealtime.ts";
const CONSUMER = "components/LeaderboardRealtime.tsx";
const CONSUMER_TOURNAMENT = "components/TournamentDetailsRealtime.tsx";
const CONSUMER_MATCH = "components/MatchRealtimeRefresh.tsx";
const PROVIDER = "components/realtime/RealtimeProvider.tsx";
const PROVIDER_ROOT = "components/realtime/RealtimeProviderRoot.tsx";

// RC8 — per-file emitter allowlist: each file may dispatch EXACTLY these
// event types, and no other file may dispatch at all.
const ALLOWED_EMITTERS = {
  "lib/tournamentResults.ts": [
    "leaderboard.updated",
    "tournament.result.updated",
  ],
  "lib/tournamentMatchEngine.ts": [
    "tournament.bracket.generated",
    "tournament.match.report_submitted",
    "tournament.match.confirmed",
    "tournament.match.advanced",
  ],
  "actions/adminTournamentInlineActions.ts": ["tournament.status.updated"],
  "lib/jobs/tournamentLifecycleJobs.ts": ["tournament.status.updated"],
  "actions/tournamentRegistrationInlineActions.ts": [
    "tournament.registration.updated",
  ],
  "actions/adminRegistrationInlineActions.ts": [
    "tournament.registration.updated",
  ],
  "actions/adminRegistrationDiscordSyncActions.ts": [
    "tournament.registration.updated",
  ],
};

const REQUIRED_DOCS = [
  "docs/realtime-release-candidate.md",
  "realtime-server/THREAT_MODEL.md",
  "realtime-server/STAGING_SIGNOFF.md",
  "realtime-server/FAILURE_MODES.md",
  "realtime-server/PRODUCTION_DRY_RUN.md",
  "docs/realtime-expansion-checklist.md",
  "docs/realtime-client.md",
];

const REALTIME_SERVER_SCRIPTS = [
  "expansion:gate",
  "dry-run:check",
  "preflight",
  "test:e2e",
  "smoke:event",
  "status:check",
];

function read(rel) {
  const full = path.join(ROOT, rel);
  return existsSync(full) ? readFileSync(full, "utf8") : null;
}

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

function importSpecifiers(content) {
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

function dispatchedEventTypes(src) {
  const types = [];
  const re = /dispatchRealtimeEventSoon\s*\(\s*\{([\s\S]*?)\}\s*\)\s*;/g;
  let m;
  while ((m = re.exec(src))) {
    const t = m[1].match(/type\s*:\s*["']([^"']+)["']/);
    if (t) types.push(t[1]);
  }
  return types;
}

export function runRcCheck() {
  const results = [];
  const check = (name, ok, detail = "") => results.push({ name, ok, detail });

  const appFiles = ["actions", "app", "components", "hooks", "lib"].flatMap((d) =>
    walk(path.join(ROOT, d), [".ts", ".tsx"]),
  );

  // 1. RC doc exists.
  check("RC doc exists", Boolean(read("docs/realtime-release-candidate.md")));

  // 2. Each approved emitter file dispatches EXACTLY its approved types.
  for (const [emitterFile, allowedTypes] of Object.entries(ALLOWED_EMITTERS)) {
    const src = read(emitterFile) ?? "";
    const types = dispatchedEventTypes(src);
    check(
      `${emitterFile} dispatches exactly its approved events`,
      types.length === allowedTypes.length &&
        allowedTypes.every((t) => types.includes(t)) &&
        types.every((t) => allowedTypes.includes(t)),
      `found: ${types.join(", ") || "none"}; allowed: ${allowedTypes.join(", ")}`,
    );
  }

  // 3. dispatchRealtimeEventSoon used only in the allowed files.
  const dispatchAllowedFiles = new Set([
    ...Object.keys(ALLOWED_EMITTERS),
    DISPATCH_DEF_FILE,
  ]);
  const dispatchOffenders = [];
  for (const file of appFiles) {
    const r = rel(file);
    if (dispatchAllowedFiles.has(r)) continue;
    if (readFileSync(file, "utf8").includes("dispatchRealtimeEvent")) {
      dispatchOffenders.push(r);
    }
  }
  check("dispatch used only in allowed files", dispatchOffenders.length === 0, dispatchOffenders.join(", "));

  // 4. Only the approved consumers use realtime hooks (besides provider).
  const CONTEXT_RE = /realtime\/realtimeContext$/;
  const CONTEXT_ALLOWED = new Set([
    PROVIDER,
    CONSUMER,
    CONSUMER_TOURNAMENT,
    CONSUMER_MATCH,
  ]);
  const consumerOffenders = [];
  for (const file of appFiles) {
    const r = rel(file);
    for (const spec of importSpecifiers(readFileSync(file, "utf8"))) {
      if (CONTEXT_RE.test(spec) && !CONTEXT_ALLOWED.has(r)) consumerOffenders.push(r);
    }
  }
  check("only approved consumers use hooks", consumerOffenders.length === 0, consumerOffenders.join(", "));

  // 5. LeaderboardRealtime requests only "leaderboard".
  const consumerSrc = read(CONSUMER) ?? "";
  const roomRequests = [...consumerSrc.matchAll(/useRealtimePublicRoom\(\s*["']([^"']+)["']/g)].map((m) => m[1]);
  check(
    'LeaderboardRealtime requests only "leaderboard"',
    roomRequests.length === 1 && roomRequests[0] === "leaderboard",
    `found: ${roomRequests.join(", ") || "none"}`,
  );

  // 5b. TournamentDetailsRealtime requests only its own tournament:{id} room.
  const tournamentConsumerSrc = read(CONSUMER_TOURNAMENT) ?? "";
  const tournamentRoomCalls = [
    ...tournamentConsumerSrc.matchAll(/useRealtimePublicRoom\(([^)]*)\)/g),
  ].map((m) => m[1].trim());
  check(
    "TournamentDetailsRealtime requests only tournament:{id}",
    tournamentRoomCalls.length === 1 &&
      tournamentRoomCalls[0] === "`tournament:${tournamentId}`",
    `found: ${tournamentRoomCalls.join(", ") || "none"}`,
  );

  // 5c. MatchRealtimeRefresh requests only its own match:{id} room.
  const matchConsumerSrc = read(CONSUMER_MATCH) ?? "";
  const matchRoomCalls = [
    ...matchConsumerSrc.matchAll(/useRealtimePublicRoom\(([^)]*)\)/g),
  ].map((m) => m[1].trim());
  check(
    "MatchRealtimeRefresh requests only match:{id}",
    matchRoomCalls.length === 1 &&
      matchRoomCalls[0] === "`match:${matchId}`",
    `found: ${matchRoomCalls.join(", ") || "none"}`,
  );

  // 6. layout mounts RealtimeProviderRoot.
  check("layout mounts RealtimeProviderRoot", (read("app/layout.tsx") ?? "").includes("RealtimeProviderRoot"));

  // 7. RealtimeProviderRoot uses publicRooms={[]}.
  check("RealtimeProviderRoot publicRooms is []", /publicRooms=\{\[\]\}/.test(read(PROVIDER_ROOT) ?? ""));

  // 8. socket.io-client only in the provider.
  const socketOffenders = [];
  for (const file of appFiles) {
    const r = rel(file);
    for (const spec of importSpecifiers(readFileSync(file, "utf8"))) {
      if ((spec === "socket.io-client" || spec.startsWith("socket.io-client/")) && r !== PROVIDER) {
        socketOffenders.push(r);
      }
    }
  }
  check("socket.io-client only in provider", socketOffenders.length === 0, socketOffenders.join(", "));

  // 9. No NEXT_PUBLIC secret exposure.
  const secretOffenders = appFiles.filter((f) =>
    /NEXT_PUBLIC_[A-Z0-9_]*SECRET/.test(readFileSync(f, "utf8")),
  );
  check("no NEXT_PUBLIC secret exposure", secretOffenders.length === 0, secretOffenders.map(rel).join(", "));

  // 10. Required docs exist.
  const missingDocs = REQUIRED_DOCS.filter((d) => !read(d));
  check("required docs exist", missingDocs.length === 0, missingDocs.join(", "));

  // 11. Root verify script present.
  let rootPkg = {};
  try {
    rootPkg = JSON.parse(read("package.json") ?? "{}");
  } catch {
    rootPkg = {};
  }
  check(
    "root verify:realtime-security script",
    typeof rootPkg.scripts?.["verify:realtime-security"] === "string",
  );

  // 12. realtime-server scripts present.
  let rtPkg = {};
  try {
    rtPkg = JSON.parse(read("realtime-server/package.json") ?? "{}");
  } catch {
    rtPkg = {};
  }
  const missingScripts = REALTIME_SERVER_SCRIPTS.filter(
    (s) => typeof rtPkg.scripts?.[s] !== "string",
  );
  check("realtime-server scripts present", missingScripts.length === 0, missingScripts.join(", "));

  return results;
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
  const results = runRcCheck();
  let fails = 0;
  for (const { name, ok, detail } of results) {
    if (!ok) fails += 1;
    const suffix = !ok && detail ? `  (${detail})` : "";
    console.log(`${ok ? "PASS" : "FAIL"} ${name}${suffix}`);
  }
  console.log(`\nRC check — ${results.length} checks, ${fails} fail`);
  if (fails > 0) {
    console.error("RC check FAILED — repo no longer matches Realtime Pilot RC8 baseline.");
    process.exit(1);
  }
  console.log("RC check PASSED — repo matches Realtime Pilot RC8 baseline.");
  process.exit(0);
}
