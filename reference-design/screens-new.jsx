/* screens-new.jsx — Tournament Detail · Games registry · Discord · Mobile preview */

// ─────────────────────────────────────────────────────────────────────────────
// TOURNAMENT DETAIL
// ─────────────────────────────────────────────────────────────────────────────

function TournamentDetailScreen({ go }) {
  const t = TOURNAMENTS.find(x => x.featured);
  const d = TOURNAMENT_DETAIL;
  const [tab, setTab] = React.useState('overview');

  return (
    <div className="page page-enter">
      {/* HERO */}
      <section className="hero" style={{ minHeight: 560 }}>
        <div className="hero-bg" style={{ backgroundImage: `url(${t.bg})` }}/>
        <div className="hero-content container" style={{ paddingBottom: 36 }}>
          <div className="row gap-1" style={{ marginBottom: 18, cursor: 'pointer' }} onClick={() => go('tournaments')}>
            <Icon name="chevron-right" size={12} style={{ transform: 'rotate(180deg)' }} className="accent"/>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Tournaments / Ascendra Major</span>
          </div>
          <div className="row gap-2" style={{ marginBottom: 18 }}>
            <span className="status s-open">Registration open</span>
            <span className="status">{t.game}</span>
            <span className="status">{t.format}</span>
            <span className="status">{t.region}</span>
          </div>
          <h1 className="title" style={{ fontSize: 'clamp(48px, 6vw, 96px)', maxWidth: 900 }}>{t.name}</h1>
          <p style={{ color: 'var(--fg-1)', fontSize: 17, marginTop: 18, maxWidth: 620, lineHeight: 1.55 }}>
            {t.tagline}. The most prestigious event on the Ascendra calendar — a global field of {t.teams} teams, a {fmtCurrency(t.prize)} purse, broadcast from the Ascendra Arena.
          </p>

          {/* Key stats inline */}
          <div className="row" style={{ marginTop: 36, gap: 'var(--pad-5)' }}>
            <div className="kv">
              <span className="k">Prize pool</span>
              <span className="v big-num" style={{ fontSize: 56, color: 'var(--accent)' }}>{fmtCurrency(t.prize)}</span>
            </div>
            <div className="kv">
              <span className="k">Teams</span>
              <span className="v big-num" style={{ fontSize: 56 }}>{t.registered}<span className="fg-3">/{t.teams}</span></span>
            </div>
            <div className="kv">
              <span className="k">Starts in</span>
              <span className="v big-num tabular" style={{ fontSize: 56 }}>21<span className="fg-3" style={{ fontSize: 22, marginLeft: 8 }}>days</span></span>
            </div>
          </div>

          <div className="row gap-2" style={{ marginTop: 32 }}>
            <button className="btn btn-accent btn-lg">
              Register team <Icon name="chevron-right" size={14}/>
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => go('bracket')}>
              <Icon name="play" size={12}/> View bracket
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => go('discord')}>
              <Icon name="users" size={13}/> Tournament Discord
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--line-soft)', background: 'oklch(0.08 0.025 285 / 0.6)', position: 'sticky', top: 60, zIndex: 10, backdropFilter: 'blur(10px)' }}>
        <div className="container row gap-1">
          {['overview', 'schedule', 'teams', 'prizes', 'rules'].map(k => (
            <button key={k} onClick={() => setTab(k)} className={`nav-tab ${tab === k ? 'active' : ''}`} style={{ padding: '14px 18px' }}>
              {k}
            </button>
          ))}
          <span className="spacer"/>
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.14em', alignSelf: 'center' }}>
            <span style={{ color: 'var(--accent)' }}>●</span> &nbsp; 28/32 TEAMS LOCKED
          </span>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 'var(--pad-4)' }}>
        {tab === 'overview' && <OverviewTab t={t} d={d}/>}
        {tab === 'schedule' && <ScheduleTab schedule={d.schedule}/>}
        {tab === 'teams' && <TeamsTab teams={d.acceptedTeams} pending={d.pendingTeams}/>}
        {tab === 'prizes' && <PrizesTab prizes={d.prizes} total={t.prize}/>}
        {tab === 'rules' && <RulesTab rules={d.rules}/>}
      </div>
    </div>
  );
}

