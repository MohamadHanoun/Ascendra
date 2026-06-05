import type { PointEvent } from "@/components/profile/types";

export type ProfileChartDataPoint = {
  name: string;
  points: number;
};

export function buildChartData(pointEvents: PointEvent[]): ProfileChartDataPoint[] {
  return pointEvents.map((event, index) => {
    const cumPoints = pointEvents
      .slice(0, index + 1)
      .reduce((sum, current) => sum + current.points, 0);

    return {
      name: new Date(event.createdAt).toLocaleDateString("en-GB", {
        month: "short",
        day: "2-digit",
      }),
      points: cumPoints,
    };
  });
}
