---
id: MM-620
status: done
component: coach-insights
related: [MM-610, MM-612, MM-605]
---

# Bug: The span switcher hides without saying why

## Context
On 2026-10-25 the owner asked what happened to the `1d | 7d | 2w | 1m | 3m` switcher on Coach: the analysis showed one day at a
time. MM-610 offers a span only when the data supports it: the days since the first entry reach the span, and at least 60% of
its days through yesterday are fully logged (`usableIntakeDays`). Reading `supportedAnalysisSpans` and
`WhatYourDataSaysSection.tsx` found two faults:
- **The switcher waits on 7d alone.** It shows only when 7d is supported. The rule checks each span on its own, so 2w can pass
  (9 of the last 14 days fully logged) while 7d fails (4 of the last 7). Then 2w is supported and never offered.
- **Nothing says why.** While only 1d is offered, the section shows no switcher and gives no reason. That goes against the
  owner's rule of 2026-10-22: a feature gated on data says what unlocks it and how far along the data is.

## Decisions
By the product owner, 2026-10-25: the section's heading is "Coach's feedback", not "What your data says".

Choices made without asking (say if any is wrong):
- The switcher shows once any span beyond 1d is supported, not only 7d.
- (Removed by MM-621, where 7d waits on nothing.) While only 1d is offered, a caption under the period line says what opens 7d, on the switcher's own rule: "7d opens a week
  after your first entry · 3 days to go", or "7d opens once 5 of the last 7 days are fully logged · 3 so far".
- The coverage rule itself (MM-605's 60%) is unchanged.

## Description
The switcher's condition, a caption for 7d's progress while only 1d is offered, and the heading renamed.

## Acceptance Criteria
```gherkin
Scenario: The heading
  When the Coach tab opens
  Then the analysis section is headed "Coach's feedback"

Scenario: 2w without 7d
  Given 9 of the last 14 days fully logged, 4 of them in the last 7, and 20 days since the first entry
  Then the switcher shows 1d and 2w

Scenario: Under a week of history
  Given a first entry this morning
  Then there is no switcher, and the section says "7d opens a week after your first entry · 7 days to go"

Scenario: A week of history, too few days fully logged
  Given 20 days since the first entry and 3 of the last 7 days fully logged
  Then there is no switcher, and the section says "7d opens once 5 of the last 7 days are fully logged · 3 so far"

Scenario: The switcher shown
  Given 7d is supported
  Then no 7d caption is shown
```

## Progress
- Built 2026-10-25 in `apps/mobile/src/engine/analysis/weekSpanProgress.ts` (on `supportedAnalysisSpans`'s rule),
  `apps/mobile/src/format/weekSpanProgressText.ts`, `apps/mobile/src/state/CoachAnalysis.ts` (`weekProgress` on the view) and
  `apps/mobile/src/coach/WhatYourDataSaysSection.tsx` (the switcher on `spans.length > 1`, the caption). The heading is
  `coachAnalysisWords.title`.
- Tests: `apps/mobile/test/coach/weekSpanProgress.test.ts` (the rule, the text, 2w without 7d) and
  `apps/mobile/test/coach/whatYourDataSays.test.tsx` (the first-morning caption, no caption with the switcher, the region
  found by its new name).