function OverviewTab({ t, d }) {
  const champion = d.prizes[0];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--pad-3)' }}>
      <div>
        <div className="rule" style={{ marginBottom: 'var(--pad-3)' }}><span className="label">▲ The Major · summary</span></div>
        <h2 className="title-2" style={{ fontSize: 26, lineHeight: 1.1, marginBottom: 18 }}>
          Three weeks of qualifying. One weekend of finals.<br/>
          <span style={{ color: 'var(--fg-2)' }}>One crown.</span>
        </h2>
        <p style={{ color: 'var(--fg-1)', fontSize: 15, lineHeight: 1.65, maxWidth: 620 }}>
          The Ascendra Major closes Season 7 with the largest prize pool in platform history.
          Sixteen invited teams take their seats automatically; the other sixteen earn them through
          open qualifiers across four regions. The bracket runs double-elimination — every match is
          a best-of-five from quarterfinals on.
        </p>
        <p style={{ color: 'var(--fg-1)', fontSize: 15, lineHeight: 1.65, marginTop: 14, maxWidth: 620 }}>
          Match results pull directly from the publisher API, so what you see on the bracket is what
          really happened on the server. No disputed scoreboards, no screenshot wars.
        </p>

        {/* The card schedule */}
        <div style={{ marginTop: 'var(--pad-4)' }}>
          <div className="rule" style={{ marginBottom: 'var(--pad-3)' }}><span className="label">▲ Timeline</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {d.schedule.slice(0, 3).map((s, i) => <ScheduleRow key={i} s={s}/>)}
          </div>
        </div>
      </div>

      {/* Right rail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pad-2)' }}>
        {/* Registration card */}
        <div className="card card-bordered" style={{ padding: 'var(--pad-3)', position: 'relative' }}>
          <div className="corner-mark"/>
          <div className="eyebrow"><span className="dot">▲</span> Registration · 4 slots left</div>
          <div className="title-2" style={{ fontSize: 22, marginTop: 8, marginBottom: 14 }}>Get your team in</div>
          <div style={{ height: 4, background: 'var(--bg-2)', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${(t.registered/t.teams)*100}%`, background: 'linear-gradient(90deg, var(--accent), oklch(0.85 0.10 245))' }}/>
          </div>
          <div className="row mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.12em', marginBottom: 18 }}>
            <span>{t.registered}/{t.teams} LOCKED</span>
            <span className="spacer"/>
            <span className="accent">{Math.round((t.registered/t.teams)*100)}%</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.55, margin: 0 }}>
            Roster of five plus one sub. Account verification through publisher API. Entry is free for ranked teams.
          </p>
          <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}>
            Register team <Icon name="chevron-right" size={12}/>
          </button>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
            <Icon name="users" size={12}/> Find teammates
          </button>
        </div>

        {/* Champion purse */}
        <div className="card card-bordered" style={{ padding: 'var(--pad-3)', position: 'relative', background: 'linear-gradient(180deg, oklch(0.18 0.10 var(--hue) / 0.5) 0%, oklch(0.11 0.04 285) 100%)' }}>
          <div className="corner-mark"/>
          <div className="row gap-1" style={{ marginBottom: 14 }}>
            <Icon name="crown" size={14} style={{ color: 'var(--gold)' }}/>
            <span className="mono" style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.18em' }}>CHAMPION'S PURSE</span>
          </div>
          <div className="big-num" style={{ fontSize: 60, color: 'var(--fg-0)' }}>{fmtCurrency(champion.amount)}</div>
          <p style={{ fontSize: 12, color: 'var(--fg-2)', margin: '12px 0 0' }}>
            56% of the prize pool. Sponsor seats, a feature on the Ascendra hall of fame, and an automatic seed in next year's Major.
          </p>
        </div>

        {/* Stream embed placeholder */}
        <div className="card card-bordered" style={{ padding: 0, position: 'relative', overflow: 'hidden', aspectRatio: '16/10' }}>
          <div className="corner-mark"/>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(assets/games/valorant.webp)`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.55 }}/>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, oklch(0.07 0.025 285 / 0.95) 100%)' }}/>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <div style={{
              width: 64, height: 64,
              background: 'var(--accent)',
              display: 'grid', placeItems: 'center',
              clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
              boxShadow: '0 0 32px var(--accent-glow)',
            }}>
              <Icon name="play" size={28} style={{ color: 'oklch(0.10 0.02 285)' }}/>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
            <span className="status s-live">LIVE QUALIFIER</span>
            <div style={{ color: 'var(--fg-0)', fontSize: 14, fontWeight: 600, marginTop: 8, fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
              NVX vs OBLK · Map 3 · Ascent
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleTab({ schedule }) {
  return (
    <div style={{ maxWidth: 920 }}>
      <div className="rule" style={{ marginBottom: 'var(--pad-3)' }}><span className="label">▲ Full schedule</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {schedule.map((s, i) => <ScheduleRow key={i} s={s} index={i + 1}/>)}
      </div>
    </div>
  );
}

function ScheduleRow({ s, index }) {
  const statusClass = s.status === 'open' ? 's-open' : s.status === 'live' ? 's-live' : 's-soon';
  return (
    <div className="card card-bordered" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 'var(--pad-3)', position: 'relative' }}>
      <div className="corner-mark"/>
      {index != null && <div className="big-num" style={{ fontSize: 32, color: 'var(--accent)', minWidth: 36, lineHeight: 1 }}>0{index}</div>}
      <div style={{ flex: 1 }}>
        <div className="row gap-2" style={{ marginBottom: 4 }}>
          <span className="title-3" style={{ fontSize: 16 }}>{s.phase}</span>
          <span className={`status ${statusClass}`}>{s.status === 'open' ? 'Live' : s.status}</span>
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.12em' }}>{s.date.toUpperCase()}</div>
        <p style={{ color: 'var(--fg-2)', fontSize: 13, margin: '8px 0 0', lineHeight: 1.5 }}>{s.desc}</p>
      </div>
    </div>
  );
}

