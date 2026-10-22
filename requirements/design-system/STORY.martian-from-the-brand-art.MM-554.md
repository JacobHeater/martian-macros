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
- **Carbs are the "MACROS" tangerine** (`#FF7A1C`), **fat the stripes' hot magenta** (`#E8329E`: the art's `#D40F9C`
  lifted to hold 3:1 on the track; at the art's own value fat is 2.6:1 there). The two stay 12.0 L* apart.
- **Danger is the planet's red**, lifted to `#FF6970` to hold 4.5:1 as text on raised (the art's `#EB282F` is 3.2:1).
- **Ion and protein stay one colour, as MM-375 decided (kept, not revisited)**, now the splash's cyan stars (`#45E9F2`).
  The art has no second free cool hue: its teal (`#239595`) is 3.0:1 on overlay, and lifted to 4.5:1 (about `#36C0C0`) it is 15
  ΔE from the cyan, too near to tell apart at caption size. The insight is a sentence with its own icon, protein a bar beside its "P".
- **Caution** is the splash sun's gold (`#FFC23D`), between the lime-yellow action and the tangerine; **info** a sky blue
  (`#8CC8FF`) and **water** a deeper blue (`#4F95FF`), both from the galaxy band.
- **Grade fills keep MM-370's categories and order** (A mint, B sunflower, C periwinkle, D orchid), re-tuned on the new
  levels; C moves to a violet periwinkle from the mountains. None is red, none is the action, and none equals a macro.
