import type { CSSProperties, ReactNode } from "react";

import type { ProfileStatuses } from "@/components/profile/types";

export function getCount(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural;
}

export function Pill({
  label,
  tone = "violet",
}: {
  label: string;
  tone?: "green" | "blue" | "red" | "gray" | "violet";
}) {
  const styleMap: Record<string, CSSProperties> = {
    green: { color: "var(--asc-green)", borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)" },
    blue: { color: "var(--asc-blue)", borderColor: "var(--asc-blue-border)", background: "var(--asc-blue-bg)" },
    red: { color: "var(--asc-live)", borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)" },
    gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
    violet: { color: "var(--asc-accent)", borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)" },
  };
  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={styleMap[tone]}>
      {label}
    </span>
  );
}

export function StatusBadge({
  status,
  statuses,
}: {
  status: string;
  statuses: ProfileStatuses;
}) {
  const s = status.toLowerCase();
  const tone =
    s === "approved" || s === "member" ? "green"
    : s === "pending" ? "blue"
    : s === "rejected" || s === "not member" ? "red"
    : "gray";
  const map: Record<string, string> = {
    approved: statuses.active,
    pending: statuses.pending,
    rejected: statuses.rejected,
    member: statuses.member,
    "not member": statuses.notMember,
  };
  return <Pill label={map[s] ?? status} tone={tone} />;
}

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className="relative overflow-hidden border"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", ...style }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute", top: -1, left: -1,
          width: 14, height: 14,
          borderTop: "1px solid var(--asc-accent)",
          borderLeft: "1px solid var(--asc-accent)",
          opacity: 0.6, zIndex: 1,
        }}
      />
      {children}
    </div>
  );
}

export function CustomTooltip({
  active,
  payload,
  label,
  ptsLabel,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  ptsLabel: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="border px-3 py-2 text-xs font-black"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-0)" }}
    >
      <p style={{ color: "var(--asc-fg-3)", marginBottom: 2 }}>{label}</p>
      <p style={{ color: "var(--asc-accent)" }}>{payload[0].value.toLocaleString()} {ptsLabel}</p>
    </div>
  );
}
