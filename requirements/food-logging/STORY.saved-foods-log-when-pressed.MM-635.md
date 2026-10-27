---
id: MM-635
status: done
component: food-logging
related: [MM-43, MM-44, MM-45, MM-153, MM-631]
---

# Story: in Add food, pressing a saved food logs it

## Context
"Saved" in the Add food sheet opened "My foods" (MM-45), where pressing a food opened its editor, so a saved
food could be logged only by searching for its name. A food just made from a scanned label (MM-44) or a
corrected copy (MM-153, "Fix this food") went back to the list, not to logging it. The food-logging review
(`docs/food-logging-plan.md`, F-16, B5) raised it, and the owner decided on 2026-10-26: pressing logs it.

## Decisions
From the owner (2026-10-26): pressing a saved food in Add food opens its amount step, to log it.

Choices made without asking (say if any is wrong):
- **Edit and Delete move to the food's ⋯ menu** ("More actions for …"); Delete still asks first.
- **A food made to be logged goes on to be logged**: one saved from a scanned label, or a corrected copy,
  opens its amount step once saved. A food made from "New food" goes back to the list, so several can be
  added in a row.
- The list says so: "Press one to log it. Foods and recipes you save also appear first when you search."

## Acceptance Criteria
```gherkin
Scenario: Logged from Saved
  Given "Protein bar" is saved
  When Saved is opened in Add food and "Protein bar" pressed
  Then its amount step opens, and "Log it" logs it

Scenario: Edited from its menu
  When "Edit" is chosen from "Protein bar"'s menu
  Then its form opens

Scenario: A label read after a scan
  Given an unknown barcode, its label read and the food saved
  Then its amount step opens to log it
```

## Notes
- Built in `MyFoodsStep` (`onPick`), `CustomFoodForm` (gives the food as saved) and `AddFoodSheet`.
- Tests: "MM-635" in `test/food/customFoods.test.tsx`; the tests that edited or deleted by pressing now use
  the menu.
