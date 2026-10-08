---
id: MM-48
status: proposed
component: food-logging
related: [MM-37, MM-38, MM-41]
---

# Story: Edit an entry after logging it

## Context
Today an entry can only be deleted (by swiping) and logged again. A typo in one number means retyping five fields. Swipe-to-delete also has
no undo, so a stray swipe silently loses an entry.

## Description
- Tapping an entry opens it in the add-food sheet with its values; saving updates it in place.
- An entry can be moved to another meal or another day.
- Deleting shows an "Undo" for a few seconds.

## Acceptance Criteria
```gherkin
Scenario: Fixing a number
  Given an entry logged with 51 g of protein that should be 15 g
  When it is opened, corrected and saved
  Then the entry has 15 g of protein and the day's totals reflect it

Scenario: Undo a delete
  When an entry is swiped away and Undo is tapped
  Then the entry is back, unchanged

Scenario: Moving to another meal
  When an entry's meal is changed from lunch to dinner
  Then it is listed under dinner
```

## Notes
- The store has no update operation for food entries yet.
