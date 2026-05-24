/* screens-home.jsx — Home — editorial premium cut */

function HomeScreen({ go, layout = 'split' }) {
  const hero = TOURNAMENTS.find(t => t.featured);
  const live = LIVE_MATCHES;
  const featuredTournaments = TOURNAMENTS.filter(t => !t.featured).slice(0, 4);
  const topPlayers = PLAYERS.slice(0, 5);

  return (
    <div className="page page-enter">
      {/* ─── HERO ─── */}
      {layout === 'editorial' ? <HeroEditorial hero={hero} go={go}/> : layout === 'full' ? <HeroFull hero={hero} go={go}/> : <HeroSplit hero={hero} go={go}/>}

      {/* ─── LIVE MARQUEE ─── */}
      <div className="marquee">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <React.Fragment key={k}>
              <span><span className="h">LIVE</span> &nbsp; NVX 13 · OBLK 11 · MAP 3 ASCENT</span>
              <span><span className="h">UP NEXT</span> &nbsp; CRSH vs VRGE · 00:42</span>
              <span><span className="h">QUALIFIERS</span> &nbsp; RIFT OPEN 96/128 TEAMS REGISTERED</span>
              <span><span className="h">SIGNING</span> &nbsp; HOLLOWAY JOINS PHOENIX DRIFT</span>
              <span><span className="h">PATCH 7.1</span> &nbsp; APEX TIER SOFT-RESET LIVE</span>
              <span><span className="h">PRIZE</span> &nbsp; ASCENDRA MAJOR $1.25M GUARANTEED</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ─── HOW IT WORKS — three quiet steps ─── */}
      <section className="section-tight" style={{ paddingTop: 'var(--pad-5)' }}>
        <div className="container">
          <div className="rule" style={{ marginBottom: 'var(--pad-4)' }}>
            <span className="label">▲ How Ascendra works</span>
          </div>
          <div className="grid grid-3">
            {[
              { n: '01', h: 'Register your team', t: 'Form a roster of five, link your game accounts and pick the tournaments you want in. We verify, you play.' },
              { n: '02', h: 'Climb the brackets', t: 'Match results pull straight from the publisher API. No screenshots, no disputes — only verified outcomes feed your MMR.' },
              { n: '03', h: 'Earn your rank', t: 'Apex tier, prize money, sponsor seats. Every season resets but the records stay on Ascendra forever.' },
            ].map(step => (
              <div key={step.n}>
                <div className="big-num accent" style={{ marginBottom: 14 }}>{step.n}</div>
                <div className="title-3" style={{ fontSize: 16, marginBottom: 8 }}>{step.h}</div>
                <p style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.55, margin: 0, maxWidth: 380 }}>{step.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIVE NOW ─── */}
      <section className="section-tight">
        <div className="container">
          <SectionHead eyebrow="Broadcasts" title="Live now" count={live.length}>
            <button className="btn btn-sm btn-ghost" onClick={() => go('bracket')}>All matches <Icon name="chevron-right" size={12}/></button>
          </SectionHead>
          <div className="grid grid-3">
            {live.map(m => <LiveMatchCard key={m.id} match={m} onClick={() => go('bracket')} />)}
          </div>
        </div>
      </section>

      {/* ─── FEATURED TOURNAMENTS — editorial 2-col ─── */}
      <section className="section-tight">
        <div className="container">
          <SectionHead eyebrow="Open registration" title="Compete this season">
            <button className="btn btn-sm btn-ghost" onClick={() => go('tournaments')}>All tournaments <Icon name="chevron-right" size={12}/></button>
          </SectionHead>
          <div className="grid grid-2">
            {featuredTournaments.slice(0, 2).map(t => <TournamentCardLarge key={t.id} t={t} onClick={() => go('tournament-detail')}/>)}
          </div>
          <div className="grid grid-2" style={{ marginTop: 'var(--pad-2)' }}>
            {featuredTournaments.slice(2, 4).map(t => <TournamentCardLarge key={t.id} t={t} onClick={() => go('tournament-detail')} compact/>)}
          </div>
        </div>
      </section>

      {/* ─── SUPPORTED GAMES — wide rail ─── */}
      <section className="section-tight">
        <div className="container">
          <SectionHead eyebrow="Competitive titles" title="Pick your arena" count={GAMES.length}>
            <button className="btn btn-sm btn-ghost" onClick={() => go('games')}>Games registry <Icon name="chevron-right" size={12}/></button>
          </SectionHead>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${GAMES.length}, 1fr)`, gap: 'var(--pad-2)' }}>
            {GAMES.map(g => <GameTile key={g.id} g={g} onClick={() => go('games')}/>)}
          </div>
        </div>
      </section>

      {/* ─── LADDER + COMMUNITY  ─── */}
      <section className="section-tight">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'var(--pad-3)' }}>
            {/* Top of ladder */}
            <div>
              <SectionHead eyebrow="Apex 100" title="Top of the ladder">
                <button className="btn btn-sm btn-ghost" onClick={() => go('leaderboard')}>Full ladder <Icon name="chevron-right" size={12}/></button>
              </SectionHead>
              <div className="card card-bordered" style={{ padding: 0 }}>
                <div className="corner-mark"/>
                {topPlayers.map((p, i) => (
                  <div key={p.handle} className="row gap-2" style={{
                    padding: '14px 20px',
                    borderTop: i ? '1px solid var(--line-soft)' : '0',
                    background: p.isMe ? 'oklch(0.20 0.12 var(--hue) / 0.14)' : 'transparent',
                    cursor: 'pointer',
                  }} onClick={() => p.isMe && go('profile')}>
                    <span className="mono tabular" style={{ width: 28, color: i < 3 ? 'var(--accent)' : 'var(--fg-3)', fontSize: 13, fontWeight: 600 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Avatar player={p} size={36}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row gap-1" style={{ lineHeight: 1.2 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg-0)' }}>{p.handle}</span>
                        {p.isMe && <span className="mono accent" style={{ fontSize: 9, letterSpacing: '0.14em' }}>YOU</span>}
                      </div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{p.tag} · {p.region} · {p.role}</div>
                    </div>
                    <Sparkline values={[p.elo - 80, p.elo - 60, p.elo - 30, p.elo - 40, p.elo - 10, p.elo - 20, p.elo + 10, p.elo]} width={64} height={20}/>
                    <div style={{ textAlign: 'right', minWidth: 60 }}>
                      <div className="display tabular" style={{ fontSize: 18, color: 'var(--fg-0)' }}>{p.elo}</div>
                      <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.12em' }}>MMR</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community stats + Discord */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pad-2)' }}>
              <DiscordCard onClick={() => go('discord')}/>
              <div className="grid grid-2" style={{ gap: 'var(--pad-2)' }}>
                <StatTile k="Players" v="48.2K" sub="↑ 12% this month"/>
                <StatTile k="Matches today" v="3.2K" sub="↑ 480 since 6 AM"/>
                <StatTile k="Active tournaments" v="14" sub="6 across 4 games"/>
                <StatTile k="Prize pooled" v="$2.1M" sub="Season 7 to date"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ANNOUNCEMENTS ─── */}
      <section className="section-tight">
        <div className="container">
          <SectionHead eyebrow="From the desk" title="Latest announcements"/>
          <div className="grid grid-2" style={{ gap: 'var(--pad-2)' }}>
            {NEWS.map((n, i) => (
              <div key={i} className="card card-bordered" style={{ padding: '18px 22px', display: 'flex', gap: 16, alignItems: 'flex-start', cursor: 'pointer' }}>
                <div className="big-num" style={{ fontSize: 38, color: 'var(--accent)', minWidth: 48, lineHeight: 1 }}>0{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>{n.tag} · {n.d}</div>
                  <div style={{ color: 'var(--fg-0)', fontSize: 15, lineHeight: 1.35, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '0.01em' }}>{n.title}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 8, letterSpacing: '0.10em' }}>{n.read.toUpperCase()} READ</div>
                </div>
                <Icon name="chevron-right" size={14} className="fg-3"/>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter go={go}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO VARIANTS
// ─────────────────────────────────────────────────────────────────────────────

function HeroSplit({ hero, go }) {
  return (
    <section className="hero" style={{ minHeight: 720 }}>
      <div className="hero-bg" style={{ backgroundImage: `url(${hero.bg})` }}/>
      <div className="hero-content container">
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', alignItems: 'end', gap: 'var(--pad-5)' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 22 }}>
              <span className="dot">▲</span> ASCENDRA · SEASON 07 · A PREMIUM ESPORTS PLATFORM
            </div>
            <h1 className="title">
              Rise<br/>
              <span style={{
                background: 'linear-gradient(92deg, var(--accent) 0%, oklch(0.85 0.10 245) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Beyond limits.</span>
            </h1>
            <p style={{ color: 'var(--fg-1)', fontSize: 17, maxWidth: 480, marginTop: 26, lineHeight: 1.55 }}>
              The competitive home for serious teams. Verified results, automated brackets, and a Discord-native community organized around the games you actually play.
            </p>
            <div className="row gap-2" style={{ marginTop: 36 }}>
              <button className="btn btn-primary btn-lg" onClick={() => go('tournaments')}>
                Browse tournaments <Icon name="chevron-right" size={14}/>
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => go('discord')}>
                <Icon name="users" size={14}/> Join Discord
              </button>
            </div>
          </div>

          {/* Right rail: featured event card */}
          <FeaturedEventCard hero={hero} go={go}/>
        </div>
      </div>
    </section>
  );
}

function HeroEditorial({ hero, go }) {
  return (
    <section className="hero" style={{ minHeight: 720 }}>
      <div className="hero-bg" style={{ backgroundImage: `url(${hero.bg})`, opacity: 0.55 }}/>
      <div className="hero-content container" style={{ textAlign: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 26, justifyContent: 'center' }}>
          <span className="dot">▲</span> ASCENDRA · SEASON 07
        </div>
        <h1 className="title" style={{ fontSize: 'clamp(64px, 9vw, 160px)', textAlign: 'center', textWrap: 'balance' }}>
          Rise beyond<br/>
          <span style={{
            background: 'linear-gradient(92deg, var(--accent) 0%, oklch(0.85 0.10 245) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>the limit.</span>
        </h1>
        <p style={{ color: 'var(--fg-1)', fontSize: 18, maxWidth: 580, margin: '32px auto 0', lineHeight: 1.55 }}>
          A premium tournament platform built around the games you play and the Discord you already live in.
        </p>
        <div className="row gap-2" style={{ marginTop: 40, justifyContent: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={() => go('tournaments')}>
            Browse tournaments <Icon name="chevron-right" size={14}/>
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => go('discord')}>
            <Icon name="users" size={14}/> Join Discord
          </button>
        </div>
      </div>
    </section>
  );
}

function HeroFull({ hero, go }) {
  return (
    <section className="hero" style={{ minHeight: 760 }}>
      <div className="hero-bg" style={{ backgroundImage: `url(${hero.bg})` }}/>
      <div className="hero-content container">
        <div style={{ maxWidth: 760 }}>
          <div className="eyebrow" style={{ marginBottom: 22 }}>
            <span className="dot">▲</span> FEATURED MAJOR · QUALIFIERS LIVE
          </div>
          <h1 className="title">{hero.name}</h1>
          <p style={{ color: 'var(--fg-1)', fontSize: 18, maxWidth: 560, marginTop: 22, lineHeight: 1.55 }}>
            {hero.tagline}. 32 teams. One champion. A {fmtCurrency(hero.prize)} purse. Open qualifiers close in days — register or watch live.
          </p>
          <div className="row gap-2" style={{ marginTop: 36 }}>
            <button className="btn btn-accent btn-lg" onClick={() => go('tournament-detail')}>
              Register team <Icon name="chevron-right" size={14}/>
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => go('bracket')}>
              <Icon name="play" size={12}/> Watch live
            </button>
          </div>
          <div className="row gap-5" style={{ marginTop: 56, gap: 56 }}>
            <div className="kv">
              <span className="k">Prize pool</span>
              <span className="v big-num" style={{ fontSize: 56 }}>{fmtCurrency(hero.prize)}</span>
            </div>
            <div className="kv">
              <span className="k">Teams</span>
              <span className="v big-num" style={{ fontSize: 56 }}>{hero.registered}<span className="fg-3">/{hero.teams}</span></span>
            </div>
            <div className="kv">
              <span className="k">Format</span>
              <span className="v" style={{ fontSize: 18 }}>{hero.format}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedEventCard({ hero, go }) {
  return (
    <div className="card glass card-bordered" style={{ padding: 'var(--pad-3)', position: 'relative' }}>
      <div className="corner-mark"/>
      <div className="row gap-1" style={{ marginBottom: 14 }}>
        <span className="status s-open">Featured · Season 7</span>
      </div>
      <div className="title-2" style={{ fontSize: 26, lineHeight: 1.05, marginBottom: 4 }}>{hero.name}</div>
      <div style={{ color: 'var(--fg-2)', fontSize: 13, marginBottom: 20 }}>{hero.tagline}</div>

      <div className="eyebrow" style={{ marginBottom: 10 }}><span className="dot">▲</span> Group stage begins in</div>
      <Countdown iso={hero.starts} />

      <div className="divider" style={{ margin: '22px 0 16px' }}/>
      <div className="grid grid-3" style={{ gap: 'var(--pad-2)' }}>
        <div className="kv">
          <span className="k">Prize</span>
          <span className="v" style={{ color: 'var(--accent)' }}>{fmtCurrency(hero.prize)}</span>
        </div>
        <div className="kv">
          <span className="k">Slots</span>
          <span className="v">{hero.registered}<span style={{ color: 'var(--fg-3)', fontSize: 14 }}>/{hero.teams}</span></span>
        </div>
        <div className="kv">
          <span className="k">Region</span>
          <span className="v">Global</span>
        </div>
      </div>
      <div style={{ marginTop: 18, height: 3, background: 'var(--bg-2)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(hero.registered/hero.teams)*100}%`, background: 'linear-gradient(90deg, var(--accent), oklch(0.85 0.10 245))' }}/>
      </div>
      <button className="btn btn-accent" style={{ marginTop: 18, width: '100%', justifyContent: 'center' }} onClick={() => go('tournament-detail')}>
        Register team <Icon name="chevron-right" size={12}/>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE MATCH CARD
