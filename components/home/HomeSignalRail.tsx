type HomeSignalSegment = {
  label: string;
  value: string;
};

type HomeSignalRailProps = {
  segments: HomeSignalSegment[];
};

export default function HomeSignalRail({ segments }: HomeSignalRailProps) {
  return (
    <div className="asc-home-signal-rail">
      <div aria-hidden="true" className="asc-home-signal-rail__line" />
      <div className="asc-home-signal-rail__track">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1 ? true : undefined}
            className="asc-home-signal-rail__copy"
            role={copy === 0 ? "list" : undefined}
          >
            {segments.map((segment, index) => (
              <span
                className="asc-home-signal"
                key={`${copy}-${index}`}
                role={copy === 0 ? "listitem" : undefined}
              >
                <span className="asc-home-signal__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="asc-home-signal__label">{segment.label}</span>
                <span className="asc-home-signal__value">{segment.value}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
