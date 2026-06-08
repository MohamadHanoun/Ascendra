import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const SCRIPT = read("scripts/check-realtime-rc.mjs");
const RC_DOC = read("docs/realtime-release-candidate.md");
const PKG = JSON.parse(read("package.json")) as {
  scripts?: Record<string, string>;
};

describe("realtime release candidate", () => {
  it("ships the RC checker script and package entry", () => {
    expect(existsSync(path.join(ROOT, "scripts", "check-realtime-rc.mjs"))).toBe(true);
    expect(PKG.scripts?.["check:realtime-rc"]).toBe(
      "node scripts/check-realtime-rc.mjs",
    );
  });

  it("RC doc documents scope, flags, polling, and staging requirement", () => {
    expect(RC_DOC).toContain("leaderboard.updated");
    expect(RC_DOC).toContain("REALTIME_ENABLE_SOCKET");
    expect(RC_DOC).toContain("NEXT_PUBLIC_REALTIME_ENABLE");
    expect(RC_DOC).toMatch(/DB polling continues/i);
    expect(RC_DOC).toMatch(/STAGING_SIGNOFF\.md/);
  });

  it("RC checker is offline and infra-free", () => {
    const lower = SCRIPT.toLowerCase();
    // Word-boundary tokens (avoid false positives like readdirSync → "rsync").
    for (const token of ["ssh", "scp", "systemctl", "vercel", "railway", "rsync", "deploy"]) {
      expect(lower).not.toMatch(new RegExp(`\\b${token}\\b`));
    }
    // Multi-word / symbol phrases are safe as plain substrings.
    for (const phrase of ["docker push", "audit fix", "npm install", "--force"]) {
      expect(lower).not.toContain(phrase);
    }
  });

  it("RC checker does not reference secret env values", () => {
    expect(SCRIPT).not.toMatch(/process\.env\.REALTIME_EVENT_SECRET/);
    expect(SCRIPT).not.toMatch(/process\.env\.REALTIME_CLIENT_TOKEN_SECRET/);
    expect(SCRIPT).not.toMatch(/process\.env\.REALTIME_STATUS_SECRET/);
  });

  it("RC checker includes the key baseline checks", () => {
    expect(SCRIPT).toContain("leaderboard.updated");
    expect(SCRIPT).toContain("dispatchRealtimeEventSoon");
    expect(SCRIPT).toContain("useRealtimePublicRoom");
    expect(SCRIPT).toContain("socket.io-client");
    expect(SCRIPT).toContain("RealtimeProviderRoot");
    expect(SCRIPT).toContain("NEXT_PUBLIC_");
  });

  it("the current repo passes the RC checker", async () => {
    const { runRcCheck } = await import("../../scripts/check-realtime-rc.mjs");
    const results = runRcCheck();
    const failures = results.filter((r: { ok: boolean }) => !r.ok);
    expect(failures).toEqual([]);
  });
});
