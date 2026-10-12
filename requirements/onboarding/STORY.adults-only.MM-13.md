---
id: MM-13
status: done
component: onboarding
related: [MM-9, MM-10, MM-11]
---

# Story: The app is for adults

## Context
Calorie targets, deficits and body-fat goals are not safe guidance for someone still growing.

## Decisions (made with the product owner)
- **Under 18 is blocked**, not given a gentler mode.

## Description
When the date of birth makes the user under 18 today, the first onboarding screen shows a notice that the app is for adults 18 and over and
Next stays disabled. Independently, the coaching policy for an under-18 profile is "blocked", and a blocked profile is never issued targets,
so a profile that turns out to be under 18 by any route still gets nothing.

## Acceptance Criteria
```gherkin
Scenario: A minor cannot continue
  Given a date of birth less than 18 years ago
  Then the first screen shows the adults-only notice and Next is disabled

Scenario: The birthday itself counts
  Given a date of birth exactly 18 years ago today
  Then the user may continue

Scenario: The engine refuses as well
  Given a stored profile that is under 18
  Then no targets are issued for it
```

## Notes (built and verified)
- `Profile.isAdultOn` and the `blocked` policy in `mm_domain`; `nextTargets` returns nothing for a blocked policy (engine test "blocked
  users get no targets").
- The age shown is self-declared. There is no age verification, and none is planned.

## UI/UX Assets

- [First launch and gates](../ui-ux-assets/views/onboarding.html) — Current.
  Draws AdultsOnlyScreen and BirthDateStep as built on 2026-10-11: default,
  empty, under 18. Frames: `#adults-only`, `#onboarding-birth-date`. Drawn
  from the source alone; not compared with the running app. It shows what
  exists and approves nothing.
- [Flows](../ui-ux-assets/flows/index.html#opening-the-app-later) — Current.
  Draws the "the gates that can stand in front of the app" path as built on
  2026-10-11. Drawn from the source alone; not compared with the running app.
  It shows what exists and approves nothing.
