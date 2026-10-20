# Brief: a weigh-in's explanation and the waist's drawing and chart (MM-142, MM-155)

## Task ID and requested outcome
`mm142-weight-jump`. Two M2 tickets built to done on `wt/measure` (from `feat/m2`), the design parts drawn in
Storybook and reviewed here in one round by the product designer and the UX guard. Fix blocking findings; record an
outcome for every finding.

## What was built (facts of the working tree)
**MM-142, "When the scale jumps, say what probably did it".**
- Engine (pure): `apps/mobile/src/engine/explainWeightJump.ts` from a reading, the trend, the last 48 hours of
  intake (carbohydrate and sodium against the 14-day usual, calories against the target band), workouts, cycle
  windows, weight events, alcohol and a change of phase, to up to three likely causes with figures
  (`WeightJumpExplanation`, `WeightJumpCause`, `WeightJumpCauseKind`) and the arithmetic (`fatKcal`). Thresholds in
  `WeightJumpRule.ts`; rows in `docs/evidence.md`. Kept back by `weightJumpWithheld.ts` under 18, with an
  eating-disorder history, or with weight hidden (MM-118's setting is not built; the safeguard flag exists).
- Words: `apps/mobile/src/format/weightJumpText.ts` and `weightJumpCauseText.ts`.
- **Dashboard** (`src/dashboard/DashboardScreen.tsx`): once today's weigh-in is saved, the explanation is the
  coach's line under the trend row, exactly as the rebound note is drawn there (MM-130): `RowWithInsight` →
  `InlineInsight layout="row"`, the figures one tap down, "Settings for “A jump on the scale”". Built by
  `src/progress/weightJumpContent.ts` and the hook `src/progress/useWeightJump.ts`.
- **Progress** (`src/progress/ProgressScreen.tsx`, `src/charts/TrendChart.tsx`, `src/progress/WeighInNote.tsx`): the
  trend chart's dots can be tapped (`pickedDay`, `onPickDay`; a tap on a dot or near one down the plot); the picked
  dot is drawn larger in Ion ringed with the canvas. Under the chart, `WeighInNote` says the picked reading as a
  caption ("Mon, Sep 21: 82.1 kg, +0.1 kg from the trend, inside the day-to-day noise.") and, when the reading is far
  from the trend, the same coach's line (`InlineInsight layout="plain"`). Without a tap, the latest weigh-in in range
  is explained if it is far from the trend; nothing is drawn if it is not. The chart stays `role="img"`; the pick is
  pointer-only, and the latest reading's explanation is the path that needs no pointer.

**MM-155, the remaining items.**
- `apps/mobile/src/ui/WaistProtocolFigure.tsx`: the protocol drawn as an SVG (torso, tape level at the navel in Ion),
  `role="img"` with a one-line text alternative; the four steps beside it as a list of captions
  (`WaistEntryCard.tsx`, `.progress-waist-protocol`). Drawn in full while the person has fewer than three
  measurements; from the third, under `MmDisclosure` "How to measure" (subtitle "Morning, relaxed, tape level with
  the navel"). No schema change: the count is the saved entries.
- `apps/mobile/src/charts/WaistChart.tsx`: dots per measurement, a line through the middle of each three
  neighbouring entries (what `waistChangeOf` compares), a band of the noise figure (`waistNoiseOf`, half as wide
  again around a single reading), in `TrendChart`'s grammar (same width, height, axes, grid; the `chart-measurement`
  colour). In the waist card under the entry: a head "Waist over time" with a compact `MmSegmented` 90d/1y, the chart,
  one caption. Empty state: "No waist measurements in this range."
- The monthly report's waist line now comes from `waistChangeOf` ("Down 2.5 cm (92 cm to 89.5 cm)", "No clear change
  (…; a difference under 1.5 cm is within what a tape can tell)"): `src/format/MonthlyReportText.ts`.

## Audit mode and coverage
Mode: `change`. Baseline `feat/m2` at 24130ec; the working tree of `wt/measure` (uncommitted at review time).
Depth targets, counted from the source: (a) Dashboard, today's weigh-in saved 1.3 kg above a flat trend after a
340 g carbohydrate day and a workout: the row, the coach's line, the figures one tap down (story `WeighInJump`,
`WeighInJumpFigures`; 1 press, 1 line, 10 figure rows); (b) Progress, the Waist section opened with two
measurements: the drawing, four steps, three fields, Save, the chart head with 90d/1y, the chart, its caption
(story `ProgressWaistFirstMeasurements`; 1 press). Surveyed: the other Dashboard states (`WeighInJumpNothingInLog`,
`WeighInLowAfterIllness`, `WeighInOvershoot`), the Progress chart states (`ProgressWeightJump`,
`ProgressPickedWeighIn`, `ProgressPickedJump`), the waist states (`ProgressWaistChart`, `ProgressWaistHowToMeasure`,
`ProgressWaistYear`, `ProgressWaistNoneInRange`), the catalogs (`Design system/Components`, `Design system/Charts`).
Render supplied: none in this session (no browser automation on the owner's Mac); the stories are read from
source. Say so. Not reviewed: the engine's thresholds (the measurement and nutrition roles' business); the tool.

