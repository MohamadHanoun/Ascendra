# Ascendra Tournament Manual QA Runbook

This runbook is the release-candidate manual QA pack for the Ascendra tournament
ecosystem. It is intended for hands-on, manual-first verification of the
tournament operation flow before treating it as production-ready.

It covers the full operator/player journey: admin setup, registration, bracket
generation, match setup, player match flow, disputes/review, notifications,
realtime, and the public/profile surfaces.

> Scope note: this is a **manual-first** flow. External provider automation
> (FACEIT / Riot / Steam) is **optional** and is not required to run a
> tournament end to end. See [Deferred / not in this release](#deferred--not-in-this-release).

---

## 1. Preflight

Checklist before starting any QA session:

- [ ] `git status` is clean (no uncommitted files)
- [ ] Build passes
- [ ] Focused tests pass
- [ ] Deployment preview exists (if testing a production-like flow)
- [ ] Database is connected
- [ ] A logged-in admin account exists
- [ ] At least two logged-in player accounts exist
- [ ] At least two test teams exist
- [ ] One tournament exists in upcoming / open-registration state
- [ ] Provider keys (FACEIT / Riot / Steam) are **optional** and not required for the manual-first flow

Commands (Windows):

```bash
npm.cmd run build
npm.cmd test -- lib/__tests__/adminMatchOperations.test.ts
npm.cmd test -- lib/__tests__/playerMatchHub.test.ts
npm.cmd test -- lib/__tests__/notificationRouting.test.ts
```

Expected:

- All commands pass
- No uncommitted files before testing begins
- No secrets printed to the console

---

## 2. Admin tournament setup flow

Steps:

1. Open the admin dashboard.
2. Open a tournament admin page (`/admin/tournaments/[id]`).
3. Confirm the **Command Center** appears.
4. Confirm registration status is shown.
5. Confirm registration readiness is shown.
6. Confirm bracket readiness is shown.
7. Confirm quick links are present:
   - registrations (`#registrations`)
   - matches
   - manage matches (`/admin/tournaments/[id]/matches`)
   - review queue (`/admin/match-operations?review=needs`)

Expected:

- No broken links.
- Command Center counts match the visible data.
- Registration / bracket / source copy is clear.
- No admin action is unexpectedly triggered just by viewing.

---

## 3. Player registration flow

Test cases (run each as the appropriate user):

- Logged-out user
- Logged-in user with no team
- Logged-in user with a team
- Team registration
- Pending registration
- Cancelled registration (if available)
- Rejected registration with reason
- Approved registration

Expected:

- The public tournament journey explains the current state.
- The player registration card matches the actual registration status.
- A pending registration clearly states it is **not in the bracket until approved**.
- An approved registration clearly states it is **eligible for bracket generation**.
- A rejected registration shows the reason if one is recorded.
- A cancelled registration is visible if relevant.
- Arabic / English copy both work.
- No admin links are visible to a player.

---

## 4. Admin registration approval flow

Steps:

1. Approve a pending team.
2. Reject a team with a reason.
3. Cancel an approved/rejected registration (if applicable).
4. Refresh the public tournament page and the profile match hub.

Expected:

- The registration list updates.
- Command Center counts update.
- The player tournament page reflects the new state.
- The profile match hub reflects the new state.
- Notifications route correctly (see [section 9](#9-notifications-qa)).
- Approve / reject / cancel behavior is unchanged.

---

## 5. Bracket generation flow

Steps:

1. Verify that an open registration blocks bracket generation.
2. Close registration (if available).
3. Test with fewer than 2 approved teams.
4. Approve 2+ teams.
5. Confirm the ready-to-generate state.
6. Generate the bracket.

Expected:

- Bracket generation uses **approved registrations only**.
- Pending teams are excluded.
- Matches are created.
- The public tournament match list appears.
- A player's "Your match" appears only for a real team match.
- The admin match operations link works.
- Existing matches prevent duplicate generation.

---

## 6. Match setup flow

Steps:

1. Open `/admin/tournaments/[id]/matches`.
2. Inspect the missing-schedule state.
3. Add a schedule / instructions.
4. Inspect the missing-room state.
5. Add a manual room link / code.
6. Open the public match page as a player.

Expected:

- Admin setup badges update.
- Global match operations sorting updates.
- The public match page **Next Action** updates.
- The profile match hub updates.
- "Room ready" appears only when a real room link/code (or FACEIT URL) exists.
- No FACEIT / Riot requirement appears in the manual flow.

---

## 7. Player match flow

Steps:

1. Open the match page as a participant.
2. Check the **Next Action** card.
3. Check in (if available).
4. Submit a result from one team.
5. Inspect the "waiting for opponent report" state.
6. Submit a matching result from the opponent.
7. If possible, create another match and submit a conflicting result.

Expected:

- The "waiting for opponent report" state appears after one side submits.
- Matching reports confirm the result correctly.
- Conflicting reports create an admin review / dispute.
- No fake provider requirement is imposed.
- The public page does not expose admin controls.

Next Action reference (from `lib/playerMatchHub.ts`):

| Situation | Next Action key |
| --- | --- |
| Cancelled match | `cancelled` |
| Confirmed / completed / forfeit / bye | `completed` |
| Disputed | `adminReview` |
| No opponent yet (not a bye) | `waitingOpponent` |
| No schedule yet | `waitingSchedule` |
| You submitted, opponent has not | `waitingOpponentReport` |
| In progress / result pending, you have not submitted | `submitResult` |
| Otherwise | `openMatch` |

---

## 8. Admin dispute / review flow

Steps:

1. Create or open a disputed match.
2. Check the admin tournament matches page.
3. Check the global review queue.
4. Check dashboard / review counts (if available).
5. Inspect the dispute reason.
6. Inspect evidence links.
7. Confirm the result.
8. Override the result.
9. Reset the result if needed.

Expected:

- The disputed match appears in:
  - `/admin/tournaments/[id]/matches`
  - `/admin/match-operations?review=needs`
- Admin links point to:
  `/admin/tournaments/[id]/matches#match-[matchId]`
- Evidence links open safely in a new tab.
- The dispute reason is visible if recorded.
- Confirmation dialogs remain in place.
- No admin resolution happens on the public match page.

---

## 9. Notifications QA

Test the notification link target for each event:

- Registration submitted
- Registration approved
- Registration rejected
- Bracket / match created
- Room ready
- Schedule updated
- Result submitted
- Waiting opponent report
- Dispute / admin review
- Completed match

Expected:

- Player notifications go to public / profile pages.
- Admin notifications go to admin pages.
- Unsafe external hrefs do not navigate (only internal `/...` hrefs are kept).
- Legacy admin notification hrefs normalize safely. From
  `lib/notifications.ts#normalizeNotificationHref`:
  - `/admin?tab=registrations` → `/admin/tournaments/[tournamentId]#registrations`
    (when `tournamentId` metadata exists)
  - `/admin?tab=matches` → `/admin/tournaments/[tournamentId]/matches#match-[matchId]`
    (when both ids exist), otherwise `/admin/match-operations?review=needs`
  - Any href that is not a safe internal path (`/...`, not `//...`) becomes `null`

---

## 10. Realtime QA

Use two browsers:

- Admin browser
- Player browser

Test:

- Registration approval updates player-facing pages.
- Bracket generation updates public tournament / profile pages.
- Schedule update refreshes match / profile / admin queue.
- Room update refreshes match / profile / admin queue.
- Result submission refreshes match / admin queue.
- Dispute refreshes the admin review queue.

Realtime components involved:

- `components/TournamentDetailsRealtime.tsx`
- `components/MatchRealtimeRefresh.tsx`
- `components/ProfileRealtime.tsx`
- `components/AdminMatchOperationsRealtime.tsx`

Expected:

- Pages refresh / update where realtime is implemented.
- No obvious refresh loop.
- Stale states do not persist after the relevant event.

---

## 11. Profile match hub QA

Test (`/profile/matches`):

- No matches
- Pending registration
- Approved, waiting for bracket
- Active match
- Scheduled match
- Room-ready match
- Result-pending match
- Admin review / disputed match
- Completed match

Expected:

- Counts are correct.
- CTAs route only to:
  - `/tournaments/[id]`
  - `/tournaments/[id]/matches/[matchId]`
- No admin links appear.
- Arabic / English copy both work.

---

## 12. Public tournament pages QA

Test:

- Tournament list
- Tournament detail (`/tournaments/[id]`)
- Tournament matches list (`/tournaments/[id]/matches`)
- Match detail (`/tournaments/[id]/matches/[matchId]`)
- Invalid tournament id
- Invalid match id
- Match id from another tournament
- Logged-out user
- Logged-in non-participant
- Logged-in participant

Expected:

- Safe `notFound` / fallback behavior for invalid ids.
- Metadata / title is sensible.
- No raw database enum labels shown to players.
- No admin links shown to public users.
- "Admin review" is used instead of "Disputed" in player-facing copy.

---

## 13. Mobile and RTL QA

Test at mobile width:

- Public tournament page
- Public match page
- Profile matches
- Admin tournament page
- Admin match operations

Test in Arabic locale:

- Public tournament page
- Public match page
- Profile match hub
- Tournament registration panel

Expected:

- Cards wrap cleanly.
- Arabic RTL does not break the layout.
- Important buttons remain visible.
- Labels remain readable.
- No Arabic in code identifiers.

---

## 14. Final production checklist

- [ ] Build passes
- [ ] Focused tests pass
- [ ] Migration status checked
- [ ] Env variables verified **without printing secrets**:
  - `DATABASE_URL`
  - `AUTH_SECRET` / `NEXTAUTH_SECRET` (depending on naming)
  - Discord auth variables (`DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `ADMIN_DISCORD_IDS`)
  - `CRON_SECRET` (if a cron / scheduler is used)
  - Provider keys (`FACEIT_API_KEY`, `RIOT_API_KEY`) are optional
- [ ] No uncommitted files
- [ ] Deployment preview tested
- [ ] Manual QA completed
- [ ] Known deferred items reviewed

---

## Deferred / not in this release

The following are intentionally **not** part of this manual-first release:

- Hetzner realtime / scheduler production setup (if not already done)
- External provider automation (FACEIT / Riot / Steam)
- No-show / forfeit automation
- An advanced global admin review page (if later needed)
- Provider result sync
- Existing `TODO` / `FIXME` items in the provider / results areas
- Any production cron limitation if Vercel Hobby is still in use
- Any manual QA issue that requires a product decision

> These are not blockers for manual-first tournament operation unless Mohamad
> decides otherwise.

---

## Recommended manual QA order

1. Preflight (section 1)
2. Admin tournament setup (section 2)
3. Player registration (section 3)
4. Admin registration approval (section 4)
5. Bracket generation (section 5)
6. Match setup (section 6)
7. Player match flow (section 7)
8. Admin dispute / review (section 8)
9. Notifications (section 9)
10. Realtime (section 10)
11. Profile match hub (section 11)
12. Public tournament pages (section 12)
13. Mobile and RTL (section 13)
14. Final production checklist (section 14)
