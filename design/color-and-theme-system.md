# Color and theme system

Status: proposed values, checked numerically, **not yet reviewed rendered on a
device**. Judge them in
the Tokens story in Storybook (`mm storybook`, MM-237). Every number below was computed (WCAG 2.x contrast; CIE L*; CVD
simulation with the Machado 2009 matrices) rather than estimated.

## 1. Strategy

### Approved Martian palette (MM-184)

The owner approved the retro '90s concept, from an HTML palette preview
since replaced by Storybook (MM-237), as the
**new-install default**.
It is a deliberate alternative to the Light/Dark direction below, not a
replacement for existing users' choices. New installations preview Martian,
Light, Dark or System before onboarding, saving only on Continue. Settings
offers the same four choices. Upgrades keep the old preference (System when
none was saved); erasing all data restarts the initial choice.

Martian keeps the same semantic roles and accessibility thresholds:

| Roles | Martian values |
|---|---|
| canvas / surface / raised / overlay | `#0A081B` / `#16122E` / `#211B3F` / `#2C2550` |
| sunken / track / selected | `#050410` / `#331A70` / `#4824AD` |
| chosen / on-chosen | `#C4F24F` / `#0A081B` |
| outline / outlineStrong | `#3F3670` / `#C77DFF` |
| edge / glow | `#6B3DF5` / edge at 45% |
| accent-line | `#FF3D8B` |
| title-from / title-to | `#F3F552` / `#FF6A2C` |
| mark | `#B98CFF` |
| text / text2 / text3 | `#FFF8E9` / `#DDD4CC` / `#CBC6D6` |
| action / on-action | `#DFF701` / `#1C2000` |
| measurement / on-measurement | `#45E9F2` / `#0A081B` |
| protein / carbs / fat | `#45E9F2` / `#FF7A1C` / `#EB3DA5` |
| positive / caution / info | `#8FE02A` / `#FFC23D` / `#8CC8FF` |
| water | `#4F95FF` |
| danger / on-danger | `#FF858B` / `#0A081B` |

**From the brand art (MM-554, the owner 2026-10-22).** "The icon set and splash screen now will drive the tokens for
martian color scheme." The art is recorded in [brand/splash-art.png](brand/splash-art.png) and
[brand/icon-art.png](brand/icon-art.png), and every Martian token above is drawn from it
(`requirements/design-system/STORY.martian-from-the-brand-art.MM-554.md` has the measured art colours and the old and new
values side by side):
- **The levels sit on the near-black behind the lettering (MM-555, the owner 2026-10-22).** The canvas is `#0A081B`,
  and surface, raised and overlay step up from it in the same hue at L* 2.9 / 7.2 / 12.4 / 17.6, at low chroma, so no
  level reads purple and the brights carry the colour. (MM-554 had climbed from the sky's indigo into the mountains'
  purple; the owner: "i want that to be the base bg color and the brights to be the accents, button bg colors".)
- **The blacklight (MM-556, the owner 2026-10-22: "more of that high contrast, 90's, blacklight look ... more of these
  colors in the palette as first class citizens").** The art's violets, purples and hot pink, which had no role, are the
  structure: cards, groups, choice cards and dialogs wear a violet edge (`edge`) that glows (`glow`); the hero and the
  navigation bar a hot-pink line (`accent-line`) with its glow; a screen's title runs from the lettering's lime-yellow into
  tangerine (`title-from` / `title-to`, 16.9 and 6.9 on the canvas); a section's mark is the mountains' lilac (`mark`,
  6.4 on raised); the track, the chosen fill and the field edge are deeper, more saturated violets. In Dark and Light the
  new roles equal their outline, text and secondary text, with no line or glow.
- **The brights are the fills.** A chosen segment and the current tab's plate are lit in the stripes' lime (`chosen`,
  `#C4F24F`) with the canvas as ink (`on-chosen`); in Dark and Light `chosen` is their `selected`.
- **The action is the "MARTIAN" lettering's lime-yellow** (`#DFF701`, the art's own value). Positive, which was the
  action colour, takes the art's lime stripe (`#8FE02A`), so success no longer looks like a button.
