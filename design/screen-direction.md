# Screen direction

Per-screen tone, density, hierarchy and what must not happen. Delivery order and
prerequisites are in the roadmap; behavior is in the tickets. The current app has
three tabs (Today, Progress, Coach); the planned split into Dashboard and Food is
in [ux-architecture.md](ux-architecture.md). Where this file says "Today" it means
the current combined screen, which becomes the Dashboard hero plus the Food list.

## Today (the screen that must be fixed)

**Diagnosis of the current screen** (from code, `today_screen.dart` and
`app.dart`): an app bar that repeats the tab name; a `Notice` in
`secondaryContainer` (a pale tinted rectangle, unrelated to everything else); a
summary `Card` whose calories sit in `displaySmall` above an 8 dp default
`LinearProgressIndicator` and three macro bars colored `primary`, `tertiary` and
`secondary` (so protein, carbs and fat get whatever those three happen to be in a
rust-seeded scheme); a separate `Card` per meal; a second full-width card for
"Is this day fully logged?"; an extended FAB in the default tonal container; the
default M3 nav indicator. Nothing is the most important thing, and the only
distinctive object is the one the user finds ugliest.

**Tone:** energetic at the top, calm below. **Density:** medium. **Primary
action:** Log food. **Emphasis:** the horizon arc and "calories left".

### Layout (360 × 800 dp reference; top to bottom)

1. **Day header, 56 dp.** Left: `title` "Thu, Oct 8" (relative "Today" when current)
   with 48 dp chevron buttons either side. Right: settings icon. No tab-name
   title. The header is on `canvas`, no divider, no elevation.
2. **Hero surface, 16 radius, 24 padding, about 232 dp** (the single `surface`
   with limb glow and orbit hairlines).
   - Top: the **horizon arc**, full inner width (312 dp), sagitta about 56 dp.
     Track in `track`; fill in `energy`; a 12 dp body dot at the progress point.
   - Center, under the arc: **`figureXL` "1,060"**, and under it `body` `text2`
     "kcal left of 2,480". If over target: "120 kcal over" in `text`, the dot
     hollows (outline only), the arc stays full. Never red.
   - Below, a 12 dp gap and **three macro rows**, each: `label` name left,
     `body` "96 / 180 g" right (tabular), 6 dp full-round bar beneath in the
     macro's color on `track`. Protein is first, its bar 8 dp and its value in
     `text`; carbs and fat are 6 dp and `text2`.
   - Foot: a 1 dp `outline` divider, then a 48 dp **status row**: `info` icon,
     `label` "Calibration, day 4 of 14", `caption` `text2` "Targets hold while
     the app learns", chevron. It opens Coach. This replaces the standalone
     peach `Notice`: the state lives inside the surface it qualifies. When
     there is no status it simply is not there and the hero shortens.
3. **Meal surfaces** (MM-180 supersedes the single combined log): four
   independently spaced `surface` cards, one for each meal, with entries
   hairline-divided inside their meal. Each group header is 48 dp: `label` meal name, `caption`
   kcal subtotal in `text2`, and a 48 dp "+" icon button that opens the add sheet
   **preselected to that meal**. A meal with no entries shows only its header
   row, so the structure never jumps and every meal is an add target.
   Entry rows are 56 dp: `body` name; `caption` `text2` "P 32 · C 4 · F 12" (the
   letters carry meaning, not the color); trailing `heading` kcal. Swipe-to-delete
   remains as an accelerator with a visible overflow alternative and an Undo
   snackbar.
4. **Day completeness**, 40 dp, bottom of the list, no surface: a quiet text
   button "Mark day complete" with a check icon and the explanation in the
   long-press/help sheet. It stops being a full card; it is a rare action.
5. **Primary action:** extended FAB "Log food", 56 dp tall, 16 radius, `ember`
   fill, `onEmber` label, plus icon, 16 dp from the edge and above the nav bar. It
   is the only Ember fill on the screen. MM-181 removes its decorative glow
   and shadow in both themes; all interaction elevations remain zero.

Bottom scroll padding is 112 dp (FAB 56 + 16 + 16 + margin) instead of 96
unexplained.

First paint order matters on a typical phone: header, hero (arc, number, macros),
and the first meal group are all above the fold. The status row is part of the
hero, not an extra group.

### Bottom navigation

