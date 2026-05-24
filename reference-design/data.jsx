/* data.jsx — mock data for Ascendra prototype */

const TEAM_TAGS = ['NVX', 'OBLK', 'CRSH', 'VRGE', 'AXIS', 'NTRL', 'PHNX', 'ZRO', 'WLKR', 'KRMA', 'GHOST', 'SVGE', 'AURA', 'RVNT', 'HVN', 'STRM'];

const PLAYERS = [
  { handle: 'Ravenous', tag: 'NVX', rank: 'Apex I', elo: 4218, region: 'NA-East', country: '🇺🇸', game: 'Valorant', kd: 1.84, wr: 71, role: 'Duelist', avatarHue: 295, isMe: true },
  { handle: 'Kairoshi', tag: 'OBLK', rank: 'Apex I', elo: 4192, region: 'JP', country: '🇯🇵', game: 'Valorant', kd: 1.92, wr: 74, role: 'Initiator', avatarHue: 200 },
  { handle: 'NyxVoid',  tag: 'CRSH', rank: 'Apex II', elo: 4087, region: 'EU-W', country: '🇩🇪', game: 'Valorant', kd: 1.71, wr: 68, role: 'Controller', avatarHue: 320 },
  { handle: 'Vortexx',  tag: 'VRGE', rank: 'Apex II', elo: 4051, region: 'EU-W', country: '🇫🇷', game: 'Valorant', kd: 1.63, wr: 66, role: 'Sentinel', avatarHue: 260 },
  { handle: 'Cinderfall',tag: 'AXIS', rank: 'Apex II', elo: 3998, region: 'NA-West', country: '🇨🇦', game: 'Valorant', kd: 1.58, wr: 63, role: 'Duelist', avatarHue: 30 },
  { handle: 'Holloway', tag: 'NTRL', rank: 'Apex III', elo: 3942, region: 'KR', country: '🇰🇷', game: 'Valorant', kd: 1.55, wr: 64, role: 'Initiator', avatarHue: 150 },
  { handle: 'Sablewing',tag: 'PHNX', rank: 'Apex III', elo: 3901, region: 'BR', country: '🇧🇷', game: 'Valorant', kd: 1.52, wr: 61, role: 'Controller', avatarHue: 100 },
  { handle: 'Ozric',    tag: 'ZRO',  rank: 'Apex III', elo: 3877, region: 'EU-E', country: '🇸🇪', game: 'Valorant', kd: 1.49, wr: 60, role: 'Sentinel', avatarHue: 60 },
  { handle: 'Mavryx',   tag: 'WLKR', rank: 'Apex IV',  elo: 3812, region: 'NA-East', country: '🇲🇽', game: 'Valorant', kd: 1.46, wr: 59, role: 'Duelist', avatarHue: 220 },
  { handle: 'Tenebra',  tag: 'KRMA', rank: 'Apex IV',  elo: 3789, region: 'AU', country: '🇦🇺', game: 'Valorant', kd: 1.44, wr: 58, role: 'Initiator', avatarHue: 340 },
  { handle: 'Quillstrike', tag: 'GHOST', rank: 'Apex IV', elo: 3741, region: 'EU-W', country: '🇬🇧', game: 'Valorant', kd: 1.42, wr: 57, role: 'Controller', avatarHue: 190 },
  { handle: 'Pyresoul', tag: 'SVGE', rank: 'Apex IV',  elo: 3698, region: 'NA-East', country: '🇺🇸', game: 'Valorant', kd: 1.39, wr: 56, role: 'Sentinel', avatarHue: 10 },
];

