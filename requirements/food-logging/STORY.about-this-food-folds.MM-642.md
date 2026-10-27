---
id: MM-642
status: done
component: food-logging
related: [MM-42, MM-49, MM-153, MM-218, MM-225, MM-370]
---

# Story: the amount step folds what the food is behind "About this food"

## Context
The food-logging review (`docs/food-logging-plan.md`, F-13) found that the amount step shows, before "Log it",
the trust mark, the grade with its caption, the meal and time, the units, the amount, the cooking oil, the
source's numbers, the Logs line, a rounding note and the macro split. The detail level (MM-49) takes out macro
depth but no decisions. In a meal of several foods (MM-631) this repeats for every food. The owner decided on
2026-10-26: fold the grade's caption, the source's numbers and the split.

## Decisions
From the owner (2026-10-26): the grade caption, the per-100 g (or per-serving) reference line and the macro
split fold under one "About this food" line.

Choices made without asking (say if any is wrong):
- **In view, as before**: the name, brand and trust mark (MM-153), the grade's letter beside the name (MM-370),
  meal and time, units, the amount, cooking oil, the Logs line (MM-218), the rounding note, and the actions.
  The rounding note and the oil sentence change what is logged, so they never fold.
- **"About this food" starts closed** and is remembered as it was left (MM-286), so a person who wants the
  source's numbers each time leaves it open.
- What is folded stays drawn while closed, so the source's numbers are one press away and never invented.

## Acceptance Criteria
```gherkin
Scenario: Folded
  Given a found food's amount step
  Then "About this food" is closed, its reference line is not shown, and the Logs line is
  When it is opened
  Then the grade's meaning, the source's numbers and the macro split are shown
```

## Notes
- Built in `FoodAmountStep` with `MmDisclosure`. Tests: "MM-642" in
  `test/food/ownersChoicesOnTheSheet.test.tsx`.