function TeamsTab({ teams, pending }) {
  return (
    <div>
      <div className="row" style={{ marginBottom: 'var(--pad-3)' }}>
        <div>
          <div className="rule"><span className="label">▲ Accepted teams</span></div>
        </div>
        <span className="spacer"/>
        <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.14em' }}>
          {teams.length} ACCEPTED · {pending} PENDING REVIEW
        </span>
      </div>
      <div className="grid grid-3" style={{ gap: 'var(--pad-2)' }}>
        {teams.map(t => (
          <div key={t.tag} className="card card-bordered" style={{ padding: '18px 20px', position: 'relative', cursor: 'pointer' }}>
            <div className="corner-mark"/>
            <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
              <Avatar player={{ handle: t.tag, avatarHue: t.color }} size={48}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row gap-1">
                  <span className="title-3" style={{ fontSize: 15 }}>{t.name}</span>
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 4, letterSpacing: '0.12em' }}>{t.tag} · {t.region}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.14em' }}>SEED</div>
                <div className="display tabular" style={{ fontSize: 22, color: 'var(--accent)', marginTop: 2 }}>{String(t.seed).padStart(2, '0')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {pending > 0 && (
        <div style={{ marginTop: 'var(--pad-3)' }}>
          <div className="rule"><span className="label">▲ Pending review</span></div>
          <div className="grid grid-3" style={{ gap: 'var(--pad-2)', marginTop: 'var(--pad-3)' }}>
            {Array.from({ length: pending }).map((_, i) => (
              <div key={i} className="card card-bordered" style={{ padding: '18px 20px', position: 'relative', borderStyle: 'dashed', opacity: 0.6 }}>
                <div className="row gap-2">
                  <div style={{ width: 48, height: 48, background: 'var(--bg-2)', border: '1px dashed var(--line)', clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}/>
                  <div style={{ flex: 1 }}>
                    <div className="title-3" style={{ fontSize: 15, color: 'var(--fg-2)' }}>Awaiting verification</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 4, letterSpacing: '0.12em' }}>SUBMITTED {2 + i}H AGO</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PrizesTab({ prizes, total }) {
  return (
    <div style={{ maxWidth: 920 }}>
      <div className="row" style={{ marginBottom: 'var(--pad-3)' }}>
        <div>
          <div className="rule"><span className="label">▲ Prize distribution</span></div>
        </div>
        <span className="spacer"/>
        <div className="kv" style={{ alignItems: 'flex-end' }}>
          <span className="k">Pool</span>
          <span className="v big-num" style={{ fontSize: 38, color: 'var(--accent)' }}>{fmtCurrency(total)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {prizes.map((p, i) => {
          const pct = (p.amount / total) * 100;
          return (
            <div key={i} className="card card-bordered" style={{ padding: '20px 24px', position: 'relative' }}>
              <div className="corner-mark"/>
              <div className="row gap-3" style={{ alignItems: 'center' }}>
                <div style={{
                  width: 72,
                  textAlign: 'center',
                }}>
                  <div className="big-num" style={{ fontSize: 36, color: i === 0 ? 'var(--gold)' : i === 1 ? 'oklch(0.78 0.04 290)' : i === 2 ? 'oklch(0.62 0.10 50)' : 'var(--fg-2)', lineHeight: 1 }}>
                    {p.place}
                  </div>
                  {i === 0 && <Icon name="crown" size={16} style={{ color: 'var(--gold)', marginTop: 4 }}/>}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="title-3" style={{ fontSize: 16 }}>{p.label}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 4, letterSpacing: '0.12em' }}>{pct.toFixed(1)}% OF POOL</div>
                  <div style={{ height: 3, background: 'var(--bg-2)', marginTop: 12, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? 'var(--gold)' : 'var(--accent)' }}/>
                  </div>
                </div>
                <div className="big-num tabular" style={{ fontSize: 40, color: 'var(--fg-0)' }}>{fmtCurrency(p.amount)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RulesTab({ rules }) {
  return (
    <div style={{ maxWidth: 820 }}>
      <div className="rule" style={{ marginBottom: 'var(--pad-4)' }}><span className="label">▲ Competitive ruleset · Season 7</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pad-4)' }}>
        {rules.map(r => (
          <div key={r.n} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 'var(--pad-3)', paddingBottom: 'var(--pad-3)', borderBottom: '1px solid var(--line-soft)' }}>
            <div className="big-num accent" style={{ fontSize: 40, lineHeight: 1 }}>0{r.n}</div>
            <div>
              <div className="title-3" style={{ fontSize: 17, marginBottom: 10 }}>{r.h}</div>
              <p style={{ color: 'var(--fg-1)', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{r.t}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'var(--pad-4)', padding: 'var(--pad-3)', background: 'oklch(0.20 0.10 var(--hue) / 0.10)', border: '1px solid var(--accent-dim)' }}>
        <div className="row gap-2">
          <Icon name="shield" size={20} className="accent"/>
          <div>
            <div className="title-3" style={{ fontSize: 14, marginBottom: 4 }}>Full code of conduct</div>
            <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>Read the complete ruleset, anti-cheat policy, and broadcast guidelines.</div>
          </div>
          <span className="spacer"/>
          <button className="btn btn-sm">Open document</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GAMES REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

function GamesScreen({ go }) {
  return (
    <div className="page page-enter">
      <section className="hero" style={{ minHeight: 360 }}>
        <div className="hero-bg" style={{ backgroundImage: `url(assets/backgrounds/tournaments-hero.webp)`, opacity: 0.7 }}/>
        <div className="hero-content container" style={{ paddingBottom: 36 }}>
          <div className="eyebrow" style={{ marginBottom: 18 }}><span className="dot">▲</span> COMPETITIVE TITLES · {GAMES.length} SUPPORTED</div>
          <h1 className="title">Games registry</h1>
          <p style={{ color: 'var(--fg-1)', fontSize: 16, maxWidth: 580, marginTop: 18, lineHeight: 1.55 }}>
            Every supported title runs on verified publisher API integration. Match results, rosters and statistics pull directly from the source.
          </p>
        </div>
      </section>

      <div className="container" style={{ paddingTop: 'var(--pad-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pad-3)' }}>
          {GAMES.map((g, i) => <GameRow key={g.id} g={g} index={i + 1} onClick={() => go('tournaments')}/>)}
        </div>

        {/* Coming soon */}
        <div style={{ marginTop: 'var(--pad-5)' }}>
          <div className="rule" style={{ marginBottom: 'var(--pad-3)' }}><span className="label">▲ On the roadmap</span></div>
          <div className="grid grid-4" style={{ gap: 'var(--pad-2)' }}>
            {['Rocket League', 'Apex Legends', 'Street Fighter 6', 'Tekken 8'].map(name => (
              <div key={name} className="card card-bordered" style={{ padding: '20px 22px', position: 'relative', opacity: 0.7 }}>
                <div className="corner-mark"/>
                <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.18em' }}>COMING · Q3 2026</div>
                <div className="title-3" style={{ fontSize: 16, marginTop: 8 }}>{name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GameRow({ g, index, onClick }) {
  const dotColor = g.integrationStatus === 'connected' ? 'var(--green)' : 'var(--gold)';
  return (
    <div className="card card-bordered" onClick={onClick} style={{ padding: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer', minHeight: 180 }}>
      <div className="corner-mark"/>
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', minHeight: 180 }}>
        {/* Art */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${g.art})`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, var(--bg-1) 100%)' }}/>
          <div style={{ position: 'absolute', top: 14, left: 14 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-2)', letterSpacing: '0.18em', padding: '4px 8px', background: 'oklch(0 0 0 / 0.5)', backdropFilter: 'blur(8px)' }}>{String(index).padStart(2, '0')} · {g.publisher.toUpperCase()}</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 'var(--pad-3) var(--pad-4)', display: 'flex', flexDirection: 'column' }}>
          <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div className="row gap-2" style={{ marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.18em' }}>{g.genre.toUpperCase()} · {g.teamSize}</span>
                <span className="row gap-1" style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>
                  <span style={{ width: 6, height: 6, background: dotColor, borderRadius: 999 }}/>
                  {g.integration.toUpperCase()}
                </span>
              </div>
              <div className="title-2" style={{ fontSize: 32, lineHeight: 1 }}>{g.name}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 10, letterSpacing: '0.10em' }}>
                {g.modes.map(m => m.toUpperCase()).join(' · ')}
              </div>
            </div>

            <div className="row gap-4" style={{ alignItems: 'flex-start' }}>
              <div className="kv" style={{ alignItems: 'flex-end' }}>
                <span className="k">Active</span>
                <span className="v" style={{ color: 'var(--danger)' }}>{g.active}</span>
              </div>
              <div className="kv" style={{ alignItems: 'flex-end' }}>
                <span className="k">Upcoming</span>
                <span className="v">{g.upcoming}</span>
              </div>
              <div className="kv" style={{ alignItems: 'flex-end' }}>
                <span className="k">Players</span>
                <span className="v">{g.players}</span>
              </div>
            </div>
          </div>

          <div className="row gap-2" style={{ marginTop: 'auto', paddingTop: 18 }}>
            <button className="btn btn-sm">View tournaments <Icon name="chevron-right" size={12}/></button>
            <button className="btn btn-sm btn-ghost">Leaderboard</button>
            <span className="spacer"/>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.14em' }}>SEASON 07</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCORD SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function DiscordScreen({ go }) {
  return (
    <div className="page page-enter">
      <section className="hero" style={{ minHeight: 460 }}>
        <div className="hero-bg" style={{
          backgroundImage: `url(assets/backgrounds/community-hero.webp)`,
          opacity: 0.55,
        }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 50%, oklch(0.42 0.20 270 / 0.30), transparent 60%)' }}/>
        <div className="hero-content container" style={{ paddingBottom: 36, position: 'relative' }}>
          <div className="row gap-2" style={{ marginBottom: 18, alignItems: 'center' }}>
            <DiscordGlyph/>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)', letterSpacing: '0.18em' }}>COMMUNITY · DISCORD-NATIVE</span>
          </div>
          <h1 className="title">The Ascendra<br/>
            <span style={{ background: 'linear-gradient(92deg, oklch(0.72 0.20 270) 0%, var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Discord.</span>
          </h1>
          <p style={{ color: 'var(--fg-1)', fontSize: 17, maxWidth: 560, marginTop: 22, lineHeight: 1.55 }}>
            Your team's home base. Live tournament rooms spin up automatically. Ticket-bot disputes. Looking-for-game pings. One server, every match.
          </p>
          <div className="row gap-2" style={{ marginTop: 32 }}>
            <button className="btn btn-discord btn-lg">
              <Icon name="users" size={14}/> Join the server
            </button>
            <button className="btn btn-ghost btn-lg">View server preview</button>
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingTop: 'var(--pad-4)' }}>
        {/* Stats strip */}
        <div className="grid grid-4" style={{ gap: 'var(--pad-2)' }}>
          <StatTile k="Members" v="184.2K" sub="↑ 14K this month"/>
          <StatTile k="Online now" v="28.4K" sub="Peak today: 31.2K"/>
          <StatTile k="Matches today" v="3.2K" sub="Auto-routed by bot"/>
          <StatTile k="Open tickets" v="12" sub="Avg resolution: 4m"/>
        </div>

        {/* What the bot does */}
        <div style={{ marginTop: 'var(--pad-5)' }}>
          <div className="rule" style={{ marginBottom: 'var(--pad-3)' }}><span className="label">▲ Bot-powered features</span></div>
          <div className="grid grid-2" style={{ gap: 'var(--pad-2)' }}>
            {[
              { h: 'Tournament rooms on demand', t: 'When a match is scheduled, the bot spins up a private voice + text channel for both teams and a referee. Channel deletes itself 30 minutes after match end.' },
              { h: 'Match dispute tickets', t: 'Type /dispute in any match channel to open a moderated ticket. Replays, screenshots and chat logs auto-attach. Average resolution time: 4 minutes.' },
              { h: 'Looking-for-game pings', t: 'Tag a role to ping only players in your region, rank tier, and game. No more @everyone spam.' },
              { h: 'Roles after team approval', t: 'When your team is verified, the bot assigns roles automatically — team tag, tournament access, organizer permissions if applicable.' },
            ].map((f, i) => (
              <div key={i} className="card card-bordered" style={{ padding: '24px 26px', position: 'relative' }}>
                <div className="corner-mark"/>
                <div className="big-num accent" style={{ fontSize: 36, marginBottom: 14 }}>0{i + 1}</div>
                <div className="title-3" style={{ fontSize: 17, marginBottom: 10 }}>{f.h}</div>
                <p style={{ color: 'var(--fg-1)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{f.t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Channels list */}
        <div style={{ marginTop: 'var(--pad-5)' }}>
          <div className="rule" style={{ marginBottom: 'var(--pad-3)' }}><span className="label">▲ Featured channels</span></div>
          <div className="card card-bordered" style={{ padding: 0 }}>
            <div className="corner-mark"/>
            {DISCORD.channels.map((c, i) => (
              <div key={c.name} className="row gap-3" style={{ padding: '18px 24px', borderTop: i ? '1px solid var(--line-soft)' : '0' }}>
                <span className="mono" style={{ fontSize: 14, color: 'var(--fg-3)' }}>#</span>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--fg-0)', letterSpacing: '0.04em' }}>{c.name}</div>
                <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.12em' }}>{c.role.toUpperCase()}</span>
                <span className="spacer"/>
                <span className="mono tabular" style={{ fontSize: 12, color: 'var(--fg-2)' }}>{c.members.toLocaleString()} members</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE PREVIEW
// ─────────────────────────────────────────────────────────────────────────────

function MobileScreen({ go }) {
  return (
    <div className="page page-enter">
      <section style={{ padding: 'var(--pad-5) 0 var(--pad-3)' }}>
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: 14 }}><span className="dot">▲</span> RESPONSIVE · NATIVELY MOBILE</div>
          <h1 className="title" style={{ fontSize: 'clamp(40px, 5vw, 76px)' }}>Mobile</h1>
          <p style={{ color: 'var(--fg-1)', fontSize: 16, maxWidth: 560, marginTop: 16, lineHeight: 1.55 }}>
            Six key flows on phone — not a compressed desktop. Bottom tab bar, large hit targets, single-column tournament cards, swipeable matches.
          </p>
        </div>
      </section>

      <div style={{ overflowX: 'auto', padding: 'var(--pad-3) 0 var(--pad-5)' }}>
        <div className="container row gap-3" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', minWidth: 'fit-content' }}>
          <PhoneFrame label="Home"><PhoneHome/></PhoneFrame>
          <PhoneFrame label="Tournaments"><PhoneTournaments/></PhoneFrame>
          <PhoneFrame label="Tournament detail"><PhoneDetail/></PhoneFrame>
          <PhoneFrame label="Games"><PhoneGames/></PhoneFrame>
          <PhoneFrame label="Profile"><PhoneProfile/></PhoneFrame>
          <PhoneFrame label="Discord"><PhoneDiscord/></PhoneFrame>
        </div>
      </div>
    </div>
  );
}

function PhoneFrame({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div className="phone-shell">
        <div className="phone-screen">
          <div className="phone-notch"/>
          {children}
          <PhoneTabbar/>
        </div>
      </div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--fg-2)', letterSpacing: '0.18em' }}>▲ {label.toUpperCase()}</div>
    </div>
  );
}

function PhoneStatusBar() {
  return (
    <div className="phone-status">
      <span className="tabular">9:41</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)' }}>●●●● 5G</span>
    </div>
  );
}

function PhoneTabbar() {
  const tabs = [
    { i: 'compass', l: 'Home', active: true },
    { i: 'trophy', l: 'Events' },
    { i: 'controller', l: 'Games' },
    { i: 'medal', l: 'Ladder' },
    { i: 'shield', l: 'Me' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'oklch(0.07 0.025 285 / 0.92)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--line-soft)',
      padding: '8px 6px 22px',
      display: 'flex', justifyContent: 'space-around',
      zIndex: 5,
    }}>
      {tabs.map(t => (
        <div key={t.l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 8px', color: t.active ? 'var(--accent)' : 'var(--fg-3)' }}>
          <Icon name={t.i} size={18}/>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase' }}>{t.l}</span>
        </div>
      ))}
    </div>
  );
}

// ── Phone screen content ────────────────────────────────────────────────────

function PhoneHome() {
  const hero = TOURNAMENTS.find(t => t.featured);
  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <PhoneStatusBar/>
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 16px 90px' }}>
        {/* Hero */}
        <div style={{ position: 'relative', height: 260, marginTop: 14, overflow: 'hidden', clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${hero.bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, oklch(0.07 0.025 285 / 0.96) 100%)' }}/>
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            <span className="status s-open" style={{ fontSize: 9 }}>Registration</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--fg-0)', marginTop: 10, lineHeight: 1.1, fontWeight: 700, textTransform: 'uppercase' }}>Ascendra Major</div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', marginTop: 4, letterSpacing: '0.14em' }}>$1.25M · 32 TEAMS · 21 DAYS</div>
          </div>
        </div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '14px 16px' }}>Register team</button>

        {/* Live now */}
        <div className="row" style={{ marginTop: 22, marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--fg-0)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Live now</span>
          <span className="spacer"/>
          <span className="mono accent" style={{ fontSize: 9, letterSpacing: '0.14em' }}>3 MATCHES →</span>
        </div>
        {LIVE_MATCHES.slice(0, 2).map(m => (
          <div key={m.id} className="card card-bordered" style={{ padding: '12px 14px', marginBottom: 8, position: 'relative' }}>
            <div className="row gap-2" style={{ marginBottom: 6 }}>
              <span className="status s-live" style={{ fontSize: 9 }}>LIVE</span>
              <span className="mono" style={{ fontSize: 9, color: 'var(--fg-3)' }}>{(m.viewers/1000).toFixed(1)}K viewing</span>
            </div>
            <div className="row gap-2">
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--fg-0)', fontWeight: 600, flex: 1 }}>{m.teamA.tag}</span>
              <span className="display tabular" style={{ fontSize: 18, color: m.teamA.score > m.teamB.score ? 'var(--accent)' : 'var(--fg-2)' }}>{m.teamA.score}</span>
            </div>
            <div className="row gap-2" style={{ marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--fg-0)', fontWeight: 600, flex: 1 }}>{m.teamB.tag}</span>
              <span className="display tabular" style={{ fontSize: 18, color: m.teamB.score > m.teamA.score ? 'var(--accent)' : 'var(--fg-2)' }}>{m.teamB.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneTournaments() {
  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <PhoneStatusBar/>
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--fg-0)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Tournaments</div>
        <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.18em', marginTop: 4 }}>14 ACTIVE · 6 OPEN</div>
      </div>
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {['All', 'Valorant', 'CS2', 'LoL', 'Dota'].map((f, i) => (
          <span key={f} style={{ padding: '6px 12px', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', background: i === 0 ? 'var(--accent)' : 'var(--bg-2)', color: i === 0 ? 'oklch(0.10 0.02 285)' : 'var(--fg-2)', border: '1px solid var(--line-soft)', whiteSpace: 'nowrap' }}>{f}</span>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: '14px 16px 90px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TOURNAMENTS.slice(0, 4).map(t => (
          <div key={t.id} className="card card-bordered" style={{ padding: 0, position: 'relative', overflow: 'hidden', minHeight: 130 }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${t.bg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.85 }}/>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 20%, oklch(0.07 0.025 285 / 0.95) 100%)' }}/>
            <div style={{ position: 'relative', padding: 14, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <span className={`status ${t.status === 'Live' ? 's-live' : 's-open'}`} style={{ alignSelf: 'flex-start', fontSize: 9 }}>{t.status === 'Live' ? 'LIVE' : 'Open'}</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--fg-0)', marginTop: 8, lineHeight: 1.1, fontWeight: 700, textTransform: 'uppercase' }}>{t.name}</div>
              <div className="row gap-3" style={{ marginTop: 8 }}>
                <span className="mono accent" style={{ fontSize: 10 }}>{fmtCurrency(t.prize)}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--fg-2)' }}>{t.registered}/{t.teams}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--fg-2)' }}>{t.game}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneDetail() {
  const t = TOURNAMENTS.find(x => x.featured);
  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: 220, flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${t.bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, var(--bg-0) 100%)' }}/>
        <PhoneStatusBar/>
        <div style={{ position: 'absolute', top: 50, left: 16 }}>
          <Icon name="chevron-right" size={20} style={{ transform: 'rotate(180deg)', color: 'var(--fg-0)' }}/>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 16px 90px', marginTop: -50, position: 'relative' }}>
        <span className="status s-open" style={{ fontSize: 9 }}>Registration · 4 left</span>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--fg-0)', marginTop: 8, lineHeight: 1, fontWeight: 700, textTransform: 'uppercase' }}>{t.name}</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-2)', marginTop: 6, letterSpacing: '0.10em' }}>{t.tagline}</div>

        <div className="row" style={{ marginTop: 18, justifyContent: 'space-between' }}>
          <div className="kv"><span className="k" style={{ fontSize: 9 }}>Prize</span><span className="v" style={{ fontSize: 18, color: 'var(--accent)' }}>{fmtCurrency(t.prize)}</span></div>
          <div className="kv"><span className="k" style={{ fontSize: 9 }}>Teams</span><span className="v" style={{ fontSize: 18 }}>{t.registered}/{t.teams}</span></div>
          <div className="kv"><span className="k" style={{ fontSize: 9 }}>Starts</span><span className="v" style={{ fontSize: 18 }}>21d</span></div>
        </div>

        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '14px' }}>Register team</button>

        <div className="row gap-1" style={{ marginTop: 18, borderBottom: '1px solid var(--line-soft)' }}>
          {['Overview', 'Schedule', 'Teams', 'Prizes'].map((tab, i) => (
            <span key={tab} style={{ padding: '10px 6px', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: i === 0 ? 'var(--fg-0)' : 'var(--fg-3)', borderBottom: i === 0 ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1 }}>{tab}</span>
          ))}
        </div>

        <p style={{ color: 'var(--fg-1)', fontSize: 12, lineHeight: 1.6, marginTop: 12 }}>
          The most prestigious event on the Ascendra calendar. Open qualifier through to grand final on the Ascendra Arena stream.
        </p>
      </div>
    </div>
  );
}

function PhoneGames() {
  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <PhoneStatusBar/>
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--fg-0)', textTransform: 'uppercase' }}>Games</div>
        <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.18em', marginTop: 4 }}>5 TITLES · ALL VERIFIED</div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: '14px 16px 90px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignContent: 'flex-start' }}>
        {GAMES.map(g => (
          <div key={g.id} className="card card-bordered" style={{ padding: 0, position: 'relative', overflow: 'hidden', aspectRatio: '3/4' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${g.art})`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, oklch(0.07 0.025 285 / 0.96) 100%)' }}/>
            <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--fg-0)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1.1 }}>{g.name}</div>
              <div className="mono accent" style={{ fontSize: 9, marginTop: 4, letterSpacing: '0.12em' }}>{g.active} LIVE · {g.upcoming} SOON</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneProfile() {
  const me = PROFILE_ME;
  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: 200, flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(assets/backgrounds/profile-hero.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, var(--bg-0) 100%)' }}/>
        <PhoneStatusBar/>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 16px 90px', marginTop: -60, position: 'relative' }}>
        <Avatar player={me} size={84}/>
        <div className="row gap-1" style={{ marginTop: 10, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--fg-0)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{me.handle}</span>
        </div>
        <div className="row gap-2" style={{ marginTop: 8 }}>
          <span className="status s-open" style={{ fontSize: 9 }}>#01 Global</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{me.tag} · {me.role.toUpperCase()}</span>
        </div>
        <div className="grid grid-3" style={{ gap: 8, marginTop: 18 }}>
          <div className="kv"><span className="k" style={{ fontSize: 9 }}>MMR</span><span className="v" style={{ fontSize: 18, color: 'var(--accent)' }}>{me.elo}</span></div>
          <div className="kv"><span className="k" style={{ fontSize: 9 }}>K/D</span><span className="v" style={{ fontSize: 18 }}>{me.kd}</span></div>
          <div className="kv"><span className="k" style={{ fontSize: 9 }}>Win %</span><span className="v" style={{ fontSize: 18 }}>{me.wr}</span></div>
        </div>

        <div className="row gap-2" style={{ marginTop: 18 }}>
          <button className="btn btn-sm btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Challenge</button>
          <button className="btn btn-sm btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Add friend</button>
        </div>

        <div className="rule" style={{ marginTop: 22 }}><span className="label">▲ Recent</span></div>
        {MATCH_HISTORY.slice(0, 3).map((m, i) => (
          <div key={i} className="row gap-2" style={{ padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
            <span style={{ width: 24, height: 24, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: m.result === 'W' ? 'var(--accent)' : 'var(--danger)', background: m.result === 'W' ? 'oklch(0.20 0.12 var(--hue) / 0.20)' : 'oklch(0.25 0.18 25 / 0.15)', fontWeight: 700, border: '1px solid ' + (m.result === 'W' ? 'var(--accent-dim)' : 'oklch(0.50 0.20 25 / 0.4)') }}>{m.result}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--fg-0)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{m.score} vs {m.oppTag}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.08em' }}>{m.map.toUpperCase()} · {m.when.toUpperCase()}</div>
            </div>
            <Delta value={m.delta}/>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneDiscord() {
  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <PhoneStatusBar/>
      <div style={{ padding: '14px 16px 0' }}>
        <DiscordGlyph/>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--fg-0)', marginTop: 12, lineHeight: 1.1, textTransform: 'uppercase' }}>The Ascendra<br/><span style={{ background: 'linear-gradient(92deg, oklch(0.72 0.20 270) 0%, var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Discord</span></div>
        <p style={{ color: 'var(--fg-1)', fontSize: 12, lineHeight: 1.55, marginTop: 12 }}>
          184K members. Match rooms spin up automatically. Disputes, LFG and tournament announcements — all in one server.
        </p>
        <button className="btn btn-discord" style={{ width: '100%', justifyContent: 'center', marginTop: 14, padding: '12px' }}>
          <Icon name="users" size={13}/> Join server
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '18px 16px 90px' }}>
        <div className="grid grid-2" style={{ gap: 8 }}>
          {[{k: 'Members', v: '184K'}, {k: 'Online', v: '28.4K'}, {k: 'Matches', v: '3.2K'}, {k: 'Tickets', v: '12'}].map(s => (
            <div key={s.k} className="card card-bordered" style={{ padding: 12 }}>
              <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.16em' }}>{s.k.toUpperCase()}</div>
              <div className="display tabular" style={{ fontSize: 22, color: 'var(--fg-0)', marginTop: 4 }}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="rule" style={{ marginTop: 16 }}><span className="label">▲ Channels</span></div>
        {DISCORD.channels.slice(0, 3).map(c => (
          <div key={c.name} className="row gap-2" style={{ padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
            <span className="mono fg-3">#</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--fg-0)' }}>{c.name}</span>
            <span className="spacer"/>
            <span className="mono tabular" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{(c.members/1000).toFixed(1)}K</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  TournamentDetailScreen, GamesScreen, DiscordScreen, MobileScreen,
});