- **Carbs are the "MACROS" tangerine** (`#FF7A1C`) and **fat the stripes' and rims' hot magenta** (`#EB3DA5`, the art's
  `#D40F9C` lifted to hold 3:1 on the track). Danger is the ringed planet's red, lifted to `#FF858B` for 4.5:1 text on
  overlay, where dialogs show their errors.
- **Ion and protein stay one colour, as MM-375 decided**, now the splash's cyan stars (`#45E9F2`).
- Cream text and MM-375's secondary text stay (`#FFF8E9`, `#DDD4CC`, `#CBC6D6`).
- **A macro colour is a graphic colour, never text.** Fat is 3.7:1 on raised and 3.0:1 on overlay, so a macro's name and
  figure are in the text colour, with the macro's colour on a key, glyph, bar or sector beside them
  (`test/charts/macroColourNotText.test.tsx`). No macro graphic sits on overlay today; one placed there needs 3:1 checked.
- **Positive is an icon or text colour only, never a filled control**: under protanopia it is 12 ΔE from the action, so
  a positive fill could pass for a button.

Computed (WCAG, on canvas / surface / raised / overlay; MM-555): text 18.7 / 17.1 / 15.4 / 13.3, text2 13.5 / 12.4 / 11.1 / 9.7,
text3 11.8 / 10.9 / 9.7 / 8.5; ion 13.3 / 12.2 / 11.0 / 9.5; outlineStrong 8.0 / 7.3 / 6.6 / 5.7; the action as text 16.4 / 15.0 / 13.5 / 11.7;
danger 8.4 / 7.7 / 6.9 / 6.0; caution 12.3 / 11.2 / 10.1 / 8.8; info 11.1 / 10.2 / 9.1 / 7.9; positive 12.1 / 11.1 / 9.9 / 8.6; carbs 7.6 / 6.9 / 6.2 / 5.4
and fat 5.4 / 5.0 / 4.4 / 3.9 (graphics). On-action 13.9, on-measurement 13.3, on-danger 8.4, on-chosen 15.2. Bars on the track:
protein 9.3, carbs 5.3, fat 3.8, water 4.6. Macro L*: protein 85.0,
carbs 66.0, fat 55.8 (gaps 19.0, 29.2, 10.2). Colour-blind ΔE (Machado 2009, normal / protan / deutan / tritan):
protein-carbs 121 / 80 / 91 / 120, protein-fat 115 / 46 / 25 / 130, carbs-fat 90 / 96 / 80 / 16; carbs and fat under
tritan rest on the 10.2 L* gap and the labels, as before. The MM-375 figures below
are that palette's, kept as its record.

**Warmer, without the washout (MM-375, approved by the owner 2026-10-17).** The first Martian put every neutral, both
secondary text colours, the tracks, the selected state and the fat macro in one violet band (CIE hue 301-309°, chroma
21-35), so the screen read as one purple field and the only colour that stood out was the lime. The revision, from the
panel's 90s research (`docs/agent-runs/mm375-warm-martian/`):
- **A royal 90s violet**, bluer than the grape it replaces, with larger lightness steps (canvas 5.8, surface 12.5, raised
  17.7, overlay 22.8 L*) so cards and the navigation bar stand off the canvas. A plum (hue about 329°) was drawn first and
  rejected by the owner: it reads maroon, not a 90s purple.
- **Secondary text near-neutral** (`text2` a warm off-white, `text3` a cool grey-lilac at chroma 9), so detail lines stop
  reading as part of the ground. This is a deliberate exception to the ban on desaturated warm neutrals, for text roles in
  Martian only; surfaces stay free of beige, sand and tan.
- **The warm voice is a 90s tangerine** (carbs) beside the lime action, the Nickelodeon-era pairing, and **fat moves out of
  the neutrals' hue to hot magenta**. Lime stays the one action colour (the owner, 2026-10-17).
- In Martian the rule "Ember is the only warm hue" (below) reads "one action colour, used as a solid"; carbs, caution,
  danger and the grade fills are warm by role.

