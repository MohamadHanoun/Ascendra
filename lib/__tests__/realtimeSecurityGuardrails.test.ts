import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Static security guardrails (Batch 1K).
 *
 * These tests scan source files as TEXT and fail if future code reintroduces
 * unsafe realtime patterns. They are intentionally strict: changing them should
 * only happen in a batch that explicitly approves the relevant capability
 * (browser provider, emitter wiring, etc.).
 *
 * Test files are excluded from scans (so this file's own pattern strings, and
 * intentional cross-imports in *.test.* fixtures, do not trip the checks).
 */

const ROOT = process.cwd();
const APP_DIRS = ["app", "components", "hooks", "lib"];

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "coverage",
]);

const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;

function walk(
  dir: string,
  exts: string[],
  includeTests: boolean,
): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (!includeTests && entry.name === "__tests__") continue;
      out.push(...walk(full, exts, includeTests));
    } else {
      if (!includeTests && TEST_FILE.test(entry.name)) continue;
      if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
    }
  }
  return out;
}

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

/** Strip block and line comments so guardrails inspect code, not prose. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function importSpecifiers(content: string): string[] {
  const specs: string[] = [];
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      specs.push(m[1]);
    }
  }
  return specs;
}

function appFiles(): string[] {
  return APP_DIRS.flatMap((d) =>
    walk(path.join(ROOT, d), [".ts", ".tsx"], false),
  );
}

// ─── A. No client exposure of secrets ─────────────────────────────────────────

describe("guardrail A: no NEXT_PUBLIC secret exposure", () => {
  it("no app source declares a NEXT_PUBLIC *SECRET env var", () => {
    const offenders: string[] = [];
    const re = /NEXT_PUBLIC_[A-Z0-9_]*SECRET/;
    for (const file of appFiles()) {
      if (re.test(readFileSync(file, "utf8"))) {
        offenders.push(path.relative(ROOT, file));
      }
    }
    expect(offenders).toEqual([]);
  });
});

// ─── B. Realtime bridge stays server-only ─────────────────────────────────────

describe("guardrail B: server-only modules", () => {
  it.each([
    "lib/realtime/emitRealtimeEvent.ts",
    "lib/realtime/dispatchRealtime.ts",
    "lib/realtime/clientToken.ts",
  ])("%s imports 'server-only'", (rel) => {
    expect(read(rel)).toMatch(/import\s+["']server-only["']/);
  });
});

// ─── C. realtime-server must not import app code ───────────────────────────────

describe("guardrail C: realtime-server does not import app code", () => {
  it("no realtime-server/src module imports app/framework code", () => {
    const offenders: string[] = [];
    for (const file of walk(
      path.join(ROOT, "realtime-server", "src"),
      [".mjs"],
      false,
    )) {
      for (const spec of importSpecifiers(readFileSync(file, "utf8"))) {
        const bad =
          spec.startsWith("@/") ||
          spec === "next" ||
          spec.startsWith("next/") ||
          spec === "react" ||
          spec.startsWith("react/") ||
          spec === "react-dom" ||
          spec.startsWith("react-dom/") ||
          spec === "prisma" ||
          spec.startsWith("prisma/") ||
          spec === "@prisma" ||
          spec.startsWith("@prisma/") ||
          spec === "auth" ||
          /(\.\.\/)+(lib|app|components|auth)(\/|$)/.test(spec);
        if (bad) {
          offenders.push(`${path.relative(ROOT, file)} -> ${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

// ─── D. App must not import realtime-server ────────────────────────────────────

describe("guardrail D: app does not import realtime-server", () => {
  it("no app source imports the realtime-server package", () => {
    const offenders: string[] = [];
    for (const file of appFiles()) {
      for (const spec of importSpecifiers(readFileSync(file, "utf8"))) {
        if (spec.includes("realtime-server")) {
          offenders.push(`${path.relative(ROOT, file)} -> ${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

// ─── E. No direct browser Socket.IO usage yet ──────────────────────────────────

describe("guardrail E: socket.io-client only in the approved provider file", () => {
  // Batch 1O: the browser provider may import socket.io-client. Nothing else.
  const ALLOWED = "components/realtime/RealtimeProvider.tsx";

  it("only RealtimeProvider.tsx imports socket.io-client", () => {
    const offenders: string[] = [];
    const dirs = ["app", "components", "hooks"];
    const files = dirs.flatMap((d) =>
      walk(path.join(ROOT, d), [".ts", ".tsx"], false),
    );
    for (const file of files) {
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      for (const spec of importSpecifiers(readFileSync(file, "utf8"))) {
        if (
          (spec === "socket.io-client" || spec.startsWith("socket.io-client/")) &&
          rel !== ALLOWED
        ) {
          offenders.push(rel);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

// ─── F. No emitter wiring yet ──────────────────────────────────────────────────

describe("guardrail F: dispatch helper is not wired into emitters", () => {
  const emitters = [
    "lib/realtime.ts",
    "lib/notifications.ts",
    "lib/matchNotifications.ts",
    "lib/tournamentResults.ts",
    "lib/tournamentMatchEngine.ts",
    "actions/adminRegistrationInlineActions.ts",
    "actions/tournamentRegistrationInlineActions.ts",
    "actions/teamInlineActions.ts",
    "actions/teamActions.ts",
    "actions/matchActions.ts",
    "actions/adminTournamentInlineActions.ts",
    "actions/adminTournamentResultActions.ts",
    "actions/profileInvitationInlineActions.ts",
  ];

  it("no runtime emitter references dispatchRealtimeEvent(Soon)", () => {
    const offenders: string[] = [];
    for (const rel of emitters) {
      const full = path.join(ROOT, rel);
      if (!existsSync(full)) continue;
      if (readFileSync(full, "utf8").includes("dispatchRealtimeEvent")) {
        offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("dispatchRealtimeEvent is only defined in dispatchRealtime.ts (+ tests)", () => {
    const definers: string[] = [];
    for (const file of walk(path.join(ROOT, "lib"), [".ts"], false)) {
      if (readFileSync(file, "utf8").includes("function dispatchRealtimeEvent")) {
        definers.push(path.relative(ROOT, file).replace(/\\/g, "/"));
      }
    }
    expect(definers).toEqual(["lib/realtime/dispatchRealtime.ts"]);
  });
});

// ─── G. Sanitizer covers required sensitive fields ─────────────────────────────

describe("guardrail G: payload sanitizer covers sensitive fields", () => {
  const required = [
    "rejectionReason",
    "discordAccessToken",
    "discordRefreshToken",
    "accessToken",
    "refreshToken",
    "authorization",
    "cookie",
    "password",
    "secret",
    "token",
    "userIds",
    "discordId",
    "headers",
    "raw",
  ];

  it.each(required)("payload.ts handles '%s'", (key) => {
    const content = read("lib/realtime/payload.ts").toLowerCase();
    expect(content).toContain(key.toLowerCase());
  });
});

// ─── H. Room mapper must not accept payload.rooms ──────────────────────────────

describe("guardrail H: room mapper ignores caller-supplied rooms", () => {
  it("rooms.ts never reads a `rooms` field from the payload", () => {
    const code = stripComments(read("lib/realtime/rooms.ts"));
    expect(code).not.toMatch(/payload\s*\.\s*rooms/);
    expect(code).not.toMatch(/getString\(\s*payload\s*,\s*["']rooms["']\)/);
  });

  it("the rooms test proves payload.rooms is ignored", () => {
    const content = read("lib/__tests__/realtimeRooms.test.ts");
    expect(content).toMatch(/rooms.*payload|payload.*rooms/is);
  });
});

// ─── I. Token payload minimization is asserted ─────────────────────────────────

describe("guardrail I: client token minimization is tested", () => {
  it("clientToken test forbids PII/secret fields in the token payload", () => {
    const content = read("lib/__tests__/clientToken.test.ts");
    for (const forbidden of [
      "discordId",
      "email",
      "username",
      "accessToken",
      "refreshToken",
      "cookie",
      "secret",
    ]) {
      expect(content).toContain(forbidden);
    }
  });
});

// ─── J. Browser provider mount is scoped and dormant (Batch 1O/1P) ─────────────

describe("guardrail J: RealtimeProvider mount is scoped and dormant", () => {
  const PROVIDER_RE = /realtime\/RealtimeProvider$/;
  const ROOT_RE = /realtime\/RealtimeProviderRoot$/;
  const PROVIDER_ALLOWED = "components/realtime/RealtimeProviderRoot.tsx";
  const ROOT_ALLOWED = "app/layout.tsx";

  function scanApp(): string[] {
    return ["app", "components", "hooks"].flatMap((d) =>
      walk(path.join(ROOT, d), [".ts", ".tsx"], false),
    );
  }

  it("RealtimeProvider is imported only by RealtimeProviderRoot.tsx", () => {
    const offenders: string[] = [];
    for (const file of scanApp()) {
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      for (const spec of importSpecifiers(readFileSync(file, "utf8"))) {
        if (PROVIDER_RE.test(spec) && rel !== PROVIDER_ALLOWED) {
          offenders.push(`${rel} -> ${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("RealtimeProviderRoot is imported only by app/layout.tsx", () => {
    const offenders: string[] = [];
    for (const file of scanApp()) {
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      for (const spec of importSpecifiers(readFileSync(file, "utf8"))) {
        if (ROOT_RE.test(spec) && rel !== ROOT_ALLOWED) {
          offenders.push(`${rel} -> ${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("app/layout.tsx mounts RealtimeProviderRoot exactly once, not RealtimeProvider directly", () => {
    const layout = read("app/layout.tsx");
    const specs = importSpecifiers(layout);
    expect(specs.filter((s) => ROOT_RE.test(s))).toHaveLength(1);
    expect(specs.some((s) => PROVIDER_RE.test(s))).toBe(false);
    expect(layout).toContain("<RealtimeProviderRoot>");
  });

  it("RealtimeProviderRoot imports RealtimeProvider and stays inert", () => {
    const raw = read("components/realtime/RealtimeProviderRoot.tsx");
    expect(importSpecifiers(raw).some((s) => PROVIDER_RE.test(s))).toBe(true);
    expect(raw).toMatch(/publicRooms=\{\[\]\}/);
    const code = stripComments(raw);
    expect(code).not.toContain("subscribe");
    expect(code).not.toContain("onEvent");
    for (const forbidden of [
      "REALTIME_EVENT_SECRET",
      "REALTIME_CLIENT_TOKEN_SECRET",
      "localStorage",
      "sessionStorage",
      "document.cookie",
      "user:",
      "notifications:",
      "profile:",
      "team:",
      "admin",
    ]) {
      expect(code).not.toContain(forbidden);
    }
  });

  it("RealtimeProvider.tsx contains no secrets/storage/cookies", () => {
    const code = stripComments(read("components/realtime/RealtimeProvider.tsx"));
    for (const forbidden of [
      "REALTIME_EVENT_SECRET",
      "REALTIME_CLIENT_TOKEN_SECRET",
      "localStorage",
      "sessionStorage",
      "document.cookie",
    ]) {
      expect(code).not.toContain(forbidden);
    }
  });

  it("realtimeClientUtils.ts uses no storage/cookies and imports no socket.io-client", () => {
    const code = stripComments(read("components/realtime/realtimeClientUtils.ts"));
    for (const forbidden of [
      "localStorage",
      "sessionStorage",
      "document.cookie",
      "socket.io-client",
    ]) {
      expect(code).not.toContain(forbidden);
    }
  });
});

// ─── K. Leaderboard consumer is scoped + additive (Batch 1Q) ───────────────────

describe("guardrail K: leaderboard realtime consumer is scoped and additive", () => {
  const CONTEXT_RE = /realtime\/realtimeContext$/;
  const CONTEXT_ALLOWED = new Set([
    "components/realtime/RealtimeProvider.tsx",
    "components/LeaderboardRealtime.tsx",
  ]);

  it("realtime hooks (realtimeContext) are imported only by the provider + LeaderboardRealtime", () => {
    const offenders: string[] = [];
    for (const file of ["app", "components", "hooks"].flatMap((d) =>
      walk(path.join(ROOT, d), [".ts", ".tsx"], false),
    )) {
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      for (const spec of importSpecifiers(readFileSync(file, "utf8"))) {
        if (CONTEXT_RE.test(spec) && !CONTEXT_ALLOWED.has(rel)) {
          offenders.push(`${rel} -> ${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("LeaderboardRealtime keeps DB polling and requests only the leaderboard room", () => {
    const raw = read("components/LeaderboardRealtime.tsx");
    expect(raw).toContain("useRealtimeEvents"); // existing polling preserved
    expect(raw).toContain('useRealtimePublicRoom("leaderboard")');
    const code = stripComments(raw);
    for (const bad of [
      "tournament:",
      "match:",
      "user:",
      "notifications:",
      "profile:",
      "team:",
    ]) {
      expect(code).not.toContain(`useRealtimePublicRoom("${bad}`);
    }
    for (const room of ["user:", "notifications:", "profile:", "team:"]) {
      expect(code).not.toContain(room);
    }
  });

  it("LeaderboardRealtime has no dispatch wiring / secrets / storage / socket import", () => {
    const code = stripComments(read("components/LeaderboardRealtime.tsx"));
    for (const forbidden of [
      "dispatchRealtimeEvent",
      "REALTIME_EVENT_SECRET",
      "REALTIME_CLIENT_TOKEN_SECRET",
      "localStorage",
      "sessionStorage",
      "document.cookie",
      "socket.io-client",
    ]) {
      expect(code).not.toContain(forbidden);
    }
  });
});
