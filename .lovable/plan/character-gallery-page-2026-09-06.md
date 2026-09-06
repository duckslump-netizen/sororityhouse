# Character gallery page

A single page that shows every girl in the house side by side, so you can see all the portraits in one place instead of scrolling the home page.

## What you get

- A new page at `/gallery` with a grid of all six girls: Dakota, Zoe, Willow, Brittany, Sasha and Piper.
- Each tile shows her portrait, name, title and short teaser line.
- Open doors (Dakota, Zoe) show a "Chat" button. Locked ones show how they open.
- Same dark purple and neon-pink look as the rest of the house.
- A link to the gallery from the home page and from the top of the house section.
- Signed-in owner view: because you are the owner, locked girls show unblurred so you can review every picture.

## Technical notes

- New route `src/routes/gallery.tsx` using `createFileRoute`, with its own `head()` title and description.
- Reads from the existing `characters` array in `src/lib/characters.ts` — no new data source, no duplicated images, so future girls appear automatically.
- Owner unblur uses the existing admin role check already used by `/admin`; non-admin visitors keep the current locked/blurred treatment.
- No database, payment or chat logic changes.
