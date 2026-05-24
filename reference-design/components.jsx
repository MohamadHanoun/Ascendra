/* components.jsx — shared atoms & molecules */

// Ascendra mark — angular A-shaped chevron (inline SVG matching the logo geometry)
function Mark({ size = 24, color = 'currentColor', glow = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
      style={{ filter: glow ? 'drop-shadow(0 0 6px var(--accent-glow))' : 'none' }}>
      {/* big chevron */}
      <path d="M14 56 L30 6 L46 56 L38 56 L30 24 L22 56 Z" fill={color} opacity="0.95"/>
      {/* small chevron offset */}
      <path d="M30 56 L40 22 L52 56 L46 56 L40 38 L36 56 Z" fill={color} opacity="0.75"/>
    </svg>
  );
}

// Simple stroke icons (no external deps)
const Icon = ({ name, size = 16, ...props }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', ...props };
  switch (name) {
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'bell': return <svg {...common}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
    case 'trophy': return <svg {...common}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3"/></svg>;
    case 'crown': return <svg {...common}><path d="M3 7l4 4 5-6 5 6 4-4-2 11H5L3 7z"/></svg>;
    case 'sword': return <svg {...common}><path d="M14 4h6v6M20 4L9 15M5 19l5-5M5 19l-2 2 2-2zm0 0l-2-2"/></svg>;
    case 'users': return <svg {...common}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5.5 5.5 0 0 1 5.5 5.5"/></svg>;
    case 'controller': return <svg {...common}><path d="M6 9h12a4 4 0 0 1 4 4v3a2 2 0 0 1-3.5 1.3L17 16H7l-1.5 1.3A2 2 0 0 1 2 16v-3a4 4 0 0 1 4-4z"/><path d="M8 13h2M9 12v2M16 13h.01M14 14h.01"/></svg>;
    case 'flame': return <svg {...common}><path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 1.5-4 .5 1 1.5 2 2 2 .5-3 1-6 1.5-8z"/></svg>;
    case 'play': return <svg {...common}><path d="M6 4l14 8-14 8V4z" fill="currentColor"/></svg>;
    case 'eye': return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'chevron-right': return <svg {...common}><path d="m9 6 6 6-6 6"/></svg>;
    case 'chevron-down': return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
    case 'filter': return <svg {...common}><path d="M3 5h18M6 12h12M10 19h4"/></svg>;
    case 'globe': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case 'arrow-up': return <svg {...common}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'arrow-down': return <svg {...common}><path d="M12 5v14M19 12l-7 7-7-7"/></svg>;
    case 'shield': return <svg {...common}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/></svg>;
    case 'lightning': return <svg {...common}><path d="m13 2-7 12h5l-1 8 7-12h-5l1-8z"/></svg>;
    case 'medal': return <svg {...common}><circle cx="12" cy="15" r="5"/><path d="M9 10 5 2h4l3 5M15 10l4-8h-4l-3 5"/></svg>;
    case 'compass': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2z"/></svg>;
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'check': return <svg {...common}><path d="M5 13l4 4L19 7"/></svg>;
    default: return null;
  }
};

// Brand wordmark text (for nav)
function Wordmark() {
  return (
    <span className="row gap-1" style={{ alignItems: 'center' }}>
      <Mark size={26} color="var(--accent)" />
      <span style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 19,
        letterSpacing: '0.20em',
        color: 'var(--fg-0)',
      }}>ASCENDRA</span>
    </span>
  );
}

// Player avatar — generated from handle & hue
function Avatar({ player, size = 36 }) {
  const initials = player.handle.slice(0, 2).toUpperCase();
  const h = player.avatarHue ?? 295;
  return (
    <div style={{
      width: size, height: size,
      flexShrink: 0,
      background: `linear-gradient(135deg, oklch(0.55 0.22 ${h}), oklch(0.30 0.16 ${h + 40}))`,
      color: 'oklch(0.97 0.01 290)',
      display: 'grid', placeItems: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: size * 0.36,
      letterSpacing: '0.04em',
      clipPath: `polygon(${size*0.18}px 0, 100% 0, 100% calc(100% - ${size*0.18}px), calc(100% - ${size*0.18}px) 100%, 0 100%, 0 ${size*0.18}px)`,
      position: 'relative',
      boxShadow: `inset 0 0 0 1px oklch(0.65 0.22 ${h} / 0.4)`,
    }}>
      {initials}
    </div>
  );
}

