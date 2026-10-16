---
id: MM-342
status: proposed
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
