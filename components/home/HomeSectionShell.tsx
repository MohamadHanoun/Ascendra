import type { ReactNode } from "react";

type HomeSectionShellVariant =
  | "broadcast"
  | "briefing"
  | "command"
  | "final"
  | "flow"
  | "rankings"
  | "registry";

type HomeSectionShellProps = {
  children: ReactNode;
  className?: string;
  variant: HomeSectionShellVariant;
};

export default function HomeSectionShell({
  children,
  className = "",
  variant,
}: HomeSectionShellProps) {
  return (
    <section
      className={[
        "asc-home-section-shell",
        `asc-home-section-shell--${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div aria-hidden="true" className="asc-home-section-shell__backdrop">
        <span className="asc-home-section-shell__grid" />
        <span className="asc-home-section-shell__rail" />
        <span className="asc-home-section-shell__flare" />
      </div>
      <div className="asc-home-section-shell__inner mx-auto max-w-[1440px] px-6 lg:px-10">
        {children}
      </div>
    </section>
  );
}
