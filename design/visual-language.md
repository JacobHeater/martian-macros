# Visual language

## Character

**A precision performance instrument with a cosmic signature.** Sharp, confident,
optimistic. Think the clarity of a good training watch or a pro cycling computer,
the craft of a premium banking or transit app, and one distinctive graphic idea
borrowed from orbital mechanics. Not a wellness spa, not a game, not a spaceship.

It should look immediately different from commodity calorie trackers: those are
white lists with a green ring. This is a deep, cool canvas (or a crisp near-white
one), large clean figures, one hot action, and an arc.

### What it must feel like
Sharp. Modern. Alive. Trustworthy. Optimistic. Premium. **Not** dusty, generic,
soft in the wrong way, depressing, or like an AI prototype.

### The identity in three marks

1. **Ember** (the hot color). Vivid Mars red-orange as a solid. The only warm hue.
2. **Ion** (the cool color). The blue-cyan of a Martian sunset. Means "estimated".
3. **The horizon arc.** The calorie progress is a shallow orbital curve with a
   small body travelling along it. It is the app's one signature graphic.

Everything else is neutral and quiet so those three can work.

## Layout and surfaces

- **Four surface levels** (canvas, surface, raised, overlay); see the color
  doc. Content sits on `surface`; chrome (nav bar, sheets) is `raised`.
- **One grouping surface per idea.** No card inside a card. Within a group use
  rows, hairline dividers and type hierarchy.
- **Spacing scale** (dp): 4, 8, 12, 16, 24, 32. Screen edge 16. Gap between
  groups 12 (related) or 24 (sectioned). Card padding 16; the hero surface 24.
  Nothing else. The hero is the only place that uses 24 padding.
- **Radii** (dp): groups and hero 16; controls and inputs 12; chips/badges 8;
  progress bars full-round (height/2); sheet top 24. This replaces the 12/8/4
  proposal in MM-103: 16 reads sharper and more current than the 12 default
  at card scale, and the full-round bar ends are what make the arc and bars feel
  one family.
- **Elevation.** Light: hairline outline `outline` plus a soft shadow
  `0 1 2 rgba(12,18,32,0.06)` on cards; sheets get `0 8 24
  rgba(12,18,32,0.12)`. Dark: no shadows on cards; separation by surface step
  plus a 1 dp inner top highlight (`text` at 6%). The FAB has no halo or shadow
  in either theme (MM-181).
- **Density.** Phone portrait. No hero block taller than the content it
  introduces (Today hero is about 232 dp including macros). No dead bands
  between groups larger than 24 dp.

## Typography

Two bundled, open-license families (no network font fetching; the app is
offline). **Proposal, replacing the platform-font default in MM-103**:

- **Space Grotesk** for figures and screen titles. Geometric, slightly
  technical, a quiet cosmic accent. Used only at 22 sp and above.
- **Inter** for everything else. Highly legible at small sizes, excellent
  numerals.

Both must be verified for tabular figures (`FontFeature.tabularFigures()`) in the
gallery (MM-105). If Space Grotesk lacks usable tabular figures, set figures in
Inter and keep Space Grotesk for titles only.

| Role | Family | Size / line | Weight | Use |
|---|---|---|---|---|
| `figureXL` | Space Grotesk | 48 / 52 | 600 | The one hero number on a screen (calories left) |
| `figure` | Space Grotesk | 32 / 36 | 600 | A card's key number (trend weight, expenditure) |
| `title` | Space Grotesk | 22 / 28 | 600 | Screen titles, sheet titles |
| `heading` | Inter | 17 / 24 | 600 | Group headings, entry kcal |
| `body` | Inter | 15 / 22 | 400 | Sentences, entry names |
| `label` | Inter | 13 / 16 | 600, +0.2 tracking | Field labels, macro labels, nav labels |
| `caption` | Inter | 12 / 16 | 400 | Explanations under charts and controls |

Seven roles plus one hero. One `figureXL` per screen at most. Minimum text size is
12 sp. Everything scales with system text size to the largest setting; layouts
reflow or scroll, they do not clip or shrink text. Units are `body` in `text2`
beside a figure ("of 2,480 kcal"), never the same size as the figure.