// ─────────────────────────────────────────────────────────────────────────────

function LiveMatchCard({ match, onClick }) {
  return (
    <div className="card card-bordered" onClick={onClick} style={{ padding: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
      <div className="corner-mark"/>
      <div className="row gap-2" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line-soft)' }}>
        <span className="status s-live">LIVE</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.12em' }}>{match.tournament}</span>
        <span className="spacer"/>
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-2)' }}>
          <Icon name="eye" size={11} style={{ verticalAlign: -2, marginRight: 3 }}/>{(match.viewers/1000).toFixed(1)}K
        </span>
      </div>

      <div style={{ padding: '20px 22px 18px' }}>
        <div className="row gap-2">
          <Avatar player={{ handle: match.teamA.tag, avatarHue: 295 }} size={36}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--fg-0)', fontSize: 15, letterSpacing: '0.02em' }}>{match.teamA.name}</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.10em' }}>{match.teamA.tag}</div>
          </div>
          <span className="display tabular" style={{ fontSize: 32, color: match.teamA.score > match.teamB.score ? 'var(--accent)' : 'var(--fg-2)' }}>{match.teamA.score}</span>
        </div>
        <div className="divider" style={{ margin: '14px 0' }}/>
        <div className="row gap-2">
          <Avatar player={{ handle: match.teamB.tag, avatarHue: 220 }} size={36}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--fg-0)', fontSize: 15, letterSpacing: '0.02em' }}>{match.teamB.name}</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.10em' }}>{match.teamB.tag}</div>
          </div>
          <span className="display tabular" style={{ fontSize: 32, color: match.teamB.score > match.teamA.score ? 'var(--accent)' : 'var(--fg-2)' }}>{match.teamB.score}</span>
        </div>
      </div>

      <div className="row gap-2" style={{ padding: '10px 16px', borderTop: '1px solid var(--line-soft)', background: 'oklch(0.09 0.03 285)' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-2)', letterSpacing: '0.10em' }}>MAP · {match.map.toUpperCase()}</span>
        <span className="vdiv" style={{ height: 10 }}/>
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-2)', letterSpacing: '0.10em' }}>{match.series}</span>
        <span className="spacer"/>
        <span className="mono accent" style={{ fontSize: 10, letterSpacing: '0.10em' }}>R{match.round} · {match.timeLeft}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOURNAMENT CARD — large editorial
