import type { CSSProperties, ReactNode } from "react";

type HomePremiumSurfaceProps = {
  as?: "article" | "div";
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  tone?: "default" | "hero";
};

export default function HomePremiumSurface({
  as: Component = "div",
  children,
  className = "",
  style,
  tone = "default",
}: HomePremiumSurfaceProps) {
  return (
    <Component
      className={`asc-home-premium-surface asc-home-premium-surface--${tone} ${className}`.trim()}
      style={style}
    >
      <span aria-hidden="true" className="asc-home-premium-surface__glow" />
      <span aria-hidden="true" className="asc-home-premium-surface__edge" />
      <span aria-hidden="true" className="asc-home-premium-surface__grid" />
      <span aria-hidden="true" className="asc-home-premium-surface__flare" />
      <span aria-hidden="true" className="asc-corner-mark" />
      {children}
    </Component>
  );
}