Computed (WCAG; CIE L*): `text2` 12.7 / 11.1 / 9.6 / 8.2 (L* 85.4, toned down from `#EDE4DC` at the UX guard's UX-5 so
the detail lines sit clearly under the primary text) and `text3` 11.2 / 9.7 / 8.5 / 7.2 on canvas / surface /
raised / overlay; `outlineStrong` 7.1 / 6.2 / 5.4 / 4.6; carbs 8.8 / 7.7 / 6.7 / 5.7; fat 5.5 / 4.8 / 4.1 / 3.5 (a graphic,
never small text). Bars on the track: protein 8.8, carbs 5.7, fat 3.5, water 4.4. Macro L*: protein 87.9, carbs 72.7, fat
57.9 (gaps 15.2, 14.8, 30.0). A brighter magenta (`#FF5CB8`) was tried and left at 9.0 L* from carbs, under the rule.
Colour-blind ΔE (Machado 2009): protein-carbs 104 / 61 / 71 / 112, protein-fat 121 / 54 / 24 / 124, carbs-fat 90 / 93 / 77
/ 22 (normal / protan / deutan / tritan); carbs and fat under tritan rest on the 14.8 L* gap and the labels.

These are now held by `apps/mobile/test/tokens.test.ts` in every palette: every text role 4.5:1 on all four levels, the
macros at least 10 L* apart, and every grade letter 4.5:1 on its fill. (The Flutter app's contrast tests were not carried
over until MM-375.)

### Grade fills (MM-370)

One solid fill per letter band, categorical rather than a ramp: no red (MM-108: no red for intake), and C and D leave the
traffic-light hues, so the set never completes a traffic light, though A green and B yellow start one. The letter is always
printed and carries the meaning.

| Band | Martian | Dark | Light | Letter on fill (M / D / L) |
|---|---|---|---|---|
| A mint | `#3FD896` | `#3FC98A` | `#3DBD7F` | 10.7 / 9.2 / 7.8 |
| B sunflower | `#FFD24A` | `#F7DC5A` | `#F2D23C` | 13.6 / 14.2 / 12.5 |
| C periwinkle | `#B4A6FF` | `#A3B1FF` | `#97A6F2` | 9.2 / 9.5 / 8.1 |
| D orchid | `#FF94DC` | `#F79BD6` | `#EE8FCC` | 9.8 / 9.8 / 8.4 |

A and B were swapped at the UX guard's UX-2: with sunflower on A, the best grade wore the app's caution gold and the
second wore a "good" green. The letter is in the palette's canvas ink (`--on-grade`). In light the fills are pale against
white, so the badge keeps an `outlineStrong` edge (`--grade-edge`). Pressed, a badge keeps its fill and letter and shows a
ring (MM-376).

Close pairs (Machado 2009 ΔE, Martian since MM-554, normal / protan / deutan / tritan): B against caution 9 / 5 / 4 / 9
(closer since B moved off the lime action); B against the lime-yellow action 39 / 19 / 16 / 24; A against info under tritan 17; C against info 31 / 15 / 9 / 30; C
against water 23 / 15 / 24 / 30; D against fat 31 / 23 / 18 / 40; A and the dark palette's positive 11 / 11 / 10 / 6;
adjacent grades A-B 75 / 45 / 53 / 71, B-C 115 / 116 / 113 / 36, C-D 34 / 15 / 28 / 48. Martian's grade fills moved a
little with MM-554 (C to a violet periwinkle from the mountains, B to a deeper sunflower away from the action, the others re-tuned on the
new levels); their roles and
order are MM-370's. These rest on form, not colour: a grade is always a lettered pill, never a
bar, an action or a chart mark, and caution is never a fill.

