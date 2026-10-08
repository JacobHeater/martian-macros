---
id: MM-30
status: done
component: adaptive-coach
related: [MM-22, MM-18, MM-23, MM-24, MM-27]
---

# Task: Simulated users whose true physiology is known

## Context
The engine estimates things that cannot be checked on a real person: nobody knows their true expenditure to within 50 kcal. Unit tests on
formulas cannot show whether the whole loop behaves. The only way to test it is against people we invent, whose truth we set.

## Description
`SyntheticUser` (in the engine's test support) is a person with a true expenditure, weight and fat mass, who lives one day at a time:
- eats to a given target with day-to-day scatter;
- **logs** with a consistent under-report fraction, per-entry noise, some days skipped and some only partly logged;
- **weighs in** most mornings, with multi-day (AR(1)) water swings plus scale noise;
- **changes** physically by the energy balance, split into fat and lean by the same partition model the engine assumes, with expenditure
  falling as weight falls.

It is deterministic for a given seed, and its behavior can be changed mid-run (to simulate buying a food scale, or logging falling apart).
`runCoachLoop` runs the full weekly loop the app runs, against one, and records each week.

## Acceptance Criteria
```gherkin
Scenario: Deterministic
  Given the same seed
  Then two runs produce identical histories

Scenario: Energy balance holds
  Given a user eating 500 kcal under their true expenditure
  Then their true weight falls at the rate the partition model implies

Scenario: The loop can be driven for months
  When the weekly loop is run for 16 weeks
  Then each week's targets, estimate, true expenditure and true weight are recorded
```

## Notes (built and verified)
- `packages/engine/test/support/synthetic_user.dart` and `coach_loop.dart`.
- It has already paid for itself three times: it exposed the overconfident trend filter (MM-18), the calorie floor that was too strict
  (MM-28) and the partial-day rule that leaked (MM-27).
- **Its biggest weakness**: the simulated person obeys the same partition model the engine assumes, so the tests cannot show what happens
  when a real body partitions differently. A truth model that deliberately disagrees is worth adding.
- The scenarios above are how it is used, not tests of the simulator itself; it has no tests of its own.