const TOURNAMENTS = [
  {
    id: 'asc-major-s7',
    name: 'Ascendra Major · Season 7',
    tagline: 'The crown returns to the arena',
    game: 'Valorant',
    gameArt: 'assets/games/valorant.webp',
    bg: 'assets/backgrounds/home-hero.webp',
    prize: 1_250_000,
    teams: 32,
    registered: 28,
    region: 'Global',
    format: 'Double-Elim · BO5 Finals',
    starts: '2026-06-14T17:00:00Z',
    status: 'Registration',
    featured: true,
  },
  {
    id: 'crs-cup-12',
    name: 'Crucible Cup XII',
    tagline: 'Weekly grind, real stakes',
    game: 'CS2',
    gameArt: 'assets/games/cs2.webp',
    bg: 'assets/games/cs2.webp',
    prize: 25_000,
    teams: 64,
    registered: 64,
    region: 'NA',
    format: 'Single-Elim · BO3',
    starts: '2026-05-25T22:00:00Z',
    status: 'Live',
  },
  {
    id: 'rift-open',
    name: 'Rift Open 2026',
    tagline: 'Open qualifier · path to the Major',
    game: 'League of Legends',
    gameArt: 'assets/games/league-of-legends.webp',
    bg: 'assets/games/league-of-legends.webp',
    prize: 180_000,
    teams: 128,
    registered: 96,
    region: 'EU',
    format: 'Swiss → Bracket',
    starts: '2026-05-30T19:00:00Z',
    status: 'Registration',
  },
  {
    id: 'dire-clash',
    name: 'Dire Clash · Continental',
    tagline: 'Cross-region invitational',
    game: 'Dota 2',
    gameArt: 'assets/games/dota2.webp',
    bg: 'assets/games/dota2.webp',
    prize: 420_000,
    teams: 16,
    registered: 14,
    region: 'APAC + EU',
    format: 'Group → Playoffs',
    starts: '2026-06-02T13:00:00Z',
    status: 'Registration',
  },
  {
    id: 'battle-royale-ix',
    name: 'Battlefront IX',
    tagline: 'Squad warfare, season grand finals',
    game: 'Battlefield',
    gameArt: 'assets/games/battlefield-hero.webp',
    bg: 'assets/games/battlefield-hero.webp',
    prize: 75_000,
    teams: 48,
    registered: 42,
    region: 'Global',
    format: 'Point Series',
    starts: '2026-06-08T20:00:00Z',
    status: 'Registration',
  },
  {
    id: 'novakai',
    name: 'Novakai Showdown',
    tagline: 'Community-run · 5v5 ladder',
    game: 'Valorant',
    gameArt: 'assets/games/valorant.webp',
    bg: 'assets/games/valorant.webp',
    prize: 8_000,
    teams: 24,
    registered: 22,
    region: 'NA-West',
    format: 'Single-Elim · BO1',
    starts: '2026-05-24T01:00:00Z',
    status: 'Live',
  },
];

const LIVE_MATCHES = [
  {
    id: 'm-1',
    teamA: { tag: 'NVX', name: 'Nova Vortex', score: 13, won: ['T','T','CT','T'] },
    teamB: { tag: 'OBLK', name: 'Obsidian Lock', score: 11, won: ['CT','T','CT','CT'] },
    map: 'Ascent',
    round: 25,
    series: 'BO5 · Map 3',
    viewers: 184_211,
    tournament: 'Ascendra Major · QF',
    game: 'Valorant',
    timeLeft: '01:24',
  },
  {
    id: 'm-2',
    teamA: { tag: 'CRSH', name: 'Crashout', score: 9, won: ['T','T'] },
    teamB: { tag: 'VRGE', name: 'Verge', score: 12, won: ['CT','CT','T'] },
    map: 'Mirage',
    round: 22,
    series: 'BO3 · Map 2',
    viewers: 72_408,
    tournament: 'Crucible Cup XII',
    game: 'CS2',
    timeLeft: '00:42',
  },
  {
    id: 'm-3',
    teamA: { tag: 'AXIS', name: 'Axis Edge', score: 1, won: [] },
    teamB: { tag: 'NTRL', name: 'Neutral Drift', score: 0, won: [] },
    map: "Summoner's Rift",
    round: 0,
    series: 'BO5 · Map 1',
    viewers: 41_900,
    tournament: 'Rift Open · Group A',
    game: 'League of Legends',
    timeLeft: 'Draft',
  },
];