// ─────────────────────────────────────────────────────────────────────────────

function TournamentCardLarge({ t, onClick, compact = false }) {
  const isLive = t.status === 'Live';
  return (
    <div className="card card-bordered" onClick={onClick} style={{ padding: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', minHeight: compact ? 180 : 280 }}>
      <div className="corner-mark"/>
      <div className="bleed-img" style={{ backgroundImage: `url(${t.bg})`, opacity: 0.85 }}/>
      <div style={{ position: 'relative', padding: 'var(--pad-3) var(--pad-3) var(--pad-3)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: compact ? 180 : 280 }}>
        <div className="row gap-1">
          {isLive
            ? <span className="status s-live">LIVE</span>
            : <span className="status s-open">Registration</span>}
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-2)', letterSpacing: '0.14em' }}>{t.game.toUpperCase()}</span>
        </div>
        <div style={{ flex: 1 }}/>
        <div className="title-2" style={{ fontSize: compact ? 24 : 32, marginTop: 12, lineHeight: 1 }}>{t.name}</div>
        <div style={{ color: 'var(--fg-1)', fontSize: 13, marginTop: 8, maxWidth: 320 }}>{t.tagline}</div>
        <div className="row gap-4" style={{ marginTop: compact ? 16 : 24 }}>
          <div className="kv">
            <span className="k">Prize</span>
            <span className="v" style={{ color: 'var(--accent)' }}>{fmtCurrency(t.prize)}</span>
          </div>
          <div className="kv">
            <span className="k">Teams</span>
            <span className="v">{t.registered}<span style={{ color: 'var(--fg-3)' }}>/{t.teams}</span></span>
          </div>
          <div className="kv">
            <span className="k">Format</span>
            <span className="v" style={{ fontSize: 14 }}>{t.format.split('·')[0].trim()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME TILE
// ─────────────────────────────────────────────────────────────────────────────

function GameTile({ g, onClick }) {
  return (
    <div className="card card-bordered" onClick={onClick} style={{
      padding: 0,
      cursor: 'pointer',
      position: 'relative',
      aspectRatio: '3/4',
      overflow: 'hidden',
    }}>
      <div className="corner-mark"/>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${g.art})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        transition: 'transform 800ms cubic-bezier(.2,.7,.2,1)',
      }} className="game-img"/>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, oklch(0.07 0.025 285 / 0.96) 100%)' }}/>
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <span className="t-status open">{g.active} LIVE</span>
      </div>
      <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
        <div className="title-3" style={{ fontSize: 17, lineHeight: 1.1 }}>{g.name}</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 6, letterSpacing: '0.14em' }}>{g.teamSize} · {g.players} ACTIVE</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT TILE
// ─────────────────────────────────────────────────────────────────────────────

function StatTile({ k, v, sub }) {
  return (
    <div className="card card-bordered" style={{ padding: 18, position: 'relative' }}>
      <div className="corner-mark"/>
      <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{k}</div>
      <div className="display tabular" style={{ fontSize: 32, color: 'var(--fg-0)', marginTop: 8, lineHeight: 1 }}>{v}</div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--green)', marginTop: 8, letterSpacing: '0.08em' }}>{sub}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCORD CARD
// ─────────────────────────────────────────────────────────────────────────────

function DiscordCard({ onClick }) {
  return (
    <div className="card card-bordered" onClick={onClick} style={{ padding: 0, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
      <div className="corner-mark"/>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, oklch(0.30 0.18 270) 0%, oklch(0.12 0.05 280) 60%)',
        opacity: 0.85,
      }}/>
      <div style={{ position: 'relative', padding: 'var(--pad-3) var(--pad-3) var(--pad-3)' }}>
        <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 14 }}>
          <DiscordGlyph/>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'oklch(0.85 0.10 270)', letterSpacing: '0.18em' }}>COMMUNITY</div>
            <div className="title-2" style={{ fontSize: 22 }}>The Ascendra Discord</div>
          </div>
        </div>
        <p style={{ color: 'var(--fg-1)', fontSize: 13, lineHeight: 1.55, margin: 0, maxWidth: 380 }}>
          184K members. Live tournament rooms, ticket-bot disputes, looking-for-game pings — your team's home base.
        </p>
        <div className="row gap-3" style={{ marginTop: 20 }}>
          <div className="kv">
            <span className="k">Members</span>
            <span className="v tabular">184.2K</span>
          </div>
          <div className="kv">
            <span className="k">Online now</span>
            <span className="v tabular" style={{ color: 'oklch(0.78 0.18 150)' }}>28.4K</span>
          </div>
        </div>
        <button className="btn btn-discord" style={{ marginTop: 20 }}>
          <Icon name="users" size={13}/> Join the server
        </button>
      </div>
    </div>
  );
}

