import type { FaceitIntegrationStatus } from "@/lib/faceitIntegrationStatus";
import type { ReadinessIssue } from "@/lib/adminMatchOperations";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductionWarning = {
  key: string;
  message: string;
  severity: "error" | "warning";
};

export type Cs2ReadinessSummary = {
  totalCs2Active: number;
  missingSchedule: number;
  missingRoom: number;
  missingProof: number;
  needsCheckin: number;
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function getFaceitProductionWarnings(
  status: FaceitIntegrationStatus,
): ProductionWarning[] {
  const warnings: ProductionWarning[] = [];

  if (!status.apiKeyConfigured) {
    warnings.push({
      key: "missing_api_key",
      message:
        "FACEIT API key is not configured. Proof sync and match lookups will fail.",
      severity: "error",
    });
  }

  if (!status.webhookSecretConfigured) {
    warnings.push({
      key: "missing_webhook_secret",
      message:
        "FACEIT webhook secret is not configured. Incoming webhooks will be rejected.",
      severity: "error",
    });
  }

  if (status.factionOrderFallbackEnabled) {
    warnings.push({
      key: "faction_order_fallback",
      message:
        "Faction-order fallback is enabled. Disable it before public tournaments.",
      severity: "warning",
    });
  }

  return warnings;
}

export function getCs2ReadinessSummary(
  cards: Array<{ isCs2: boolean; readinessIssues: ReadinessIssue[] }>,
): Cs2ReadinessSummary {
  const cs2 = cards.filter((c) => c.isCs2);
  return {
    totalCs2Active: cs2.length,
    missingSchedule: cs2.filter((c) =>
      c.readinessIssues.includes("missing_schedule"),
    ).length,
    missingRoom: cs2.filter((c) =>
      c.readinessIssues.includes("missing_room"),
    ).length,
    missingProof: cs2.filter((c) =>
      c.readinessIssues.includes("missing_proof"),
    ).length,
    needsCheckin: cs2.filter((c) =>
      c.readinessIssues.includes("needs_checkin"),
    ).length,
  };
}
