# Ascendra

Ascendra is a premium esports platform for Discord-based gaming communities, tournaments, teams, rankings, match operations, and admin-controlled community management.

The project is built with **Next.js**, **TypeScript**, **Prisma**, **PostgreSQL**, **NextAuth Discord authentication**, and a prepared **Discord bot operations layer**.

---

## Project Status

Ascendra is no longer a static placeholder website. The current version includes a real database-backed platform structure with authentication, admin tools, tournament management, team registration, rankings, match systems, notifications, and bot dashboard foundations.

Current production focus:

- Website polish and final brand consistency
- Full user-flow testing
- Production environment validation
- Discord bot integration hardening
- Tournament and match workflow testing

---

## Main Features

### Public Website

- Premium Ascendra homepage
- Tournaments listing
- Tournament detail pages
- Games pages
- Leaderboard page
- Community page
- Profile page
- Light / dark theme support
- Arabic / English language support
- Global navigation and search
- Responsive layout foundation

### Authentication

- Discord login through NextAuth
- Session-aware navigation
- Admin-only access control
- User profile support
- Discord identity storage

### Admin Panel

The admin dashboard is protected and available only to configured admin Discord accounts.

Current admin tools include:

- Dashboard overview
- Tournament management
- Registration review
- Team review
- Player overview
- Match management
- Announcements management
- Rules management
- Roles management
- Staff management
- Admin module navigation
- Bot dashboard entry

### Tournament System

Ascendra includes database models and UI flows for:

- Creating tournaments
- Assigning games to tournaments
- Managing tournament status
- Managing registration status
- Team registration
- Admin approval / rejection
- Tournament results
- Points and ranking events
- Tournament match records
- Match check-ins
- Match reports
- Game rooms
- FACEIT-related match metadata foundations

### Team System

Current team-related structure supports:

- Team creation
- Team leaders
- Team members
- Team invitations
- Team status review
- Tournament registration by team
- Game-specific team ownership

### Ranking and Leaderboard

The project includes ranking-related database structures for:

- Ranking seasons
- Ranking point events
- Game-based rankings
- Tournament-based points
- User/team point tracking

### Notifications and Realtime Events

The project includes backend structures for:

- User notifications
- Realtime event records
- Public/admin event audiences
- Entity-specific realtime updates

### Discord Bot Dashboard

The project includes a protected bot operations dashboard with sections for:

- Bot overview
- Health and controls
- Bot messages
- Tournament messages
- Bot event queue
- Command logs and insights
- Maintenance tools
- Bot settings
- Invite tools

The bot structure is prepared for Discord operations using `discord.js`.

---

## Tech Stack

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Prisma 7**
- **PostgreSQL**
- **NextAuth v5 beta**
- **Discord.js**
- **Recharts**
- **Vitest**
- **Vercel-ready deployment**

---

## Scripts

Use these commands on Windows:

```bash
npm.cmd run dev
npm.cmd run build
npm.cmd run start
npm.cmd run lint
npm.cmd run test
npm.cmd run db:seed
npm.cmd run bot:dev
npm.cmd run bot:start
```

The build script runs Prisma generation before the Next.js build:

```bash
prisma generate && next build
```

---

## Environment Variables

The project requires environment variables for database access, authentication, Discord integration, admin access, and optional external game services.

Create a local `.env` file based on the project needs.

Common variables expected by the platform may include:

```env
DATABASE_URL=
AUTH_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
ADMIN_DISCORD_IDS=
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
FACEIT_API_KEY=
RIOT_API_KEY=
```

Do not commit real secret values to GitHub.

A dedicated `.env.example` file should be added and kept updated as the next documentation step.

---

## Project Structure

```txt
app/
  admin/
  api/
  community/
  discord/
  games/
  leaderboard/
  login/
  profile/
  tournaments/

components/
  Reusable UI, admin panels, tournament panels, profile components,
  navbar, footer, theme controls, and dashboard components.

actions/
  Server actions for profile, teams, tournament registrations,
  admin workflows, and bot-related operations.

bot/
  Discord bot entry points and helper scripts.

data/
  Static configuration and navigation/module data.

lib/
  Auth helpers, Prisma client, ranking services, Discord helpers,
  tournament utilities, i18n, and integrations.

prisma/
  Prisma schema, migrations, and seed script.

public/
  Static images, brand assets, backgrounds, game images, and icons.
```

---

## Database Models Overview

The Prisma schema includes models for:

- `User`
- `Game`
- `Team`
- `TeamMember`
- `TeamInvite`
- `Tournament`
- `TournamentRegistration`
- `TournamentResult`
- `RankingSeason`
- `RankingPointEvent`
- `Match`
- `TournamentMatch`
- `TournamentMatchGame`
- `TournamentMatchCheckIn`
- `MatchReport`
- `GameRoom`
- `GameIntegration`
- `PlayerGameAccount`
- `Notification`
- `RealtimeEvent`
- `Announcement`
- `Rule`
- `Role`
- `StaffMember`
- `BotEvent`
- `GameWebhookEvent`
- `GameApiAuditLog`
- `FaceitWebhookLog`

This structure supports a complete esports platform foundation and can be expanded without redesigning the whole database.

---

## Production Readiness Checklist

Before treating the website as fully complete, verify these items:

### Visual and UX

- Brand assets are final
- Background images are final
- Light mode and dark mode are both readable
- Admin and bot pages match the main site theme
- Mobile navigation works correctly
- Arabic layout and text direction are clean
- No outdated blue/purple styling remains where it conflicts with the Ascendra identity

### Authentication

- Discord OAuth works in production
- Callback URLs are correct
- Admin Discord IDs are configured
- Non-admin users cannot access protected admin pages

### Database

- Production PostgreSQL database is connected
- Prisma migrations are applied
- Seed data works if needed
- No local-only database configuration remains

### Tournament Flow

Test the complete tournament flow:

1. Login with Discord
2. Create or manage a team
3. Create a tournament from admin
4. Register a team for a tournament
5. Approve or reject the registration in admin
6. Generate or manage matches
7. Open match pages
8. Use check-in/reporting flows where available
9. Confirm results
10. Verify leaderboard/profile points update correctly

### Bot Flow

- Bot token is configured securely
- Bot dashboard loads for admins
- Bot event queue works as expected
- Bot logs and commands display correctly
- Discord server/guild configuration is correct

---

## Development Notes

- Keep code and variables in English.
- Arabic UI text should be professional Modern Standard Arabic.
- Do not rename existing image files unless the code is updated intentionally.
- Preserve the premium esports identity: dark luxury, bronze, ivory, charcoal, and clean competitive UI.
- Avoid unnecessary design rewrites when a focused fix is enough.
- Run the Windows build command before committing functional or styling changes:

```bash
npm.cmd run build
```

---

## Recommended Next Steps

1. Add and maintain `.env.example`
2. Finish full user-flow testing
3. Fix any remaining visual inconsistencies
4. Verify production deployment settings
5. Harden bot production setup
6. Add basic tests for critical flows
7. Keep this README updated after each major feature batch

---

## Repository

GitHub repository:

```txt
https://github.com/MohamadHanoun/Ascendra
```

---

## License

Private/community project unless a license is added later.
