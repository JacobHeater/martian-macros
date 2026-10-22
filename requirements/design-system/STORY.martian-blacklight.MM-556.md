---
id: MM-556
status: done
component: design-system
related: [MM-555, MM-554, MM-375, MM-184]
---

# Story: Martian under blacklight

## Context
The owner, 2026-10-22, after MM-555 moved Martian onto the art's near-black: "it's looking better now from the dark of
the background, but I'm really hoping for more of that high contrast, 90's, blacklight look. I want to see more of these
colors in the palette as first class citizens." The crops sent: the mountains (electric violet `#5A28E7`, purple
`#8327A7`, magenta `#DC39B5`, orange `#E96239`), the lettering and stripes (lime-yellow `#F3F552`, lime `#D0F750`, hot
pink `#E4387B`, tangerine `#EC6B31`) and the ringed planet (orange `#ED7332`, gold `#F6C746`, magenta `#D83586`).

## Decisions
- **The colours with no role become the structure.** MM-554 and MM-555 gave the brights meanings (action, chosen,
  macros, cautions); the art's violets and hot pink had none, so the screens read as near-black with grey-violet lines.
  They now draw the edges and lines, so every screen carries the art's neon without borrowing a meaning colour.
- **Cards glow under blacklight.** Cards, list groups, choice cards and dialogs wear `edge` (the mountains' violet,
  `#6B3DF5`) with a soft glow (`glow`, the edge at 45%, 14 px).
- **The hero and the navigation bar wear the stripes' hot pink** (`accent-line`, `#FF3D8B`, 4.9 on raised) with its
  glow; the hero's backdrop is lit violet, not cyan.
- **A screen's title is the lettering**: lime-yellow into tangerine (`title-from` `#F3F552`, `title-to` `#FF6A2C`;
  16.9 and 6.9 on the canvas). It is not the carbs colour (`#FF7A1C`), and a title is never a figure.
- **A section's mark is the mountains' lilac** (`mark`, `#B98CFF`, 6.4 on raised); a caution's section keeps the
  caution colour (MM-553).
- **Deeper violets underneath**: the track `#331A70` (fat 3.8, water 4.7 on it), the chosen-chip fill `#4824AD` (text
  9.3), the field edge and the segmented border `#C77DFF` (6.0 on raised).
- **Dark and Light are unchanged**: `edge` is their outline, `glow` and `accent-line` are transparent, the title's ends
  are their text and `mark` their secondary text. Owner-dictated, so no panel pass.

## Description
New tokens `edge`, `glow`, `accent-line`, `title-from`, `title-to` and `mark` in every palette of
`apps/mobile/src/theme/tokens.css`, used by `apps/mobile/src/ui/ui.css`; the Martian track, selected and outline-strong
deepened; the record and the design docs follow.

## Acceptance Criteria
- [x] Martian cards, groups, choice cards and dialogs have a violet glowing edge; the hero and the navigation bar a hot-pink line.
- [x] A screen's title runs lime-yellow into tangerine in Martian and is the text colour in Dark and Light.
- [x] Both title ends hold 4.5:1 on the canvas, the mark and the line 3:1 (`test/tokens.test.ts`); every earlier rule holds.
- [x] Dark and Light draw as before (their new roles equal existing values, no line or glow).

## UI/UX
Every Storybook story in Martian (MM-237).
