/**
 * Safe health/status checker for the Ascendra realtime server (Batch 1T).
 *
 * Queries /healthz (always) and /internal/status (only when a status secret is
 * provided) against a local or staging/prod target. Node built-ins only.
 *
 * Safety:
 *  - Never prints secrets or the Authorization header.
 *  - Fixed paths only (/healthz, /internal/status) — no caller path override.
 *  - Non-local targets must be https.
 *  - Prints a safe summary (no allowed-origins list, no env values).
 *  - Exit 0 only when required checks pass; exit 1 on failed health, or failed
 *    protected status when a secret was provided.
 */

import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

const HEALTH_PATH = "/healthz";
const STATUS_PATH = "/internal/status";
const DEFAULT_TARGET = "http://127.0.0.1:8787";
const TIMEOUT_MS = 4000;

export function validateStatusTarget(rawUrl, isProduction = false) {
  const value = rawUrl && rawUrl.trim() ? rawUrl.trim() : DEFAULT_TARGET;
  let url;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: "invalid_target_url" };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "credentials_in_url" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "unsupported_protocol" };
  }
  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol === "http:" && (isProduction || !isLocalhost)) {
    return { ok: false, reason: "https_required" };
  }
  return { ok: true, origin: url.origin };
}

/** Build a safe, secret-free summary line from a /healthz or /internal/status body. */
export function summarizeStatus(body) {
  if (!body || typeof body !== "object") return {};
  const out = {};
  if (typeof body.uptimeSeconds === "number") out.uptimeSeconds = body.uptimeSeconds;
  if (typeof body.connections === "number") out.connections = body.connections;
  const counters = body.counters;
  if (counters && typeof counters === "object") {
    out.internalEventsAccepted = counters.internalEventsAccepted;
    out.emittedEvents = counters.emittedEvents;
    out.emittedRooms = counters.emittedRooms;
  }
  return out;
}

async function getJson(url, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: headers ?? {},
    });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { status: res.status, ok: res.ok, body };
  } catch {
    return { status: 0, ok: false, body: null };
  } finally {
    clearTimeout(timer);
  }
}

export async function runStatusCheck({ targetUrl, statusSecret, isProduction = false } = {}) {
  const target = validateStatusTarget(targetUrl, isProduction);
  if (!target.ok) {
    return { ok: false, reason: target.reason };
  }

  const health = await getJson(`${target.origin}${HEALTH_PATH}`);
  const result = {
    origin: target.origin,
    health: { ok: health.ok && health.body?.ok === true, summary: summarizeStatus(health.body) },
    status: { state: "skipped" },
    ok: false,
  };

  if (statusSecret) {
    const status = await getJson(`${target.origin}${STATUS_PATH}`, {
      Authorization: `Bearer ${statusSecret}`,
    });
    result.status = {
      state: status.ok && status.body?.ok === true ? "ok" : "fail",
      summary: summarizeStatus(status.body),
    };
  }

  result.ok =
    result.health.ok && (result.status.state === "skipped" || result.status.state === "ok");
  return result;
}

// ─── CLI ───────────────────────────────────────────────────────────────────────

function isRunDirectly() {
  try {
    if (!process.argv[1]) return false;
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isRunDirectly()) {
  const targetUrl = process.env.REALTIME_STATUS_TARGET_URL;
  const statusSecret = process.env.REALTIME_STATUS_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  const target = validateStatusTarget(targetUrl, isProduction);
  if (!target.ok) {
    console.error(`[status] FAILED: ${target.reason}`);
    process.exit(1);
  }

  console.log(`[status] target: ${target.origin}`);
  if (!statusSecret) {
    console.log("[status] note: REALTIME_STATUS_SECRET not set — protected status skipped.");
  }

  runStatusCheck({ targetUrl, statusSecret, isProduction }).then((result) => {
    if (result.reason) {
      console.error(`[status] FAILED: ${result.reason}`);
      process.exit(1);
    }
    console.log(`[status] health: ${result.health.ok ? "ok" : "fail"}`);
    if (result.health.summary && Object.keys(result.health.summary).length > 0) {
      console.log(`[status] health summary: ${JSON.stringify(result.health.summary)}`);
    }
    console.log(`[status] protected status: ${result.status.state}`);
    if (result.status.summary && Object.keys(result.status.summary).length > 0) {
      console.log(`[status] status summary: ${JSON.stringify(result.status.summary)}`);
    }
    console.log(`[status] result: ${result.ok ? "PASS" : "FAIL"}`);
    process.exit(result.ok ? 0 : 1);
  });
}