const NEWS = [
  { tag: 'Patch Notes', title: 'Season 7 ranked system: Apex Tier resets and softer decay', read: '4 min', d: '12h ago' },
  { tag: 'Tournament', title: 'Nova Vortex stuns Phoenix Drift in five-map thriller', read: '6 min', d: '1d ago' },
  { tag: 'Community', title: 'Open qualifier sign-ups crossed 14k teams overnight', read: '2 min', d: '2d ago' },
  { tag: 'Esports', title: 'Holloway joins Phoenix Drift on a two-year contract', read: '3 min', d: '3d ago' },
];

const PROFILE_ME = PLAYERS[0];

/* 24-week MMR series for profile graph */
const ELO_SERIES = [
  3654, 3678, 3702, 3691, 3725, 3754, 3742, 3789,
  3812, 3805, 3851, 3884, 3902, 3897, 3941, 3982,
  4011, 4045, 4022, 4078, 4112, 4156, 4194, 4218,
];

const MATCH_HISTORY = [
  { result: 'W', score: '13–9',  opp: 'Obsidian Lock',  oppTag: 'OBLK', map: 'Ascent',   kda: '24/11/6', delta: +28, when: '2h ago' },
  { result: 'W', score: '13–6',  opp: 'Crashout',       oppTag: 'CRSH', map: 'Haven',    kda: '26/8/4',  delta: +31, when: '4h ago' },
  { result: 'L', score: '9–13',  opp: 'Verge',          oppTag: 'VRGE', map: 'Split',    kda: '18/16/8', delta: -22, when: '8h ago' },
  { result: 'W', score: '13–11', opp: 'Phoenix Drift',  oppTag: 'PHNX', map: 'Bind',     kda: '22/14/7', delta: +24, when: '1d ago' },
  { result: 'W', score: '13–7',  opp: 'Axis Edge',      oppTag: 'AXIS', map: 'Lotus',    kda: '21/9/5',  delta: +27, when: '1d ago' },
  { result: 'L', score: '11–13', opp: 'Neutral Drift',  oppTag: 'NTRL', map: 'Sunset',   kda: '17/19/9', delta: -19, when: '2d ago' },
  { result: 'W', score: '13–4',  opp: 'Karma',          oppTag: 'KRMA', map: 'Pearl',    kda: '23/6/3',  delta: +29, when: '2d ago' },
];

const ACHIEVEMENTS = [
  { name: 'First Blood', desc: 'Win 100 ranked matches', pct: 100, t: 'gold' },
  { name: 'Apex Ascension', desc: 'Reach Apex Tier', pct: 100, t: 'gold' },
  { name: 'Clutch King', desc: 'Win 50 1v3+ rounds', pct: 84 },
  { name: 'Storm Caller', desc: 'Win 10 ranked in 24h', pct: 60 },
  { name: 'Untouchable', desc: 'Win 5 in a row, no death', pct: 40 },
  { name: 'Champion of Ascendra', desc: 'Win the Major', pct: 0 },
];

