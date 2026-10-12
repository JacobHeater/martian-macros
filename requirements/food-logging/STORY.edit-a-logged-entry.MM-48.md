---
id: MM-48
status: done
component: food-logging
related: [MM-37, MM-38, MM-41, MM-167]
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

## Progress
Built: tapping an entry opens it in the add-food sheet ("Edit food"), where name, macros, how it was measured, meal and day can
be changed and saved in place (`FoodEntryWriter.updateFood`, with a contract test for both stores); a swipe-to-delete shows
"Removed ... Undo" and Undo puts the entry back with its values. Tested in `food_edit_test.dart`.

Limits: Undo logs the entry again, so it takes a new id and sorts to the end of its meal; the snackbar's length is the
framework default, not tuned. Not seen on the emulator yet.

## Clarified by MM-167 (proposed, not built)
Editing restores name, macros, method, meal and day only. MM-167 requires it to restore the quantity, unit, serving and basis too, to
show legacy entries as "Amount not recorded", and to avoid scaling totals twice.

## UI/UX Assets

- [Add food sheet](../ui-ux-assets/views/add-food.html#add-food-default) —
  Current. Draws AddFoodSheet as built on 2026-10-11: empty, filled, label
  serving, alcohol, invalid, estimate source, search, edit, and more. Drawn
  from the source alone; not compared with the running app. It shows what
  exists and approves nothing.
- [Food](../ui-ux-assets/views/food.html#food-default) — Current. Draws
  FoodEntryTile as built on 2026-10-11: an entry. Compared with a screenshot
  test of the built screen. It shows what exists and approves nothing.
- [Flows](../ui-ux-assets/flows/index.html#log-a-food) — Current. Draws the
  "adding, editing and removing a food, and closing the day" path as built on
  2026-10-11. Drawn from the source alone; not compared with the running app.
  It shows what exists and approves nothing.
