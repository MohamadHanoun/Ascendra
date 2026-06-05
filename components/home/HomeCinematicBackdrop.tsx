type HomeCinematicBackdropProps = {
  eventLabel: string;
  seasonLabel: string;
};

export default function HomeCinematicBackdrop({
  eventLabel,
  seasonLabel,
}: HomeCinematicBackdropProps) {
  return (
    <div aria-hidden="true" className="asc-home-arena-backdrop">
      <div className="asc-home-arena-depth asc-home-arena-depth--back" />
      <div className="asc-home-arena-depth asc-home-arena-depth--front" />
      <div className="asc-home-arena-grid" />
      <div className="asc-home-arena-grid asc-home-arena-grid--far" />
      <div className="asc-home-arena-vault">
        {Array.from({ length: 6 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
      <div className="asc-home-arena-beams">
        {Array.from({ length: 3 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
      <svg
        className="asc-home-arena-frame"
        focusable="false"
        preserveAspectRatio="none"
        viewBox="0 0 1440 720"
      >
        <path d="M90 612 L250 460 L452 460 L540 382 L902 382 L990 460 L1192 460 L1350 612" />
        <path d="M160 116 L365 226 L580 226 L658 288 L782 288 L860 226 L1075 226 L1280 116" />
        <path d="M0 520 L202 520 M1238 520 L1440 520" />
        <path d="M348 616 L448 548 L992 548 L1092 616" />
        <path d="M520 330 L618 276 L822 276 L920 330" />
      </svg>
      <div className="asc-home-arena-core">
        <span className="asc-home-arena-core__ring asc-home-arena-core__ring--outer" />
        <span className="asc-home-arena-core__ring asc-home-arena-core__ring--mid" />
        <span className="asc-home-arena-core__ring asc-home-arena-core__ring--inner" />
        <span className="asc-home-arena-core__slash" />
      </div>
      <div className="asc-home-arena-nodes">
        {Array.from({ length: 6 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
      <div className="asc-home-arena-mobile">
        <span className="asc-home-arena-mobile__ring" />
        <span className="asc-home-arena-mobile__ring asc-home-arena-mobile__ring--inner" />
        <span className="asc-home-arena-mobile__line" />
      </div>
      <div className="asc-home-arena-orbit asc-home-arena-orbit--one" />
      <div className="asc-home-arena-orbit asc-home-arena-orbit--two" />
      <div className="asc-home-arena-readout asc-home-arena-readout--season">
        {seasonLabel}
      </div>
      <div className="asc-home-arena-readout asc-home-arena-readout--event">
        {eventLabel}
      </div>
      <div className="asc-home-arena-sweep" />
    </div>
  );
}
