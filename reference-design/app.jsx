/* app.jsx — Ascendra root */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "hue": 285,
  "density": 1,
  "cardShape": "angled",
  "heroLayout": "split",
  "showGrid": false
}/*EDITMODE-END*/;

function App() {
  const [screen, setScreen] = React.useState('home');
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply tweaks as CSS vars on the root
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--hue', t.hue);
    root.style.setProperty('--density', t.density);
    root.style.setProperty('--cut', t.cardShape === 'sharp' ? '0px' : t.cardShape === 'rounded' ? '0px' : '14px');
  }, [t]);

  const go = React.useCallback((s) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setScreen(s);
  }, []);

  const shellClass = [
    'app-shell',
    `app-shape-${t.cardShape}`,
    t.showGrid ? 'with-grid' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClass} data-screen-label={`Ascendra · ${screen}`}>
      <TopNav active={screen} go={go}/>

      <main style={{ position: 'relative', zIndex: 1 }}>
        {screen === 'home' && <HomeScreen go={go} layout={t.heroLayout}/>}
        {screen === 'tournaments' && <TournamentsScreen go={go}/>}
        {screen === 'tournament-detail' && <TournamentDetailScreen go={go}/>}
        {screen === 'bracket' && <BracketScreen go={go}/>}
        {screen === 'games' && <GamesScreen go={go}/>}
        {screen === 'leaderboard' && <LeaderboardScreen go={go}/>}
        {screen === 'profile' && <ProfileScreen go={go}/>}
        {screen === 'discord' && <DiscordScreen go={go}/>}
        {screen === 'mobile' && <MobileScreen go={go}/>}
      </main>

      <TweaksPanel>
        <TweakSection label="Accent">
          <TweakSlider label="Hue" value={t.hue} min={0} max={360} step={1} unit="°"
                       onChange={(v) => setTweak('hue', v)}/>
          <div className="row gap-1" style={{ marginTop: 6, flexWrap: 'wrap' }}>
            {[
              { label: 'Violet', v: 285 },
              { label: 'Magenta', v: 330 },
              { label: 'Indigo', v: 265 },
              { label: 'Cyan', v: 220 },
              { label: 'Lime', v: 130 },
              { label: 'Amber', v: 60 },
            ].map(p => (
              <button key={p.label} onClick={() => setTweak('hue', p.v)} style={{
                padding: '4px 8px',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.10em',
                background: `oklch(0.70 0.22 ${p.v})`,
                color: 'oklch(0.10 0.02 285)',
                border: '1px solid transparent',
                cursor: 'pointer',
                clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)',
              }}>{p.label}</button>
            ))}
          </div>
        </TweakSection>

        <TweakSection label="Layout">
          <TweakRadio label="Density" value={
            t.density <= 0.85 ? 'compact' : t.density >= 1.15 ? 'comfy' : 'regular'
          } options={['compact', 'regular', 'comfy']} onChange={(v) => setTweak('density', v === 'compact' ? 0.82 : v === 'comfy' ? 1.18 : 1)}/>
          <TweakRadio label="Card shape" value={t.cardShape} options={['sharp', 'angled', 'rounded']}
                      onChange={(v) => setTweak('cardShape', v)}/>
          <TweakRadio label="Hero layout" value={t.heroLayout} options={['split', 'editorial', 'full']}
                      onChange={(v) => setTweak('heroLayout', v)}/>
          <TweakToggle label="Tactical grid" value={t.showGrid}
                       onChange={(v) => setTweak('showGrid', v)}/>
        </TweakSection>

        <TweakSection label="Navigate">
          <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
            {[
              ['home', 'Home'],
              ['tournaments', 'Tournaments'],
              ['tournament-detail', 'T·Detail'],
              ['bracket', 'Bracket'],
              ['games', 'Games'],
              ['leaderboard', 'Leaderboard'],
              ['profile', 'Profile'],
              ['discord', 'Discord'],
              ['mobile', 'Mobile'],
            ].map(([k, l]) => (
              <button key={k} onClick={() => go(k)} style={{
                padding: '5px 9px',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.10em',
                background: screen === k ? 'var(--accent)' : 'transparent',
                color: screen === k ? 'oklch(0.10 0.02 285)' : 'var(--fg-2)',
                border: '1px solid ' + (screen === k ? 'var(--accent)' : 'var(--line-soft)'),
                cursor: 'pointer',
                clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)',
                textTransform: 'uppercase',
              }}>{l}</button>
            ))}
          </div>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

function TopNav({ active, go }) {
  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'tournaments', label: 'Tournaments' },
    { id: 'games', label: 'Games' },
    { id: 'bracket', label: 'Brackets' },
    { id: 'leaderboard', label: 'Leaderboard' },
  ];
  // map sub-screens to their parent tab so the active underline doesn't disappear
  const activeTab = active === 'tournament-detail' ? 'tournaments'
                  : active === 'discord' ? 'home'
                  : active === 'mobile' ? 'home'
                  : active;
  return (
    <nav className="nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="nav-inner">
        <div className="nav-logo" onClick={() => go('home')}>
          <Wordmark/>
        </div>
        <div className="nav-tabs compact">
          {tabs.map(tab => (
            <button key={tab.id}
                    className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => go(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <div className="nav-search">
            <Icon name="search" size={12}/>
            <span>Search teams, players…</span>
            <kbd>⌘K</kbd>
          </div>
          <button className="nav-discord" onClick={() => go('discord')}>
            <Icon name="users" size={13}/> Discord
          </button>
          <button className="nav-icon-btn" title="Notifications">
            <Icon name="bell" size={16}/>
            <span className="badge">3</span>
          </button>
          <div className="nav-avatar" onClick={() => go('profile')}>
            <div className="av">RV</div>
            <div className="meta">
              <span className="h">RAVENOUS</span>
              <span className="s">▲ APEX I · 4218</span>
            </div>
            <Icon name="chevron-down" size={12} className="fg-3"/>
          </div>
        </div>
      </div>
    </nav>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