Energy uses cream text. The existing `ember` semantic role now means a
lime-yellow action in Martian (MM-554, from the brand art's lettering); it does not imply orange. Night-sky violet and cream
are intentional exceptions to the old neutral restrictions, scoped to this
palette. Cards and primary floating actions use 12 dp corners and navigation
indicators use 8 dp corners. Primary actions remain flat: no glow, halo or
interaction elevation. Macro labels remain present alongside colors.

Automated tests cover text on all four surface levels, filled controls,
graphic contrast, tracks, navigation, and at least 10 L* between macros.

1. **Do not use a seed palette.** `ColorScheme.fromSeed` / `colorSchemeSeed`
   invents every surface, container and tertiary from one hue. With a rust seed
   this is what produces the pale salmon containers, tinted beige surfaces and
   olive-brown tertiary. Define every `ColorScheme` role explicitly.
2. **Four layers of neutral, cool, with a measurable step between them.**
   Hierarchy comes from surface level, not from borders and tints on everything.
3. **One hot accent, used as a solid.** Ember is the only warm hue in the UI.
4. **One cool measurement hue.** Ion means "this is measured or estimated by the
   engine".
5. **Three macro hues**, separated by lightness as well as hue, so they survive
   grayscale and the common color-vision deficiencies.
6. **Semantic state colors are rare** and each has exactly one job.

### The rule that prevents mud

**Ember is never tinted, washed, faded or used as a background.** It appears only
as a solid fill (the primary action), a solid icon or text color, or a stroke.
A pale tint of a red-orange is peach, and peach is the failure mode. Selected
states use the cool `selected` neutral with an Ember icon and label, not an
Ember wash. The same applies to caution and info: icons, strokes and text carry
the color, never a pastel fill.

### Forbidden

Beige, cream, sand, tan, brown, clay, terracotta, dusty pink, salmon, peach,
olive, any desaturated warm neutral, purple-to-blue "AI" gradients, pure black
(`#000`) canvases, pure white (`#FFF`) text on dark, neon outer glows.

## 2. Neutrals (cool ink, not gray-brown)

| Role | Dark | Light | Used for |
|---|---|---|---|
| `canvas` | `#090D15` | `#F3F5FA` | Page background |
| `surface` | `#101624` | `#FFFFFF` | Grouped content (cards, lists) |
| `raised` | `#171F32` | `#FFFFFF` | Nav bar, sheets, menus |
| `overlay` | `#1F2A42` | `#FFFFFF` | Dialogs, popovers (dark only gets a visible step) |
| `sunken` | `#0D1220` | `#E8ECF5` | Wells, input fills, skeletons |
| `track` | `#1F2940` | `#EBEFF7` | Empty part of progress bars and arcs |
| `selected` | `#1C2842` | `#E3E8F5` | Selected row, chip, nav indicator |
| `outline` | `#2B3853` | `#CBD3E3` | Dividers, card hairlines (decorative) |
| `outlineStrong` | `#5A6A8C` | `#7C88A3` | Input and control boundaries (needs 3:1) |
| `text` | `#ECF0F8` | `#0C1220` | Primary text, figures |
| `text2` | `#A9B4CA` | `#46526B` | Secondary text |
| `text3` | `#8F9BB5` | `#5A6680` | Captions, disabled-looking-but-readable labels |

Dark mode steps lighter as things come closer (canvas → surface → raised →
overlay). Light mode keeps cards white on a cool-gray canvas and separates them
with a 1 dp `outline` hairline and a very soft shadow, not with a tint.

## 3. Brand and measurement

| Token | Dark | Light | Job |
|---|---|---|---|
| `ember` | `#FF6A45` | `#CC3210` | Primary action, current-location indicator, links. **Solid only.** |
| `onEmber` | `#1A0802` | `#FFFFFF` | Text/icon on an Ember fill |
| `ion` | `#3FD8F0` | `#0A7890` | Trend line, estimate band, anything the engine inferred |
| `energy` | `#ECF0F8` | `#0C1220` | The calorie arc ("starlight" in dark, ink in light) |

`energy` deliberately reuses the primary text color: the calorie figure is the
hero number and its arc should be the highest-contrast mark on the screen
without spending a hue. The arc's marker dot may carry an `ion` glow in dark
mode only.

## 4. Macros

| Token | Dark | Light | CIE L* dark / light |
|---|---|---|---|
| `protein` | `#5B9DFF` | `#1646A6` | 65 / 32 |
| `carbs` | `#F6C453` | `#BF7A00` | 82 / 57 |
| `fat` | `#7F57FF` | `#7448E6` | 50 / 44 |

Blue, gold, violet. The lightness order differs by theme (dark: carbs > protein >
fat; light: carbs > fat > protein), so **the label is always present** and the
bars are never the only encoding. Protein is the emphasised macro (taller bar,
`text` weight value) because it is the recomp-critical one.

Macro colors appear only on macro bars, legends and entry-row letters. Never as
decoration, never for anything that is not that macro.

## 5. State colors (each has one job)

| Token | Dark | Light | Job |
|---|---|---|---|
| `positive` | `#4FDB8A` | `#117A3E` | A permitted achievement (strength PR, waist measurement down). **Never** for eating less or weighing less |
| `caution` | `#FFB84D` | `#8F5600` | Health/safety notices |
| `info` | `#7FB8FF` | `#1C62C9` | Explanations, calibration status |
| `danger` | `#FF7A7A` | `#B3261E` | Destructive actions only (erase, delete) |

Applied as icon color, text color or 1 dp stroke on a neutral surface. Never as
a fill wash. Being over a calorie target uses `text`, not `danger`.

### Water (MM-326)

| Token | Martian | Dark | Light | Job |
|---|---|---|---|---|
| `water` | `#4F9DFF` | `#1E88C8` | `#1590D8` | The fill of the water bar on Food, and nothing else |

A blue kept at least 10 L* from each palette's protein and ion, one solid hue,
no gradient. Computed (WCAG contrast; CIE L* difference):

| | Martian | Dark | Light |
|---|---|---|---|
| Against `track` | 4.2 | 3.7 | 3.0 |
| Against `canvas` | 6.9 | 5.0 | 3.2 |
| L* from `protein` | -23.8 | -10.5 | +24.6 |
| L* from `ion` | -23.8 | -25.8 | +10.8 |
| L* from `info` | -15.9 | -19.5 | +14.1 |

## 6. Measured contrast

Text roles need 4.5:1 (large text 3:1). Fills, lines and icons need 3:1.

**Dark** (`canvas / surface / raised / overlay`)

| Token | canvas | surface | raised | overlay |
|---|---|---|---|---|
| `text` | 17.0 | 15.8 | 14.4 | 12.5 |
| `text2` | 9.3 | 8.7 | 7.9 | 6.9 |
| `text3` | 7.0 | 6.5 | 5.9 | 5.1 |
| `ember` | 6.9 | 6.4 | 5.8 | 5.0 |
| `ion` | 11.4 | 10.6 | 9.6 | 8.4 |
| `protein` | 7.1 | 6.6 | 6.0 | 5.3 |
| `carbs` | 12.0 | 11.1 | 10.1 | 8.8 |
| `fat` | 4.4 | 4.1 | 3.7 | 3.2 (graphic only; never small text) |
| `caution` | 11.3 | 10.5 | 9.6 | 8.3 |
| `info` | 9.4 | 8.8 | 8.0 | 6.9 |
| `danger` | 7.7 | 7.2 | 6.5 | 5.7 |
| `positive` | 11.0 | 10.2 | 9.3 | 8.1 |
| `outlineStrong` | 3.6 | 3.3 | 3.0 | 2.6 (**do not use on overlay**) |

`onEmber` on `ember` is 6.9. `ember` on `selected` is 5.2.

**Light** (`canvas / surface / sunken`)

| Token | canvas | surface | sunken |
|---|---|---|---|
| `text` | 17.1 | 18.7 | 15.8 |
| `text2` | 7.2 | 7.8 | 6.6 |
| `text3` | 5.3 | 5.8 | 4.9 |
| `ember` | 4.8 | 5.2 | 4.4 (**not for text on sunken**) |
| `ion` | 4.7 | 5.1 | 4.3 (**not for text on sunken**) |
| `protein` | 7.8 | 8.5 | 7.2 |
| `carbs` | 3.2 | 3.5 | 3.0 (fill only; never text) |
| `fat` | 5.1 | 5.5 | 4.7 |
| `caution` | 5.5 | 6.0 | 5.1 |
| `info` | 5.3 | 5.8 | 4.9 |
| `danger` | 6.0 | 6.5 | 5.5 |
| `positive` | 5.0 | 5.4 | 4.6 |
| `outlineStrong` | 3.3 | 3.6 | 3.0 |

`onEmber` on `ember` is 5.2. `ember` on `selected` is 4.2 (icon and label, large
or bold; do not use for small body text on a selected fill).

**Bars against their track:** dark protein 5.3, carbs 8.9, fat 3.2; light protein
7.4, carbs 3.0, fat 4.8. Calorie arc against track: 12.7 dark, 16.2 light.

### Color-blind and grayscale checks

Pairwise ΔE (CIE76, simulated; > ~20 is clearly distinguishable):

| Pair | Dark: normal / deutan / protan / tritan | Light: normal / deutan / protan / tritan |
|---|---|---|
| protein–fat | 54 / 25 / 30 / 30 | 39 / 20 / 24 / 18 |
| protein–carbs | 118 / 122 / 115 / 69 | 122 / 124 / 113 / 72 |
| fat–carbs | 152 / 144 / 141 / 58 | 142 / 137 / 132 / 62 |

Protein vs. fat is the weakest pair, and in light mode under deutan (20) and
tritan (18) is at or just under the line. That is acceptable only because the lightness gap (dark 15
L*, light 12 L*), the always-visible text label, and the protein bar being
taller all independently carry the distinction. Do not remove any of the three.
`ion` vs. `protein` is ΔE 35-39 under deutan/protan but 21 (dark) and 18 (light)
under tritan; they are never plotted on the same chart and differ in form (line vs.
bar). Verify with a real simulator in the gallery (MM-105).
In Martian they are one aqua (MM-375, settled by default on 2026-10-21): no free hue
holds 4.5:1 as caption text on overlay without sitting next to the action or in the
canvas's violet band, so they are told apart by form alone: the insight is a sentence
with its icon, protein a bar beside its "P".

## 7. Theme structure

Same role names in both themes; values differ.

- **Light:** cool-gray canvas, white grouped surfaces with hairline + soft
  shadow, ink text, deeper (700-ish) accent values to hold 4.5:1.
- **Dark:** ink-navy canvas, surfaces step lighter with elevation, no shadows
  needed (shadows on dark are nearly invisible; use surface step and a 1 dp
  top-edge highlight of `text` at 6%), brighter accent values, off-white text.
- The `ember` hue shifts (`#FF6A45` vs `#CC3210`) because one value cannot be
  both luminous on dark and 4.5:1 on white. It is the same identity at two
  luminances. Never mix the two values in one theme.

## 8. The space signature (color usage)

Gradients are allowed in exactly three cases and nowhere else:

| Name | What | Where | Budget |
|---|---|---|---|
| **Limb glow** | Radial `ion` at 12% (dark) / 8% (light) fading to transparent, from the card's top-trailing corner, ~60% radius | One hero surface per screen: Today hero, Coach confidence, onboarding welcome | Max one per screen. Never behind body text |
| **Horizon arc** | The calorie arc itself (a shallow orbital curve) in `energy` on `track` | Today hero only | One |
| **Primary action** | Solid `ember` with `onEmber` foreground; no halo or shadow (MM-181) | Both themes | One primary action |

No gradient has two hues. There is no purple-to-blue, no sunrise gradient, no
mesh gradient.

## 9. Usage budget (anti-sludge)

Per screen, at most: one Ember-filled element, one Ion element group (a trend
line plus its band counts as one), and the three macro colors only where macros
are shown. If a screen needs more color than that, it needs less content.

Exception (the owner, 2026-10-17): the coach's inline insight lines are drawn in
ion (MM-362), and all of a screen's insight lines count as one more ion group.
Grade fills (MM-370) are lettered badges and are not counted against the budget.
