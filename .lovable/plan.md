# Trust scores and two scoreboards

No separate challenge pages. The challenge already lives inside the
conversations: you only move on to the next girl once you've earned the
current one's trust. What's missing is the score being real, and a second
board for All Site Access members who are allowed to skip around.

## What changes

**The score becomes real**
- Every conversation quietly tracks how much a girl trusts you (the 0–100
  meter already written into the house rules), and which stage that puts you
  in. You never see the number — you see how far you've got with her.
- The home scoreboard stops showing 0/4 for everyone and shows your actual
  progress with each girl, plus the house-wide count of people who finished.

**Doors unlock by trust, not by nothing**
- Storyline members work in order: the next door opens once the current girl
  trusts you enough. Push too hard and you slide back, exactly as the house
  rules already describe.
- All Site Access members keep every door open from day one and can jump
  between girls in any order.

**Two boards instead of one**
- Storyline board: ranked by how far you got in order — girls completed, then
  total trust, then who did it fastest.
- All Access board: ranked by total trust across all the girls, since order
  doesn't apply to them.
- Both show a display name, progress and date, with your own row highlighted.
  Boards are visible to anyone signed in.

## Technical notes

- Migration: `public.character_trust` (user_id, character_id, trust int 0–100,
  stage text, updated_at, unique on user+character) and a
  `public.leaderboard_entries` view or table carrying per-user totals plus
  `board` = `storyline` | `all_access` derived from their plan. GRANTs on both,
  RLS: signed-in users read the board rows, users read their own trust rows,
  writes are server-side only via `service_role`.
- `src/utils/chat.functions.ts`: after each reply, a second lightweight model
  call scores the exchange against the point economy in
  `relationship-progression.md` and returns a trust delta (capped at +8 per
  session, hard stops lock progression). Delta is applied server-side with
  `supabaseAdmin`; the value is never accepted from the browser.
- Unlock rules move from the hardcoded `FULL_HOUSE_ONLY` list into a trust
  check in `chat.functions.ts` and `src/lib/characters.ts`: tier 2 bypasses
  ordering; tier 1 requires the previous girl at TRUSTED (50+).
- `src/routes/index.tsx`: scoreboard section reads real progress; new
  `src/routes/leaderboard.tsx` with the two boards and its own `head()`.
- `roadmap.md` gets: real trust scoring, trust-gated unlocks, storyline +
  all-access leaderboards.
