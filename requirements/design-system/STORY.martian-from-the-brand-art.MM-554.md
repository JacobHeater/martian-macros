---
id: MM-554
status: done
component: design-system
related: [MM-184, MM-375, MM-370, MM-376, MM-362, MM-106, MM-297]
---

# Story: Martian drawn from the brand art

## Context
The owner, 2026-10-22: "The icon set and splash screen now will drive the tokens for martian color scheme. You must use
the icon and the splash screen as inspiration for the tokens for martian theme."

The two pieces of art are recorded as the palette's source, downscaled to 1024 px:
- `design/brand/splash-art.png`: the splash, with the UFO plate of food.
- `design/brand/icon-art.png`: the icon art, without the food or the UFO.

Dominant colours measured by k-means on both (share of the pixels; CIE L*, chroma, hue):

| Where in the art | Colours | L* / C / h |
|---|---|---|
| Night sky, near-black indigo-violet | `#020015` (18%), `#0B0027` (13%), `#130140` (11%), `#1F0165` (8%) | 1-11 / 10-65 / 293-309 |
| Mountains, electric purple | `#3B0191`, `#7106AC`, `#8302A9` | 20-33 / 83-89 / 310-320 |
| "MARTIAN" lettering, neon lime-yellow | `#DFF701`, `#D9E50F`; lime `#7DCD04` | 93, 87; 75 |
| "MACROS" lettering, tangerine | `#F66B04`, `#EB7B19` | 62-63 / 76-85 / 55-60 |
| Stripes and rims, hot magenta | `#D3097B`, `#D40F9C` | 46-48 / 74-81 / 343-355 |
| The ringed planet, red | `#EB282F`, `#E42D47` | 51 / 76-85 / 25-33 |
| A small teal accent; cyan stars in the splash | `#239595` | 56 / 31 / 197 |

## Decisions
- **The levels climb from the night sky into the mountains' purple.** The canvas is the sky; surface, raised and overlay
  step towards the mountains' violet in the art's hue (CIE about 303-307°). The steps are larger than MM-375's (MM-375's
  lesson: cards, groups and the navigation bar have to stand off the canvas): L* 3.4 / 11.7 / 18.6 / 25.7, against
  5.8 / 12.5 / 17.7 / 22.8. Chroma 57-71: more saturated than MM-375's 42-51, well under the art's 65-89, so the surfaces
  stay muted enough for long reading.
- **The action (ember) is the "MARTIAN" lime-yellow**, the art's own `#DFF701`. **Positive** was the action colour; it
  takes the art's lime stripe (`#8FE02A`), so success no longer looks like a button.
- **Carbs are the "MACROS" tangerine** (`#FF7A1C`), **fat the stripes' hot magenta** (`#EB3DA5`: the art's `#D40F9C`
  lifted to hold 3:1 on the track; at the art's own value fat is 2.6:1 there). The two stay 10.2 L* apart, just over the
  rule; the review asked for fat this bright (3.4:1 on the track, 4.5:1 on surface).
