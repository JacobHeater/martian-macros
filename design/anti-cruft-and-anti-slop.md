# Anti-cruft and anti-slop

A quality gate for every new or materially changed screen. The limits are
deliberate. An exception needs a concrete user, safety or comprehension benefit,
recorded in the ticket.

## 1. What is wrong in the app today

Found by reading `apps/mobile/lib/src/` (not from screenshots; the user's own
report of "muddy, beige-brown, low-energy" matches what the code produces).

| # | Pattern in the code | Why it makes slop | Fix |
|---|---|---|---|
| 1 | `colorSchemeSeed: Color(0xFFC1440E)` in `app.dart` | One seed generates every surface, container and tertiary. A rust seed yields pale salmon containers, warm-tinted surfaces and an olive-brown tertiary. This is the root of the muddy look | Explicit `ColorScheme` per theme from [color-and-theme-system.md](color-and-theme-system.md); no seed |
| 2 | `Notice` always uses `secondaryContainer` | Every message (calibration, info, safety, "settling") is the same peach rectangle; the most important and least important look identical | Notice family: info / caution / required, no fills, icon + word |
| 3 | Coach screen: 4 `InfoCard`s + up to 5 `Notice`s | "Design by card stack": identical radius, identical title style, nothing important | Hierarchy: Targets hero → Why → Metabolism; notices at most one prominent |
| 4 | Macro bars use `scheme.primary`, `tertiary`, `secondary` | The meaning of a color changes with the seed; protein is "primary" only by accident | `mm.protein`, `mm.carbs`, `mm.fat` tokens; labels always visible |
| 5 | Today summary: `displaySmall` kcal over a stock 8 dp `LinearProgressIndicator` | Calories are the most important number and have no distinctive treatment | Horizon arc + `figureXL` |
| 6 | App bar title repeats the tab label | Wasted 56 dp saying what the nav bar already says | Day header that carries real information |
| 7 | One card per meal plus a full card for "Is this day fully logged?" | Equal weight for an essential list and a rare action; many borders | One log surface; completeness becomes a quiet row |
| 8 | Default `FloatingActionButton.extended` and `NavigationBar` | Tonal container pill and FAB in the generated palette; the CTA is not desirable and not clearly *the* action | Ember FAB; nav with `selected` pill and Ember icon |
| 9 | `SegmentedButton` used for a rare binary | Heavy control for a low-frequency choice | Text button or switch |
| 10 | 96 dp bottom padding with no relation to the FAB | Arbitrary; dead zone | 112 dp derived from FAB + margins |
| 11 | Screens and widgets pick colors directly (`scheme.*`, `Colors.*`, `Color(0x…)`: 19 uses across `app.dart`, `widgets.dart`, `progress_screen.dart`, `today_screen.dart`) | Visual decisions made per screen, so one meaning gets different colors | Tokens and shared components only |
| 12 | Section titles all `titleMedium`, all cards equal | No ladder of emphasis | Type roles with a deliberate ladder |

## 2. What AI slop looks like (reject)

Anything that could be pasted into a generic health startup unchanged: three
pastel cards over a gradient, oversized vague headlines, decorative KPI rings,
interchangeable icon tiles, "AI coach" claims, random pastel palettes, an
everything-is-rounded-and-soft look, or equal polish and equal loudness on every
element. Character comes from exact language, one distinctive graphic idea, a
disciplined palette and precise motion.

## 3. Hard limits

- **Primary emphasis:** one Ember fill per screen. One `figureXL` per screen.
- **Surfaces:** no card inside a card. One grouping surface per idea.
- **Navigation:** at most five destinations. Settings is not a tab.
- **Dashboard:** at most three direct actions; the first three groups fit without
  scrolling.
- **Callouts:** one prominent non-critical notice at a time. Required safeguards
  are grouped and prioritized, never suppressed.
- **Color budget per screen:** one Ember element; one Ion group (line plus band);
  macro colors only where macros are shown. Gradients only in the three allowed
  places ([color doc §8](color-and-theme-system.md)).
