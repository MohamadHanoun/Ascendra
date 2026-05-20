# Ascendra

Official website for **Ascendra**, a modern Discord community focused on electronic games, tournaments, community events, XP progression, and future Discord bot integration.

Live website:  
https://ascendra-ebon.vercel.app/

---

## About the Project

Ascendra is a gaming community website built to support a Discord server with a clean and expandable structure.

The current version is a static website prepared for future features such as:

- Discord login
- Admin panel
- Tournament registration
- XP and level system
- Live Discord statistics
- Custom Discord bot
- PostgreSQL database integration

The project is built with scalability in mind, so future features can be added without rebuilding the website from scratch.

---

## Tech Stack

This project uses:

- Next.js
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL-ready structure
- Discord.js-ready bot structure
- Vercel for deployment

---

## Current Pages

The website currently includes:

- Home
- About
- Rules
- Roles
- Staff
- Stats
- Tournaments
- Leaderboard
- Announcements
- Admin Panel placeholder
- 404 Not Found page

---

## Future Features

Planned features include:

### Database

The project is prepared for PostgreSQL using Prisma.

Future database features:

- Store server settings
- Manage rules
- Manage roles
- Manage staff members
- Manage tournaments
- Manage announcements
- Store Discord users
- Store XP logs
- Store leaderboard data

### Admin Panel

The admin panel is currently a visual placeholder.

Future admin features:

- Discord login for admins
- Manage website content
- Create and edit announcements
- Create and manage tournaments
- Manage roles and staff
- View Discord statistics
- Control XP system settings

### Discord Bot

The project includes a prepared bot structure.

Future bot features:

- XP tracking
- Level system
- Leaderboard updates
- Discord server statistics
- Tournament notifications
- Auto roles
- Activity logs

---

## Project Structure

```txt
app/
  api/
  about/
  admin/
  announcements/
  leaderboard/
  roles/
  rules/
  staff/
  stats/
  tournaments/

components/
  Reusable UI components

content/
  Website content and bilingual content foundation

data/
  Temporary static data used before database integration

lib/
  Utility and config files

bot/
  Future Discord bot structure

prisma/
  Prisma schema for future database models

public/
  Static assets