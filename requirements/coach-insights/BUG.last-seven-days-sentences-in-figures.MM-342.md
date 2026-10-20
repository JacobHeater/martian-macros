---
id: MM-342
status: done
component: coach-insights
related: [MM-149, MM-321]
---

# Bug: "Your last 7 days" puts sentences in a column made for figures

## Context
Found drawing the Coach screen's undrawn states for MM-321 (story "Coach Stalled Over Target"). The weekly
summary's rows are stat rows, a label and a figure; "Average intake" holds "2,350 kcal against 2,100: 250
over", which wraps to three lines in the figure column and wraps its label too.

## Description
Each row's figure is a figure; what it is measured against, and by how much, is said in a form the design
system has for it, matched to its siblings on Coach.

## Acceptance Criteria
```gherkin
Scenario: Eating above target
  Given seven logged days at 2,600 kcal against a 2,100 kcal target
  Then "Average intake" shows a figure on one line, and the target and the difference are still said
```

## Notes
Guarded by "MM-342" in `apps/mobile/test/gallery/registerDefects.test.tsx`, skipped with this ID until the
fix lands. A design fix: drawn in Storybook, reviewed by the panel's designer and UX guard, then built.

## Fix (2026-10-19)
`adherenceLines` gives each line a figure and a `detail`: "2,350 kcal" in the value column, "against 2,100: 250 over · rests on 3 days" under the row, through `StatRow`'s new `detail` (`.mm-stat-detail`). The guard `MM-342` in `apps/mobile/test/gallery/registerDefects.test.tsx` runs: the value is at most sixteen characters and the detail still says the target and the distance; `test/coach/adherenceSummary.test.tsx` covers the lines. Story `CoachStalledOverTarget` draws it; reviewed in `docs/agent-runs/m2-design-bugs`.

## Decisions after the panel (2026-10-19)
- One pattern for what a figure rests on, across Coach (the designer's PD-5): `StatRow`'s `detail`, in the caption role; the pace's detail under "Intended pace" moved onto it.
- "Days logged" is a figure too: "7" with "6 complete" or "all complete" under it (PD-6).
- The target is named (the UX guard's F10): "against a 2,100 kcal target: 250 over", still a fact and no score (MM-149).
- The value keeps the end of its line when large text wraps it under the label (F3); stories `CoachFewDaysEstimated` (the full detail) and `CoachLargeText`.
