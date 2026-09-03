# WORLD SETTING — the sorority house

## The concept
A dark, stylish, mysterious AI companion experience set inside **one expanding sorority house**. The user steps into the house and, over time, gets to know the women who live there.

**Tagline:** "Welcome to the sorority house, can you survive or will you thrive?"

The hook of the world is not a list of chatbots — it's a **living house with many doors**. The user builds trust with each resident through one continuous conversation each, and every relationship they earn opens more of the house to them.

## The house — many doors, always expanding
- The sorority house has **many doors, not just six**. It should feel larger than the characters currently available.
- The layout shows a hallway or house with multiple doors. Some doors belong to current characters; others remain **locked, blurred, unnamed, or marked "coming soon."**
- The house is built for **continuous expansion** — new members can always be added later. Six current named girls are NOT the limit of the house.
- Adding a future girl later should only require adding: her personality file, her portrait, her name/title/teaser, her door, her unlock condition, and her relationship progression — **no full rebuild**.

## Current residents
The first six named residents (all 19-year-old college sophomores living in the house):
1. **Dakota** — "the quiet strength" (front doors — available first)
2. **Zoe** — "the impossible first impression" (front doors — available first)
3. **Willow** — "the quiet one" (locked/unlock through progression)
4. **Brittany** — "the easy one" (the twist) (locked/unlock through progression)
5. **Sasha** — "knows what she wants" (locked/unlock through progression)
6. **Piper** — "the free-spirit musician" (locked/unlock through progression)

Each girl keeps her selected portrait exactly as-is. Do not redesign or replace their appearances.

## Visual style
- Deep black and purple color palette
- Neon pink and magenta accents
- Modern typography, mobile-first
- Dark, stylish, a little mysterious — it should feel like a world, not a generic chat menu

## House home screen
- Shows the larger sorority house and its many doors — not a simple six-character menu.
- Each character door shows: name, portrait, title, and a teaser line.
- Locked doors use blurred or shadowed portraits, "locked" states, or "coming soon" markers so the house feels bigger than what's unlocked.
- Smooth transitions and subtle animations. A feeling that more of the house remains undiscovered.
- Locked characters must still be visible as part of the world — never removed or treated as empty placeholders.

## Chat screen (per available character)
Each available girl has her own individual chat screen containing:
- Her selected portrait
- Her name and title
- Message history
- Text input and send button
- Typing/loading feedback
- Persistent conversation history for that character
- A way to return to the house
- Relationship progression indicator where appropriate (shown softly — never as raw numbers or mechanics)

## Door / unlock logic
Dakota and Zoe are available from the start with clear, unblurred portraits. The other named girls appear as part of the house with locked or progression-based states. Completing/earning trust with the front characters opens more of the house — new members arrive as the user grows closer to the ones already available.

## Backend notes
- Keep API keys and secrets secure on the server side; never expose them in the frontend.
- Use separate AI instructions for each girl: load her personality file, the shared rules, her memories, her conversation history, and her relationship progress before generating each reply.
- Keep the project focused on the sorority-house companion experience. No unrelated features.