`raised` surface, 1 dp `outline` top hairline, 72 dp tall, labels always shown.
Selected: filled icon, Ember icon and Ember `label` 600, on a 56 × 32 pill in
`selected` (cool neutral, **not** an Ember tint). Unselected: outline icon,
`text2`. Three signals (shape, fill, weight) so selection is not color-only. Tap
target stays the full destination width. When Train is added, the bar is five
destinations at the same height.

### Both themes

MM-179 adds a shared macronutrient-energy pie below the existing progress bars
on Dashboard and Food. Named gram/percentage labels use the bars' semantic
macro colors; the denominator is protein/carbs/fat energy, not total calories.
No recorded macros means an explanatory empty state, never invented sectors.

MM-180 meal cards have 12 dp corners and a subtle outline. Their disclosure
headers use 16 dp horizontal and 12 dp vertical insets, with title/subtotal
on the left and Add beside a muted 16 dp chevron on the right. Both are crisp
16 dp vector paths, using round 2-unit strokes in a 24-unit coordinate system.
Add has a 28 dp rounded-square Ember 15% wash, within a 48 dp touch target;
hover/focus uses solid Ember and the contrast-tested `onEmber` foreground.
This small secondary-action affordance is an explicit owner-approved exception
to the usual no-Ember-wash rule; it is not a second primary fill. Add and Copy
consume their own gestures and do not change disclosure state.

- Dark: canvas `#090D15`, hero on `surface` with limb glow, arc in near-white,
  flat solid FAB without a halo. This is the signature look.
- Light: cool-gray canvas, white hero with hairline and soft shadow, ink arc.
  Same layout, same hierarchy, no glow beyond 8%. Check it stays energetic: the
  Ember FAB and the heavy figure carry it.

### Must never

Add a second Ember fill, put a gradient behind meal rows, show the calorie bar in
red or green, count up the number as an animation, put a streak, flame or
trophy near the hero, or let the status row grow into a stack of banners.

## Dashboard (when WS-03 lands it)

MM-176 supersedes the sparse, one-screen direction below: a compact intake
summary (all macros except in Simple detail), weight snapshot, and scrollable
7/30-day nutrition, measurement, coverage and coaching sections. Each chart
has dates, units, series labels and explicit missing-data states. Recovery
keeps five separate trends. The owner explicitly requests metrics-heavy
density; equal-weight decoration and invented measurements remain prohibited.

Previous direction per MM-98: intake with protein, then trend weight (one
`figure`, a 30-day Ion line, the weigh-in action in place if none today), then a
single coach line. First three groups fit without scrolling. Cards are stable
when data is absent: the empty state keeps the layout. At most three direct
actions. **Tone:** scannable, energetic only in the hero. **Never:** an unlabeled KPI wall,
equal-weight cards, a second hero.

## Food logging flows

**Tone:** fast, factual, calm. **Density:** high but quiet.

- **Add sheet** (bottom sheet, `raised`, 24 top radius): a search field at top
  (focused, `sunken` fill, 12 radius), then a segmented set of entry routes:
  **Search**, **Scan**, **Quick add**, with Recent as the default list. Primary
  action in the sheet is the Ember "Add" bar, only when a food is selected.
- **Search:** results are 64 dp rows: name `body`, brand/serving `caption`, kcal
  `heading` right. Source/trust shown as a small labeled marker, not color. No nutrient
  table in the list; detail is one tap deeper.
- **Barcode:** full-screen camera on `canvas`, a 2 dp `text` reticle frame (not a
  HUD), result confirmation as a bottom sheet with the matched item for approval.
  Permission-denied is a plain state with a manual fallback button.
- **Quick add:** four fields only (calories required; protein, carbs, fat
  optional) with a large kcal field and numeric keyboard. The macro fields use
  the macro labels, not color. Save is the Ember action.
- **Never:** a second primary action in the sheet, tinted result rows, red/green
  grading of foods.

## Progress and trend

**Tone:** measured, explanatory. **Density:** medium. **Primary action:** "Add
weigh-in". **Emphasis:** the Ion trend line and its band.

One `figure` (trend weight) with `body` "7-day change" beneath, then the chart
with the shared grammar and a caption, then 30/90-day selector, then readings
list. Raw readings are quiet dots. If there is one reading, there is one dot and
a sentence. Everything about uncertainty stays visible. The hide-weight
preference collapses the number but keeps the shape available if the user chooses.
**Never:** flat invented trend, a goal-weight "finish line", red/green change
arrows, celebrations for a lower number.

## Coach insights

