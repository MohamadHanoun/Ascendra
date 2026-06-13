import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SCRIPT = readFileSync(
  path.join(ROOT, "scripts", "verify-realtime-security.mjs"),
  "utf8",
);
const PKG = JSON.parse(
  readFileSync(path.join(ROOT, "package.json"), "utf8"),
) as { scripts?: Record<string, string> };

describe("verify-realtime-security script", () => {
  it("runs all required checks", () => {
    expect(SCRIPT).toContain("expansion:gate");
    expect(SCRIPT).toContain("dry-run:check");
    expect(SCRIPT).toContain("preflight");
    expect(SCRIPT).toContain("test:e2e");
    expect(SCRIPT).toContain("realtimeSecurityGuardrails");
    expect(SCRIPT).toContain("expansionGate");
    expect(SCRIPT).toContain("build");
    expect(SCRIPT).toContain("audit");
    expect(SCRIPT).toContain("--omit=optional");
  });

  it("does not run audit fix / install / dependency mutation", () => {
    expect(SCRIPT).not.toContain("audit fix");
    expect(SCRIPT).not.toMatch(/"install"/);
    expect(SCRIPT).not.toMatch(/npm\s+install/);
    expect(SCRIPT).not.toContain("--force");
  });

  it("does not deploy / ssh / touch infra", () => {
    for (const forbidden of [
      "ssh",
      "scp",
      "vercel",
      "railway",
      "docker push",
      "systemctl",
      "rsync",
      "deploy",
    ]) {
      expect(SCRIPT.toLowerCase()).not.toContain(forbidden);
    }
  });

  it("does not print env secret values", () => {
    // No echoing of secret-bearing env vars.
    expect(SCRIPT).not.toMatch(/process\.env\.REALTIME_EVENT_SECRET/);
    expect(SCRIPT).not.toMatch(/process\.env\.REALTIME_CLIENT_TOKEN_SECRET/);
    expect(SCRIPT).not.toMatch(/process\.env\.REALTIME_STATUS_SECRET/);
  });

  it("supports the known-audit override flag", () => {
    expect(SCRIPT).toContain("REALTIME_VERIFY_ALLOW_KNOWN_AUDIT");
  });

  it("does not auto-run status:check or smoke:event", () => {
    expect(SCRIPT).not.toContain("status:check");
    expect(SCRIPT).not.toContain("smoke:event");
  });

  it("is registered as a root package script", () => {
    expect(PKG.scripts?.["verify:realtime-security"]).toBe(
      "node scripts/verify-realtime-security.mjs",
    );
  });
});
