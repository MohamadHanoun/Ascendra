"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { CustomTooltip } from "@/components/profile/shared";
import type { PointEvent } from "@/components/profile/types";

export function buildChartData(pointEvents: PointEvent[]) {
  return pointEvents.map((e, i) => {
    const cumPoints = pointEvents.slice(0, i + 1).reduce((s, x) => s + x.points, 0);
    return {
      name: new Date(e.createdAt).toLocaleDateString("en-GB", { month: "short", day: "2-digit" }),
      points: cumPoints,
    };
  });
}

export function PointHistoryChart({
  data,
  ptsLabel,
  height,
}: {
  data: Array<{ name: string; points: number }>;
  ptsLabel: string;
  height: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
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