/* Bracket data for the featured tournament — single quadrant (top half) */
const BRACKET_ROUNDS = [
  {
    name: 'Round of 16',
    matches: [
      { a: { tag: 'NVX',  score: 2, won: true }, b: { tag: 'PHNX', score: 0 } },
      { a: { tag: 'OBLK', score: 2, won: true }, b: { tag: 'SVGE', score: 1 } },
      { a: { tag: 'CRSH', score: 1 },            b: { tag: 'VRGE', score: 2, won: true } },
      { a: { tag: 'AXIS', score: 2, won: true }, b: { tag: 'KRMA', score: 0 } },
      { a: { tag: 'NTRL', score: 2, won: true }, b: { tag: 'GHOST', score: 1 } },
      { a: { tag: 'WLKR', score: 0 },            b: { tag: 'ZRO',  score: 2, won: true } },
      { a: { tag: 'AURA', score: 2, won: true }, b: { tag: 'HVN',  score: 1 } },
      { a: { tag: 'RVNT', score: 1 },            b: { tag: 'STRM', score: 2, won: true } },
    ],
  },
  {
    name: 'Quarterfinals',
    matches: [
      { a: { tag: 'NVX',  score: 2, won: true }, b: { tag: 'OBLK', score: 1 } },
      { a: { tag: 'VRGE', score: 0 },            b: { tag: 'AXIS', score: 2, won: true } },
      { a: { tag: 'NTRL', score: 2, won: true }, b: { tag: 'ZRO',  score: 1 } },
      { a: { tag: 'AURA', score: 1 },            b: { tag: 'STRM', score: 2, won: true } },
    ],
  },
  {
    name: 'Semifinals',
    matches: [
      { a: { tag: 'NVX',  score: 1, live: true }, b: { tag: 'AXIS', score: 2, live: true } },
      { a: { tag: 'NTRL', score: 0 },             b: { tag: 'STRM', score: 0 }, upcoming: true },
    ],
  },
  {
    name: 'Grand Final',
    matches: [
      { a: { tag: 'TBD', score: 0 }, b: { tag: 'TBD', score: 0 }, tbd: true },
    ],
  },
];

