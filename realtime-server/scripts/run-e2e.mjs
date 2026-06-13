/**
 * Cross-platform runner for the opt-in realtime E2E suite (Batch 1G).
 *
 * Runs the ROOT vitest (with its config: tsconfig paths + server-only mock)
 * filtered to the e2e test file, with ASCENDRA_REALTIME_E2E=true set. This works
 * from inside realtime-server without needing vitest installed here and without
 * fragile cross-platform env syntax in package.json.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url)); // realtime-server/scripts
const rootDir = path.resolve(here, "..", ".."); // repo root
const vitestEntry = path.join(rootDir, "node_modules", "vitest", "vitest.mjs");

const result = spawnSync(process.execPath, [vitestEntry, "run", "e2e"], {
  cwd: rootDir,
  stdio: "inherit",
  env: { ...process.env, ASCENDRA_REALTIME_E2E: "true" },
});

process.exit(result.status ?? 1);
