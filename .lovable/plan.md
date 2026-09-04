# Skill challenge + leaderboard

A new part of the site where visitors are tested on how they talk to the girls,
scored on it, and ranked against everyone else.

## What gets built

**Challenge list page**
- A new "Challenge" page reachable from the top of the home page.
- Each girl runs her own challenge (Dakota and Zoe to start, locked girls show
  as locked, same rules as the rest of the site).
- Shows your best score per girl and a "Start" button.

**The challenge itself**
- A run is 5 questions: she says something, you answer in your own words.
- After each answer she replies in her own voice, and you get points out of 10
  for that answer plus one line on why.
- Crude or sexual answers get a cold, dismissive reply from her and a zero for
  that round — the run can end early if it keeps happening.
- At the end you see a total out of 50, her closing verdict, and a button to
  post your score to the board or try again.

**Leaderboard**
- On the same page: top 25 runs across the house, plus a per-girl tab.
- Shows a display name, the girl, the score and the date. Your own best run is
  highlighted.
- Signed-in visitors only can post a score, so the board can't be spammed.

**Rules note**
- A short line under the challenge: flirting and banter are fair game, anything
  explicit loses points.

## Technical notes

- Routes: `src/routes/challenge.tsx` (list + leaderboard) and
  `src/routes/challenge.$characterId.tsx` (the run), each with its own `head()`.
- Server function `src/utils/challenge.functions.ts`, auth-protected like the
  chat functions: takes the character, question index and the user's answer;
  builds the prompt from `buildCharacterPrompt(characterId)` plus a scoring
  layer; returns `{ reply, score, note, ended }` as strict JSON from the same
  Gemini model the chat uses. Question sets live in
  `src/content/challenges/<character>.md` so new girls slot in the same way.
- Counts against the existing message allowance and entitlement checks — no new
  billing.
- Migration: `public.challenge_runs` (id, user_id, character_id, score,
  display_name, created_at) with GRANTs, RLS — anyone signed in can read the
  board, insert only their own row, no updates or deletes. Scores are written
  server-side from the graded total, never from the browser.
- `roadmap.md` gets the challenge + leaderboard entry.
