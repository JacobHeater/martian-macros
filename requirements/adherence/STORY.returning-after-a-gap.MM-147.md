---
id: MM-147
status: in-progress
component: adherence
related: [MM-145, MM-16, MM-18, MM-23, MM-24, MM-31, MM-92, MM-98, MM-108, MM-112, MM-135, MM-139, MM-146, MM-148]
---

# Story: Come back after a gap and pick up where a good coach would

## Context
See MM-145. A user stops for three weeks: a holiday, a bad month, a new baby. They open the app again. What they find today is a
dashboard of empty cards, a trend chart with a hole in it, targets from a month ago, and, if rewards exist by then, a broken streak.
Every element says "you failed". The likeliest next action is to close it.

The engine side is mostly right already: missing days are missing, never zero (MM-23); the trend predicts across a gap with growing
uncertainty (MM-18); targets hold without data (MM-24). What is missing is a deliberate re-entry and a few rules about what a gap *means*.

## Decisions
Choices I made without asking (say if any is wrong):
- **A gap is 7 or more consecutive days with no weigh-in and no food logged**, not covered by a pause (MM-148).
- **On the first opening after a gap, one screen is shown before the dashboard**: "Welcome back. To pick up, the coach needs one thing: a
  weigh-in." With a field for it, and "Later". Nothing else: no count of days missed, no summary of the gap, no streak.
- **What happens next depends on the gap's length**:

| gap | coach behavior |
|---|---|
| 7 to 27 days | targets unchanged; the expenditure estimate is kept; confidence drops to Fair until the window refills (MM-139) |
| 28 to 89 days | targets unchanged for a 7-day re-calibration, then check-ins resume; the last measured expenditure becomes the starting estimate with its uncertainty widened to 10% |
| 90 days or more | as above, and the health check is asked again (MM-112) and the goal is re-confirmed on a single screen |

- **If weight has changed by more than 5% across the gap**, the last measured expenditure is rescaled by the change in resting energy and
  treated as a starting estimate, whatever the gap's length.
- **A gap of 14 days or more counts as a break from the deficit**: the unbroken-deficit count restarts (MM-31, MM-135). The app does not
  know what was eaten, and assuming a continued deficit would force a diet break on someone who has just had one.
- **Streaks and summaries treat the gap as absent, not failed** (MM-92): process counts restart at zero without a "lost" message, and the
  monthly report covering the gap says "no data from the 3rd to the 24th" and nothing more.
- **The trend chart draws the gap as a gap**: the band widens, and no line is drawn through days with no reading beyond the filter's
  prediction (shown dashed).
- **Nothing was sent during the gap** (MM-146), and nothing refers to it afterwards.

Where the experts disagreed:
- The physique expert wanted the return screen to show the weight change over the gap, as the fact the user most needs. The
  behavior-change expert: it is the fact most likely to end the session; the user will see the trend as soon as they look at Progress,
  on their own terms. Not on the welcome screen.
- The engineer questioned keeping the old expenditure estimate after a month. Expenditure changes slowly unless weight or activity
  changed a lot; widening the uncertainty and re-measuring is better than discarding a hard-won number. The 5% rule covers the case
  where it is clearly stale.

## Description
Gap detection in the shell; a return screen; gap-length rules in `analyze` and `nextTargets`.

## Acceptance Criteria
```gherkin
Scenario: A three-week gap
  Given no weigh-in or food for 21 days, then the app is opened
  Then the welcome-back screen is shown, asking only for a weigh-in

Scenario: After the weigh-in
  When a weigh-in is saved
  Then the dashboard is shown with the previous targets and a confidence of Fair

Scenario: Nothing about failure
  Then no text on the return screen or dashboard states how many days were missed or that a streak ended

Scenario: A two-month gap
  Given a 60-day gap
  Then targets are held for 7 days after return, and the first check-in after that starts from the last measured expenditure with a
    wider uncertainty

Scenario: A long gap
  Given a 120-day gap
  Then the health check and goal are confirmed before coaching resumes

Scenario: Weight changed a lot
  Given a 40-day gap across which weight rose 6%
  Then the starting estimate is rescaled for the new weight

Scenario: The deficit count
  Given 11 unbroken weeks of deficit before a 16-day gap
  Then the count after returning is zero

Scenario: Later
  When "Later" is chosen
  Then the dashboard is shown, and the weight card asks for a weigh-in as it normally would
```

## Notes
- Priority: must-have before month two after launch; it costs little and addresses the commonest way users are lost.
- A connected scale (MM-68) may have kept recording through the gap. Then there was no gap in weigh-ins and this flow does not trigger,
  which is right; the food-log gap is handled by the estimator as missing days.
- A simulator test should cover a user who lapses for four weeks mid-cut and returns (MM-30).

## Progress
Built:
- **What a gap is** (engine): `activityGaps` and `openGap` find runs of 7 or more days with no weigh-in and no food logged; today is
  never part of one. Thresholds are in `GapRule`.
- **The welcome-back screen**: on opening the app when returning from a gap, one screen, "Welcome back. To pick up, the coach needs
  one thing: a weigh-in.", with the weigh-in field and "Later". No count of days, no summary, no streak (a test forbids those words).
  Saving a weigh-in closes the gap and opens the dashboard. "Later" is stored (schema version 18) so the screen is not shown again
  for the same absence, and the dashboard's weight card asks as usual.
- **The deficit count** restarts on the first day back after a gap of 14 days or more (`consecutiveDeficitWeeks`, from the snapshot's
  `deficitRestartOn`).
- **The starting estimate** (`gapPrior`, used by `analyze`): after a gap of 28 days or more that still falls in the estimation window,
  the last measured expenditure is the starting estimate with its uncertainty widened to 10% (never narrowed); if weight changed by
  more than 5% across a gap of any length, it is first moved by the change in resting energy. With too little data in the window the
  estimator holds, so targets are unchanged while it re-measures.
- **A long gap**: the health check is already asked again after 90 days without one, and is shown after the welcome-back screen.
- Tests: `activity_gap_test.dart` (engine), `welcome_back_test.dart` (app), the preferences contract and the migration test.

Not built: confidence set to Fair after a 7 to 27 day gap (confidence follows the data in the window as before); the fixed 7-day
re-calibration (the estimator holds until it has its usual minimum of data, which is longer); re-confirming the goal after 90 days;
the trend chart drawing the gap dashed; streaks and the monthly report (neither exists yet); pauses (MM-148), so a paused period
would count as a gap; a simulator user who lapses for four weeks and returns (MM-30). Food logged more than 60 days ago is not
loaded, so an old stretch with food but no weigh-ins can read as a gap for the deficit count.