- **Space signature budget:** one arc, one hairline cluster, one limb glow per
  screen; the starfield only on onboarding welcome and the unlock screen.
- **Badges and chips:** chips for choices; a badge only for a meaningful,
  non-redundant status.
- **Charts:** the shared grammar only; no decorative sparklines.
- **Copy:** one direct sentence beats three explaining the same thing.
- **One implementation per control (MM-163):** a screen never uses a raw Material
  control (button, field, dropdown, switch, card, chip, dialog, progress bar). It uses
  the design-system component, which takes meaning and never a color, radius or
  padding. A part of a view that another view could plausibly show is a component now.
  `mm arch` enforces it with a baseline that only shrinks.

## 4. Color sludge rules (checkable)

1. No `Color(0x…)` and no `ColorScheme.fromSeed` / `colorSchemeSeed` outside the
   theme files (lint or test; MM-102 already asks for this).
2. **Ember is never tinted.** No `ember.withOpacity(...)` / `withValues(alpha:)`
   used as a background. Ember is a solid fill, icon, text or stroke.
3. No semantic color is used as a surface wash. `caution`, `info`, `danger`,
   `positive` are icon/text/stroke only.
4. None of: beige, cream, tan, brown, clay, terracotta, salmon, peach, dusty
   pink, olive. If a rendered screen reads "edible", it fails review.
5. No pure black canvas, no pure white text on dark.
6. Every foreground/background pair a theme can produce meets the contrast table;
   the gallery has a test that computes it (MM-105/106).
7. Light and dark are reviewed together for every token change.

## 5. Keeping the interface from bloating

- **Add by replacing.** A new feature earns a slot by displacing something or by
  living one level deeper, not by adding a card to the top level.
- **Quarterly variant audit.** List every component variant; delete any not used
  in at least two contexts. Historical styling drift is not a variant.
- **Token diet.** A new color, radius or spacing value needs a written reason in
  the ticket; most requests are met by an existing token.
- **Screen budget table:** in [design-map.json](design-map.json) each screen lists
  its maximum number of top-level groups; adding past it requires removing one.
- **Gallery is law.** A change that shifts the gallery goldens needs an explained
  diff; do not update snapshots to hide a regression.

## 6. Cruft in general

Cruft is also redundant status indicators, duplicate entry points, over-explained
flows, controls that change nothing, nested settings and abandoned routes. Ask:
*if this disappeared, would the user lose a useful action, meaning, safety or
confidence?* If not, remove it.

## 7. Progressive disclosure

Routine action and minimum context first. Material uncertainty, safety and
destructive consequences stay visible. Provenance, secondary nutrients, model
inputs and contribution breakdowns are one deliberate step deeper. Safety is
never behind a paywall, a hidden gesture or a long path.

## 8. Pre-ship screen review

- [ ] Can a new user say what this screen is for from its title and first content?
- [ ] One clear primary action, in Ember, and only one?
- [ ] Does every card, badge, color, chart and animation earn its place?
- [ ] Related values grouped without nesting or repeated labels?
- [ ] Measurement, estimate (Ion), uncertainty and recommendation distinct?
- [ ] Calorie differences neutral; no food or person judged?
- [ ] Safeguards complete, humane and available regardless of entitlement?
- [ ] Hidden-weight setting honored; no unnecessary exposure of sensitive answers?
- [ ] Empty, loading, error, offline, destructive states truthful and actionable?
- [ ] 48 dp targets, largest text size, screen reader, reduce motion, grayscale,
      **light and dark**?
- [ ] Any beige, brown, peach, salmon, tinted Ember or seed-derived color visible?
- [ ] Is it clear in under two seconds what the most important thing is?
- [ ] Could it be pasted into any other health app unchanged? (If yes, fail.)
- [ ] Tests cover behavior and semantics, not only a golden?

Do not ship a screen that fails a safety, access, honesty or agency check for the
sake of consistency. Fix the system or record a reviewed exception; do not add a
local workaround that spreads.
