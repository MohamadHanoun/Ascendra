import type { ReactNode } from "react";

export type CommandRailItem = {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: boolean;
};

/**
 * A cohesive premium "command rail" — a clipped stat bar with a gold top
 * edge and hairline dividers. Server component, CSS-only (static + hover).
 * Renders only the real data passed in.
 */
export default function CommandRail({
  items,
  columns = 4,
  className = "",
}: {
  items: CommandRailItem[];
  columns?: 3 | 4 | 5;
  className?: string;
}) {
  return (
    <div className={`asc-cmd-rail asc-cmd-rail--${columns} ${className}`.trim()}>
      {items.map((item, index) => (
        <div className="asc-cmd-rail__item" key={`${item.label}-${index}`}>
          <span className="asc-cmd-rail__label">{item.label}</span>
          <span
            className={`asc-cmd-rail__value tabular-nums${
              item.accent ? " asc-cmd-rail__value--accent" : ""
            }`}
          >
            {item.value}
          </span>
          {item.sub ? <span className="asc-cmd-rail__sub">{item.sub}</span> : null}
        </div>
      ))}
    </div>
  );
}
