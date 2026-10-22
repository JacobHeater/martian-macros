---
id: MM-176
status: done
component: dashboard
related: [MM-98, MM-149, MM-139, MM-116]
---

# Story: A metrics-heavy dashboard with useful history

## Decisions
The owner requests a full existing-data overview, replacing the sparse,
one-screen direction of MM-98. The Dashboard is intentionally scrollable.
Compact summaries and labeled charts show nutrition, body measurements,
logging coverage, coaching, and recovery without moral scores or invented data.
Food and Progress remain detail destinations. Sensitive-data policy, safety
notices, and pause semantics remain unchanged.

Panel review of PR #285 (2026-10-21):
- The averages count the days the Logging row counts: a paused day is drawn
  but left out of the averages as it is out of coverage, and each average
  reads "across N logged days" (QA-3, UX-6). Chosen over a caption saying the
  averages include paused days, for consistency with the Logging row.
- With no coaching estimate the coach section says why: "Targets are off for
  your profile" when screening turns targets off, otherwise "Needs two weeks
  of logs and weigh-ins" (UX-7, the coordinator's wording).
- The disclosure is named "History", not "More about this week", since it
  shows 7 or 30 days (UX-8). The history chart's spoken label gives each
  line's lowest and highest finished day and today so far (UX-8).
- Pauses that cannot be read no longer fail the whole history (UX-1, with
  MM-183, MM-334): it is drawn with targets and coverage withheld and the
  caption "Paused days could not be checked"; the Dashboard's own pauses
  notice is the one alert and the one retry.

## Acceptance Criteria
```gherkin
Scenario: A populated overview
  Given stored intake, target, weight, waist and recovery history
  When the Dashboard opens
  Then today's calories and protein, carbohydrate and fat totals are visible
  And the Simple detail preference still limits today's macro display to protein
  And seven-day and thirty-day views show recorded intake against the target in force on each day
  And protein history, weight trend with uncertainty and waist history have dated, labeled charts
  And recovery shows five separate labeled trends over the last eight check-ins without a composite score
  And logging coverage and coach confidence with the expenditure range explain the available evidence
  And charts show dates, units and the meaning of their series

Scenario: Missing days are not zero intake
  Given days without food records between recorded days
  Then the intake chart leaves gaps rather than implying zero consumption
  And averages say how many recorded days they use
  And no-data states say what would populate each section

Scenario: Safety and pauses
  Given a pause or screening that prevents targets
  Then historical observations remain visible without grading paused days
  And unavailable targets and expenditure are not presented as measured zero values
  And no display rewards lower intake or weight loss

Scenario: Inspecting a metric
  When the user opens nutrition, measurements or coaching details
  Then the corresponding existing destination opens

Scenario: Loading and failures
  Given a history source is loading or has failed
  Then the Dashboard communicates that state instead of reporting empty history as success

Scenario: Readability
  Then both themes and narrow phone widths show readable chart labels without overflow
  And interactive controls have accessible names
```

## Progress
Implemented the existing-data overview and shared dated chart components.
Dashboard model/widget tests cover 7/30-day boundaries, gaps, historical
targets, pauses, screening, empty/loading/error states and narrow widths in
both themes. The integrated workspace passed `mm check` with exit 0 and
"All checks passed." Populated summary, nutrition, measurements and coaching
sections were inspected on the Android emulator using MM-177 synthetic data.
Linux screenshot regeneration and PR checks remain delivery gates.

Since MM-254 the history sits one tap under the Dashboard's hero, as sections
of the Dashboard's own hierarchy (MM-335), each opening its home tab.

### Closed (2026-10-21)
- Gap found against "averages say how many recorded days they use": the
  protein average gave no day count. It now reads "170 g a day on average,
  across 30 logged days", counted from the logged days it uses
  (`DashboardHistory.proteinDays`); `dashboardMetrics.test.tsx` checks both
  ranges and the unfinished-today case.
- Panel fixes (2026-10-21): "across N logged days" on intake and protein;
  paused days left out of the averages (`DashboardHistory.pausedDays`,
  `finishedDays`, `proteinDays`, asserted with gaps and a pause in
  `test/dashboard/dashboardHistory.test.ts`); the 7-day averages asserted in
  `dashboardMetrics.test.tsx`; the coach section's two no-estimate reasons
  (tested; stories `HistoryNoWeighIn`, `HistoryTargetsOff`); "History" as
  the disclosure's name; the history chart's spoken label with lowest,
  highest and today so far (`test/charts/charts.test.tsx`); pauses that
  cannot be read leave the history drawn (story `HistoryPausesFailed`).
- Every other criterion is built and tested in
  `apps/mobile/test/dashboard/dashboardMetrics.test.tsx` (sections, 7/30-day
  range, empty, loading, error, pauses) and drawn in `Today.stories.tsx`.
- Not run locally; CI validates.

### Owed on a phone
- Chart labels at a narrow phone width in both themes, read on a device.
