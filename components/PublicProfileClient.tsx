"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartPoint = { name: string; points: number };

function CustomTooltip({
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
      <p style={{ color: "var(--asc-accent)" }}>
        {payload[0].value.toLocaleString()} {ptsLabel}
      </p>
    </div>
  );
}

export function PublicProgressChart({
  data,
  ptsLabel,
}: {
  data: ChartPoint[];
  ptsLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid stroke="var(--asc-line-soft)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "var(--asc-fg-3)", fontFamily: "Barlow, sans-serif", fontWeight: 700 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--asc-fg-3)", fontFamily: "Barlow, sans-serif", fontWeight: 700 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip ptsLabel={ptsLabel} />} />
        <Line
          type="monotone"
          dataKey="points"
          stroke="var(--asc-accent)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "var(--asc-accent)", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CopyIdButton({
  value,
  copyLabel,
  copiedLabel,
}: {
  value: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.10em] transition hover:opacity-80"
      style={{
        borderColor: copied ? "var(--asc-green-border)" : "var(--asc-line-soft)",
        color: copied ? "var(--asc-green)" : "var(--asc-fg-2)",
        background: "transparent",
      }}
    >
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}
