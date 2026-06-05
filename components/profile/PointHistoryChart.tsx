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

import type { ProfileChartDataPoint } from "@/components/profile/chartData";
import { CustomTooltip } from "@/components/profile/shared";

export function PointHistoryChart({
  data,
  ptsLabel,
  height,
}: {
  data: ProfileChartDataPoint[];
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
