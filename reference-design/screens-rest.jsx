/* screens-rest.jsx — Leaderboard + Profile */

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────

function LeaderboardScreen({ go }) {
  const [region, setRegion] = React.useState('Global');
  const [game, setGame] = React.useState('Valorant');
  const podium = PLAYERS.slice(0, 3);
  const rest = PLAYERS.slice(3);

  return (
    <div className="page page-enter">
      <section className="hero" style={{ minHeight: 360 }}>
        <div className="hero-bg" style={{ backgroundImage: `url(assets/backgrounds/leaderboard-hero.webp)` }}/>
        <div className="hero-content container" style={{ paddingBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}><span className="dot">▲</span> SEASON 7 · APEX TIER</div>
          <h1 className="title" style={{ fontSize: 'clamp(36px, 4vw, 60px)' }}>Leaderboard</h1>
          <p style={{ color: 'var(--fg-2)', maxWidth: 540, marginTop: 12, fontSize: 15 }}>
            The grind never ends. The top 100 ranked competitors across every region.
          </p>

          {/* Filter buttons */}
          <div className="row gap-2" style={{ marginTop: 22, flexWrap: 'wrap' }}>
            <FilterGroup label="Region" options={['Global', 'NA', 'EU', 'APAC', 'BR']} value={region} onChange={setRegion}/>
            <span className="vdiv" style={{ height: 24 }}/>
            <FilterGroup label="Game" options={['Valorant', 'CS2', 'League of Legends', 'Dota 2']} value={game} onChange={setGame}/>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: 'calc(-1 * var(--pad-3))', position: 'relative', zIndex: 3 }}>
        {/* Podium */}
        <div className="grid" style={{ gridTemplateColumns: '1fr 1.15fr 1fr', gap: 'var(--pad-2)', alignItems: 'end' }}>
          <PodiumCard player={podium[1]} place={2} go={go}/>
          <PodiumCard player={podium[0]} place={1} go={go}/>
          <PodiumCard player={podium[2]} place={3} go={go}/>
        </div>

        {/* Full table */}
        <div style={{ marginTop: 'var(--pad-4)' }}>
          <SectionHead eyebrow="Ranks 4 – 100" title="Apex 100 Ladder">
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>Updated 14m ago</span>
          </SectionHead>
          <div className="card card-bordered" style={{ padding: 0 }}>
            <div className="corner-mark"/>
            <div className="row gap-2" style={{ padding: '10px 18px', borderBottom: '1px solid var(--line-soft)', background: 'oklch(0.08 0.03 285)' }}>
              {[
                { l: '#', f: 0.4 }, { l: 'Player', f: 2 }, { l: 'Tier', f: 1.2 }, { l: 'MMR', f: 0.8 },
                { l: 'K/D', f: 0.7 }, { l: 'Win %', f: 0.7 }, { l: 'Region', f: 0.9 }, { l: 'Trend', f: 0.9 }, { l: 'Δ7D', f: 0.7 },
              ].map((h, i) => (
                <span key={i} className="mono" style={{ flex: h.f, fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{h.l}</span>
              ))}
            </div>
            {rest.map((p, i) => {
              const rank = i + 4;
              const trend = Array.from({ length: 12 }, (_, k) => p.elo - 80 + Math.sin(k + i) * 30 + k * 6);
              const delta = Math.round(trend[trend.length-1] - trend[0]);
              return (
                <div key={p.handle} className="row gap-2" style={{
                  padding: '12px 18px',
                  borderTop: '1px solid var(--line-soft)',
                  background: p.isMe ? 'oklch(0.20 0.12 var(--hue) / 0.15)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={e => !p.isMe && (e.currentTarget.style.background = 'oklch(0.20 0.10 var(--hue) / 0.08)')}
                onMouseLeave={e => !p.isMe && (e.currentTarget.style.background = 'transparent')}
                onClick={() => p.isMe && go('profile')}>
                  <span style={{ flex: 0.4 }} className="mono fg-3">{String(rank).padStart(2, '0')}</span>
                  <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar player={p} size={32}/>
                    <div>
                      <div className="row gap-1" style={{ lineHeight: 1.2 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--fg-0)' }}>{p.handle}</span>
                        <span style={{ fontSize: 11 }}>{p.country}</span>
                        {p.isMe && <span className="mono accent" style={{ fontSize: 9, letterSpacing: '0.14em', marginLeft: 4 }}>YOU</span>}
                      </div>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{p.tag} · {p.role}</div>
                    </div>
                  </div>
                  <span style={{ flex: 1.2 }}><TierBadge rank={p.rank}/></span>
                  <span style={{ flex: 0.8 }} className="display fg-0">{p.elo}</span>
                  <span style={{ flex: 0.7 }} className="mono fg-1">{p.kd.toFixed(2)}</span>
                  <span style={{ flex: 0.7 }} className="mono fg-1">{p.wr}%</span>
                  <span style={{ flex: 0.9 }} className="mono fg-2">{p.region}</span>
                  <span style={{ flex: 0.9 }}><Sparkline values={trend}/></span>
                  <span style={{ flex: 0.7 }}><Delta value={delta}/></span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PodiumCard({ player, place, go }) {
  const accentColor = place === 1 ? 'var(--gold)' : place === 2 ? 'oklch(0.78 0.04 290)' : 'oklch(0.62 0.10 50)';
  const heightOffset = place === 1 ? 0 : 24;
  return (
    <div className="card card-bordered" style={{
      padding: 'var(--pad-3)',
      paddingTop: place === 1 ? 'var(--pad-4)' : 'var(--pad-3)',
      paddingBottom: place === 1 ? 'var(--pad-4)' : 'var(--pad-3)',
      cursor: 'pointer',
      position: 'relative',
      background: place === 1
        ? 'linear-gradient(180deg, oklch(0.18 0.10 var(--hue) / 0.6) 0%, oklch(0.10 0.04 285) 100%)'
        : 'var(--bg-1)',
      marginBottom: heightOffset,
      overflow: 'hidden',
    }} onClick={() => player.isMe && go('profile')}>
      <div className="corner-mark"/>
      {/* Big rank glyph */}
      <div style={{
        position: 'absolute', top: -10, right: -8,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: place === 1 ? 200 : 140,
        color: 'oklch(1 0 0)',
        opacity: 0.04,
        lineHeight: 0.9,
        letterSpacing: '-0.02em',
      }}>0{place}</div>

      {place === 1 && (
        <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)', pointerEvents: 'none' }}/>
      )}

      <div className="row gap-2" style={{ alignItems: 'center', position: 'relative' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 32,
          color: accentColor,
          textShadow: place === 1 ? `0 0 24px ${accentColor}` : 'none',
          lineHeight: 1,
        }}>#{place}</span>
        {place === 1 && <Icon name="crown" size={20} style={{ color: 'var(--gold)' }}/>}
      </div>

      <div className="row gap-2" style={{ marginTop: 18, position: 'relative' }}>
        <Avatar player={player} size={place === 1 ? 64 : 52}/>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: place === 1 ? 22 : 18, color: 'var(--fg-0)', letterSpacing: '0.04em', lineHeight: 1.1 }}>
            {player.handle}
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 2, letterSpacing: '0.10em' }}>
            {player.tag} · {player.country} {player.region}
          </div>
        </div>
      </div>

      <div className="divider" style={{ margin: '16px 0' }}/>

      <div className="grid grid-3" style={{ gap: 8 }}>
        <div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.14em' }}>MMR</div>
          <div className="display" style={{ fontSize: place === 1 ? 24 : 20, color: 'var(--accent)', marginTop: 2 }}>{player.elo}</div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.14em' }}>K/D</div>
          <div className="display" style={{ fontSize: place === 1 ? 24 : 20, color: 'var(--fg-0)', marginTop: 2 }}>{player.kd.toFixed(2)}</div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.14em' }}>WIN %</div>
          <div className="display" style={{ fontSize: place === 1 ? 24 : 20, color: 'var(--fg-0)', marginTop: 2 }}>{player.wr}</div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <TierBadge rank={player.rank}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

function ProfileScreen({ go }) {
  const me = PROFILE_ME;
  return (
    <div className="page page-enter">
      <section className="hero" style={{ minHeight: 380 }}>
        <div className="hero-bg" style={{ backgroundImage: `url(assets/backgrounds/profile-hero.webp)` }}/>
        <div className="hero-content container" style={{ paddingBottom: 28 }}>
          <div className="row gap-3" style={{ alignItems: 'flex-end' }}>
            <div style={{ position: 'relative' }}>
              <Avatar player={me} size={130}/>
              <div style={{ position: 'absolute', bottom: -8, right: -8, padding: '4px 10px', background: 'var(--bg-0)', border: '1px solid var(--accent-dim)', clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
                <span className="mono accent" style={{ fontSize: 10, letterSpacing: '0.14em' }}>#01 GLOBAL</span>
              </div>
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div className="row gap-1" style={{ marginBottom: 10 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.14em' }}>{me.country} {me.region.toUpperCase()} · {me.role.toUpperCase()}</span>
                <span className="vdiv" style={{ height: 14, margin: '0 6px' }}/>
                <span className="chip chip-accent">VERIFIED PRO</span>
                <span className="chip">SEASON 7</span>
              </div>
              <h1 className="title" style={{ fontSize: 'clamp(40px, 4.5vw, 64px)', lineHeight: 0.95 }}>{me.handle}</h1>
              <div className="row gap-2" style={{ marginTop: 14, alignItems: 'center' }}>
                <TierBadge rank={me.rank}/>
                <span className="display" style={{ fontSize: 18, color: 'var(--accent)' }}>{me.elo} MMR</span>
                <span className="vdiv" style={{ height: 16 }}/>
                <span className="mono fg-2" style={{ fontSize: 11 }}>{me.tag} · NOVA VORTEX</span>
              </div>
            </div>
            <div className="row gap-2" style={{ paddingBottom: 8 }}>
              <button className="btn btn-ghost btn-sm"><Icon name="plus" size={12}/> Follow</button>
              <button className="btn btn-primary btn-sm">Challenge</button>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: 'var(--pad-3)' }}>
        {/* Stats strip */}
        <div className="grid grid-4">
          {[
            { l: 'MATCHES', v: '847', d: '+12 this week' },
            { l: 'WIN RATE', v: '71', unit: '%', d: '+3.2%', up: true },
            { l: 'K/D', v: '1.84', d: '+0.11', up: true },
            { l: 'PEAK MMR', v: '4218', d: 'Season high' },
          ].map((s, i) => (
            <div key={i} className="card card-bordered stat" style={{ position: 'relative' }}>
              <div className="corner-mark"/>
              <div className="l">{s.l}</div>
              <div className="v">{s.v}{s.unit && <span className="unit">{s.unit}</span>}</div>
              <div className={`d ${s.up === false ? 'down' : ''}`}>{s.d}</div>
            </div>
          ))}
        </div>

        {/* MMR graph + sidebar */}
        <div style={{ marginTop: 'var(--pad-3)', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--pad-3)' }}>
          <div className="card card-bordered" style={{ padding: 'var(--pad-3)', position: 'relative' }}>
            <div className="corner-mark"/>
            <div className="row" style={{ marginBottom: 18 }}>
              <div>
                <div className="eyebrow"><span className="dot">▲</span> Season 7 trajectory</div>
                <div className="title-2" style={{ fontSize: 22, marginTop: 4 }}>MMR Climb</div>
              </div>
              <span className="spacer"/>
              <div className="row gap-1">
                {['24W', '12W', '4W', '1W'].map((r, i) => (
                  <span key={r} className="mono" style={{
                    padding: '4px 10px',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    background: i === 0 ? 'var(--accent)' : 'var(--bg-2)',
                    color: i === 0 ? 'oklch(0.10 0.02 285)' : 'var(--fg-2)',
                    border: '1px solid ' + (i === 0 ? 'var(--accent)' : 'var(--line-soft)'),
                    cursor: 'pointer',
                    clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                  }}>{r}</span>
                ))}
              </div>
            </div>
            <EloChart values={ELO_SERIES}/>
          </div>

          <div className="card card-bordered" style={{ padding: 'var(--pad-3)', position: 'relative' }}>
            <div className="corner-mark"/>
            <div className="eyebrow"><span className="dot">▲</span> Achievements</div>
            <div className="title-2" style={{ fontSize: 22, marginTop: 4, marginBottom: 16 }}>Trophy Wall</div>
            <div className="grid" style={{ gap: 10 }}>
              {ACHIEVEMENTS.map((a, i) => (
                <div key={i} className="row gap-2" style={{
                  padding: 10,
                  background: a.t === 'gold' ? 'oklch(0.30 0.16 85 / 0.10)' : 'var(--bg-2)',
                  border: '1px solid ' + (a.t === 'gold' ? 'oklch(0.50 0.20 85 / 0.4)' : 'var(--line-soft)'),
                  clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                }}>
                  <div style={{
                    width: 34, height: 34,
                    background: a.t === 'gold' ? 'linear-gradient(135deg, var(--gold), oklch(0.55 0.18 60))' : 'var(--bg-3)',
                    color: a.t === 'gold' ? 'oklch(0.20 0.02 285)' : 'var(--fg-2)',
                    display: 'grid', placeItems: 'center',
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}>
                    <Icon name="medal" size={16}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--fg-0)', letterSpacing: '0.04em' }}>{a.name}</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', marginTop: 2, letterSpacing: '0.06em' }}>{a.desc}</div>
                    {a.pct < 100 && (
                      <div style={{ height: 2, background: 'var(--bg-3)', marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${a.pct}%`, background: 'var(--accent)' }}/>
                      </div>
                    )}
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: a.t === 'gold' ? 'var(--gold)' : 'var(--fg-2)' }}>
                    {a.pct === 100 ? '✓' : `${a.pct}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Match history */}
        <div style={{ marginTop: 'var(--pad-3)' }}>
          <SectionHead eyebrow="Recent" title="Match history">
            <button className="btn btn-sm btn-ghost">View all</button>
          </SectionHead>
          <div className="card card-bordered" style={{ padding: 0 }}>
            <div className="corner-mark"/>
            {MATCH_HISTORY.map((m, i) => (
              <div key={i} className="row gap-2" style={{
                padding: '14px 18px',
                borderTop: i ? '1px solid var(--line-soft)' : '0',
                background: m.result === 'W' ? 'oklch(0.18 0.06 var(--hue) / 0.05)' : 'transparent',
              }}>
                <div style={{
                  width: 38, height: 38,
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '0.04em',
                  color: m.result === 'W' ? 'var(--accent)' : 'var(--danger)',
                  background: m.result === 'W' ? 'oklch(0.20 0.12 var(--hue) / 0.20)' : 'oklch(0.25 0.18 25 / 0.15)',
                  border: '1px solid ' + (m.result === 'W' ? 'var(--accent-dim)' : 'oklch(0.50 0.20 25 / 0.4)'),
                  clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  flexShrink: 0,
                }}>{m.result}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row gap-2">
                    <span className="display" style={{ fontSize: 16, color: 'var(--fg-0)' }}>{m.score}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>vs</span>
                    <TeamTag tag={m.oppTag}/>
                    <span style={{ fontSize: 13, color: 'var(--fg-1)' }}>{m.opp}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 4, letterSpacing: '0.08em' }}>{m.map.toUpperCase()} · {m.when.toUpperCase()}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{m.kda}</span>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.14em' }}>K / D / A</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 80 }}>
                  <Delta value={m.delta} suffix=" MMR"/>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.14em' }}>RATING</span>
                </div>
                <Icon name="chevron-right" size={14} className="fg-3"/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EloChart({ values }) {
  const W = 800, H = 220;
  const PAD_L = 56, PAD_R = 24, PAD_T = 18, PAD_B = 30;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;
  const padRange = range * 0.15;
  const yMin = min - padRange;
  const yMax = max + padRange;
  const step = innerW / (values.length - 1);
  const x = (i) => PAD_L + i * step;
  const y = (v) => PAD_T + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const pts = values.map((v, i) => `${x(i)},${y(v)}`);
  const area = `M ${pts[0]} L ${pts.slice(1).join(' L ')} L ${x(values.length - 1)},${PAD_T + innerH} L ${x(0)},${PAD_T + innerH} Z`;
  const line = `M ${pts.join(' L ')}`;

  // gridlines
  const gridY = [yMin, yMin + (yMax - yMin) * 0.25, yMin + (yMax - yMin) * 0.5, yMin + (yMax - yMin) * 0.75, yMax];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.66 0.24 var(--hue))" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="oklch(0.66 0.24 var(--hue))" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* grid */}
      {gridY.map((g, i) => (
        <g key={i}>
          <line x1={PAD_L} y1={y(g)} x2={W - PAD_R} y2={y(g)} stroke="oklch(0.30 0.08 290 / 0.15)" strokeDasharray="2 4"/>
          <text x={PAD_L - 8} y={y(g) + 3} fontFamily="var(--font-mono)" fontSize="10" fill="var(--fg-3)" textAnchor="end">{Math.round(g)}</text>
        </g>
      ))}
      {/* area + line */}
      <path d={area} fill="url(#area)"/>
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))' }}/>
      {/* end-point marker */}
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="6" fill="var(--accent)"/>
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="12" fill="none" stroke="var(--accent)" strokeOpacity="0.35"/>
      {/* end label */}
      <g transform={`translate(${x(values.length - 1) - 60}, ${y(values[values.length - 1]) - 32})`}>
        <rect width="56" height="22" fill="oklch(0.06 0.02 285)" stroke="var(--accent-dim)"/>
        <text x="28" y="15" fontFamily="var(--font-display)" fontWeight="700" fontSize="13" fill="var(--accent)" textAnchor="middle" letterSpacing="0.04em">{values[values.length - 1]}</text>
      </g>
      {/* x labels */}
      {['24w', '18w', '12w', '6w', 'now'].map((l, i) => (
        <text key={l} x={PAD_L + (innerW * i / 4)} y={H - 8} fontFamily="var(--font-mono)" fontSize="10" fill="var(--fg-3)" textAnchor="middle" letterSpacing="0.12em">{l.toUpperCase()}</text>
      ))}
    </svg>
  );
}

Object.assign(window, { LeaderboardScreen, ProfileScreen });