## Requirement files
- `requirements/coach-insights/STORY.explain-a-weight-jump.MM-142.md`
- `requirements/body-measurements/STORY.measurement-protocol-and-noise.MM-155.md`
Direction: `design/screen-direction.md` (rules 1, 2, 4, 5, 7, 9; "Progress and trend"), `design/anti-cruft-and-anti-slop.md`.

## Siblings (rule 9) and the question every reviewer answers first
- The explanation under the Dashboard's trend row: its sibling is the rebound note (`reboundText`, MM-130) drawn by
  `RowWithInsight`/`InlineInsight` under the same row, and the waist and water rows' inline insights (MM-362).
- The note under the Progress chart: its siblings are the chart's caption (`app-caption`) and the "How to read this"
  disclosure beneath it; the coach's line is the same `InlineInsight` as the Dashboard's, in the `plain` layout.
- The picked dot: the chart's own weigh-in dots (`.chart-weigh-in`) and the trend's Ion line.
- The waist chart block: the Progress hero's trend block (`.progress-hero-trend`: head with title and a compact
  `MmSegmented`, the chart, a caption). The waist chart itself: `TrendChart`.
- The protocol drawing: `ShakerBottleOutlined` and `HorizonArc` are the design system's other drawn graphics; the
  steps are `app-caption` lines like the card's former one-line protocol. The fold is `MmDisclosure`, as "How to read
  this" under the trend chart.
Does each look and behave like its siblings, and if not, why not?

## Existing facts, non-goals, owner decisions
- Every design through Storybook and the panel (MM-293); here the stories exist and the review follows the build in
  the same batch, recorded before the commit.
- Non-goals: an action slot on the inline insight (the offer to add a weight event is in words; the Add button is
  the Weight events section's, one scroll down on Progress); the "logged after 9 pm" cause (food entries carry no
  clock time; left out and said in the ticket); MM-118's setting itself; widening the waist noise inside a cycle
  window (optional in MM-155, not done).
- MM-108: causes are likely, never certain; no moralising words (`test/voice.test.ts`).

## Acceptance criteria
MM-142's seven scenarios are traced in `test/engine/weightJump.test.ts`, `test/format/weightJumpText.test.ts`,
`test/dashboard/weightJump.test.tsx`, `test/progress/weightJumpChart.test.tsx`. MM-155's remaining items in
`test/charts/waistChart.test.tsx`, `test/progress/waistProtocol.test.tsx`, `test/engine/monthlyReport.test.ts`.

## Role assignments
`product-designer` (visual hierarchy, siblings, product identity) and `ux-accessibility` (task flow, comprehension,
accessibility: the pointer-only pick, the SVG figure's alternative, the long inline line, 200% text). Others omitted:
one round, design parts only.

## Roles omitted
- training omitted: no training behaviour changes in this round; the workout cause is a date match on finished workouts, not exercise science.
- nutrition omitted: the carbohydrate and sodium thresholds are product judgement recorded in docs/evidence.md and are out of this design round; one round, design parts only.
- coaching omitted: the words were checked by the voice test and by the UX guard; the chair answered the one coaching question (the arithmetic in the figures) under MM-142 and MM-108.
- measurement omitted: the noise threshold reuses the trend model’s water sigma and the waist chart reuses waistChangeOf’s smoothing; the chair answered the one measurement question (dots alone under three entries).
- safety omitted: no new intake or weight rule; the explanation is withheld under 18, with an eating-disorder history and with weight hidden, and the UX guard’s safety note is answered in MM-142.

## Dependencies, safety, privacy, unresolved choices
Health data stays on the phone; nothing is transmitted. Open: whether the explanation's one line is too long for a
row (it carries the head, the causes and the arithmetic, as MM-142 asks); whether a pointer-only pick needs a
keyboard path beyond the default latest reading.

## Writer identity and ownership
The parent session (Claude Code, 2026-10-20) is the single edit owner; reviewers are read-only and return Markdown
which the parent saves under `docs/agent-runs/mm142-weight-jump/findings/`.
