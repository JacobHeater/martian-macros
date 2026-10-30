---
id: MM-707
status: in-progress
component: food-logging
related: [MM-44, MM-45, MM-153, MM-635, MM-645, MM-703, MM-706]
---

# Story: The Saved step picks; the Library manages

## Context
The add-food sheet's Saved step (`MyFoodsStep`) lists the person's foods and meals to log them, and also makes, edits
and deletes them. With the Library (MM-706), the owner chose one place to manage and one place to log (MM-703).

## Decisions
The owner's (MM-703): the Saved step keeps listing foods and meals to log; New food, edit and delete move to the
Library; the step ends with "Manage in Library".

Choices made without asking (say if any is wrong):
- **The lists and their rows stay as they are**, pressed to log (MM-635, MM-645); the rows lose their "More actions"
  menus, and the "New food" and "New recipe" buttons go. A text button **"Manage in Library"** stands where they were,
  before "Back"; it closes the sheet and pushes the Library.
- **Two flows still open the food form inside the sheet**, because they come back to be logged: a label read from an
  unknown barcode (MM-44, `initialBarcode`) and "Fix this food" (MM-153, `draft`). They are unchanged.
- **Nothing saved** says "Nothing saved yet. Make a food in the Library." with the same button.

## Description
The Saved step is a picker: foods and meals to log, and a way to the Library to manage them.

## Acceptance Criteria
```gherkin
Scenario: Picking
  Given a saved food
  When the Saved step is open and the food is pressed
  Then its amount step opens, as today

Scenario: No management here
  When the Saved step is open
  Then no row has "More actions", and neither "New food" nor "New recipe" is offered
  And "Manage in Library" is offered

Scenario: To the Library
  When "Manage in Library" is pressed
  Then the sheet is closed and the Library is open

Scenario: A label still saves and logs
  Given an unknown barcode and a label read (MM-44)
  Then the food form opens in the sheet, and saving returns the food to be logged
```

## UI/UX
- Saved — apps/mobile/src/gallery/screens/Food.stories.tsx (Stories: AddFoodSavedOwn, updated; AddFoodSavedEmpty).

## Notes
- Tests: `test/food/customFoods.test.tsx` updated (management cases move to `test/library/library.test.tsx`),
  `test/food/savedStep.test.tsx` for the scenarios above.

## Progress
Built 2026-10-30 (PR B of MM-703, with MM-706): `MyFoodsStep` lists the saved meals and foods to log them, with no
menus and no New food or New recipe; "Manage in Library" (a text button before Back) closes the sheet and pushes the
Library; nothing saved says "Nothing saved yet. Make a food in the Library."; a label read from an unknown barcode
(MM-44) and "Fix this food" (MM-153) still open the food form inside the sheet and come back to be logged. Tests in
`test/food/savedStep.test.tsx`; the management cases of `test/food/customFoods.test.tsx` moved to
`test/library/library.test.tsx`. Stories: `AddFoodSaved` and `AddFoodSavedOwn` (Food.stories.tsx) draw the picker.

Not run locally; CI validates.

