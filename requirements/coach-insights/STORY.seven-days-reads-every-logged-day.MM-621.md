---
id: MM-621
status: in-progress
component: coach-insights
related: [MM-610, MM-620, MM-606, MM-605]
---

# Story: 7d reads every day logged in the last 7, today included

## Context
On 2026-10-25, after MM-620, the owner overruled MM-610's rule for 7d. 7d was offered only once 5 of the last 7 days through
yesterday were fully logged. The owner: "7d is the only exclusion where I'll say you're wrong. it should be treated as the
time frame within the last 7 days inclusive, not 5/7 days." When a draft treated a part-logged today as not logged, the owner
vetoed it: "coach should analyze any amount of data for the last 7 days incomplete or otherwise."

## Decisions
By the product owner, 2026-10-25:
- 7d is the last 7 days, today included.
- 7d reads whatever is logged in them: complete, partial or part-logged today, any number of days.
- The other spans (2w, 1m, 3m) keep MM-610's rule.

Choices made without asking (say if any is wrong):
- 7d is offered once anything is logged. With nothing logged there is no switcher.
- On 7d every logged day is a judged day, so there is no partial-days finding and the level rules read from a single day. The
  trend engine keeps its own coverage rule (MM-605), so a thin week is read by the level rules alone.
- The period line on 7d is "Last 7 days with today · 3 days logged".
- The trend engine's span for the announcement log and the Dashboard's card (`canonicalTrendSpan`) is still chosen by MM-605's
  coverage rule, through yesterday.
- MM-620's caption ("7d opens once 5 of the last 7 days are fully logged") is removed: 7d no longer waits on anything.

## Description
The switcher offers 7d once anything is logged. 7d runs MM-606's food analysis from 6 days ago through today on every logged day
(`foodSpanAnalysisOf`'s `everyLoggedDay`), with the minimum days at one.

## Acceptance Criteria
```gherkin
Scenario: 7d from the first morning
  Given a first entry this morning
  When the Coach tab opens
  Then it opens on 1d, and the switcher offers 1d and 7d
  And 7d reads "Last 7 days with today · 1 day logged"

Scenario: Partial days are read
  Given 6 logged days through yesterday, 3 of them marked partial, and a part-logged today
  When 7d is chosen
  Then there is no partial-days finding, and every one of the 7 days is read

Scenario: Any amount of data
  Given 2 logged days
  When 7d is chosen
  Then the level rules read them

Scenario: Nothing logged
  Given nothing logged
  Then there is no switcher
```

## Progress
- Built 2026-10-25: `apps/mobile/src/state/CoachAnalysis.ts` (`offered` beside `spans`; 7d to today, `everyLoggedDay`),
  `apps/mobile/src/engine/analysis/food/foodSpanAnalysisOf.ts` and `readFoodSignals.ts` (`minimumDays`,
  `sodiumMinimumDays`), `apps/mobile/src/format/coachPeriodText.ts`.
- Tests: `apps/mobile/test/engine/sevenDaysEveryLoggedDay.test.ts`, `apps/mobile/test/coach/whatYourDataSays.test.tsx`,
  `apps/mobile/test/format/coachAnalysisText.test.ts`.
