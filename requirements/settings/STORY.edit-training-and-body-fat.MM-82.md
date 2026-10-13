---
id: MM-82
status: done
component: settings
related: [MM-80, MM-10, MM-12, MM-23, MM-28]
---

# Story: Update my training background and body-fat estimate

## Context
See MM-80. Both change over time, and both feed the coach: training days set the starting expenditure estimate; experience sets the
lean-gain pace and the recommendation; body fat sets the loss-rate cap, the protein rule, the lean-user calorie floor and the
recommendation.

## Decisions
Choices I made without asking (say if any is wrong):
- **Changes save as they are made**; there is no Save button.
- **Body fat is a switch plus a slider**: off means "let the app estimate". Turning it on starts at 25%.
- **A change does not issue new targets by itself.** It takes effect at the next weekly check-in (MM-24).

## Description
Settings has Training (experience, days per week) and Body fat estimate.

## Acceptance Criteria
```gherkin
Scenario: More training days
  Given 3 training days
  When it is changed to 5
  Then the stored setup has 5 days and the starting expenditure estimate uses the higher activity factor

Scenario: Entering a body-fat estimate
  When the switch is turned on and the slider set to 18%
  Then the Coach screen shows about 18% as the user's estimate

Scenario: Removing it
  When the switch is turned off
  Then no body-fat value is stored and the Coach screen shows the rough formula range
```

## Notes (built, not verified beyond compiling)
- `settings_screen.dart`; `UserSetup.copyWith`. **No test and not exercised on a device** (MM-93).
- Two rough edges to fix:
  - Turning the switch on starts at a fixed 25% rather than at the app's own estimate (onboarding uses the estimate).
  - The sliders write to the database on every movement, not when released.
- Whether a change here should apply at once instead of waiting for the check-in is worth deciding. Waiting is consistent, but a user who
  corrects their body fat from 30% to 15% keeps a loss rate that is too fast for up to a week.
