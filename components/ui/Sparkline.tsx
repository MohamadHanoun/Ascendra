type SparklineProps = {
  values: number[];
  id: string;
  width?: number;
  height?: number;
  color?: string;
};

export default function Sparkline({
  values,
  id,
  width = 64,
  height = 20,
  color = "var(--asc-accent)",
}: SparklineProps) {
  if (values.length < 2) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const padV = height * 0.08;
  const innerH = height - padV * 2;
  const step = width / (values.length - 1);

  const pts = values.map((v, i) => ({
    x: +(i * step).toFixed(2),
    y: +(padV + innerH - ((v - min) / range) * innerH).toFixed(2),
  }));

  const linePts = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = [
    `M ${pts[0].x},${pts[0].y}`,
    ...pts.slice(1).map((p) => `L ${p.x},${p.y}`),
    `L ${pts[pts.length - 1].x},${height}`,
    `L ${pts[0].x},${height}`,
    "Z",
  ].join(" ");

  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  const gradId = `asc-spark-${safeId}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline
        points={linePts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
