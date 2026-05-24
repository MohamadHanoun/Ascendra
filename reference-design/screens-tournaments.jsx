/* screens-tournaments.jsx — Tournaments list + Bracket detail */

function TournamentsScreen({ go }) {
  const [game, setGame] = React.useState('All');
  const [region, setRegion] = React.useState('All');
  const [status, setStatus] = React.useState('All');

  const filtered = TOURNAMENTS.filter(t =>
    (game === 'All' || t.game === game) &&
    (region === 'All' || t.region.includes(region)) &&
    (status === 'All' || t.status === status)
  );

  return (
    <div className="page page-enter">
      {/* Compact hero */}
      <section className="hero" style={{ minHeight: 320 }}>
        <div className="hero-bg" style={{ backgroundImage: `url(assets/backgrounds/tournaments-hero.webp)` }}/>
        <div className="hero-content container" style={{ paddingBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}><span className="dot">▲</span> COMPETITIVE EVENTS · {TOURNAMENTS.length} ACTIVE</div>
          <h1 className="title" style={{ fontSize: 'clamp(36px, 4vw, 60px)' }}>Tournaments</h1>
          <p style={{ color: 'var(--fg-2)', maxWidth: 540, marginTop: 12, fontSize: 15 }}>
            Live broadcasts, open qualifiers, sponsored majors. Filter by game, region, and stage — register or watch.
          </p>
        </div>
      </section>

      <div className="container" style={{ marginTop: 'calc(-1 * var(--pad-3))', position: 'relative', zIndex: 3 }}>
        {/* Filter bar */}
        <div className="card card-bordered" style={{ padding: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Icon name="filter" size={14} className="accent"/>
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.18em', marginRight: 4 }}>FILTER</span>
          <FilterGroup label="Game" options={['All', 'Valorant', 'CS2', 'League of Legends', 'Dota 2', 'Battlefield']} value={game} onChange={setGame}/>
          <span className="vdiv" style={{ height: 24 }}/>
          <FilterGroup label="Region" options={['All', 'Global', 'NA', 'EU', 'APAC']} value={region} onChange={setRegion}/>
          <span className="vdiv" style={{ height: 24 }}/>
          <FilterGroup label="Status" options={['All', 'Live', 'Registration']} value={status} onChange={setStatus}/>
          <span className="spacer"/>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{filtered.length} results</span>
        </div>

        {/* Highlight row */}
        <div style={{ marginTop: 'var(--pad-3)' }}>
          <SectionHead eyebrow="Featured" title="Marquee event">
            <button className="btn btn-sm btn-ghost" onClick={() => go('tournament-detail')}>Open event <Icon name="chevron-right" size={12}/></button>
          </SectionHead>
          <FeaturedRow t={TOURNAMENTS[0]} onClick={() => go('tournament-detail')}/>
        </div>

        {/* Full list */}
        <div style={{ marginTop: 'var(--pad-4)' }}>
          <SectionHead eyebrow="All events" title="Tournament directory" count={filtered.length}/>
          <div className="card card-bordered" style={{ padding: 0 }}>
            <div className="corner-mark"/>
            <div className="row gap-2" style={{ padding: '10px 18px', borderBottom: '1px solid var(--line-soft)', background: 'oklch(0.08 0.03 285)' }}>
              {['Event', 'Game', 'Format', 'Region', 'Teams', 'Prize', 'Starts', 'Status', ''].map((h, i) => (
                <span key={i} className="mono" style={{
                  fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.16em', textTransform: 'uppercase',
                  flex: i === 0 ? 2 : i === 8 ? 0.4 : 1,
                  textAlign: i === 8 ? 'right' : 'left',
                }}>{h}</span>
              ))}
            </div>
            {filtered.map((t, i) => (
              <TournamentRow key={t.id} t={t} idx={i} onClick={() => go('tournament-detail')}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div className="row gap-1">
      <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.14em', marginRight: 4 }}>{label.toUpperCase()}</span>
      <div className="row" style={{ gap: 2 }}>
        {options.map(o => (
          <button key={o} onClick={() => onChange(o)} style={{
            background: value === o ? 'var(--accent)' : 'var(--bg-2)',
            color: value === o ? 'oklch(0.10 0.02 285)' : 'var(--fg-2)',
            border: '1px solid ' + (value === o ? 'var(--accent)' : 'var(--line-soft)'),
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            padding: '4px 10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
          }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function FeaturedRow({ t, onClick }) {
  return (
    <div className="card card-bordered" onClick={onClick} style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', position: 'relative', minHeight: 220 }}>
      <div className="corner-mark"/>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${t.bg})`, backgroundSize: 'cover', backgroundPosition: 'center right' }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, oklch(0.06 0.02 285 / 0.96) 0%, oklch(0.06 0.02 285 / 0.6) 50%, transparent 100%)' }}/>
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.5fr 1fr', padding: 'var(--pad-3) var(--pad-4)', minHeight: 220, alignItems: 'center', gap: 'var(--pad-3)' }}>
        <div>
          <div className="row gap-1" style={{ marginBottom: 14 }}>
            <span className="chip chip-accent">REGISTRATION</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.10em' }}>{t.game.toUpperCase()} · {t.format.toUpperCase()}</span>
          </div>
          <div className="title-2" style={{ fontSize: 36 }}>{t.name}</div>
          <div style={{ color: 'var(--fg-2)', marginTop: 8 }}>{t.tagline}</div>
          <div className="row gap-3" style={{ marginTop: 20 }}>
            <button className="btn btn-primary btn-sm">Register</button>
            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onClick(); }}>Event detail <Icon name="chevron-right" size={12}/></button>
          </div>
        </div>
        <div className="row gap-2" style={{ alignItems: 'stretch', justifyContent: 'flex-end' }}>
          <div style={{ padding: '14px 18px', background: 'oklch(0.10 0.04 285 / 0.7)', borderLeft: '1px solid var(--line-soft)' }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.18em' }}>PRIZE</div>
            <div className="display" style={{ fontSize: 26, color: 'var(--accent)' }}>{fmtCurrency(t.prize)}</div>
          </div>
          <div style={{ padding: '14px 18px', background: 'oklch(0.10 0.04 285 / 0.7)', borderLeft: '1px solid var(--line-soft)' }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.18em' }}>TEAMS</div>
            <div className="display fg-0" style={{ fontSize: 26 }}>{t.registered}<span style={{ color: 'var(--fg-3)', fontSize: 16 }}>/{t.teams}</span></div>
          </div>
          <div style={{ padding: '14px 18px', background: 'oklch(0.10 0.04 285 / 0.7)', borderLeft: '1px solid var(--line-soft)' }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.18em' }}>STARTS</div>
            <div className="display fg-0" style={{ fontSize: 26 }}>JUN 14</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TournamentRow({ t, idx, onClick }) {
  const startsDate = new Date(t.starts);
  const startsLabel = startsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  const startsTime = startsDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return (
    <div className="row gap-2" onClick={onClick} style={{
      padding: '14px 18px',
      borderTop: idx ? '1px solid var(--line-soft)' : '0',
      cursor: 'pointer',
      transition: 'background 120ms ease',
    }} onMouseEnter={e => e.currentTarget.style.background = 'oklch(0.20 0.10 var(--hue) / 0.10)'}
       onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48,
          backgroundImage: `url(${t.gameArt})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
          border: '1px solid var(--line-soft)',
          flexShrink: 0,
        }}/>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--fg-0)', fontSize: 14, letterSpacing: '0.04em', lineHeight: 1.2 }}>{t.name}</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 2 }}>{t.tagline}</div>
        </div>
      </div>
      <span className="mono" style={{ flex: 1, fontSize: 11, color: 'var(--fg-1)' }}>{t.game}</span>
      <span className="mono" style={{ flex: 1, fontSize: 11, color: 'var(--fg-2)' }}>{t.format}</span>
      <span className="mono" style={{ flex: 1, fontSize: 11, color: 'var(--fg-2)' }}>{t.region}</span>
      <span style={{ flex: 1 }}>
        <span className="display" style={{ fontSize: 14, color: 'var(--fg-0)' }}>{t.registered}<span style={{ color: 'var(--fg-3)' }}>/{t.teams}</span></span>
      </span>
      <span style={{ flex: 1 }}>
        <span className="display accent" style={{ fontSize: 14 }}>{fmtCurrency(t.prize)}</span>
      </span>
      <span style={{ flex: 1 }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-0)' }}>{startsLabel}</div>
        <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)' }}>{startsTime} UTC</div>
      </span>
      <span style={{ flex: 1 }}>
        {t.status === 'Live'
          ? <span className="status s-live">LIVE</span>
          : <span className="status s-open">{t.status}</span>}
      </span>
      <span style={{ flex: 0.4, textAlign: 'right' }}>
        <Icon name="chevron-right" size={14} className="fg-3"/>
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BRACKET SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function BracketScreen({ go }) {
  const t = TOURNAMENTS[0];
  return (
    <div className="page page-enter">
      <section className="hero" style={{ minHeight: 280 }}>
        <div className="hero-bg" style={{ backgroundImage: `url(assets/backgrounds/leaderboard-hero.webp)` }}/>
        <div className="hero-content container" style={{ paddingBottom: 28 }}>
          <div className="row gap-1" style={{ marginBottom: 14, cursor: 'pointer' }} onClick={() => go('tournaments')}>
            <Icon name="chevron-right" size={12} style={{ transform: 'rotate(180deg)' }} className="accent"/>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-2)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Tournaments / {t.name}</span>
          </div>
          <h1 className="title" style={{ fontSize: 'clamp(36px, 4vw, 58px)' }}>Knockout Bracket</h1>
          <div className="row gap-2" style={{ marginTop: 14 }}>
            <span className="chip chip-live"><span className="pulse"/>SEMIFINALS LIVE</span>
            <span className="chip chip-accent">{t.game.toUpperCase()}</span>
            <span className="chip">{t.format.toUpperCase()}</span>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: 'var(--pad-3)' }}>
        {/* Featured live match - large */}
        <FeaturedLiveMatch/>

        {/* Bracket */}
        <div style={{ marginTop: 'var(--pad-4)' }}>
          <SectionHead eyebrow="Top half" title="Path to the final"/>
          <div className="card card-bordered" style={{ padding: 'var(--pad-3) var(--pad-2)', overflowX: 'auto' }}>
            <div className="corner-mark"/>
            <div style={{ display: 'flex', gap: 24, minWidth: 'min-content' }}>
              {BRACKET_ROUNDS.map((round, ri) => (
                <BracketColumn key={ri} round={round} index={ri}/>
              ))}
            </div>
          </div>
          <div className="row gap-3" style={{ marginTop: 14, color: 'var(--fg-3)', fontSize: 11 }}>
            <LegendDot color="var(--accent)" label="Winner"/>
            <LegendDot color="var(--danger)" label="Live"/>
            <LegendDot color="var(--fg-3)" label="Upcoming"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="row gap-1">
      <span style={{ width: 8, height: 8, background: color, boxShadow: `0 0 8px ${color}` }}/>
      <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em' }}>{label.toUpperCase()}</span>
    </span>
  );
}

function FeaturedLiveMatch() {
  // The currently-live SF: NVX 1 vs AXIS 2 (live)
  const teamA = { tag: 'NVX', name: 'Nova Vortex', score: 1, won: 1, hue: 295, players: PLAYERS.slice(0, 5) };
  const teamB = { tag: 'AXIS', name: 'Axis Edge', score: 2, won: 2, hue: 220, players: PLAYERS.slice(4, 9) };

  return (
    <div className="card card-bordered" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      <div className="corner-mark"/>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(assets/games/valorant.webp)`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5 }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, oklch(0.06 0.02 285 / 0.8) 0%, oklch(0.06 0.02 285 / 0.96) 100%)' }}/>
      <div style={{ position: 'relative', padding: 'var(--pad-3) var(--pad-4)' }}>
        <div className="row gap-2" style={{ marginBottom: 14 }}>
          <span className="chip chip-live"><span className="pulse"/>LIVE NOW</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.12em' }}>SEMIFINAL · BO5 · MAP 4</span>
          <span className="spacer"/>
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-2)' }}><Icon name="eye" size={11} style={{ verticalAlign: -2, marginRight: 3 }}/>184.2K WATCHING</span>
        </div>

        <div className="row gap-3" style={{ alignItems: 'center' }}>
          {/* Team A */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
            <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 8 }}>
              <div style={{ textAlign: 'right' }}>
                <div className="title-2" style={{ fontSize: 24, color: 'var(--fg-0)' }}>{teamA.name}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.12em' }}>{teamA.tag} · ROSTER 5/5</div>
              </div>
              <Avatar player={{ handle: teamA.tag, avatarHue: teamA.hue }} size={56}/>
            </div>
            <div className="row gap-1" style={{ justifyContent: 'flex-end' }}>
              {teamA.players.map((p, i) => (
                <div key={i} title={p.handle} style={{ width: 28, height: 28, border: '1px solid var(--line-soft)' }}>
                  <Avatar player={p} size={28}/>
                </div>
              ))}
            </div>
          </div>

          {/* Score */}
          <div style={{ textAlign: 'center', padding: '0 var(--pad-3)' }}>
            <div className="display" style={{ fontSize: 96, lineHeight: 0.95, color: 'var(--fg-0)', letterSpacing: '0.02em' }}>
              <span style={{ color: teamA.score > teamB.score ? 'var(--accent)' : 'var(--fg-2)' }}>{teamA.score}</span>
              <span style={{ color: 'var(--fg-3)', margin: '0 12px' }}>:</span>
              <span style={{ color: teamB.score > teamA.score ? 'var(--accent)' : 'var(--fg-2)' }}>{teamB.score}</span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.16em', marginTop: 4 }}>BO5 · MATCH POINT</div>
          </div>

          {/* Team B */}
          <div style={{ flex: 1 }}>
            <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 8 }}>
              <Avatar player={{ handle: teamB.tag, avatarHue: teamB.hue }} size={56}/>
              <div>
                <div className="title-2" style={{ fontSize: 24, color: 'var(--fg-0)' }}>{teamB.name}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.12em' }}>{teamB.tag} · ROSTER 5/5</div>
              </div>
            </div>
            <div className="row gap-1">
              {teamB.players.map((p, i) => (
                <div key={i} title={p.handle} style={{ width: 28, height: 28, border: '1px solid var(--line-soft)' }}>
                  <Avatar player={p} size={28}/>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="row gap-2" style={{ marginTop: 20 }}>
          <button className="btn btn-primary"><Icon name="play" size={12}/> Watch live</button>
          <button className="btn btn-ghost btn-sm">Match thread</button>
          <span className="spacer"/>
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.12em' }}>MAPS: ASCENT · HAVEN · LOTUS · SUNSET</span>
        </div>

        {/* Map series */}
        <div className="row" style={{ marginTop: 14, gap: 6 }}>
          {[
            { map: 'ASCENT', a: 13, b: 9, winner: 'A' },
            { map: 'HAVEN',  a: 8,  b: 13, winner: 'B' },
            { map: 'LOTUS',  a: 11, b: 13, winner: 'B' },
            { map: 'SUNSET', a: 9,  b: 8,  live: true },
            { map: 'TBD',    upcoming: true },
          ].map((m, i) => (
            <div key={i} style={{
              flex: 1,
              padding: '8px 10px',
              background: m.live ? 'oklch(0.25 0.18 25 / 0.15)' : m.upcoming ? 'transparent' : 'var(--bg-2)',
              border: `1px solid ${m.live ? 'oklch(0.50 0.20 25 / 0.5)' : 'var(--line-soft)'}`,
              clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
            }}>
              <div className="mono" style={{ fontSize: 9, color: m.live ? 'var(--danger)' : 'var(--fg-3)', letterSpacing: '0.16em', marginBottom: 4 }}>
                MAP {i + 1} · {m.map}
              </div>
              {m.upcoming
                ? <div className="display" style={{ fontSize: 18, color: 'var(--fg-3)' }}>—</div>
                : <div className="display" style={{ fontSize: 18, color: 'var(--fg-0)' }}>
                    <span style={{ color: m.winner === 'A' ? 'var(--accent)' : 'var(--fg-2)' }}>{m.a}</span>
                    <span style={{ color: 'var(--fg-3)' }}> : </span>
                    <span style={{ color: m.winner === 'B' ? 'var(--accent)' : 'var(--fg-2)' }}>{m.b}</span>
                  </div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BracketColumn({ round, index }) {
  // Vertical spacing increases per round, like a real bracket
  const mult = Math.pow(2, index);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14, paddingLeft: 6 }}>
        {round.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1, gap: 12 * mult }}>
        {round.matches.map((m, mi) => (
          <BracketMatch key={mi} match={m}/>
        ))}
      </div>
    </div>
  );
}

function BracketMatch({ match }) {
  const Row = ({ side, opp }) => {
    const isWinner = side.won;
    const isLive = side.live;
    return (
      <div className="row gap-2" style={{
        padding: '6px 10px',
        background: isWinner ? 'oklch(0.20 0.12 var(--hue) / 0.25)' : 'transparent',
        borderLeft: `2px solid ${isWinner ? 'var(--accent)' : isLive ? 'var(--danger)' : 'transparent'}`,
      }}>
        <TeamTag tag={side.tag} muted={match.tbd}/>
        <span className="spacer"/>
        {match.upcoming || match.tbd
          ? <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>—</span>
          : <span className="display" style={{
              fontSize: 14,
              color: isWinner ? 'var(--accent)' : isLive ? 'var(--fg-0)' : 'var(--fg-2)',
            }}>{side.score}</span>}
      </div>
    );
  };
  return (
    <div style={{
      background: match.tbd ? 'transparent' : 'oklch(0.10 0.04 285 / 0.6)',
      border: '1px solid ' + (match.live ? 'oklch(0.50 0.20 25 / 0.5)' : 'var(--line-soft)'),
      clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
      padding: '6px 0',
      position: 'relative',
    }}>
      <Row side={match.a}/>
      <div style={{ height: 1, background: 'var(--line-soft)', margin: '4px 0' }}/>
      <Row side={match.b}/>
      {match.live && (
        <div style={{ position: 'absolute', top: -8, right: 6 }}>
          <span className="chip chip-live" style={{ fontSize: 9, padding: '2px 6px' }}><span className="pulse"/>LIVE</span>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { TournamentsScreen, BracketScreen });
