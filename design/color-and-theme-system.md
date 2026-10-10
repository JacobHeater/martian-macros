# Color and theme system

Status: proposed values, checked numerically, **not yet reviewed rendered on a
device**. Judge them in [palette-preview.html](palette-preview.html) before
building. Every number below was computed (WCAG 2.x contrast; CIE L*; CVD
simulation with the Machado 2009 matrices) rather than estimated.

## 1. Strategy

### Approved Martian palette (MM-184)

The owner approved the retro '90s concept in
[palette-preview.html](palette-preview.html) as the **new-install default**.
It is a deliberate alternative to the Light/Dark direction below, not a
replacement for existing users' choices. New installations preview Martian,
Light, Dark or System before onboarding, saving only on Continue. Settings
offers the same four choices. Upgrades keep the old preference (System when
none was saved); erasing all data restarts the initial choice.

Martian keeps the same semantic roles and accessibility thresholds:

| Roles | Martian values |
|---|---|
| canvas / surface / raised / overlay | `#120B29` / `#20143D` / `#2C1B4C` / `#382558` |
| sunken / track / selected | `#180F30` / `#40305E` / `#423261` |
| outline / outlineStrong | `#594576` / `#A18BBE` |
| text / text2 / text3 | `#FFF8E9` / `#D8C7EF` / `#BAA4D3` |
| action / on-action | `#C4FF48` / `#172500` |
| measurement / on-measurement | `#43F5E0` / `#120B29` |
| protein / carbs / fat | `#43F5E0` / `#FF80BB` / `#9170ED` |
| positive / caution / info | `#C4FF48` / `#FFD166` / `#85CFFF` |
| danger / on-danger | `#FF938E` / `#120B29` |

Energy uses cream text. The existing `ember` semantic role now means an
acid-lime action in Martian; it does not imply orange. Deep grape and cream
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