Numbers follow the repository conventions: grouping separators, a space before
units, `lb`, no precision beyond the estimate. Figures that update use tabular
numerals so digits never shift.

## Icons

One family: Material Symbols **Rounded**, weight 500, optical size 24, fill
variable. Selected nav destinations use the filled variant; unselected, the
outline. 24 dp default, 20 dp inside rows. Always paired with a text label where
the meaning is not universal. No custom icon set until the app icon and mark are
designed (MM-109); when they are, the mark should be built from the same arc.

## Charts

One grammar, shared by every chart (WS-03/WS-07):

- Raw readings: small dots (4 dp radius), `text2` at 70%, labeled in the legend.
- **Trend**: a 2.5 dp `ion` line, round caps. The only chart color.
- **Uncertainty**: a band in `ion` at 14% (dark) / 12% (light), same hue as the
  line. (This is a data-encoding tint, permitted because it carries uncertainty;
  it is not a surface wash.)
- Targets: 1 dp dashed `text2` line with a direct label.
- Amount bars start at zero; body-measurement axes scale to the data.
- Gridlines: at most three horizontal, `outline`, 1 dp. No vertical grid.
- Labels `caption` size, sparse; the unit is stated once.
- Selected point: a 6 dp `text` ring and a floating value label. Never Ember;
  Ember is for actions.
- One reading is one dot and a sentence, never an invented flat trend.
- Every chart has a caption that doubles as the screen-reader summary.
- 30- and 90-day ranges only, as a two-option selector.
- Draw-in animation: line draws left to right in 400 ms on first appearance
  only; skipped under reduce motion.

## The space signature (budget)

Allowed, in this fixed budget. The point is a recognizable identity, not a theme.

| Element | Spec | Where | Limit |
|---|---|---|---|
| Horizon arc | Shallow arc spanning the hero's width; 8 dp stroke; `energy` on `track`; a 12 dp body dot at the progress end with an `ion` 4 dp glow in dark | Today hero | One per screen |
| Orbit hairline | 1 dp concentric arcs, `text` at 6% (dark) / `ink` at 5% (light), partially clipped by the card | Behind hero figures | One cluster per screen |
| Limb glow | Radial `ion`, 12% / 8%, top-trailing, ~60% radius | One hero surface per screen | Never behind text under 22 sp |
| Starfield | ≤ 24 static points, ≤ 30% opacity, seeded so it never changes | Onboarding welcome and the Coach unlock screen only | Never on a routine screen; never animated |
| Naming | Words like "orbit" or "launch" | Marketing, the app icon, store listing | **Never** in functional labels or buttons. A button says "Log food". |

Forbidden: planets, rockets, astronauts, mascots, galaxy wallpapers, HUD frames,
fake instrument bezels, chrome buttons, lens flares, parallax, particle effects,
scanlines.

## Emphasis rules

- One strongest element per view. Others are `text2` or smaller.
- Emphasis ladder: Ember fill (action) > `figureXL`/`figure` > `heading` weight
  > `label` > `body` > `caption`. Do not skip rungs to make something loud.
- A neutral fact uses `text`. An important state uses its semantic icon plus a
  word. A color is never the only signal.

## Area tone

| Area | Energy | Calm |
|---|---|---|
| Today / Dashboard | The hero arc, the Ember action | Everything below the hero |
| Food logging | The add action and the sheet's speed | The list, quiet and dense |
| Progress | The trend line and its band | Axes, gridlines, captions |
| Coach | The one next step | The explanation, the evidence |
| Onboarding | The welcome moment and the final reveal | The questions themselves |
| Settings | None | All of it |
| Train (later) | Large, high-contrast set controls | History |

## Explicit avoid list

Glassmorphism, neon glows, blurred floating orbs, purple-blue AI gradients,
sunrise gradients, pastel wellness sameness, tinted Ember backgrounds, brown,
beige, cream, salmon, dusty pink, decorative KPI rings, bento grids, mascots,
confetti on routine logging, fake precision, charts whose shape suggests data we
do not have.