- **Danger is the planet's red**, lifted to `#FF858B` to hold 4.5:1 as text on overlay, where dialogs show
  their errors (the art's `#EB282F` is 3.2:1 on raised; the first MM-554 value, `#FF6970`, was 3.9:1 on overlay).
- **Ion and protein stay one colour, as MM-375 decided (kept, not revisited)**, now the splash's cyan stars (`#45E9F2`).
  The art has no second free cool hue: its teal (`#239595`) is 3.0:1 on overlay, and lifted to 4.5:1 (about `#36C0C0`) it is 15
  ΔE from the cyan, too near to tell apart at caption size. The insight is a sentence with its own icon, protein a bar beside its "P".
- **Caution** is the splash sun's gold (`#FFC23D`), between the lime-yellow action and the tangerine; **info** a sky blue
  (`#8CC8FF`) and **water** a deeper blue (`#4F95FF`), both from the galaxy band.
- **Grade fills keep MM-370's categories and order** (A mint, B sunflower, C periwinkle, D orchid), re-tuned on the new
  levels; C moves to a violet periwinkle from the mountains, and B to a deeper sunflower (`#FFD24A`) away from the
  lime-yellow action. None is red, none is the action, and none equals a macro.
- **Cream text and MM-375's secondary text stay** (`#FFF8E9`, `#DDD4CC`, `#CBC6D6`): MM-375's hierarchy, still 7.4 and
  6.5 on the brighter overlay. Every ink (on-ion, on-danger, on-grade) is the new canvas.
- **A macro colour is a graphic colour, never text** (the product designer's and UX reviews): fat is 3.7:1 on raised and
  3.0:1 on overlay, under 4.5 for text. The macro split's names and figures were in their macro colour; they are now in
  the text colour, with a coloured key before each name, and the history chart's legend keeps its colour on the glyph
  only. A test holds that no stylesheet gives text a macro colour.
- **Positive is an icon or text colour only, never a filled control**: under protanopia it is 12 ΔE from the action.
- **A focused field shows a 2px inset ring** inside its border, not 1px, so the change of state reads clearly.
- **No macro graphic sits on overlay today**: the macro bars, the split ring and the macro figures are drawn on the
  canvas, cards and sheets (raised); dialogs, menus, popovers and snacks (overlay) show none. On overlay fat would be
  3.0:1 and carbs 4.2:1, so a macro graphic placed on a dialog later needs a fresh check.
- **Native launch colours are already the art's.** The Android launcher background (`#020016`) and the iOS launch screen
  (`#02010D`) are the splash art's own night sky, from the icon and splash work, and are shown before any palette is
  chosen; they are left as they are. Nothing native names a Martian token value.

No rule was bent: every token test holds, with the margins below.

### Old and new tokens, with contrast

Contrast is WCAG 2.x, computed with a stdlib script (recomputed after the design and UX reviews).

Levels, with each text role on them:

| Token | MM-375 | MM-554 | L* / C / h | text | text2 | text3 |
|---|---|---|---|---|---|---|
| canvas | `#110C35` | `#0E0233` | 3.4 / 33 / 303 | 18.5 | 13.4 | 11.7 |
| surface | `#1D1752` | `#1F0B5F` | 11.7 / 57 / 307 | 15.6 | 11.3 | 9.9 |
| raised | `#282066` | `#2E187B` | 18.6 / 65 / 306 | 13.0 | 9.4 | 8.2 |
| overlay | `#342A78` | `#3E2697` | 25.7 / 71 / 306 | 10.3 | 7.4 | 6.5 |
| sunken | `#0C082B` | `#070120` | 1.5 / 18 / 296 | 19.2 | 13.9 | 12.2 |
| track | `#342D6C` | `#372182` | 22.0 / 63 / 306 | 11.7 | 8.4 | 7.4 |
| selected | `#3F3684` | `#4B31A8` | 30.7 / 74 / 306 | 8.6 | 6.2 | 5.5 |
| outline | `#4F4890` | `#5F43B5` | 37.5 / 69 / 305 | 6.7 | 4.9 | 4.3 |

Text, colours and fills, on each level and on the track:

| Token | MM-375 | MM-554 | L* / C / h | canvas | surface | raised | overlay | track |
|---|---|---|---|---|---|---|---|---|
| outline-strong | `#9D9AD9` | `#B49BFF` | 69.7 / 55 / 303 | 8.44 | 7.14 | 5.92 | 4.70 | 5.33 |
| text | `#FFF8E9` | `#FFF8E9` | 97.7 / 8 / 91 | 18.47 | 15.62 | 12.95 | 10.29 | 11.66 |
| text2 | `#DDD4CC` | `#DDD4CC` | 85.4 / 5 / 71 | 13.36 | 11.30 | 9.37 | 7.45 | 8.44 |
| text3 | `#CBC6D6` | `#CBC6D6` | 80.7 / 9 / 303 | 11.71 | 9.90 | 8.21 | 6.53 | 7.39 |
| energy | `#FFF8E9` | `#FFF8E9` | 97.7 / 8 / 91 | 18.47 | 15.62 | 12.95 | 10.29 | 11.66 |
| ember | `#C4FF48` | `#DFF701` | 92.7 / 95 / 109 | 16.22 | 13.72 | 11.38 | 9.04 | 10.25 |
| ion | `#43F5E0` | `#45E9F2` | 85.0 / 42 / 203 | 13.20 | 11.16 | 9.26 | 7.36 | 8.34 |
| protein | `#43F5E0` | `#45E9F2` | 85.0 / 42 / 203 | 13.20 | 11.16 | 9.26 | 7.36 | 8.34 |
| carbs | `#FF9A3D` | `#FF7A1C` | 66.0 / 82 / 56 | 7.49 | 6.33 | 5.25 | 4.17 | 4.73 |
| fat | `#E84FAE` | `#EB3DA5` | 55.8 / 75 / 347 | 5.34 | 4.52 | 3.75 | 2.98 | 3.37 |
| positive | `#C4FF48` | `#8FE02A` | 81.5 / 89 / 125 | 11.96 | 10.12 | 8.39 | 6.67 | 7.56 |
| caution | `#FFD166` | `#FFC23D` | 81.9 / 72 / 82 | 12.12 | 10.25 | 8.50 | 6.76 | 7.66 |
| info | `#85CFFF` | `#8CC8FF` | 78.5 / 33 / 261 | 10.99 | 9.30 | 7.71 | 6.13 | 6.94 |
| water | `#4F9DFF` | `#4F95FF` | 62.0 / 60 / 281 | 6.58 | 5.57 | 4.62 | 3.67 | 4.16 |
| danger | `#FF938E` | `#FF858B` | 69.4 / 50 / 21 | 8.35 | 7.06 | 5.86 | 4.66 | 5.28 |
| grade-a | `#3FD08A` | `#3FD896` | 77.5 / 59 / 159 | 10.67 | 9.02 | 7.49 | 5.95 | 6.74 |
| grade-b | `#FFE45E` | `#FFD24A` | 85.9 / 70 / 88 | 13.55 | 11.46 | 9.50 | 7.55 | 8.56 |
| grade-c | `#A6B4FF` | `#B4A6FF` | 72.4 / 49 / 300 | 9.15 | 7.74 | 6.42 | 5.10 | 5.78 |
| grade-d | `#FF9EDB` | `#FF94DC` | 74.6 / 53 / 339 | 9.79 | 8.28 | 6.86 | 5.45 | 6.18 |

Labels on fills:

| Token | MM-375 | MM-554 | On |
|---|---|---|---|
| on-ember | `#172500` | `#1C2000` | ember 13.89 |
| on-ion | `#110C35` | `#0E0233` | ion 13.20 |
| on-danger | `#110C35` | `#0E0233` | danger 8.35 |
| on-grade | `#110C35` | `#0E0233` | A / B / C / D 10.67 / 13.55 / 9.15 / 9.79 |
| grade-edge | transparent | transparent | the fills hold 3:1 themselves |

The minimum of each rule `apps/mobile/test/tokens.test.ts` holds (threshold in brackets):
- text roles on canvas, surface, raised and overlay: text 10.3, text2 7.4, text3 6.5 (4.5).
- ion on the four levels: 7.4 (4.5). outline-strong on canvas, surface and raised: 5.9 (3).
- on canvas, surface, raised and overlay (overlay added by this ticket): the action as text 9.0; caution 6.8, info 6.1,
  danger 4.7, positive 6.7 (4.5).
- on-ember 13.9, on-danger 8.4 (4.5); on-ion 13.2; text on sunken 19.2 and on selected 8.6 (4.5).
- bars on the track: protein 8.3, carbs 4.7, fat 3.4, water 4.2 (3).
- grade letters on their fills: 9.2 (4.5); grade fills on canvas, surface and raised: 6.4 (3).
- macro L* gaps: protein-carbs 19.0, protein-fat 29.2, carbs-fat 10.2 (10).
- no macro equals water or a grade fill; no grade fill is the action; no stylesheet gives text a macro colour.

Colour-blind ΔE (Machado 2009; normal / protan / deutan / tritan): protein-carbs 121 / 80 / 91 / 120, protein-fat
115 / 46 / 25 / 130, carbs-fat 90 / 96 / 80 / 16 (tritan rests on the 10.2 L* gap and the labels, as in MM-375); the
action and positive 28 / 12 / 20 / 28 (one a filled button, the other an icon or text, never a fill); grade B and the
action 39 / 19 / 16 / 24; grade B and caution 9 / 5 / 4 / 9, closer than before because B moved off the lime (a grade is
always a lettered pill and caution never a fill, so they never meet in one form); carbs and danger under tritan 15.

This supersedes MM-375's Martian values; MM-375's other decisions (lime-family action, tangerine carbs, magenta fat,
near-neutral secondary text, categorical grade fills, ion equal to protein) stand.

## Description
The Martian block of `apps/mobile/src/theme/tokens.css` re-derived from the brand art, the recorded theme
(`apps/mobile/test/support/flutterTheme.json`, which the token test compares), `design/design-map.json`'s Martian palette,
and the Martian section of `design/color-and-theme-system.md`. From the reviews: the macro split's names and figures in the
text colour with a coloured key (`MacroSplitChart.tsx`, `charts.css`), the history legend's colour on its glyph only
(`HistoryChart.tsx`), a 2px focus ring on a field (`ui.css`), and the token tests' semantic colours checked on overlay. Light, Dark and the other palettes are unchanged.

## Acceptance Criteria
```gherkin
Scenario: The palette comes from the brand art
  Given the splash art and the icon art in design/brand
  Then the Martian canvas is the art's night sky, and surface, raised and overlay step towards the mountains' violet
  And the primary action is the "MARTIAN" lettering's lime-yellow
  And carbs are the "MACROS" tangerine and fat the stripes' hot magenta
  And the ticket records the measured art colours and every old and new value

Scenario: Cards stand off the canvas
  Given any screen story in Martian
  Then each step between canvas, surface, raised and overlay is at least 6 L*
  And cards, groups and the navigation bar are told apart from the canvas without their outlines

Scenario: Contrast holds
  Then every text role is at least 4.5:1 on canvas, surface, raised and overlay
  And ion, the action, caution, info, danger and positive are at least 4.5:1 on all four
  And the labels on the action, danger and ion, and every grade letter on its fill, are at least 4.5:1
  And the macro and water bars are at least 3:1 on the track, and every grade fill 3:1 on canvas, surface and raised

Scenario: A macro colour is never text
  Given the macro split and the history chart's legend
  Then each macro's name and figure is in the text colour, with the macro's colour on a key or glyph beside it
  And no stylesheet gives text the protein, carbs or fat colour

Scenario: Focus is clear
  Given a field
  When it takes focus
  Then its box shows a 2px ring in the text colour inside its border

Scenario: Meanings stay apart
  Then protein, carbs and fat each differ by at least 10 L*
  And no macro colour equals water or a grade fill, and no grade fill is the action colour
  And positive is not the action colour

Scenario: Only Martian changes
  Then the Light and Dark tokens are as they were
```

## Progress
Built (2026-10-22): the Martian tokens, the recorded theme the token test compares, the design map and the colour doc; the
art copied into `design/brand/`. The contrast and L* figures were computed with a stdlib script, not by the test suite.
Not run locally; CI validates (`apps/mobile/test/tokens.test.ts`).

Revised (2026-10-22, the product designer's and UX reviews of the PR): danger `#FF858B` for 4.5:1 on overlay, and the
token test now checks the semantic colours on overlay; fat `#EB3DA5`; grade B `#FFD24A`; text2 and text3 back to MM-375's;
the macro split and the history legend no longer write words in a macro colour, held by
`apps/mobile/test/charts/macroColourNotText.test.tsx`; a 2px focus ring on a field. Every ratio above recomputed. Not run
locally; CI validates.

## UI/UX
- `Design system/Tokens` in Martian, against the art in `design/brand/`.
- The Dashboard, Food (grade badges, macro bars), Workout, Coach (insight lines in ion) and Settings stories in Martian:
  cards and the navigation bar off the canvas, the lime-yellow action, tangerine and magenta bars.
- `Charts` stories: the macro split's names and figures in cream with a coloured key before each name; the history
  legend's coloured glyphs. Any field story, focused: the 2px ring.

## Owed on a phone
- Martian at low screen brightness: cards, groups and the navigation bar still told apart from the canvas, and the
  saturated surfaces not vibrating under cream text.
- Sheets, dialogs and menus (overlay `#3E2697`, chroma 71): if they read too vivid on a phone, the product designer's
  fallback is overlay `#382A88`, to be checked against every overlay ratio before it ships.
- The splash beside the app: the launch screen's night sky running into the Martian canvas without a jarring jump.
