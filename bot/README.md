# Ascendra Discord Bot

The live Ascendra Discord bot, deployed on Hetzner VPS via Docker.

## What the bot does

- Polls the Ascendra web API every 5 seconds for queued events and executes them:
  - Sends and edits tournament announcement embeds
  - Creates and deletes team Discord roles and voice channels on registration approval/rejection
  - Assigns/removes the Team Captain role automatically
  - Sends custom admin messages to any configured channel
- Sends a heartbeat every 30 seconds with member counts, role counts, uptime, and the slash command list
- Handles all slash commands (see below)
- Logs all events and slash command usage via Discord and the database

## Slash commands

| Command | Description |
|---|---|
| `/ascendra` | Link to the AscendraHub website |
| `/about` | Short embed about Ascendra |
| `/links` | All Ascendra links |
| `/invite` | Discord server invite |
| `/ping` | Bot latency |
| `/tournaments` | List tournaments (filter by game/status) |
| `/schedule` | Upcoming and open tournaments by date |
| `/tournament <query>` | Detailed tournament info (autocomplete) |
| `/results` | Leaderboard results for players or teams |
| `/leaderboard` | Live leaderboard |
| `/games` | Supported games |
| `/profile [user]` | Player profile |
| `/teams [user]` | Teams for a player |
| `/team <query>` | Team details including roster and registrations |
| `/roster <query>` | Team roster |
| `/teamresults <query>` | Team tournament history |
| `/registrations [user]` | Registration history |
| `/announcements` | Latest site announcements |
| `/stats` | Platform stats |
| `/rules` | Active community rules |
| `/staff` | Staff directory |
| `/community` | Community page link |
| `/status` | Bot uptime and system status |
| `/help` | All commands |

## Environment variables

See `.env.bot.example` for the full list. Required: `DISCORD_BOT_TOKEN`, `BOT_API_TOKEN`, `DISCORD_GUILD_ID`.

## Running the bot

```bash
# Development
npm run bot:dev

# Production (Docker on VPS)
npm run bot:start
```

## Security

Do not commit real bot tokens to the repository.
