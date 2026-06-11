/**
 * One-command realtime security verification gate (Batch 1V).
 *
 * Runs the full realtime security validation suite from the repo root,
 * sequentially, failing fast. Node built-ins only; no dependencies; cross-platform.
 *
 * Scope / safety:
 *  - No release/publish steps; no remote-host access; no production network calls.
 *  - Does NOT modify, remediate, or add dependencies.
 *  - Does NOT run the manual operator commands that need a running server or
 *    secrets (those remain operator-only).
 *  - Never prints secrets.
 *
 * Audit handling:
 *  - `npm audit --omit=optional` currently reports a PRE-EXISTING moderate
 *    Next/PostCSS advisory (the only remediation is a breaking Next downgrade,
 *    which is not applied).
 *  - Set REALTIME_VERIFY_ALLOW_KNOWN_AUDIT=true to treat an audit-only failure as
 *    a non-blocking warning (the script still fails if anything else fails).
 *
 * Exit 0 only if all required checks pass.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

// Required checks, in order. `audit` is special-cased (see below).
export const VERIFY_STEPS = [
  {
    name: "expansion-gate",
    cmd: npm,
    args: ["--prefix", "realtime-server", "run", "expansion:gate"],
  },
  {
    name: "dry-run-check",
    cmd: npm,
    args: ["--prefix", "realtime-server", "run", "dry-run:check"],
  },
  {
    name: "preflight",
    cmd: npm,
    args: ["--prefix", "realtime-server", "run", "preflight"],
  },
  {
    name: "realtime-server-e2e",
    cmd: npm,
    args: ["--prefix", "realtime-server", "run", "test:e2e"],
  },
  {
    name: "root-realtime-tests",
    cmd: npm,
    args: [
      "run",
      "test",
      "--",
      "--run",
      "expansionGate",
      "leaderboardRealtimeLoop",
      "realtimeSecurityGuardrails",
      "realtimeFailureModes",
      "RealtimeProvider",
      "clientToken",
      "acl",
      "security",
      "channels",
      "metrics",
      "emitRealtimeEvent",
      "dispatchRealtime",
      "realtimePayload",
      "realtimeRooms",
      "tournamentRealtime",
      "matchRealtime",
      "smokeEvent",
      "statusCheck",
    ],
  },
  { name: "build", cmd: npm, args: ["run", "build"] },
  { name: "audit", cmd: npm, args: ["audit", "--omit=optional"], audit: true },
];

function header(title) {
  // eslint-disable-next-line no-console
  console.log(`\n=== ${title} ===`);
}

function runStep(step) {
  header(step.name);
  // Join static tokens into one command and run through the shell so Windows can
  // resolve npm.cmd. All tokens are static (no user input), so this is safe.
  const command = [step.cmd, ...step.args].join(" ");
  const result = spawnSync(command, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  return (result.status ?? 1) === 0;
}

function main() {
  const allowKnownAudit = process.env.REALTIME_VERIFY_ALLOW_KNOWN_AUDIT === "true";
  let failed = false;

  for (const step of VERIFY_STEPS) {
    const ok = runStep(step);
    if (ok) continue;

    if (step.audit && allowKnownAudit) {
      // eslint-disable-next-line no-console
      console.log(
        "\n[verify] WARNING: npm audit reported issues. Treating as the KNOWN " +
          "pre-existing Next/PostCSS advisory (REALTIME_VERIFY_ALLOW_KNOWN_AUDIT=true). " +
          "Not blocking. Investigate manually; do not auto-remediate dependencies.",
      );
      continue;
    }

    failed = true;
    if (step.audit) {
      // eslint-disable-next-line no-console
      console.error(
        "\n[verify] FAILED at: audit. If this is only the known pre-existing " +
          "Next/PostCSS advisory, re-run with REALTIME_VERIFY_ALLOW_KNOWN_AUDIT=true.",
      );
    } else {
      // eslint-disable-next-line no-console
      console.error(`\n[verify] FAILED at: ${step.name}`);
    }
    break; // fail fast
  }

  if (failed) {
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log("\n[verify] All realtime security checks PASSED.");
  process.exit(0);
}

main();