const fmtCurrency = (n) => '$' + (n >= 1000 ? (n/1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : n);

function countdownTo(iso) {
  const target = new Date(iso).getTime();
  const now = Date.now();
  let diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
  const m = Math.floor(diff / 60000);    diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  return { d, h, m, s };
}

/* Games registry */
const GAMES = [
  {
    id: 'valorant',
    name: 'Valorant',
    publisher: 'Riot Games',
    genre: 'Tactical FPS',
    teamSize: '5v5',
    art: 'assets/games/valorant.webp',
    integration: 'Verified API',
    integrationStatus: 'connected',
    active: 3,
    upcoming: 5,
    players: '14.2K',
    color: 295,
    modes: ['Search & Destroy', 'Spike Rush', 'Premier'],
  },
  {
    id: 'cs2',
    name: 'CS2',
    publisher: 'Valve',
    genre: 'Tactical FPS',
    teamSize: '5v5',
    art: 'assets/games/cs2.webp',
    integration: 'Steam Match ID',
    integrationStatus: 'connected',
    active: 2,
    upcoming: 4,
    players: '11.8K',
    color: 30,
    modes: ['Competitive', 'Wingman'],
  },
  {
    id: 'lol',
    name: 'League of Legends',
    publisher: 'Riot Games',
    genre: 'MOBA',
    teamSize: '5v5',
    art: 'assets/games/league-of-legends.webp',
    integration: 'Verified API',
    integrationStatus: 'connected',
    active: 1,
    upcoming: 6,
    players: '9.6K',
    color: 220,
    modes: ['Summoner\u2019s Rift', 'ARAM'],
  },
  {
    id: 'dota2',
    name: 'Dota 2',
    publisher: 'Valve',
    genre: 'MOBA',
    teamSize: '5v5',
    art: 'assets/games/dota2.webp',
    integration: 'Steam Match ID',
    integrationStatus: 'connected',
    active: 1,
    upcoming: 2,
    players: '6.4K',
    color: 25,
    modes: ['All Pick', 'Captains Mode'],
  },
  {
    id: 'battlefield',
    name: 'Battlefield',
    publisher: 'EA DICE',
    genre: 'Squad FPS',
    teamSize: '8v8',
    art: 'assets/games/battlefield-hero.webp',
    integration: 'Manual report',
    integrationStatus: 'partial',
    active: 1,
    upcoming: 1,
    players: '4.1K',
    color: 60,
    modes: ['Conquest', 'Breakthrough'],
  },
];

/* Tournament detail — extends one TOURNAMENTS entry */
const TOURNAMENT_DETAIL = {
  id: 'asc-major-s7',
  prizes: [
    { place: '1st', amount: 700_000, label: 'Champion' },
    { place: '2nd', amount: 280_000, label: 'Runner-up' },
    { place: '3rd-4th', amount: 90_000, label: 'Semifinalist' },
    { place: '5th-8th', amount: 22_500, label: 'Quarterfinalist' },
  ],
  schedule: [
    { phase: 'Registration', date: 'May 14 – Jun 10', status: 'open', desc: 'Open team sign-ups across all qualifying regions.' },
    { phase: 'Qualifiers', date: 'Jun 11 – Jun 13', status: 'upcoming', desc: 'Regional best-of-three knockout. Top 32 advance.' },
    { phase: 'Group Stage', date: 'Jun 14 – Jun 18', status: 'upcoming', desc: 'Eight groups of four. Double round-robin BO3.' },
    { phase: 'Playoffs', date: 'Jun 19 – Jun 22', status: 'upcoming', desc: 'Double-elimination bracket. BO5 finals.' },
    { phase: 'Grand Final', date: 'Jun 22', status: 'upcoming', desc: 'Live broadcast from the Ascendra Arena.' },
  ],
  rules: [
    { n: 1, h: 'Roster lock', t: 'Five players plus one substitute. Roster locks at qualifier check-in. Substitutions require admin approval.' },
    { n: 2, h: 'Match format', t: 'Best-of-three group stage. Best-of-five from quarterfinals onward. Map veto with hammer-and-anvil method.' },
    { n: 3, h: 'Fair play', t: 'Anti-cheat verification required on all match clients. Stream sniping or coaching during play results in forfeit.' },
    { n: 4, h: 'Disputes', t: 'File disputes via the Ascendra Discord ticket bot within 15 minutes of map end. Decisions are final.' },
    { n: 5, h: 'Broadcast', t: '60-minute broadcast delay on all maps. Streaming your point of view is allowed at 5+ minute delay.' },
  ],
  acceptedTeams: [
    { tag: 'NVX',  name: 'Nova Vortex',     region: 'NA-East',  seed: 1, color: 295 },
    { tag: 'OBLK', name: 'Obsidian Lock',   region: 'EU-West',  seed: 2, color: 220 },
    { tag: 'CRSH', name: 'Crashout',        region: 'KR',       seed: 3, color: 30 },
    { tag: 'VRGE', name: 'Verge',           region: 'EU-West',  seed: 4, color: 320 },
    { tag: 'AXIS', name: 'Axis Edge',       region: 'NA-West',  seed: 5, color: 260 },
    { tag: 'NTRL', name: 'Neutral Drift',   region: 'JP',       seed: 6, color: 200 },
    { tag: 'PHNX', name: 'Phoenix Drift',   region: 'BR',       seed: 7, color: 60 },
    { tag: 'ZRO',  name: 'Zero Caliber',    region: 'EU-East',  seed: 8, color: 150 },
    { tag: 'WLKR', name: 'Walker Squad',    region: 'NA-East',  seed: 9, color: 100 },
    { tag: 'KRMA', name: 'Karma',           region: 'AU',       seed: 10, color: 340 },
    { tag: 'GHOST',name: 'Ghost Protocol',  region: 'EU-West',  seed: 11, color: 190 },
    { tag: 'SVGE', name: 'Savage',          region: 'NA-East',  seed: 12, color: 10 },
  ],
  pendingTeams: 4,
};

/* Discord community stats */
const DISCORD = {
  members: 184_211,
  online: 28_402,
  matchesToday: 3_204,
  ticketsOpen: 12,
  channels: [
    { name: 'tournament-announcements', members: 184_211, role: 'broadcast' },
    { name: 'team-finder',              members: 92_400,  role: 'channel' },
    { name: 'looking-for-game',         members: 71_200,  role: 'channel' },
    { name: 'support-tickets',          members: 184_211, role: 'support' },
  ],
};

Object.assign(window, {
  PLAYERS, TOURNAMENTS, LIVE_MATCHES, NEWS,
  PROFILE_ME, ELO_SERIES, MATCH_HISTORY, ACHIEVEMENTS,
  BRACKET_ROUNDS, TEAM_TAGS,
  GAMES, TOURNAMENT_DETAIL, DISCORD,
  fmtCurrency, countdownTo,
});