- **Cream text stays** (MM-375's "Still Martian"); text2 and text3 are a step lighter to keep their margin on the brighter
  overlay. Every ink (on-ion, on-danger, on-grade) is the new canvas.
- **Native launch colours are already the art's.** The Android launcher background (`#020016`) and the iOS launch screen
  (`#02010D`) are the splash art's own night sky, from the icon and splash work, and are shown before any palette is
  chosen; they are left as they are. Nothing native names a Martian token value.

No rule was bent: every token test holds, with the margins below.

### Old and new tokens, with contrast

Contrast is WCAG 2.x, computed with a stdlib script; "c / s / r / o" is canvas / surface / raised / overlay.

| Token | MM-375 | MM-554 | L* / C / h | Contrast |
|---|---|---|---|---|
| canvas | `#110C35` | `#0E0233` | 3.4 / 33 / 303 | text 18.5, text2 14.0, text3 12.4 |
| surface | `#1D1752` | `#1F0B5F` | 11.7 / 57 / 307 | text 15.6, text2 11.9, text3 10.5 |
| raised | `#282066` | `#2E187B` | 18.6 / 65 / 306 | text 13.0, text2 9.9, text3 8.7 |
| overlay | `#342A78` | `#3E2697` | 25.7 / 71 / 306 | text 10.3, text2 7.8, text3 6.9 |
| sunken | `#0C082B` | `#070120` | 1.5 / 18 / 296 | text 19.2 |
| track | `#342D6C` | `#372182` | 22.0 / 63 / 306 | text 11.7 |
| selected | `#3F3684` | `#4B31A8` | 30.7 / 74 / 306 | text 8.6, ember 7.6 |
| outline | `#4F4890` | `#5F43B5` | 37.5 / 69 / 305 | hairline |
| outline-strong | `#9D9AD9` | `#B49BFF` | 69.7 / 55 / 303 | c / s / r / o 8.4 / 7.1 / 5.9 / 4.7 |
| text | `#FFF8E9` | `#FFF8E9` | 97.7 / 8 / 91 | see the levels |
| text2 | `#DDD4CC` | `#E3D9D0` | 87.2 / 6 / 71 | see the levels |
| text3 | `#CBC6D6` | `#D2CBE0` | 82.8 / 11 / 304 | see the levels |
| ember | `#C4FF48` | `#DFF701` | 92.7 / 95 / 109 | c / s / r / o 16.2 / 13.7 / 11.4 / 9.0 |
| on-ember | `#172500` | `#1C2000` | 11.1 / 18 / 115 | 13.9 on ember |
| ion | `#43F5E0` | `#45E9F2` | 85.0 / 42 / 203 | c / s / r / o 13.2 / 11.2 / 9.3 / 7.4 |
| on-ion | `#110C35` | `#0E0233` | | 13.2 on ion |
| energy | `#FFF8E9` | `#FFF8E9` | | as text |
| protein | `#43F5E0` | `#45E9F2` | 85.0 / 42 / 203 | 8.3 on track |
| carbs | `#FF9A3D` | `#FF7A1C` | 66.0 / 82 / 56 | c / s / r / o 7.5 / 6.3 / 5.3 / 4.2; 4.7 on track |
| fat | `#E84FAE` | `#E8329E` | 53.9 / 77 / 348 | c / s / r / o 5.0 / 4.2 / 3.5 / 2.8; 3.2 on track |
| positive | `#C4FF48` | `#8FE02A` | 81.5 / 89 / 125 | c / s / r 12.0 / 10.1 / 8.4 |
| caution | `#FFD166` | `#FFC23D` | 81.9 / 72 / 82 | c / s / r 12.1 / 10.3 / 8.5 |
| info | `#85CFFF` | `#8CC8FF` | 78.5 / 33 / 261 | c / s / r 11.0 / 9.3 / 7.7 |
| water | `#4F9DFF` | `#4F95FF` | 62.0 / 60 / 281 | 4.2 on track |
| danger | `#FF938E` | `#FF6970` | 63.8 / 63 / 24 | c / s / r 7.0 / 5.9 / 4.9 |
| on-danger | `#110C35` | `#0E0233` | | 7.0 on danger |
| grade-a | `#3FD08A` | `#3FD896` | 77.5 / 59 / 159 | c / s / r 10.7 / 9.0 / 7.5; letter 10.7 |
| grade-b | `#FFE45E` | `#FFE14D` | 89.7 / 73 / 94 | c / s / r 15.0 / 12.7 / 10.5; letter 15.0 |
| grade-c | `#A6B4FF` | `#B4A6FF` | 72.4 / 49 / 300 | c / s / r 9.2 / 7.7 / 6.4; letter 9.2 |
| grade-d | `#FF9EDB` | `#FF94DC` | 74.6 / 53 / 339 | c / s / r 9.8 / 8.3 / 6.9; letter 9.8 |
| on-grade | `#110C35` | `#0E0233` | | the letters above |
| grade-edge | transparent | transparent | | the fills hold 3:1 themselves |

The minimum of each rule `apps/mobile/test/tokens.test.ts` holds (threshold in brackets):
- text roles on canvas, surface, raised and overlay: text 10.3, text2 7.8, text3 6.9 (4.5).
- ion on the four levels: 7.4 (4.5). outline-strong on canvas, surface and raised: 5.9 (3).
- the action as text on canvas, surface and raised 11.4; caution 8.5, info 7.7, danger 4.9, positive 8.4 (4.5).
- on-ember 13.9, on-danger 7.0 (4.5); on-ion 13.2; text on sunken 19.2 and on selected 8.6 (4.5).
- bars on the track: protein 8.3, carbs 4.7, fat 3.2, water 4.2 (3).
- grade letters on their fills: 9.2 (4.5); grade fills on canvas, surface and raised: 6.4 (3).
- macro L* gaps: protein-carbs 19.0, protein-fat 31.1, carbs-fat 12.0 (10).
- no macro equals water or a grade fill; no grade fill is the action.

Colour-blind ΔE (Machado 2009; normal / protan / deutan / tritan): protein-carbs 121 / 80 / 91 / 120, protein-fat
117 / 48 / 27 / 133, carbs-fat 89 / 96 / 79 / 18 (tritan rests on the 12.0 L* gap and the labels, as in MM-375); the
action and positive 28 / 12 / 20 / 28 (one a filled button, the other an icon or text); grade B and caution
17 / 10 / 7 / 16 and grade B and the action 31 / 14 / 14 / 17 (a grade is always a lettered pill); carbs and danger under
tritan 7 (a bar beside its label, against text and icons).

This supersedes MM-375's Martian values; MM-375's other decisions (lime-family action, tangerine carbs, magenta fat,
near-neutral secondary text, categorical grade fills, ion equal to protein) stand.

## Description
The Martian block of `apps/mobile/src/theme/tokens.css` re-derived from the brand art, the recorded theme
(`apps/mobile/test/support/flutterTheme.json`, which the token test compares), `design/design-map.json`'s Martian palette,
and the Martian section of `design/color-and-theme-system.md`. Light, Dark and the other palettes are unchanged.

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
  And ion is at least 4.5:1 on all four, and the action, caution, info, danger and positive on canvas, surface and raised
  And the labels on the action, danger and ion, and every grade letter on its fill, are at least 4.5:1
  And the macro and water bars are at least 3:1 on the track, and every grade fill 3:1 on canvas, surface and raised

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

## UI/UX
- `Design system/Tokens` in Martian, against the art in `design/brand/`.
- The Dashboard, Food (grade badges, macro bars), Workout, Coach (insight lines in ion) and Settings stories in Martian:
  cards and the navigation bar off the canvas, the lime-yellow action, tangerine and magenta bars.

## Owed on a phone
- Martian at low screen brightness: cards, groups and the navigation bar still told apart from the canvas, and the
  saturated surfaces not vibrating under cream text.
- The splash beside the app: the launch screen's night sky running into the Martian canvas without a jarring jump.
