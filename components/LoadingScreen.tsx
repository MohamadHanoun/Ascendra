import Image from "next/image";

type LoadingScreenProps = {
  /** Optional override for the heading label. Defaults to "Loading". */
  label?: string;
  /** Optional override for the cycling status lines. */
  statuses?: [string, string, string];
};

const DEFAULT_STATUSES: [string, string, string] = [
  "Initializing Ascendra",
  "Syncing Arena",
  "Preparing Matchday",
];

/**
 * Branded, cinematic, CSS-only full-screen loader.
 *
 * Dark mode: a drifting graphite grid, breathing gold/bronze ambient glow,
 * a rotating gold arc ring + counter-rotating outline, a pulsing rim, the
 * Ascendra mark powering on behind a vertical scanline, rising gold embers,
 * and a travelling glow rail. Light mode renders the same energy in
 * platinum / silver via tokens.
 *
 * Server component — no client JS. All motion lives in globals.css and is
 * frozen to a static premium state under `prefers-reduced-motion: reduce`.
 */
export default function LoadingScreen({
  label = "Loading",
  statuses = DEFAULT_STATUSES,
}: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className="asc-loader flex min-h-screen flex-col items-center justify-center gap-7 px-6"
      style={{ background: "var(--asc-bg-0)" }}
    >
      {/* Cinematic background layers */}
      <div aria-hidden="true" className="asc-loader-grid" />
      <div aria-hidden="true" className="asc-loader-ambient" />
      <div aria-hidden="true" className="asc-loader-vignette" />
      <div aria-hidden="true" className="asc-loader-sweep" />
      <div aria-hidden="true" className="asc-loader-sparks">
        <span className="asc-loader-spark" />
        <span className="asc-loader-spark" />
        <span className="asc-loader-spark" />
        <span className="asc-loader-spark" />
        <span className="asc-loader-spark" />
        <span className="asc-loader-spark" />
      </div>

      {/* Stage: rings + logo tile */}
      <div className="relative z-10 flex flex-col items-center gap-7">
        <div className="asc-loader-stage">
          <span aria-hidden="true" className="asc-loader-ring" />
          <span aria-hidden="true" className="asc-loader-ring asc-loader-ring--outline" />
          <span aria-hidden="true" className="asc-loader-rim" />
          <div className="asc-loader-tile">
            <Image
              src="/images/brand/ascendra-logo-mark.png"
              alt=""
              width={56}
              height={56}
              priority
              className="asc-loader-mark h-14 w-14 object-contain"
            />
            <span aria-hidden="true" className="asc-loader-scan" />
          </div>
        </div>

        {/* Heading + cycling status */}
        <div className="flex flex-col items-center gap-3" aria-hidden="true">
          <p className="asc-loader-heading">{label}</p>
          <div className="asc-loader-status">
            <span>{statuses[0]}</span>
            <span>{statuses[1]}</span>
            <span>{statuses[2]}</span>
          </div>
        </div>

        {/* Progress rail */}
        <div aria-hidden="true" className="asc-loader-rail">
          <span className="asc-loader-rail-fill" />
        </div>
      </div>
    </div>
  );
}
