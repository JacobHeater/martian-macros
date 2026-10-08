---
id: MM-83
status: proposed
component: settings
related: [MM-80, MM-11, MM-14, MM-24, MM-62]
---

# Story: Correct my profile or health check without losing my data

## Context
Sex, date of birth and height are shown in Settings but cannot be changed, and the health check cannot even be seen. The only fix for a
mis-tap is erasing everything (MM-62). The health check is not a one-time fact either: someone becomes pregnant, stops breastfeeding, or
is diagnosed with something.

## Decisions (made with the product owner)
- **A user may correct a mis-tapped sex.** When they do, everything is recomputed from stored history, since the engine is a pure function
  of it.

Choices I made without asking (say if any is wrong):
- **Changing sex needs a deliberate confirmation**, explaining that energy needs and limits will be recalculated. Female-only health
  answers are cleared when changing to male.
- **Changing sex, date of birth or height issues new targets immediately**, without the weekly step limit, like a change of goal. The old
  targets were computed for someone else.
- **Changing a health-check answer takes effect immediately** as well: a goal that is no longer allowed falls back to maintenance at once,
  and the user is told why.
- **Past targets in the history are left as they were** (they are a record of what the app said at the time); only current and future
  targets change.

## Description
Settings lets the user edit sex, date of birth and height, and revisit the health check with the same questions as onboarding.

## Acceptance Criteria
```gherkin
Scenario: Correcting sex
  Given a profile entered as male by mistake
  When it is changed to female and confirmed
  Then resting energy, body-fat estimate, calorie floor and targets are recalculated for a female profile at once
  And all logged food and weigh-ins are kept

Scenario: Becoming pregnant
  Given a female profile on fat loss
  When Pregnant is ticked in the health check
  Then the goal becomes maintenance immediately, with an explanation

Scenario: No longer breastfeeding
  Given a profile with Breastfeeding ticked
  When it is unticked
  Then the 400 kcal addition is removed and all goals are offered again

Scenario: Under 18 by correction
  Given a date of birth corrected to one that makes the user under 18
  Then coaching stops, as for any under-18 profile
```

## Notes
- The engine already recomputes from history on every change; what is missing is the screens, and the "apply immediately" rule in
  `nextTargets` (today only a goal change bypasses the weekly wait).
