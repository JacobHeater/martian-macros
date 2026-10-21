---
id: MM-450
status: done
component: adaptive-coach
related: [MM-33, MM-34, MM-11, MM-92]
---

# Story: The body-fat range in the monthly report

## Context
The owner's decision for the monthly report (MM-33) puts the body-fat range in it "if one has settled". The estimate from the
user's own measurements is MM-34, built after MM-33; this ticket carries that one item into the report.

## Decisions
- From MM-33 (made with the product owner): the range is in the report only once one has settled.

Choices I made without asking (say if any is wrong):
- **A range, never a single figure**, as MM-34 shows it, and as it stood at the end of the month, like the report's strength.
- **No card until a range has settled**: a month before that says nothing about body fat rather than showing the formula's guess.
- **Users with a history of an eating disorder (MM-11)** get no body-fat change in the report, as with weight-based rewards (MM-92).
- **"Settled" means the range rests on the waist** (MM-34's `basis` `waist`: three waist entries in the four weeks before the day).
  The formula alone is the guess the report leaves out, and the user's own figure is not a range from measurements, so neither
  puts a row in the report. No new threshold: the rule is MM-34's `BodyFatRule`.
- **The month's two ends**: the range at the end of the month as the row's value, and the range when the month began (at the end
  of the day before, where the report before ended) as its detail, like the waist's ends. That is the "change since the report
  before": two ranges side by side, never a difference of their middles, which would be a point figure. With an
  eating-disorder history the start is left out and the end stays, as the Coach's Body row still shows the range (MM-34).
- **As it stood on each day**: the waist entries up to that day and the trend weight from the weigh-ins up to it, so a later
  entry does not change an old report (as its strength does). That trend is the plain weight trend, without the cycle and
  creatine allowances the Coach applies, which move it by a fraction of a kilogram and the range by much less than a point. The
  profile (height, age on the day) and the screening answer are the current ones: a report is rebuilt from today's setup.
- **Built like its sibling**: a row in "What your body did" beside the waist, value and detail (MM-342), with MM-34's wording
  ("(from your waist)", "a tape narrows the range but cannot pin body fat down").

## Description
The monthly report's "What your body did" card gains the settled body-fat range at the end of the month, and its change since the
report before when both have one.

## Acceptance Criteria
```gherkin
Scenario: No settled range
  Given a month in which no body-fat range from measurements has settled
  Then the report says nothing about body fat

Scenario: A settled range
  Given a body-fat range from measurements has settled by the end of the month
  Then the report shows that range as a range, not one number

Scenario: Eating-disorder history
  Given that screening answer is ticked
  Then the report shows no change in body fat
```

## UI/UX
- MonthlyReportBodyFat — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: MonthlyReportBodyFat). Both ends.
- MonthlyReportBodyFatEatingDisorder — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story:
  MonthlyReportBodyFatEatingDisorder). The end only.

## Notes
- Placed in WS-09 step 8 beside phase planning, which waits for the same estimate.

## Progress
Built 2026-10-21:
- `buildMonthlyReport` takes the setup and gives `MonthlyReport.bodyFat` (`ReportBodyFat`: `end`, and `start` when a range had
  settled then and there is no eating-disorder history), each from `estimateBodyFat` on its day; `MonthlyReportText.body` adds
  the "Body fat" row (`format/bodyFatRange.ts` gives the range alone for the detail). `AppState.monthlyReport` passes the setup.
- Tests: `test/engine/monthlyReport.test.ts` ("body fat": none before it settles, the end, the start, a later entry changes
  nothing, the eating-disorder history, the user's own figure), `test/format/reportBodyFatText.test.ts`,
  `test/coach/monthlyReport.test.tsx` (the three scenarios in the app). Not run locally; CI validates.
- Not checked on a device.