// Team tag pill — sharp-cut, mono
function TeamTag({ tag, size = 'md', muted = false }) {
  const big = size === 'lg';
  return (
    <span style={{
      display: 'inline-block',
      padding: big ? '5px 10px' : '3px 7px',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: big ? 14 : 11,
      letterSpacing: '0.10em',
      color: muted ? 'var(--fg-3)' : 'var(--fg-0)',
      background: muted ? 'transparent' : 'var(--bg-2)',
      border: '1px solid var(--line-soft)',
      clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
    }}>{tag}</span>
  );
}

// Tier badge — like a rank chevron
function TierBadge({ rank }) {
  const tier = rank.split(' ')[0]; // Apex
  const sub = rank.split(' ')[1] || '';
  return (
    <div className="row gap-1" style={{
      padding: '4px 10px',
      background: 'oklch(0.20 0.10 var(--hue) / 0.3)',
      border: '1px solid var(--accent-dim)',
      clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
    }}>
      <Mark size={12} color="var(--accent)" glow={false} />
      <span style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.14em',
        color: 'var(--accent)',
      }}>{tier}</span>
      {sub && (
        <span className="mono" style={{ fontSize: 10, color: 'var(--accent)', opacity: 0.85 }}>{sub}</span>
      )}
    </div>
  );
}

// Big section header
function SectionHead({ eyebrow, title, children, count }) {
  return (
    <div className="section-head">
      <div className="lhs">
        {eyebrow && <div className="eyebrow e"><span className="dot">▲</span> {eyebrow}{count != null && <span style={{ color: 'var(--fg-3)', marginLeft: 8 }}>· {String(count).padStart(2, '0')}</span>}</div>}
        <div className="title-2">{title}</div>
      </div>
      {children && <div className="rhs">{children}</div>}
    </div>
  );
}

// Countdown component
function Countdown({ iso }) {
  const [t, setT] = React.useState(() => countdownTo(iso));
  React.useEffect(() => {
    const id = setInterval(() => setT(countdownTo(iso)), 1000);
    return () => clearInterval(id);
  }, [iso]);
  const Cell = ({ v, l }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 64 }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 38, lineHeight: 1,
        color: 'var(--fg-0)',
        background: 'linear-gradient(180deg, var(--fg-0), oklch(0.78 0.10 var(--hue)))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        letterSpacing: '0.02em',
      }}>{String(v).padStart(2, '0')}</div>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--fg-3)', textTransform: 'uppercase' }}>{l}</div>
    </div>
  );
  return (
    <div className="row gap-3" style={{ alignItems: 'flex-end' }}>
      <Cell v={t.d} l="Days" />
      <span style={{ fontFamily: 'var(--font-display)', color: 'var(--fg-3)', fontSize: 32, marginBottom: 14 }}>·</span>
      <Cell v={t.h} l="Hrs" />
      <span style={{ fontFamily: 'var(--font-display)', color: 'var(--fg-3)', fontSize: 32, marginBottom: 14 }}>·</span>
      <Cell v={t.m} l="Min" />
      <span style={{ fontFamily: 'var(--font-display)', color: 'var(--fg-3)', fontSize: 32, marginBottom: 14 }}>·</span>
      <Cell v={t.s} l="Sec" />
    </div>
  );
}

// Mini sparkline (for player rows)
function Sparkline({ values, width = 60, height = 18, color }) {
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke={color || 'var(--accent)'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// Ranking change indicator
function Delta({ value, suffix }) {
  if (value === 0) return <span className="mono fg-3">—</span>;
  const up = value > 0;
  return (
    <span className="mono" style={{ color: up ? 'var(--green)' : 'var(--danger)', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <Icon name={up ? 'arrow-up' : 'arrow-down'} size={10}/>
      {Math.abs(value)}{suffix || ''}
    </span>
  );
}

Object.assign(window, { Mark, Icon, Wordmark, Avatar, TeamTag, TierBadge, SectionHead, Countdown, Sparkline, Delta });
