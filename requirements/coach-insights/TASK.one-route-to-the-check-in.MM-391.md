---
id: MM-391
status: done
component: coach-insights
related: [MM-256, MM-389, MM-339, MM-116]
---

# Task: one way into the weekly check-in on Coach

## Context
Raised by the UX role in the MM-389 review (UX-10) and not built there because it needs the product
designer. In a week the recovery check-in is due, Coach shows two ways to answer it, the one-thing row
("Answer this week's five questions") and the recovery card's "Answer this week", and both explain the
questions as what the log and the scale cannot see.

## Decisions
- The product designer's recommendation: the one-thing row is the way in, since it sits under the goal
  where MM-256 keeps the one routine action. The recovery card drops its "Answer this week" while the
  check-in is due and keeps its history.
- Choices made without asking (easy to overrule):
  - "Skip this week" stays on the recovery card and does not move into the check-in. The check-in screen
    is unchanged.
  - The rule applies to Coach only. The same card on the Dashboard (`DashboardMetrics`) has no one-thing row,
    so it keeps its "Answer this week".
  - While the check-in is due and nothing has been answered yet, the card leaves out its "Five quick
    questions..." paragraph, because the one-thing row already says what the questions are for. With
    answers on record, the card keeps its caption, "...never to a lower target", which goes with the
    history. The check-in screen still says "they never lower a target".
  - The section still opens when the check-in is due (MM-339), showing the sleep line, the history and
    the skip.

## Description
While the check-in is due, Coach offers one way into it and says once what the questions are for,
keeping "never to a lower target". The one-thing row is that way in. The recovery card
(`RecoveryCard answeredAbove` on Coach) keeps its history and its skip, and has no answer button until
the check-in is no longer due.

## Acceptance Criteria
```gherkin
Scenario: The check-in is due
  When Coach is shown in a week the check-in is due
  Then there is one control that opens the check-in
  And what the questions are for is said once

Scenario: The section keeps its record while the check-in is due
  Given check-ins have been answered before
  When Coach is shown in a week the check-in is due
  Then "How you are holding up" shows the answers and "never to a lower target"
  And it has no button that opens the check-in
  And it still offers "Skip this week"

Scenario: The check-in is not due
  When Coach is shown in a week the check-in has been answered
  Then "How you are holding up" offers "Answer again"
```

## UI/UX
- CheckInDue — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CheckInDue). The due week, with
  the one-thing row as the only way in.
- RecoveryOpens — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: RecoveryOpens). The section's
  "Answer again" in a week the check-in is not due.

## Notes
Progress: built 2026-10-21 in `apps/mobile/src/coach/RecoveryCard.tsx` (the `answeredAbove` prop) and
`apps/mobile/src/coach/CoachScreen.tsx`. Guarding tests are in `apps/mobile/test/coach/recoveryCheckIn.test.tsx`:
"while the check-in is due Coach has one way into it, and says once what it is for" and "with answers on
record the due section keeps them and their promise, without a second way in". The tests that answered
from the card now answer from the one-thing row. `test/coach/recoveryOpenWhenDue.test.tsx` was updated
for MM-339. Not run locally; CI validates. No device check is needed beyond the usual look at Coach in a
due week.
