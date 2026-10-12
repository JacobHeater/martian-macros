---
id: MM-207
status: done
component: food-logging
related: [MM-48, MM-180]
---

# Bug: Food entry deletion lacks a visible alternative to swipe

## Context
A bounded UX audit and QA challenge inspected the meal-row and edit paths.
They found swipe dismissal, but no visible non-gesture delete action in either
path. This conflicts with the established interaction direction that gestures
are accelerators and have visible alternatives. Runtime accessibility behavior
has not been tested.

## Description
Provide a visible, accessible non-gesture way to delete a logged food entry,
while preserving swipe deletion and Undo.

## Acceptance Criteria
```gherkin
Scenario: A food entry can be deleted without a swipe
  Given a logged food entry is visible in its meal
  When the user activates its visible, accessibly named delete alternative
  Then the entry is removed
  And Undo restores the same entry

Scenario: Swipe deletion remains an accelerator
  Given a logged food entry is visible in its meal
  When the user dismisses the entry by swiping
  Then the entry is removed
  And Undo restores the same entry
```

## Notes
Regression guard: `apps/mobile/test/food_edit_test.dart`.
Each food row now has a design-system More actions menu with a named Delete
item. The trigger enforces a 48-by-48 minimum; swipe deletion and Undo remain
available. `food_edit_test.dart` exercises the visible menu, semantic name,
deletion, and restoration. Native screen-reader behavior was not tested.
