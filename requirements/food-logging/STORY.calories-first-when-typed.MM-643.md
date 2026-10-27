---
id: MM-643
status: done
component: food-logging
related: [MM-38, MM-49, MM-226, MM-428]
---

# Story: typing a food, calories come first

## Context
The food-logging review (`docs/food-logging-plan.md`, F-14) found that the manual form asks for protein, carbs,
fat, the label's other lines and alcohol before calories, though calories are the number most people know.
The owner decided on 2026-10-26: calories first, keeping the per-serving default (MM-226).

## Decisions
From the owner (2026-10-26): "Calories" (or "Calories per serving") is the first field under the form's
"Nutrition …" heading, above the macros. Nothing else changes: blank still derives calories from the macros
(MM-38), and the mismatch caution is unchanged.

## Acceptance Criteria
```gherkin
Scenario: Calories first
  When a food is entered by hand
  Then the calories field comes before the protein field
```

## Notes
- Built in `AddFoodSheet` (`typedFields`). Tests: "MM-643" in `test/food/ownersChoicesOnTheSheet.test.tsx`.
