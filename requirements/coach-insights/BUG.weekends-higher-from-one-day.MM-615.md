---
id: MM-615
status: done
component: coach-insights
related: [MM-141, MM-124, MM-605]
---

# Bug: "Weekends higher" can rest on one day

## Context
`weekendHigher` (MM-141, `findInsights.ts:204-212`) compares the mean of weekend days with the mean of weekdays, with as few as 2
weekend days (`WeekPatternRule.minimumWeekendDays`) and no check that the weekends agree. With a 2,000 kcal target, one Saturday
1,000 kcal over and an on-target Sunday make the weekend mean 500 over, which is 25% of target. That passes the 20% threshold, so
the insight fires on a single day, against MM-141's own rule. Found by the measurement panel on 2026-10-24 and confirmed by
reading the code.

## Decisions
- **Author's choices, easy to overrule:**
  - Weeks run Monday to Sunday, so a weekend is never split across two weeks.
  - A week counts when it has at least 1 whole weekend day and 3 whole weekdays (`minimumWeekdaysPerWeek`), with a target
    for each day.
  - The rule reads the last 5 calendar weeks, the fewest that allow the 5-week, 80% case.
  - Only "higher" is reported, as before.
- **The one-Saturday scenario as written passes on the old rule.** 14 whole days hold 4 weekend days, so one Saturday
  1,000 over moves the weekend mean only 250. The regression test uses the Context's arithmetic: one Saturday 1,000 over
  and an on-target Sunday, with the other weekend's days unlogged. That fails on the old rule. The test also checks 28
  whole days with one big Saturday.

## Description
"Weekends higher" needs every contributing week to agree: ≥ 3 weeks each with the weekend beyond the margin in the same direction,
or ≥ 5 weeks with ≥ 80% agreeing. Each week is paired within itself: the weekend against that week's own weekdays (MM-605's D5).

## Acceptance Criteria
```gherkin
Scenario: One big Saturday
  Given 14 whole days at target except one Saturday 1,000 kcal over
  Then no weekends-higher insight is shown

Scenario: A real weekend pattern
  Given 3 weeks each with the weekend at least 20% of target above that week's weekdays
  Then the insight is shown
```

## Notes
Regression test: the one-Saturday scenario, written to fail on the current rule.

## Progress
- Built in `apps/mobile/src/engine/findInsights.ts` (the `weekendHigher` block), with the thresholds in
  `apps/mobile/src/engine/WeekPatternRule.ts` (`weekendWeeks: 5`, `minimumWeekdaysPerWeek: 3`, `allAgreeWeeks: 3`,
  `mostAgreeWeeks: 5`, `mostAgreeShare: 0.8`). The unused fortnight minimums `minimumWeekendDays` and `minimumWeekdays`
  were removed.
- How the rule works:
  - Each week's weekend average is set against that week's own weekdays, read against the plan (`asPlanned`, MM-124).
  - A week is "higher" when that gap is at least 20% of the week's target.
  - It fires when at least 3 weeks are counted and all of them are higher, or at least 5 are counted with 80% or more
    higher.
  - Whole days come from `usableIntakeDays` over the rule's own 5-week window. Every other rule keeps the 14-day
    `patternDays` window.
  - The insight's period starts on the Monday of the first counted week.
- The caller's input already covers the window: `AppState.judgedIntake` reads 60 days. No input was widened.
- The words (`apps/mobile/src/format/insightText.ts`) say "In each of the last N weeks" (or "k of the last N") "your
  weekend ran above that week's weekdays", and the evidence adds "Weeks with the weekend higher".
- Guarding tests, in `apps/mobile/test/engine/insights.test.ts`:
  - "one big Saturday is not a weekend pattern": the regression.
  - "weekends a fifth of the target above that week's weekdays, three weeks running": a real 3-week pattern.
  - "two weeks of higher weekends are not yet a pattern".
  - "a smaller weekend excess says nothing".
  - "with fewer than five weeks, one week that disagrees breaks the pattern".
  - "over five weeks, four in five higher is a pattern".
  - `apps/mobile/test/coach/insightCard.test.tsx`, "the weekend insight states both averages against the target", checks
    the new words.
- Existing tests changed because they encoded the 2-week basis:
  - "weekends a fifth of the target above weekdays" (14 days) became the 3-week test above. Its 14-day form is now "two
    weeks of higher weekends are not yet a pattern".
  - "a smaller weekend excess says nothing" now uses 21 days.
  - In `apps/mobile/test/engine/plannedShareReaders.test.ts`, "a planned higher weekend is not 'weekends run higher'"
    builds 28 days, so its unplanned control still fires.
- The roadmap was not touched in this change.
- Not run locally; CI validates.
