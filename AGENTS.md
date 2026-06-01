# Ascendra Agent Instructions

## Project

This project is Ascendra / AscendraHub.

It is a Next.js + TypeScript + Prisma + Discord bot project.

The project includes:
- Public website
- Admin dashboard
- Tournament system
- Team registration system
- Match/check-in system
- Leaderboards and tournament results
- Discord bot integration
- Bot admin dashboard

## Main rule

Do not make code changes unless the user explicitly asks for implementation.

For QA tasks, inspect, test, document, and report only.

## Language and content

- Use professional English in code, variable names, functions, and technical identifiers.
- User-facing Arabic must be professional Modern Standard Arabic.
- Do not add casual Arabic inside code logic.
- Do not add AI-like guidance text, tutorial text, or unnecessary explanations inside the UI.
- Keep UI text short, product-like, and practical.

## Design rules

Ascendra uses a premium esports visual identity.

Preserve:
- Dark luxury style
- Bronze / ivory / charcoal palette
- Premium esports feeling
- Current logo and brand assets

Avoid:
- Yellow-heavy design
- Blue/purple/cyan/neon leftovers unless semantically required
- Unnecessary redesigns
- Changing the logo
- Changing image paths unless explicitly requested

## Safety rules

Never run destructive commands unless the user explicitly approves them.

Do NOT run:
- rm
- del
- rmdir
- git reset
- git clean
- prisma migrate
- prisma db push
- destructive database commands
- commands that delete production data
- commands that overwrite environment files

Do NOT commit or push unless the user explicitly asks.

Do NOT edit:
- .env.local
- .env.bot
- production secrets
- database URLs
- tokens
- Discord tokens
- NextAuth secrets

Do NOT ask the user for:
- passwords
- 2FA codes
- Discord tokens
- bot tokens
- database URLs
- private secrets

If login is required, navigate to the login page and stop. The user will complete login manually in the browser.

## Environment files

Never commit environment files.

Allowed:
- Reading .env.example or .env.bot.example if needed

Not allowed:
- Printing secret values
- Copying secrets into code
- Hardcoding Discord channel IDs
- Hardcoding tokens or production secrets

Discord channel IDs must be stored through environment variables or ServerSetting values, not hardcoded in source code.

## Build and validation

Use Windows-compatible commands.

Use safe commands only:
```bash
npm.cmd run build
npm.cmd run dev
git status
git diff --stat

Run build after TypeScript, React, server action, API, bot, or component changes.

For content-only changes, build is optional unless TypeScript syntax might be affected.

Git rules

Do not commit automatically.

When work is complete, report:

Files changed
What changed
Build result
Any risks
Suggested commit message

The user will decide when to commit.

QA rules

For QA/testing tasks:

Do:

Use the browser like a real user
Check desktop and mobile
Check dark and light modes
Check Arabic and English
Check console errors
Check failed network requests
Capture screenshots for bugs
Report exact steps to reproduce

Do NOT:

Fix issues unless asked
Delete data
Restart production services
Clean production logs
Change settings without approval
Run destructive admin actions without approval
QA areas

Test these flows when requested:

Public website
Home
Games
Tournaments
Tournament details
Leaderboard
Community
Rules
Staff
Announcements / News
Terms
Privacy
Cookies
404 page
Auth
Discord login
Logout
Admin-only routes
Normal user restrictions
Profile
Profile page
Discord user info
Teams
Registrations
Game accounts
Match/check-in info
Teams
Create team
Edit team
Invite member
Accept invite
Remove member
Register team for tournament
Tournaments
Create tournament
Edit tournament
Publish tournament
Open/close registration
Register team
Approve registration
Reject registration
Discord announcement sync
Matches
Create/manage matches
Schedule match
Match page
Check-in
Report result
Confirm result
Match status updates
Leaderboard and results
Tournament results
Final standings
Ranking points
Leaderboard updates
Admin
Rules CRUD
Roles CRUD
Staff CRUD
Announcements CRUD
Tournament CRUD
Bot dashboard
Bot dashboard
Overview
Queue
Events
Commands
Messages
Tournaments
Settings
Maintenance

Confirm dangerous actions have confirmation modals.

Bot rules

Do not reintroduce XP.

The old XP/chat activity system has been removed.

Keep:

Tournament points
Ranking points
Leaderboard
TournamentResult
RankingSeason
RankingPointEvent

Do not remove ranking or tournament point logic.

Discord bot rules

Do not add new slash commands unless explicitly requested.

Do not change:

Discord token handling
BOT_API_TOKEN behavior
Auth logic
Prisma schema
Tournament registration business logic
Match business logic

Do not hardcode Discord channel IDs.

Use existing settings and ServerSetting-based config for:

bot log channel
tournament log channel
bot error channel
admin actions channel
Reporting format

When reporting QA results, use this format:

Summary
Overall status:
Build result:
Highest-risk issue:
Critical issues

For each issue:

Page/flow:
Steps to reproduce:
Expected:
Actual:
Screenshot:
Console/network error:
Likely files:
Major issues
Minor visual issues
Passed checks
Recommended fix order
Implementation format

When implementing changes, use this format:

Files changed
What changed
Validation
Build:
Other checks:
Risks
Suggested commit message