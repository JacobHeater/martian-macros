---
id: MM-614
status: done
component: coach-insights
related: [MM-141, MM-605]
---

# Bug: The unlogged-weekday insight fires on random gaps

## Context
`consistentDay` (MM-141, `findInsights.ts:262-267`) fires when any weekday is unlogged in both of the last two weeks and each week
has ≥ 5 logged days. For a person who skips 2 random days a week, the chance that the two weeks share no skipped weekday is
C(5,2)/C(7,2) = 10/21. So it fires about 52% of the time. With 1 random skip a week it fires about 14% of the time. The coach
states a weekday habit that does not exist. Found by the measurement panel on 2026-10-24, by calculation, and confirmed by
reading the code.

## Decisions
- **Author's choice, easy to overrule: the weekday must also be most of the gaps.** The 3-of-4 test alone cannot meet the
  2% scenario. With 2 random skips a week, some weekday lands in 3 of 4 aligned weeks about 47% of the time (exact count
  over C(7,2)^4 weeks), and about 21% over rolling evaluations, where a week holding 3 skips has too few logged days to
  count. So the finding also needs the weekday to be more than half of the unlogged days over the 4 weeks. That brings the
  rolling rate to about 0.25%. A weekday that is most of the gaps is a habit; a weekday that collected 3 of 8 random gaps
  is not. Days before the first log are not gaps. MM-605's D5 states the same 3-of-4 test and its "random logger"
  scenario has the same conflict, so it should take this condition too.

## Description
An unlogged-weekday finding needs the weekday unlogged in ≥ 3 of the last 4 weeks, each with ≥ 5 logged days (MM-605's D5). Until
MM-605 replaces the rule, the existing rule uses that test.

## Acceptance Criteria
```gherkin
Scenario: Random gaps
  Given a simulated user leaving 2 random days a week unlogged for 8 weeks
  Then the unlogged-weekday insight appears in at most 2% of evaluations

Scenario: A real habit
  Given Saturday unlogged in 3 of the last 4 weeks, each with 5 or more logged days
  Then the insight names Saturday
```

## Notes
Regression test: the random-gap simulation above, written to fail on the current rule.

## Progress
- Built in `apps/mobile/src/engine/findInsights.ts` (the `consistentDay` block), with the thresholds in
  `apps/mobile/src/engine/WeekPatternRule.ts` (`unloggedWeeks: 4`, `unloggedMinimumWeeks: 3`, `minimumDaysPerWeek: 5`).
  The rule reads 4 rolling weeks ending at `through`, straight from `intake`. Only this rule is widened to 28 days; every
  other rule keeps the 14-day `patternDays` window. The insight's period is the 28 days.
- The "highest day" branch shares the week list. It keeps its 2-week basis: the last 2 of the 4 weeks, the same 14 days
  and whole days as before.
- The caller's input already covers the window: `AppState.judgedIntake` reads from `watchIntakeDays({ since: today - 60 })`,
  without paused days. No input was widened.
- The words (`apps/mobile/src/format/insightText.ts`) say "in 3 of the last 4 weeks", and the evidence shows
  "Weeks without a log, 3 of 4".
- Guarding tests, in `apps/mobile/test/engine/insights.test.ts`:
  - "the unlogged weekday against random gaps › names a weekday in at most 2% of evaluations": the regression. It runs 100
    seeded loggers (`DartRandom`) with 2 random gaps a week for 8 weeks, evaluated on each of the last 29 days.
  - "the same weekday unlogged in three of the last four weeks": Saturday, with other gaps around it.
  - "a weekday unlogged in two weeks is not a habit": the old rule fired on this.
  - "a weekday unlogged in weeks with too few days logged is not a habit".
  - `apps/mobile/test/coach/insightCard.test.tsx`, "the consistent day names the weekday, highest or unlogged", checks
    the new words.
- One existing test was changed because it encoded the bug: "the same weekday unlogged in both weeks" (2 weeks, 14 days)
  became the 3-of-4-weeks test above. The card test's `consistentDay` figures now carry `weeks: 4, unloggedWeeks: 3`. The
  story scenario (`weekShapeScenario`) already logged 28 days. Only its comment changed.
- The roadmap was not touched in this change.
- Not run locally; CI validates.
