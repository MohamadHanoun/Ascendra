import type { CSSProperties, ReactNode } from "react";

import type { ProfileStatuses } from "@/components/profile/types";

type PillTone = "green" | "bronze" | "red" | "gray" | "accent";

export function getCount(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural;
}

export function CornerMark() {
  return (
    <div
      aria-hidden="true"
      className="asc-corner-mark"
      style={{
        position: "absolute",
        top: 10,
        insetInlineStart: 10,
        width: 12,
        height: 12,
        borderTop: "1.5px solid var(--asc-accent)",
        borderInlineStart: "1.5px solid var(--asc-accent)",
        opacity: 0.9,
        pointerEvents: "none",
        zIndex: 30,
      }}
    />
  );
}

export function Pill({
  label,
  tone = "accent",
}: {
  label: string;
  tone?: PillTone;
}) {
  const styleMap: Record<PillTone, CSSProperties> = {
    green: { color: "var(--asc-green)", borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)" },
    bronze: { color: "var(--asc-amber)", borderColor: "var(--asc-amber-border)", background: "var(--asc-amber-bg)" },
    red: { color: "var(--asc-live)", borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)" },
    gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
    accent: { color: "var(--asc-accent)", borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)" },
  };
  return (
    <span className="asc-profile-pill inline-flex w-fit border px-3 py-1 text-xs font-black" style={styleMap[tone]}>
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
    : s === "pending" ? "bronze"
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

export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`asc-profile-card ${className ?? ""}`.trim()}
      style={style}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute", top: -1, insetInlineStart: -1,
          width: 14, height: 14,
          borderTop: "1px solid var(--asc-accent)",
          borderInlineStart: "1px solid var(--asc-accent)",
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