**Tone:** calm, evidence-led, no oracle. **Density:** medium, disclosed in layers.
**Primary action:** the one next step, if any.

Replace today's stack of four identical cards plus up to five identical notices
with a hierarchy: (1) **Targets** (hero-style surface with `figure` kcal and three
compact macros) with the confidence label and next check-in date; (2) **Why this
week** as one `heading` and a three-line reason list with an expand control; (3)
**Metabolism** estimate with its range (Ion; labeled "estimate"); (4) anything
else only if it applies. Safety and calibration state use the notice family
(below), at most one prominent at a time, ordered by importance.
**Never:** "AI insight" cards, certainty framing, a notice style per feature.

## Notice family (replaces the single `Notice`)

One component, three structures, no colored fills:

| Kind | Structure | Use |
|---|---|---|
| Info | `surface`, `info` icon, `body` text, no border | Calibration, settling, explanations |
| Caution | `surface`, `caution` icon, `caution` 1 dp border, label word "Heads up" | Health/safety guidance |
| Required safeguard | As caution, 1.5 dp border, bold lead sentence, an action button | Screening results, floors, limits |

Each pairs an icon and a word so color is never the sole signal. Max one prominent
non-critical notice at a time; required safeguards are never suppressed.

## Onboarding and setup

**Tone:** focused, plain, low-pressure; the one place with a little theater.
**Density:** one question per screen. **Primary action:** Continue.

Welcome: canvas with the starfield (the only routine-adjacent use), a large
`title`, the horizon arc drawn once at 600 ms with the body dot, and Continue.
Each step: `title` question, a one-line reason in `body` `text2`, large choice
cards (56 dp tall, `surface`, `selected` fill and Ember check on selection, not
an Ember wash), a segmented progress indicator at the top (steps, not a
percentage). Back is always available. No default for biological sex; under-18
blocks. Final reveal: a short "what to expect" with calibration dates, the first
use of the Ember FAB-style button. Screening questions use neutral wording and
never visually alarm.

## Settings

**Tone:** quiet. **Density:** medium. **Emphasis:** none.

Grouped lists on `surface` with `label` group headings, 56 dp rows, trailing value
or switch, hairline dividers. No Ember except the switch/active state. Destructive
rows (erase) use `danger` text and a confirmation sheet that explains the
consequence and offers the safe exit first. No marketing in Settings.

## Empty, loading and error states

Keep the page structure so nothing jumps.

- **Empty** (no food today): the log surface shows the four meal headers with "+"
  and, once, a `body` line under the hero: "Nothing logged yet. Start with
  breakfast." The Ember FAB is the action. No illustration needed; the hero arc at
  zero is the visual.
- **Empty with illustration** (no weigh-ins, no history): a 120 dp line drawing
  made from the arc and a dot in `text3`, one `heading`, one `body`, one button.
  Never a mascot.
- **Loading:** reserve layout; show nothing for local reads under about 150 ms;
  beyond that, flat `sunken` skeleton blocks shaped like the content, no
  shimmer, never fake numbers or fake chart lines.
- **Error:** `surface` with a neutral icon, a `heading` naming what failed, a
  `body` next step, a retry button. Preserve entered work. A failed read is never
  shown as zero or as an empty success. Migration or database errors give the data-safe message from
  the ticket.
- **Offline-dependent features:** say what needs a connection and that nothing
  was uploaded.

## Priorities by surface (carried over, unchanged in intent)

| Surface | Priority and roadmap |
|---|---|
| Design-system foundation | Foundational; WS-03 before large new UI |
| Health screening and safeguards | Highest safety priority; WS-02 then WS-05 |
| Onboarding, profile, what to expect | High; WS-05 on WS-03 |
| Dashboard / Today | Highest daily orientation; WS-03 |
| Daily macro and food logging | Highest frequency; WS-08 |
| Food search, barcode, label | High; WS-04 contract then WS-08 |
| Target review and weekly check-in | High trust; WS-06 |
| Trend and progress, body measurements | High trust; WS-07 |
| Coach insights, adherence, recovery | Progressive; WS-06 then WS-09 |
| Training | Task-speed critical; WS-10 |
| Settings, backup, erase | High consequence; WS-05, WS-12, WS-13 |
| Monetization and release | Last; WS-13 |

Cross-flow rules from the earlier package still apply: consistent units and dates
between summaries and detail, global hide-weight, usable with a screen reader at
the largest text size, and visible safety and uncertainty where they change
interpretation.
