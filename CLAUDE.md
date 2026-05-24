# CRITICAL: The previous redesign attempt failed. Only ~6% was changed.
# This prompt supersedes all previous instructions.

## THE PROBLEM
You made superficial changes to existing elements. That is NOT what was asked.
The target design has ENTIRELY DIFFERENT sections and layout that do not exist yet in the codebase.
You must ADD new sections and REBUILD existing ones from scratch.

## COMPARE: CURRENT vs TARGET

### NAVBAR — REBUILD COMPLETELY
CURRENT: Logo on left + "Menu" text on right. That's it.
TARGET:
- Fixed navbar, height 52px, background rgba(8,9,14,0.92) + blur
- Left: [▲ triangle logo] [ASCENDRA text]
- Center: HOME · TOURNAMENTS · GAMES · BRACKETS · LEADERBOARD (all caps, 0.7rem, spaced)
- Active link has 1.5px purple (#7c5cfc) underline below it
- Right: [Search box "Search teams, players… ⌘K"] [DISCORD button indigo #5865F2] [🔔 bell with dot] [User avatar square + name + MMR]
- Mobile: hamburger that reveals full nav

### HOMEPAGE — REBUILD SECTION BY SECTION

#### SECTION 1: HERO — SPLIT LAYOUT (does not exist in current)
CURRENT: Full-width hero with background image + text centered/left
TARGET: TWO COLUMN layout side by side:

LEFT COLUMN:
- Eyebrow: "▲ ASCENDRA · SEASON 07 · A PREMIUM ESPORTS PLATFORM" (tiny, muted, uppercase)
- H1 line 1: "RISE" — huge white, Barlow Condensed 900, ~7rem
- H1 line 2: "BEYOND LIMITS." — same size but COLOR #7c5cfc (purple)
- Body: "The competitive home for serious teams. Verified results, automated brackets..."
- Two buttons: [BROWSE TOURNAMENTS ›] [🎮 JOIN DISCORD]

RIGHT COLUMN (floating dark card with L-bracket corner):
- Badge: "● FEATURED · SEASON 7"
- Title: "ASCENDRA MAJOR · SEASON 7" — Barlow Condensed 800
- Subtitle: "The crown returns to the arena"
- Countdown label: "▲ GROUP STAGE BEGINS IN"
- COUNTDOWN: [21 DAYS] · [16 HRS] · [38 MIN] · [22 SEC] — large numbers, Barlow Condensed
- Stats row: PRIZE: $1250K (blue #60a5fa) | SLOTS: 28/32 | REGION: Global
- Full-width purple button: [REGISTER TEAM ›]

#### SECTION 2: TICKER BAR — ADD THIS (completely missing)
Scrolling horizontal marquee bar between hero and next section.
Background: rgba(255,255,255,0.03), thin borders top+bottom
Content scrolling left: "NVX 13 · OBLK 11 · MAP 3 ASCENT  UP NEXT  CRSH VS VRGE · 00:42  QUALIFIERS  RIFT OPEN 96/128 TEAMS REGISTERED  SIGNING..."
Font: 0.65rem uppercase, color muted. Some segments highlighted in purple/white.
CSS: animation: ticker 35s linear infinite; transform: translateX(-50%)

#### SECTION 3: HOW IT WORKS — RESTYLE COMPLETELY
CURRENT: Numbered steps in basic card layout
TARGET:
- Eyebrow: "▲ HOW ASCENDRA WORKS"
- Layout: 2-column grid
- Numbers 01/02/03: font-size 4.5rem, Barlow Condensed 900, color white
- Step title: uppercase, Barlow Condensed 700, ~1.1rem
- Description: small, muted color
- NO card borders on the steps themselves — just the number + title + text

#### SECTION 4: LIVE MATCHES — ADD THIS SECTION (completely missing)
Eyebrow: "▲ BROADCASTS · 03"
Title: "LIVE NOW" + [ALL MATCHES ›] button right-aligned

3 match cards in a row (or 2 visible + scroll):
Each match card has L-bracket corner, contains:
- Top: [● LIVE] badge + match name (e.g. "Ascendra Major · QF") + viewer count (◎ 184.2K)
- Team 1 row: [colored square tag "NV"] [Nova Vortex / NVX] .............. [score: 13]
- Team 2 row: [colored square tag "OB"] [Obsidian Lock / OBLK] ........... [score: 11]
- Bottom: MAP · ASCENT  BO5 · Map 3  R25 · 01:24

Get REAL data from your existing matches/tournaments in the database.

#### SECTION 5: COMPETE THIS SEASON — RESTYLE COMPLETELY
CURRENT: Tournament cards with rounded corners, game image, colored status badges (pill shape)
TARGET:
- Eyebrow: "▲ OPEN REGISTRATION"
- Title: "COMPETE THIS SEASON" + [ALL TOURNAMENTS ›]
- 2×2 grid of tournament cards
- Each card has L-bracket corner (::before CSS)
- Top of card: [● LIVE] or [● REGISTRATION] badge (no border-radius) + game name
- Large title: Barlow Condensed 800, ~2rem
- Subtitle below
- Stats row: PRIZE: $X (blue) | TEAMS: 64/64 | FORMAT: Single-Elim
- ZERO rounded corners on cards or badges

#### SECTION 6: PICK YOUR ARENA — ADD THIS (completely missing)
Eyebrow: "▲ COMPETITIVE TITLES · 05"
Title: "PICK YOUR ARENA" + [GAMES REGISTRY ›]

5 game cards in a horizontal row:
Each card: dark bg, game image/poster placeholder, "N LIVE" badge top-right
Bottom: game name (Barlow Condensed 800) + "5v5 · 14.2K ACTIVE" (muted small)
Games: VALORANT, CS2, LEAGUE OF LEGENDS, DOTA 2, BATTLEFIELD
Get actual game data from database if available.

#### SECTION 7: TOP OF THE LADDER + DISCORD — ADD THIS (completely missing)
Two columns side by side:

LEFT (60%): Leaderboard top 5
- Eyebrow: "▲ APEX 100"
- Title: "TOP OF THE LADDER" + [FULL LADDER ›]
- 5 rows: [rank 01] [colored-square avatar "RA"] [Ravenous YOU · NVX · NA-East · Duelist] [.......] [4218 MMR]
- Winner row highlighted with subtle purple left border
- Get REAL data from leaderboard/users table

RIGHT (40%): Discord community card (dark card, L-bracket corner)
- Title: "🎮 COMMUNITY — THE ASCENDRA DISCORD"
- "184K members. Live tournament rooms..."
- MEMBERS: 184.2K | ONLINE NOW: 28.4K
- [JOIN THE SERVER] button
Below it, 4 small stat cards in 2x2 grid:
- PLAYERS: 48.2K (↑ 12% this month)
- MATCHES TODAY: 3.2K (↑ 480 since 6 AM)
- ACTIVE TOURNAMENTS: 14 (6 across 4 games)
- PRIZE POOLED: $2.1M (Season 7 to date)
Get real counts from database.

#### SECTION 8: LATEST ANNOUNCEMENTS — ADD THIS (completely missing)
- Eyebrow: "▲ FROM THE DESK"
- Title: "LATEST ANNOUNCEMENTS"
- 2×2 grid of announcement cards
- Each: large dim number (01/02/03/04) + "CATEGORY · 12H AGO" + title + "N MIN READ"
- Get from news/announcements table if exists, otherwise use placeholder data

### FOOTER — REBUILD COMPLETELY
CURRENT: Logo + description + category links stacked + Join Discord + copyright
TARGET:
- 5-column grid: [Brand column] [COMPETE] [PLATFORM] [COMMUNITY] [COMPANY]
- Brand: Logo + 2-line description + JOIN DISCORD button
- COMPETE: Tournaments, Brackets, Leaderboards, Open qualifiers
- PLATFORM: Games registry, Team finder, Rules & ToS, Anti-cheat
- COMMUNITY: Discord server, Creator hub, News, Code of conduct
- COMPANY: About, Organizer tools, Partnerships, Status · API
- Bottom bar: "© 2026 ASCENDRA INTERACTIVE" left + "● ALL SYSTEMS OPERATIONAL" right (green dot)
- Keep existing links that work, add hrefs to new ones

---

## DESIGN TOKENS (apply everywhere)

```css
body { background: #08090e; font-family: 'Barlow', sans-serif; }

/* The L-bracket card corner — apply to EVERY card */
.card { position: relative; background: #0d1117; border: 1px solid rgba(255,255,255,0.10); }
.card::before {
  content: ''; position: absolute; top: -1px; left: -1px;
  width: 14px; height: 14px;
  border-top: 1.5px solid rgba(255,255,255,0.22);
  border-left: 1.5px solid rgba(255,255,255,0.22);
}

/* Fonts */
h1, h2, h3, .display { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; text-transform: uppercase; }

/* NO border-radius anywhere */
* { border-radius: 0 !important; }
/* Exception: dots only */
.dot { border-radius: 50% !important; }
```

Add Google Fonts to layout.tsx:
```
https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600;700&display=swap
```

---

## WHAT TO PRESERVE (do not break)
- All authentication (login, register, session)
- All data fetching from Supabase/database
- All admin panel functionality
- All existing routes and API endpoints
- The TournamentMatchesSection component (just restyle it)
- All form submissions and actions

---

## EXECUTION ORDER
1. app/globals.css — add all CSS variables + utility classes + L-bracket + ticker animation
2. app/layout.tsx — add fonts, set body background
3. components/layout/Navbar.tsx — full rebuild (5-item nav + search + discord + user)
4. components/layout/Footer.tsx — full rebuild (5-column)
5. app/page.tsx — rebuild ALL 8 sections listed above
6. app/tournaments/page.tsx — restyle with new tokens
7. app/tournaments/[id]/page.tsx — restyle with new tokens
8. All remaining pages

For each section that needs real data: query your existing database/API.
For sections where data doesn't exist yet: use realistic placeholder data in the component.

## FINAL CHECK
After finishing, every page must have:
✓ Dark background #08090e
✓ Barlow Condensed headings (uppercase)
✓ L-bracket ::before on every card
✓ Zero border-radius (except dots)
✓ Navbar with full links (not just "Menu")
✓ Footer with 5 columns
✓ All 8 homepage sections present

---

## ALL REMAINING PAGES — APPLY SAME DESIGN SYSTEM

The design reference only shows the main public pages. But EVERY page in the codebase
must be updated with the same design tokens. Go through the entire file tree and update
every single .tsx / .jsx file that renders UI.

### HOW TO HANDLE PAGES NOT IN THE DESIGN REFERENCE
For any page not shown in the reference design, apply the same tokens:
- Background: #08090e
- Cards: #0d1117 + L-bracket ::before corner
- All headings: Barlow Condensed 800 uppercase
- Buttons: sharp corners, #7c5cfc primary / transparent ghost
- Text: white primary / rgba(255,255,255,0.55) secondary / rgba(255,255,255,0.30) muted
- Inputs/forms: dark background #0d1117, border rgba(255,255,255,0.10), no border-radius
- Tables: dark rows, subtle hover #111827, dim column headers uppercase 0.6rem
- Zero border-radius everywhere

---

### AUTH PAGES

#### /app/auth/login — or wherever login page is
- Full dark page, centered card with L-bracket corner
- Logo at top
- "SIGN IN" — Barlow Condensed 800 title
- Input fields: dark bg, subtle border, white text, no border-radius
- Submit button: full-width purple #7c5cfc
- Links: muted color, hover white

#### /app/auth/register — or signup page
- Same dark centered layout
- "CREATE ACCOUNT" heading
- All form fields: same dark input style
- Submit: purple full-width button

---

### USER PROFILE PAGE

#### /app/profile — or /app/dashboard
Apply "PLAYER HUB" layout from reference:
- Page hero banner (dark, ~200px): player avatar square (colored) + username + stats row
- Stat grid 2×3 (cards with L-bracket):
  TEAMS | INVITES | ENTRIES | POINTS | RESULTS | BEST
  Large number + small label
- Sections below with tables (tournament history, team memberships)
- All tables: .asc-table style (dark rows, dim headers, hover effect)

---

### TEAMS PAGES

#### /app/teams or /app/teams/[id]
- Page hero: team name + tag + game badge
- Roster table: player rows with avatar tags, role, joined date
- Tournaments section: cards with L-bracket
- Create/edit team form: dark inputs, purple submit

---

### TOURNAMENT DETAIL PAGE (complete version)

#### /app/tournaments/[id]
Beyond what was described before, make sure:
- Breadcrumb: "TOURNAMENTS / TOURNAMENT NAME" — small, muted, uppercase
- Tab navigation (if exists): styled as filter pills
- Registration form/panel: dark card, L-bracket corner
- Match results table: uses .asc-table
- Prize distribution section: prize values in #60a5fa
- All status badges use the badge system (no rounded pills)

---

### ADMIN PAGES — apply dark theme throughout

#### /app/admin — dashboard
- Sidebar (if exists): dark #0d1117, border-right rgba(255,255,255,0.06)
- Sidebar links: uppercase 0.7rem, active = purple left border + brighter text
- Main area: dark bg, stat cards with L-bracket corner
- All admin tables: .asc-table style

#### /app/admin/tournaments
- Data table with dark rows
- Action buttons: small, sharp corners
- Status badges: same badge system

#### /app/admin/users
- User table: avatar squares (colored), name, role, joined date
- Same dark table style

#### /app/admin/matches or results
- Match management table
- Approve/reject buttons: small, sharp

#### Any other /app/admin/* pages
- Apply same dark sidebar + table layout

---

### LEADERBOARD PAGE

#### /app/leaderboard
Full implementation:
- Page hero: "▲ SEASON 7 · APEX TIER" + "LEADERBOARD" title
- Filter pills: GLOBAL / NA / EU / APAC (region) + game tabs
- Top 3 podium: 3 cards, center one taller with purple glow
- Main table (ranks 4–100):
  # | PLAYER (avatar + name + team + region) | TIER | MMR | K/D | WIN% | REGION | TREND | Δ70
- All using real data from database

---

### NEWS / ANNOUNCEMENTS PAGE

#### /app/news — if exists
- Page hero: "▲ FROM THE DESK" + "LATEST ANNOUNCEMENTS"
- Article cards: L-bracket corner, category badge, title, date, read time
- Pagination: minimal, dark style

---

### COMMUNITY PAGES

#### /app/community, /app/about, /app/rules, /app/roles, /app/staff
- Each has a page hero banner with title
- Content in dark cards with L-bracket
- Same design tokens throughout

---

### 404 PAGE

#### /app/not-found.tsx or similar
- Dark full-page
- Large "404" in Barlow Condensed 900 (maybe purple)
- "PAGE NOT FOUND" subtitle
- Back to home button: purple primary

---

### LOADING / SKELETON STATES

For any loading states or Suspense boundaries:
```css
.skeleton {
  background: linear-gradient(90deg, #111827 0%, rgba(255,255,255,0.05) 50%, #111827 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

### FORM ELEMENTS — GLOBAL STANDARD

Apply to ALL forms across the entire site:

```css
input, textarea, select {
  background: #0d1117;
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 0;
  color: #ffffff;
  padding: 0.6rem 0.85rem;
  font-family: 'Barlow', sans-serif;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease;
}
input:focus, textarea:focus, select:focus {
  border-color: rgba(124, 92, 252, 0.5);
}
input::placeholder { color: rgba(255,255,255,0.25); }
label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.40);
  display: block;
  margin-bottom: 0.4rem;
}
```

---

### COMPLETE FILE TREE SCAN

After implementing the above, scan the ENTIRE project:
```
find . -name "*.tsx" -o -name "*.jsx" | grep -v node_modules | grep -v .next
```

For EVERY file found that renders UI:
1. Check if it uses old colors (white bg, rounded corners, old button styles)
2. If yes — update to match the design system
3. No file should be left with old styling

---

## FINAL VERIFICATION CHECKLIST

Run through this after completing every file:

□ body background is #08090e everywhere
□ All headings use Barlow Condensed (add font if missing)
□ Every card/panel has L-bracket ::before corner
□ Zero border-radius on any card, button, input, or badge
□ All status labels use the badge system (LIVE/REGISTRATION/FEATURED)
□ Prize/money values are color #60a5fa (blue)
□ Navbar shows full 5 links + search + discord (not just "Menu")
□ Footer has 5 columns
□ All form inputs are dark with subtle borders
□ Admin pages match same dark theme
□ Auth pages (login/register) are dark centered cards
□ No white or light backgrounds anywhere in any page
□ TypeScript compiles with no errors
□ All existing functionality still works

