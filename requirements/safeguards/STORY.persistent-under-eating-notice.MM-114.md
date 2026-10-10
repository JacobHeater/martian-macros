---
id: MM-114
status: in-progress
component: safeguards
related: [MM-110, MM-11, MM-27, MM-28, MM-29, MM-40, MM-92, MM-108, MM-113, MM-149]
---

# Story: Notice when someone keeps eating far below the floor

## Context
The calorie floor (MM-28) limits what the app *prescribes*. A user can be prescribed 1,900 kcal and log 1,000 every day. Today the app
shows "900 kcal remaining" and says nothing else. The estimator's partial-day rule (MM-27) protects the *target* from falling, which is
right, but nobody tells the user that what they are doing is below what the app considers a safe minimum.

There are two very different people behind that log, and the app cannot tell them apart:
- someone logging only part of what they eat (common, harmless, a data-quality matter);
- someone restricting hard (uncommon, and the case the app must not encourage).

Evidence: association between diet-tracking apps and eating-disorder symptoms is **moderate** but cross-sectional (Levinson 2017; Linardon
and Messer 2019); the one randomized trial in low-risk undergraduate women found a month of tracking did not raise risk. The reasonable
reading is that tracking is not shown to cause disordered eating, and can maintain it in those who have it. The thresholds below are
**judgement**.

## Decisions
Choices I made without asking (say if any is wrong):
- **The trigger**: over the last 14 days, at least 7 days that are either marked complete or pass the estimator's usable-day rule, whose
  average intake is more than 10% below the user's calorie floor. Marked-partial and empty days never count.
- **The response is one neutral notice on the Coach screen and dashboard**, which says three things: what was seen ("Your logged days
  average 1,050 kcal; the lowest the app would ever suggest for you is 1,500"); the innocent explanation and its fix ("If those days are
  missing food, mark them partial"); and the other one ("If they are complete, that is less than the app considers enough. Eating at
  your target will not slow your progress the way it feels like it will.").
- **Nothing is praised, and nothing is cut.** The "remaining" figure, streaks and summaries are governed by MM-92: under-eating earns
  nothing. Targets do not fall because of these days.
- **It is not repeated more than once every 14 days**, and it clears when the average rises above the threshold.
- **For a user with the eating-disorder-history answer** (MM-11), the notice adds a line reviewed in MM-29 pointing to professional
  support. The app does not suggest a diagnosis to anyone.
- **Marking a day complete below half the floor** asks once, at the time: "Is this everything you ate today?" with Yes and "Mark partial".
  A deliberate fast is a legitimate Yes and is not questioned again that day.

Where the experts disagreed:
- The behavior-change expert: a warning shown to a partial-logger reads as an accusation and teaches them to stop logging. The safety
  expert: silence in front of a 1,000 kcal log is the worse error. Resolved by leading with the innocent explanation and making its fix
  one tap.
- Whether to lock deficit goals when the pattern persists. Rejected: it punishes logging honestly and the user can simply stop logging.

## Description
A pure engine function from intake days, completeness marks and the floor to "notice or not" with the figures to show; a notice component.

## Acceptance Criteria
```gherkin
Scenario: Sustained low intake
  Given a man whose floor is 1,500 kcal
  And 9 complete days in the last 14 averaging 1,050 kcal
  Then the notice is shown with both figures

Scenario: Partial days do not count
  Given the same days are marked partial
  Then no notice is shown

Scenario: Too few days
  Given 4 usable days averaging 1,000 kcal
  Then no notice is shown

Scenario: Slightly under
  Given usable days averaging 1,420 kcal against a 1,500 floor
  Then no notice is shown

Scenario: Targets are untouched
  Given the notice is showing
  Then the calorie target is no lower than it was before the low days

Scenario: No praise
  Given the notice is showing
  Then no text on any screen congratulates the user or counts those days as better than days at target

Scenario: Not nagging
  Given the notice was dismissed 5 days ago and the pattern continues
  Then it is not shown again until 14 days have passed
```

## Notes
- Priority: must-have before public release.
- All wording goes through MM-29 and MM-108. In particular the support line for users with an eating-disorder history must name a
  resource that exists at release; helplines have closed and changed in recent years, so check at the time.
- The same pattern over the *weight* channel (loss faster than the limit) is MM-115. The two together catch restriction that is logged and
  restriction that is not.

## Progress
Built: `findUnderEating` (engine): over the 14 days to yesterday, at least 7 whole days (marked complete, or unmarked and passing the
expenditure estimate's usable-day rule) averaging more than 10% below the calorie floor; days marked partial and empty days never
count; constants in `UnderEatingRule`. One notice, "About your logged days", on the dashboard and the Coach screen with both figures,
the innocent explanation first and its fix as one tap ("Mark those days partial"), then the other explanation; "They are complete"
dismisses it, and it is not shown again for 14 days (`underEatingNoticeDue`; the dismissal day is stored, schema version 17); it
clears by itself when the average rises. Marking a day complete with less than half the floor logged asks "Is this everything you
ate today?" with Yes and Mark partial. The easy-to-miss line (MM-152) is not shown while the pattern holds. Tests:
`under_eating_test.dart` (engine), `under_eating_notice_test.dart` (app), the preferences contract and the migration test.

Open, and needing the owner or MM-29:
- **The support line.** For a user with the eating-disorder-history answer the notice adds "If eating has become a source of
  distress, a doctor or a registered dietitian is the right person to talk to." No helpline or organisation is named, because the
  ticket says the resource must be checked at release. This wording has not been through MM-29.
- **"Targets are untouched" is not proved by a test.** Days marked partial are never used by the estimator. Days the user confirms as
  complete are used, as MM-27 decided, so a real, confirmed 1,050 kcal intake does inform the expenditure estimate; the target still
  cannot go below the floor or move more than the weekly limit. Whether confirmed-low days should be withheld from the estimator is a
  decision, not made here.
- The question on marking a low day complete is asked each time such a day is marked, not once per day.
- The adherence summary's pointer to this notice (MM-149) is not built.