function DiscordGlyph() {
  return (
    <div style={{
      width: 48, height: 48,
      background: 'oklch(0.62 0.18 270)',
      display: 'grid', placeItems: 'center',
      clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
    }}>
      <svg width="24" height="18" viewBox="0 0 24 18" fill="oklch(0.98 0.01 290)">
        <path d="M20.3 1.8a18 18 0 0 0-4.5-1.4l-.2.4c1.6.3 3 .9 4.3 1.7-1.6-.9-3.4-1.4-5.3-1.4S10.9.6 9.3 1.5c1.3-.8 2.7-1.4 4.3-1.7l-.2-.4A18 18 0 0 0 8.9 1.8C5.7 6.7 4.9 11.4 5.3 16c1.8 1.3 3.6 2 5.4 2.5l.4-.6a11 11 0 0 1-2.2-1.1c.2-.1.4-.2.5-.3 4.1 1.9 8.5 1.9 12.5 0 .2.1.4.2.5.3-.7.4-1.4.8-2.2 1.1l.4.6c1.8-.5 3.6-1.2 5.4-2.5.5-5.4-.8-10-2.7-14.2zM9.7 13.5c-1 0-1.9-1-1.9-2.2s.9-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2zm6.6 0c-1 0-1.9-1-1.9-2.2s.9-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2z"/>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

function SiteFooter({ go }) {
  return (
    <footer style={{ borderTop: '1px solid var(--line-soft)', marginTop: 'var(--pad-5)', padding: 'var(--pad-5) 0 var(--pad-3)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 'var(--pad-4)', alignItems: 'flex-start' }}>
          <div>
            <Wordmark/>
            <p style={{ color: 'var(--fg-2)', fontSize: 13, marginTop: 18, maxWidth: 320, lineHeight: 1.6 }}>
              A premium esports tournament platform built for serious teams. Verified results, transparent brackets, Discord-native community.
            </p>
            <button className="btn btn-discord" style={{ marginTop: 18 }} onClick={() => go('discord')}>
              <Icon name="users" size={13}/> Join Discord
            </button>
          </div>
          <div className="link-col">
            <div className="h">Compete</div>
            <a onClick={() => go('tournaments')}>Tournaments</a>
            <a onClick={() => go('bracket')}>Brackets</a>
            <a onClick={() => go('leaderboard')}>Leaderboards</a>
            <a>Open qualifiers</a>
          </div>
          <div className="link-col">
            <div className="h">Platform</div>
            <a onClick={() => go('games')}>Games registry</a>
            <a>Team finder</a>
            <a>Rules &amp; ToS</a>
            <a>Anti-cheat</a>
          </div>
          <div className="link-col">
            <div className="h">Community</div>
            <a onClick={() => go('discord')}>Discord server</a>
            <a>Creator hub</a>
            <a>News</a>
            <a>Code of conduct</a>
          </div>
          <div className="link-col">
            <div className="h">Company</div>
            <a>About</a>
            <a>Organizer tools</a>
            <a>Partnerships</a>
            <a>Status · API</a>
          </div>
        </div>
        <div className="row gap-2" style={{ marginTop: 'var(--pad-4)', paddingTop: 22, borderTop: '1px solid var(--line-soft)' }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.16em' }}>© 2026 ASCENDRA INTERACTIVE</span>
          <span className="spacer"/>
          <span className="row gap-1">
            <span style={{ width: 6, height: 6, background: 'var(--green)', borderRadius: 999 }}/>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.16em' }}>ALL SYSTEMS OPERATIONAL</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { HomeScreen, LiveMatchCard, TournamentCardLarge, GameTile, StatTile, DiscordCard, SiteFooter });
